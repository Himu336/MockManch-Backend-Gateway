# Voice Interview Frontend Integration Guide

This document provides complete integration instructions for the Voice Interview feature in the frontend application.

## Table of Contents
1. [Overview](#overview)
2. [REST API Endpoints](#rest-api-endpoints)
3. [WebSocket Events](#websocket-events)
4. [Complete Flow](#complete-flow)
5. [Request/Response Formats](#requestresponse-formats)
6. [Error Handling](#error-handling)
7. [Example Implementation](#example-implementation)

---

## Overview

The Voice Interview feature enables real-time two-way voice conversations between users and an AI interviewer. It supports:
- Real-time audio streaming via WebSocket
- Automatic speech-to-text transcription
- Natural conversation flow (greeting → questions → follow-ups → wrap-up)
- AI-generated voice responses
- Interview analysis and feedback

**Base URL:** `http://your-backend-url/api/v1/voice-interview`  
**WebSocket URL:** `ws://your-backend-url` (same as HTTP server)

---

## REST API Endpoints

### 1. Create Voice Interview Session

**Endpoint:** `POST /api/v1/voice-interview/create`

**Request Body:**
```json
{
  "job_role": "Senior Software Engineer",
  "experience_level": "Senior Level (6-10 years)",
  "company": "Google",
  "job_description": "Optional job description...",
  "interview_type": "Technical",
  "interview_role": "Technical Interviewer",
  "difficulty": "Advanced",
  "user_id": "user123",
  "num_questions": 5,
  "duration_minutes": 30
}
```

**Required Fields:**
- `job_role` (string)
- `experience_level` (string)
- `interview_type` (string)
- `user_id` (string)

**Optional Fields:**
- `company` (string)
- `job_description` (string)
- `interview_role` (string)
- `difficulty` (string: "Beginner", "Intermediate", "Advanced")
- `num_questions` (number, 3-15, default: 5)
- `duration_minutes` (number)

**Response (200/201):**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-here",
    "total_questions": 5,
    "config": { ... },
    "created_at": "2024-01-01T00:00:00"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

### 2. Transcribe Audio (Optional - Use WebSocket Instead)

**Endpoint:** `POST /api/v1/voice-interview/transcribe`

**Request Body:**
```json
{
  "session_id": "uuid-here",
  "audio_data": "base64-encoded-audio",
  "audio_format": "webm",
  "sample_rate": 16000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-here",
    "text": "Transcribed text here",
    "confidence": 0.95,
    "is_final": true
  }
}
```

**Note:** Prefer using WebSocket `voiceInterview:audio` event for real-time transcription.

---

### 3. Start Interview

**Endpoint:** `POST /api/v1/voice-interview/start`

**Request Body:**
```json
{
  "session_id": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-here",
    "text": "Hello! Thank you for joining us today...",
    "audio_data": "base64-encoded-mp3",
    "audio_format": "mp3",
    "current_phase": "greeting",
    "current_question_index": 0,
    "total_questions": 5,
    "progress_percentage": 0.0,
    "is_complete": false,
    "should_ask_followup": false
  }
}
```

**Note:** You can also use WebSocket `voiceInterview:start` event for this.

---

### 4. Process Message (Optional - Use WebSocket Instead)

**Endpoint:** `POST /api/v1/voice-interview/process`

**Request Body:**
```json
{
  "session_id": "uuid-here",
  "user_message": "User's transcribed text or input",
  "include_audio": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-here",
    "text": "AI response text",
    "audio_data": "base64-encoded-mp3",
    "audio_format": "mp3",
    "current_phase": "questions",
    "current_question_index": 1,
    "total_questions": 5,
    "progress_percentage": 20.0,
    "is_complete": false,
    "should_ask_followup": false
  }
}
```

**Note:** Prefer using WebSocket `voiceInterview:message` or `voiceInterview:audio` events.

---

### 5. Get Interview State

**Endpoint:** `GET /api/v1/voice-interview/:session_id/state`

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-here",
    "current_phase": "questions",
    "current_question_index": 2,
    "total_questions": 5,
    "progress_percentage": 40.0,
    "is_complete": false,
    "is_started": true
  }
}
```

---

### 6. Get Session Status

**Endpoint:** `GET /api/v1/voice-interview/:session_id/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-here",
    "is_complete": false,
    "is_started": true,
    "current_phase": "questions",
    "current_question_index": 2,
    "total_questions": 5,
    "conversation_turns": 6,
    "created_at": "2024-01-01T00:00:00",
    "started_at": "2024-01-01T00:05:00",
    "completed_at": null
  }
}
```

---

### 7. Get Analysis (After Interview Complete)

**Endpoint:** `GET /api/v1/voice-interview/:session_id/analysis`

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-here",
    "overall_score": 75.5,
    "total_questions": 5,
    "answered_questions": 5,
    "conversation_summary": "Summary of the interview...",
    "strengths_summary": ["Clear communication", "Good examples"],
    "improvement_areas": ["Could be more concise", "Add metrics"],
    "recommendations": ["Practice speaking pace", "Prepare STAR examples"],
    "communication_score": 80.0,
    "content_score": 72.0,
    "engagement_score": 74.5,
    "completed_at": "2024-01-01T01:00:00"
  }
}
```

---

## WebSocket Events

### Connection

Connect to the WebSocket server (same URL as HTTP, but with `ws://` or `wss://` protocol).

```javascript
import io from 'socket.io-client';
const socket = io('http://your-backend-url');
```

---

### Client → Server Events (Emit)

#### 1. Join Voice Interview Session

**Event:** `voiceInterview:join`

**Payload:**
```json
{
  "session_id": "uuid-here",
  "user_id": "user123"
}
```

**When to use:** After creating a session, before starting the interview.

---

#### 2. Start Interview

**Event:** `voiceInterview:start`

**Payload:**
```json
{
  "session_id": "uuid-here"
}
```

**When to use:** When user clicks "Start Interview" button.

---

#### 3. Send Audio Chunk

**Event:** `voiceInterview:audio`

**Payload:**
```json
{
  "session_id": "uuid-here",
  "audio_data": "base64-encoded-audio-chunk",
  "audio_format": "webm",
  "sample_rate": 16000,
  "is_final": false
}
```

**When to use:** Continuously send audio chunks while user is speaking. Set `is_final: true` when user stops speaking.

**Audio Format:**
- Encode audio as base64 string
- Supported formats: `webm`, `wav`, `mp3`
- Sample rate: typically 16000 Hz
- Send chunks every 1-2 seconds while recording

---

#### 4. Send Text Message (Alternative to Audio)

**Event:** `voiceInterview:message`

**Payload:**
```json
{
  "session_id": "uuid-here",
  "user_message": "User's text input",
  "include_audio": true
}
```

**When to use:** If user types instead of speaking, or for testing.

---

#### 5. Get Current State

**Event:** `voiceInterview:getState`

**Payload:**
```json
{
  "session_id": "uuid-here"
}
```

**When to use:** To refresh the current interview state.

---

#### 6. Leave Session

**Event:** `voiceInterview:leave`

**Payload:** None (session_id is tracked by socket)

**When to use:** When user exits the interview or component unmounts.

---

### Server → Client Events (Listen)

#### 1. Session Joined

**Event:** `voiceInterview:joined`

**Payload:**
```json
{
  "session_id": "uuid-here",
  "state": {
    "session_id": "uuid-here",
    "current_phase": "greeting",
    "current_question_index": 0,
    "total_questions": 5,
    "progress_percentage": 0.0,
    "is_complete": false,
    "is_started": false
  }
}
```

**When received:** After emitting `voiceInterview:join`.

---

#### 2. Interview Started

**Event:** `voiceInterview:started`

**Payload:**
```json
{
  "session_id": "uuid-here",
  "text": "Hello! Thank you for joining us today...",
  "audio_data": "base64-encoded-mp3",
  "audio_format": "mp3",
  "current_phase": "greeting",
  "current_question_index": 0,
  "total_questions": 5,
  "progress_percentage": 0.0,
  "is_complete": false,
  "should_ask_followup": false
}
```

**When received:** After emitting `voiceInterview:start`.

**Action:** Play the `audio_data` and display the `text` on screen.

---

#### 3. Transcription Result

**Event:** `voiceInterview:transcription`

**Payload:**
```json
{
  "session_id": "uuid-here",
  "text": "Transcribed text here",
  "confidence": 0.95,
  "is_final": true
}
```

**When received:** After sending audio chunk via `voiceInterview:audio`.

**Action:** Display transcribed text to user (optional, for feedback).

---

#### 4. AI Response

**Event:** `voiceInterview:response`

**Payload:**
```json
{
  "session_id": "uuid-here",
  "text": "AI response text",
  "audio_data": "base64-encoded-mp3",
  "audio_format": "mp3",
  "current_phase": "questions",
  "current_question_index": 1,
  "total_questions": 5,
  "progress_percentage": 20.0,
  "is_complete": false,
  "should_ask_followup": false
}
```

**When received:** After processing user's message/audio.

**Action:** 
- Play the `audio_data` 
- Display the `text` on screen
- Update progress bar using `progress_percentage`
- Update question counter: `current_question_index + 1` of `total_questions`

---

#### 5. Interview Complete

**Event:** `voiceInterview:complete`

**Payload:**
```json
{
  "session_id": "uuid-here",
  "message": "Interview completed successfully"
}
```

**When received:** When `is_complete: true` in the response.

**Action:** 
- Stop recording
- Show completion message
- Fetch analysis using REST API: `GET /api/v1/voice-interview/:session_id/analysis`
- Display results to user

---

#### 6. Current State

**Event:** `voiceInterview:state`

**Payload:**
```json
{
  "session_id": "uuid-here",
  "state": {
    "session_id": "uuid-here",
    "current_phase": "questions",
    "current_question_index": 2,
    "total_questions": 5,
    "progress_percentage": 40.0,
    "is_complete": false,
    "is_started": true
  }
}
```

**When received:** After emitting `voiceInterview:getState`.

---

#### 7. Left Session

**Event:** `voiceInterview:left`

**Payload:**
```json
{
  "session_id": "uuid-here"
}
```

**When received:** After emitting `voiceInterview:leave`.

---

#### 8. Error

**Event:** `voiceInterview:error`

**Payload:**
```json
{
  "error": "Error message here"
}
```

**When received:** On any error during WebSocket operations.

**Action:** Display error message to user.

---

#### 9. Transcription Error

**Event:** `voiceInterview:transcription_error`

**Payload:**
```json
{
  "error": "Failed to transcribe audio"
}
```

**When received:** When audio transcription fails.

**Action:** Retry sending audio or show error to user.

---

## Complete Flow

### Step-by-Step Interview Flow

```
1. User fills interview configuration form
   ↓
2. POST /api/v1/voice-interview/create
   → Get session_id
   ↓
3. Connect WebSocket
   ↓
4. Emit: voiceInterview:join { session_id, user_id }
   → Listen: voiceInterview:joined
   ↓
5. User clicks "Start Interview"
   ↓
6. Emit: voiceInterview:start { session_id }
   → Listen: voiceInterview:started
   → Play greeting audio
   → Display greeting text
   ↓
7. Start recording user audio
   ↓
8. While user is speaking:
   - Capture audio chunks (every 1-2 seconds)
   - Convert to base64
   - Emit: voiceInterview:audio { session_id, audio_data, is_final: false }
   → Listen: voiceInterview:transcription (optional, for display)
   ↓
9. When user stops speaking:
   - Emit: voiceInterview:audio { session_id, audio_data, is_final: true }
   → Listen: voiceInterview:transcription (final)
   → Listen: voiceInterview:response
   → Play AI response audio
   → Display AI response text
   → Update progress
   ↓
10. Repeat steps 7-9 until:
    → Listen: voiceInterview:complete
    ↓
11. GET /api/v1/voice-interview/:session_id/analysis
    → Display analysis and feedback
    ↓
12. Emit: voiceInterview:leave
    → Disconnect WebSocket
```

---

## Request/Response Formats

### Interview Phases

- `"greeting"` - Initial greeting from AI
- `"questions"` - Main interview questions
- `"followup"` - Follow-up questions on current topic
- `"wrapup"` - Closing remarks

### Progress Calculation

```javascript
progress_percentage = (current_question_index / total_questions) * 100
```

### Audio Handling

**Encoding Audio to Base64:**
```javascript
// Example: Convert Blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
```

**Decoding Base64 Audio:**
```javascript
// Example: Play base64 audio
const playBase64Audio = (base64Audio, format = 'mp3') => {
  const audio = new Audio(`data:audio/${format};base64,${base64Audio}`);
  audio.play();
};
```

---

## Error Handling

### HTTP Error Responses

All REST endpoints return:
- `200/201`: Success
- `400`: Bad Request (invalid input)
- `404`: Session not found
- `500`: Internal server error
- `503`: Python microservice unavailable
- `504`: Request timeout

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

### WebSocket Error Handling

Listen for `voiceInterview:error` event:
```javascript
socket.on('voiceInterview:error', (data) => {
  console.error('Voice Interview Error:', data.error);
  // Display error to user
  showErrorNotification(data.error);
});
```

### Common Error Scenarios

1. **Session Not Found**
   - Error: "Session not found. Please join the session first."
   - Solution: Ensure you've called `voiceInterview:join` before other events

2. **Interview Already Complete**
   - Error: "Interview is already complete"
   - Solution: Don't send audio/messages after completion

3. **Microservice Unavailable**
   - Error: "Python microservice is not available"
   - Solution: Check backend connection, retry after delay

4. **Transcription Failed**
   - Event: `voiceInterview:transcription_error`
   - Solution: Retry sending audio or ask user to speak again

---

## Example Implementation

### React/TypeScript Example

```typescript
import { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

interface VoiceInterviewState {
  sessionId: string | null;
  isConnected: boolean;
  isRecording: boolean;
  currentPhase: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  progressPercentage: number;
  isComplete: boolean;
  transcript: string;
  aiResponse: string;
}

const VoiceInterviewComponent = () => {
  const [state, setState] = useState<VoiceInterviewState>({
    sessionId: null,
    isConnected: false,
    isRecording: false,
    currentPhase: 'greeting',
    currentQuestionIndex: 0,
    totalQuestions: 5,
    progressPercentage: 0,
    isComplete: false,
    transcript: '',
    aiResponse: '',
  });

  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 1. Create Session
  const createSession = async () => {
    const response = await fetch('/api/v1/voice-interview/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_role: 'Senior Software Engineer',
        experience_level: 'Senior Level (6-10 years)',
        interview_type: 'Technical',
        user_id: 'user123',
        num_questions: 5,
      }),
    });

    const data = await response.json();
    if (data.success) {
      setState(prev => ({ ...prev, sessionId: data.data.session_id }));
      connectWebSocket(data.data.session_id);
    }
  };

  // 2. Connect WebSocket
  const connectWebSocket = (sessionId: string) => {
    const socket = io('http://your-backend-url');
    socketRef.current = socket;

    socket.on('connect', () => {
      setState(prev => ({ ...prev, isConnected: true }));
      
      // Join session
      socket.emit('voiceInterview:join', {
        session_id: sessionId,
        user_id: 'user123',
      });
    });

    // Listen for events
    socket.on('voiceInterview:joined', (data) => {
      console.log('Joined session:', data);
    });

    socket.on('voiceInterview:started', (data) => {
      playAudio(data.audio_data);
      setState(prev => ({
        ...prev,
        aiResponse: data.text,
        currentPhase: data.current_phase,
        progressPercentage: data.progress_percentage,
      }));
    });

    socket.on('voiceInterview:transcription', (data) => {
      if (data.is_final) {
        setState(prev => ({ ...prev, transcript: data.text }));
      }
    });

    socket.on('voiceInterview:response', (data) => {
      playAudio(data.audio_data);
      setState(prev => ({
        ...prev,
        aiResponse: data.text,
        currentPhase: data.current_phase,
        currentQuestionIndex: data.current_question_index,
        progressPercentage: data.progress_percentage,
        isComplete: data.is_complete,
      }));
    });

    socket.on('voiceInterview:complete', async (data) => {
      setState(prev => ({ ...prev, isComplete: true, isRecording: false }));
      stopRecording();
      // Fetch analysis
      const analysis = await fetchAnalysis(data.session_id);
      // Display analysis
    });

    socket.on('voiceInterview:error', (data) => {
      console.error('Error:', data.error);
      // Show error to user
    });
  };

  // 3. Start Interview
  const startInterview = () => {
    if (socketRef.current && state.sessionId) {
      socketRef.current.emit('voiceInterview:start', {
        session_id: state.sessionId,
      });
    }
  };

  // 4. Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          sendAudioChunk(event.data, false);
        }
      };

      mediaRecorder.onstop = () => {
        // Send final chunk
        const finalBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        sendAudioChunk(finalBlob, true);
      };

      mediaRecorder.start(1000); // Send chunks every 1 second
      setState(prev => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // 5. Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setState(prev => ({ ...prev, isRecording: false }));
    }
  };

  // 6. Send Audio Chunk
  const sendAudioChunk = async (blob: Blob, isFinal: boolean) => {
    if (!socketRef.current || !state.sessionId) return;

    const base64Audio = await blobToBase64(blob);
    
    socketRef.current.emit('voiceInterview:audio', {
      session_id: state.sessionId,
      audio_data: base64Audio,
      audio_format: 'webm',
      sample_rate: 16000,
      is_final: isFinal,
    });
  };

  // Helper: Convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:audio/webm;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Helper: Play Base64 Audio
  const playAudio = (base64Audio: string) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audio.play();
  };

  // Fetch Analysis
  const fetchAnalysis = async (sessionId: string) => {
    const response = await fetch(`/api/v1/voice-interview/${sessionId}/analysis`);
    const data = await response.json();
    return data.data;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('voiceInterview:leave');
        socketRef.current.disconnect();
      }
      stopRecording();
    };
  }, []);

  return (
    <div>
      <button onClick={createSession}>Create Session</button>
      <button onClick={startInterview} disabled={!state.isConnected}>
        Start Interview
      </button>
      <button onClick={startRecording} disabled={state.isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!state.isRecording}>
        Stop Recording
      </button>
      
      <div>
        <p>Progress: {state.progressPercentage}%</p>
        <p>Question: {state.currentQuestionIndex + 1} / {state.totalQuestions}</p>
        <p>Phase: {state.currentPhase}</p>
      </div>

      <div>
        <h3>Your Transcript:</h3>
        <p>{state.transcript}</p>
      </div>

      <div>
        <h3>AI Response:</h3>
        <p>{state.aiResponse}</p>
      </div>

      {state.isComplete && <p>Interview Complete! Fetching analysis...</p>}
    </div>
  );
};

export default VoiceInterviewComponent;
```

---

## Key Implementation Notes

1. **Audio Recording:**
   - Use `MediaRecorder` API for browser audio capture
   - Send chunks every 1-2 seconds while recording
   - Set `is_final: true` only when user stops speaking

2. **Audio Playback:**
   - Decode base64 audio and play using HTML5 Audio API
   - Handle audio format (typically `mp3` from server)

3. **State Management:**
   - Track session state locally
   - Update UI based on WebSocket events
   - Handle reconnection if connection drops

4. **Error Handling:**
   - Always listen for `voiceInterview:error`
   - Show user-friendly error messages
   - Retry failed operations when appropriate

5. **Cleanup:**
   - Always emit `voiceInterview:leave` on component unmount
   - Stop recording and close media streams
   - Disconnect WebSocket

6. **Progress Tracking:**
   - Use `progress_percentage` for progress bar
   - Display `current_question_index + 1` of `total_questions`

7. **Interview Phases:**
   - Show different UI based on `current_phase`
   - Handle `should_ask_followup` flag for follow-up questions

---

## Testing Checklist

- [ ] Create session successfully
- [ ] Connect WebSocket and join session
- [ ] Start interview and receive greeting
- [ ] Record and send audio chunks
- [ ] Receive transcription results
- [ ] Receive AI responses (text + audio)
- [ ] Play AI audio responses
- [ ] Update progress bar correctly
- [ ] Handle interview completion
- [ ] Fetch and display analysis
- [ ] Handle errors gracefully
- [ ] Clean up on component unmount

---

## Support

For issues or questions, refer to:
- Backend API documentation
- WebSocket event documentation above
- Error messages for debugging

---

**Last Updated:** 2024-01-01  
**Version:** 1.0.0

