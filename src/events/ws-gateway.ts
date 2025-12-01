import { Server } from "socket.io";
import {
  transcribeAudio,
  processVoiceMessage,
  startVoiceInterview,
  getVoiceInterviewState,
  type TranscribeAudioRequest,
  type ProcessMessageRequest,
} from "../services/voice-interview-service.js";

let io: Server;

// Store active voice interview sessions
const activeVoiceSessions = new Map<string, {
  session_id: string;
  user_id: string;
  socket_id: string;
  is_started: boolean;
  is_complete: boolean;
}>();

// Store audio buffers per session for server-side buffering
const sessionBuffers = new Map<string, {
  chunks: string[]; // Array of base64-encoded audio chunks
  audio_format: string; // Format of the audio (e.g., "webm")
  sample_rate: number; // Sample rate
}>();

/**
 * Helper function to combine base64-encoded audio chunks
 * For WebM format, we can concatenate the binary data directly
 */
function combineBase64AudioChunks(chunks: string[]): string {
  if (chunks.length === 0) {
    return "";
  }
  if (chunks.length === 1) {
    const firstChunk = chunks[0];
    if (!firstChunk) {
      return "";
    }
    return firstChunk;
  }

  // Decode all chunks to binary buffers
  const buffers = chunks.map(chunk => Buffer.from(chunk, 'base64'));
  
  // Concatenate all buffers
  const combined = Buffer.concat(buffers);
  
  // Re-encode to base64
  return combined.toString('base64');
}

export const initWebSocket = (httpServer: any) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // later restrict this to your frontend domain
      methods: ["GET", "POST"],
    },
  });

  console.log("⚡ WebSocket server initialized");

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // USER JOINS ROOM
    socket.on("joinRoom", ({ room_id, user_id }) => {
      socket.join(room_id);

      console.log(`🟢 User ${user_id} joined room ${room_id}`);

      // Notify others
      socket.to(room_id).emit("userJoined", {
        user_id,
        socket_id: socket.id,
      });
    });

    // USER LEAVES ROOM
    socket.on("leaveRoom", ({ room_id, user_id }) => {
      socket.leave(room_id);

      console.log(`🔴 User ${user_id} left room ${room_id}`);

      socket.to(room_id).emit("userLeft", {
        user_id,
        socket_id: socket.id,
      });
    });

    // ========== VOICE INTERVIEW HANDLERS ==========

    /**
     * Join a voice interview session
     * Event: voiceInterview:join
     * Payload: { session_id, user_id }
     */
    socket.on("voiceInterview:join", async ({ session_id, user_id }) => {
      try {
        if (!session_id || !user_id) {
          socket.emit("voiceInterview:error", {
            error: "session_id and user_id are required",
          });
          return;
        }

        // Store session info
        activeVoiceSessions.set(socket.id, {
          session_id,
          user_id,
          socket_id: socket.id,
          is_started: false,
          is_complete: false,
        });

        // Get current state
        const stateResult = await getVoiceInterviewState(session_id);
        
        if (stateResult.success && stateResult.data) {
          socket.emit("voiceInterview:joined", {
            session_id,
            state: stateResult.data,
          });
          console.log(`🎤 User ${user_id} joined voice interview session ${session_id}`);
        } else {
          socket.emit("voiceInterview:error", {
            error: stateResult.error || "Failed to get interview state",
          });
        }
      } catch (error: any) {
        console.error("Voice Interview Join Error:", error);
        socket.emit("voiceInterview:error", {
          error: error.message || "Internal server error",
        });
      }
    });

    /**
     * Start the voice interview
     * Event: voiceInterview:start
     * Payload: { session_id }
     */
    socket.on("voiceInterview:start", async ({ session_id }) => {
      try {
        const session = activeVoiceSessions.get(socket.id);
        if (!session || session.session_id !== session_id) {
          socket.emit("voiceInterview:error", {
            error: "Session not found. Please join the session first.",
          });
          return;
        }

        console.log(`🎬 Starting voice interview session ${session_id}`);
        const result = await startVoiceInterview(session_id);

        if (result.success && result.data) {
          session.is_started = true;
          socket.emit("voiceInterview:started", {
            session_id,
            text: result.data.text,
            audio_data: result.data.audio_data,
            audio_format: result.data.audio_format,
            current_phase: result.data.current_phase,
            current_question_index: result.data.current_question_index,
            total_questions: result.data.total_questions,
            progress_percentage: result.data.progress_percentage, // Pass through zero-based progress directly
            is_complete: result.data.is_complete,
            should_ask_followup: result.data.should_ask_followup,
          });
        } else {
          socket.emit("voiceInterview:error", {
            error: result.error || "Failed to start interview",
          });
        }
      } catch (error: any) {
        console.error("Voice Interview Start Error:", error);
        socket.emit("voiceInterview:error", {
          error: error.message || "Internal server error",
        });
      }
    });

    /**
     * Receive audio chunk from client and process it
     * Event: voiceInterview:audio
     * Payload: { session_id, audio_data, audio_format, sample_rate, is_final, stop_reason }
     */
    socket.on("voiceInterview:audio", async ({ session_id, audio_data, audio_format, sample_rate, is_final, stop_reason }) => {
      try {
        const session = activeVoiceSessions.get(socket.id);
        if (!session || session.session_id !== session_id) {
          socket.emit("voiceInterview:error", {
            error: "Session not found. Please join the session first.",
          });
          return;
        }

        if (session.is_complete) {
          socket.emit("voiceInterview:error", {
            error: "Interview is already complete",
          });
          return;
        }

        // Size validation: Skip tiny audio chunks (likely silence) unless it's final
        if (audio_data.length < 5000 && !is_final) {
          console.log("⚠️ Skipping tiny audio chunk (likely silence)");
          return;
        }

        // Validate audio format (optional WebM validation)
        const format = audio_format || "webm";
        if (format !== "webm") {
          console.warn(`⚠️ Non-WebM audio format received: ${format}. Proceeding but may have compatibility issues.`);
          // Continue processing but log warning
        }

        // Initialize buffer for this session if it doesn't exist
        if (!sessionBuffers.has(session_id)) {
          sessionBuffers.set(session_id, {
            chunks: [],
            audio_format: format,
            sample_rate: sample_rate || 16000,
          });
        }

        const buffer = sessionBuffers.get(session_id)!;

        // If this is NOT a final chunk, buffer it and optionally send for preview
        if (!is_final) {
          // Store the chunk in the buffer
          buffer.chunks.push(audio_data);
          buffer.audio_format = format;
          buffer.sample_rate = sample_rate || buffer.sample_rate;

          // OPTIONAL: Send to Python for preview transcription (non-blocking)
          // This is optional and can be removed if preview is not needed
          transcribeAudio({
            session_id,
            audio_data,
            audio_format: format,
            sample_rate: buffer.sample_rate,
          }).then((previewResult) => {
            if (previewResult.success && previewResult.data && !previewResult.data.is_final) {
              // Only emit preview if it's not final
              socket.emit("voiceInterview:transcription", {
                session_id,
                text: previewResult.data.text,
                confidence: previewResult.data.confidence,
                is_final: false, // Always false for preview
              });
            }
          }).catch((err) => {
            // Silently fail preview transcription - it's optional
            console.debug(`Preview transcription failed (non-critical): ${err.message}`);
          });

          return; // Don't process further until final chunk
        }

        // This is a FINAL chunk - combine all buffered chunks
        buffer.chunks.push(audio_data); // Include the final chunk
        const combinedAudioData = combineBase64AudioChunks(buffer.chunks);

        if (!combinedAudioData || combinedAudioData.length === 0) {
          socket.emit("voiceInterview:error", {
            error: "No audio data to transcribe",
          });
          // Clear buffer
          sessionBuffers.delete(session_id);
          return;
        }

        // Prepare transcription payload with stop_reason
        const transcribePayload: TranscribeAudioRequest = {
          session_id,
          audio_data: combinedAudioData,
          audio_format: buffer.audio_format,
          sample_rate: buffer.sample_rate,
          stop_reason: stop_reason || undefined, // Forward stop_reason to Python
        };

        // Clear the buffer after combining
        sessionBuffers.delete(session_id);

        console.log(`🎙️ Transcribing FINAL combined audio for session ${session_id}, stop_reason: ${stop_reason || "none"}`);
        const transcribeResult = await transcribeAudio(transcribePayload);

        if (!transcribeResult.success || !transcribeResult.data) {
          socket.emit("voiceInterview:transcription_error", {
            error: transcribeResult.error || "Failed to transcribe audio",
          });
          return;
        }

        const finalTranscript = transcribeResult.data.text.trim();

        // When the final transcript is empty, instruct the frontend to retry
        if (finalTranscript.length === 0) {
          console.log(`⚠️ Empty transcript for session ${session_id}, asking user to retry`);
          socket.emit("voiceInterview:transcription", {
            session_id,
            text: "",
            confidence: 0,
            is_final: true,
            should_retry: true,
            message: "Unable to capture speech. Please speak again.",
          });
          return;
        }

        // STEP 1: Emit final transcription FIRST (guaranteed ordering)
        await new Promise<void>((resolve) => {
          socket.emit("voiceInterview:transcription", {
            session_id,
            text: finalTranscript,
            confidence: transcribeResult.data!.confidence,
            is_final: true, // Always true for final transcription
          });
          // Use setImmediate to ensure event is queued before continuing
          setImmediate(() => resolve());
        });

        // STEP 2: Process the message and get AI response (AFTER transcript is emitted)
        const processPayload: ProcessMessageRequest = {
          session_id,
          user_message: finalTranscript,
          include_audio: true,
        };

        console.log(`💬 Processing message for session ${session_id}: "${finalTranscript}"`);
        const processResult = await processVoiceMessage(processPayload);

        if (processResult.success && processResult.data) {
          const responseData = processResult.data;
          
          // Update session state
          if (responseData.is_complete) {
            session.is_complete = true;
          }

          // STEP 3: Emit AI response AFTER transcription (guaranteed ordering)
          await new Promise<void>((resolve) => {
            socket.emit("voiceInterview:response", {
              session_id,
              text: responseData.text,
              audio_data: responseData.audio_data,
              audio_format: responseData.audio_format,
              current_phase: responseData.current_phase,
              current_question_index: responseData.current_question_index,
              total_questions: responseData.total_questions,
              progress_percentage: responseData.progress_percentage, // Pass through zero-based progress directly
              is_complete: responseData.is_complete,
              should_ask_followup: responseData.should_ask_followup,
            });
            // Use setImmediate to ensure event is queued before continuing
            setImmediate(() => resolve());
          });

          // If interview is complete, notify client
          if (responseData.is_complete) {
            socket.emit("voiceInterview:complete", {
              session_id,
              message: "Interview completed successfully",
            });
          }
        } else {
          socket.emit("voiceInterview:error", {
            error: processResult.error || "Failed to process message",
          });
        }
      } catch (error: any) {
        console.error("Voice Interview Audio Processing Error:", error);
        socket.emit("voiceInterview:error", {
          error: error.message || "Internal server error",
        });
        // Clean up buffer on error
        if (session_id) {
          sessionBuffers.delete(session_id);
        }
      }
    });

    /**
     * Process text message (alternative to audio)
     * Event: voiceInterview:message
     * Payload: { session_id, user_message, include_audio }
     */
    socket.on("voiceInterview:message", async ({ session_id, user_message, include_audio = true }) => {
      try {
        const session = activeVoiceSessions.get(socket.id);
        if (!session || session.session_id !== session_id) {
          socket.emit("voiceInterview:error", {
            error: "Session not found. Please join the session first.",
          });
          return;
        }

        if (session.is_complete) {
          socket.emit("voiceInterview:error", {
            error: "Interview is already complete",
          });
          return;
        }

        if (!user_message || user_message.trim().length === 0) {
          socket.emit("voiceInterview:error", {
            error: "user_message is required",
          });
          return;
        }

        const processPayload: ProcessMessageRequest = {
          session_id,
          user_message: user_message.trim(),
          include_audio,
        };

        console.log(`💬 Processing text message for session ${session_id}: "${user_message}"`);
        const processResult = await processVoiceMessage(processPayload);

        if (processResult.success && processResult.data) {
          const responseData = processResult.data;
          
          // Update session state
          if (responseData.is_complete) {
            session.is_complete = true;
          }

          // Send AI response to client
          socket.emit("voiceInterview:response", {
            session_id,
            text: responseData.text,
            audio_data: responseData.audio_data,
            audio_format: responseData.audio_format,
            current_phase: responseData.current_phase,
            current_question_index: responseData.current_question_index,
            total_questions: responseData.total_questions,
            progress_percentage: responseData.progress_percentage, // Pass through zero-based progress directly
            is_complete: responseData.is_complete,
            should_ask_followup: responseData.should_ask_followup,
          });

          // If interview is complete, notify client
          if (responseData.is_complete) {
            socket.emit("voiceInterview:complete", {
              session_id,
              message: "Interview completed successfully",
            });
          }
        } else {
          socket.emit("voiceInterview:error", {
            error: processResult.error || "Failed to process message",
          });
        }
      } catch (error: any) {
        console.error("Voice Interview Message Processing Error:", error);
        socket.emit("voiceInterview:error", {
          error: error.message || "Internal server error",
        });
      }
    });

    /**
     * Get current interview state
     * Event: voiceInterview:getState
     * Payload: { session_id }
     */
    socket.on("voiceInterview:getState", async ({ session_id }) => {
      try {
        const session = activeVoiceSessions.get(socket.id);
        if (!session || session.session_id !== session_id) {
          socket.emit("voiceInterview:error", {
            error: "Session not found. Please join the session first.",
          });
          return;
        }

        const stateResult = await getVoiceInterviewState(session_id);
        
        if (stateResult.success && stateResult.data) {
          socket.emit("voiceInterview:state", {
            session_id,
            state: stateResult.data,
          });
        } else {
          socket.emit("voiceInterview:error", {
            error: stateResult.error || "Failed to get interview state",
          });
        }
      } catch (error: any) {
        console.error("Voice Interview Get State Error:", error);
        socket.emit("voiceInterview:error", {
          error: error.message || "Internal server error",
        });
      }
    });

    /**
     * Leave voice interview session
     * Event: voiceInterview:leave
     */
    socket.on("voiceInterview:leave", () => {
      const session = activeVoiceSessions.get(socket.id);
      if (session) {
        console.log(`👋 User ${session.user_id} left voice interview session ${session.session_id}`);
        // Clean up audio buffer for this session
        sessionBuffers.delete(session.session_id);
        activeVoiceSessions.delete(socket.id);
        socket.emit("voiceInterview:left", {
          session_id: session.session_id,
        });
      }
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      // Clean up voice interview session
      const session = activeVoiceSessions.get(socket.id);
      if (session) {
        console.log(`🧹 Cleaning up voice interview session ${session.session_id} for disconnected client`);
        // Clean up audio buffer for this session
        sessionBuffers.delete(session.session_id);
        activeVoiceSessions.delete(socket.id);
      }
    });
  });
};

export const getIO = () => io;
