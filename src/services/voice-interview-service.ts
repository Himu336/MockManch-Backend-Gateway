import axios, { AxiosError } from "axios";
import ServerConfig from "../config/serverConfig.js";

// Type definitions for Voice Interview API
export interface CreateVoiceInterviewRequest {
  job_role: string;
  experience_level: string;
  company?: string;
  job_description?: string;
  interview_type: string;
  interview_role?: string;
  difficulty?: string;
  user_id: string;
  num_questions?: number;
  duration_minutes?: number;
}

export interface CreateVoiceInterviewResponse {
  session_id: string;
  total_questions: number;
  config: any;
  created_at: string;
}

export interface TranscribeAudioRequest {
  session_id: string;
  audio_data: string; // base64-encoded audio
  audio_format?: string; // default: "webm"
  sample_rate?: number; // default: 16000
  stop_reason?: "manual" | "silence" | "timeout"; // reason for final chunk
}

export interface TranscribeAudioResponse {
  session_id: string;
  text: string;
  confidence: number;
  is_final: boolean;
}

export interface StartInterviewRequest {
  session_id: string;
}

export interface StartInterviewResponse {
  session_id: string;
  text: string;
  audio_data: string; // base64-encoded mp3
  audio_format: string;
  current_phase: "greeting" | "questions" | "followup" | "wrapup";
  current_question_index: number;
  total_questions: number;
  progress_percentage: number;
  is_complete: boolean;
  should_ask_followup: boolean;
}

export interface ProcessMessageRequest {
  session_id: string;
  user_message: string;
  include_audio?: boolean; // default: true
}

export interface ProcessMessageResponse {
  session_id: string;
  text: string;
  audio_data: string; // base64-encoded mp3
  audio_format: string;
  current_phase: "greeting" | "questions" | "followup" | "wrapup";
  current_question_index: number;
  total_questions: number;
  progress_percentage: number;
  is_complete: boolean;
  should_ask_followup: boolean;
}

export interface InterviewStateResponse {
  session_id: string;
  current_phase: "greeting" | "questions" | "followup" | "wrapup";
  current_question_index: number;
  total_questions: number;
  progress_percentage: number;
  is_complete: boolean;
  is_started: boolean;
}

export interface SessionStatusResponse {
  session_id: string;
  is_complete: boolean;
  is_started: boolean;
  current_phase: "greeting" | "questions" | "followup" | "wrapup";
  current_question_index: number;
  total_questions: number;
  conversation_turns: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface AnalysisResponse {
  session_id: string;
  overall_score: number;
  total_questions: number;
  answered_questions: number;
  conversation_summary: string;
  strengths_summary: string[];
  improvement_areas: string[];
  recommendations: string[];
  communication_score: number;
  content_score: number;
  engagement_score: number;
  completed_at: string;
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Base method to make HTTP requests to Python microservice
 */
const makeRequest = async <T>(
  method: "GET" | "POST",
  endpoint: string,
  data?: any
): Promise<ServiceResponse<T>> => {
  try {
    const config: any = {
      method,
      url: `${ServerConfig.PYTHON_MICROSERVICE_URL}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 120000, // 120 seconds timeout for voice operations (longer for audio processing)
      validateStatus: (status: number) => status < 500, // Don't throw on 4xx errors
    };

    if (data && method === "POST") {
      config.data = data;
    }

    const response = await axios(config);

    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    }

    // Handle client errors (4xx)
    const errorMessage = response.data?.detail || `Request failed with status ${response.status}`;
    return {
      success: false,
      error: errorMessage,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === "ECONNREFUSED") {
        return {
          success: false,
          error: "Python microservice is not available. Connection refused.",
          statusCode: 503,
        };
      }

      if (axiosError.code === "ETIMEDOUT" || axiosError.code === "ECONNABORTED") {
        return {
          success: false,
          error: "Request to Python microservice timed out",
          statusCode: 504,
        };
      }

      if (axiosError.response) {
        const responseData = axiosError.response.data as any;
        return {
          success: false,
          error: responseData?.detail || `Error from Python microservice: ${axiosError.response.status}`,
          data: responseData,
          statusCode: axiosError.response.status,
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      statusCode: 500,
    };
  }
};

/**
 * Create a new voice interview session
 */
export const createVoiceInterviewSession = async (
  payload: CreateVoiceInterviewRequest
): Promise<ServiceResponse<CreateVoiceInterviewResponse>> => {
  // Validate required fields
  if (!payload.job_role || !payload.experience_level || !payload.interview_type || !payload.user_id) {
    return {
      success: false,
      error: "Missing required fields: job_role, experience_level, interview_type, and user_id are required",
      statusCode: 400,
    };
  }

  // Validate num_questions if provided
  if (payload.num_questions !== undefined) {
    if (payload.num_questions < 3 || payload.num_questions > 15) {
      return {
        success: false,
        error: "num_questions must be between 3 and 15",
        statusCode: 400,
      };
    }
  }

  return makeRequest<CreateVoiceInterviewResponse>("POST", "/voice-interview/create", payload);
};

/**
 * Transcribe audio chunk to text
 */
export const transcribeAudio = async (
  payload: TranscribeAudioRequest
): Promise<ServiceResponse<TranscribeAudioResponse>> => {
  if (!payload.session_id || !payload.audio_data) {
    return {
      success: false,
      error: "Missing required fields: session_id and audio_data are required",
      statusCode: 400,
    };
  }

  // Set defaults
  const requestPayload = {
    session_id: payload.session_id,
    audio_data: payload.audio_data,
    audio_format: payload.audio_format || "webm",
    sample_rate: payload.sample_rate || 16000,
  };

  return makeRequest<TranscribeAudioResponse>("POST", "/voice-interview/transcribe", requestPayload);
};

/**
 * Start the interview and get greeting
 */
export const startVoiceInterview = async (
  sessionId: string
): Promise<ServiceResponse<StartInterviewResponse>> => {
  if (!sessionId || sessionId.trim() === "") {
    return {
      success: false,
      error: "session_id is required",
      statusCode: 400,
    };
  }

  return makeRequest<StartInterviewResponse>("POST", "/voice-interview/start", {
    session_id: sessionId,
  });
};

/**
 * Process user message and get AI response
 */
export const processVoiceMessage = async (
  payload: ProcessMessageRequest
): Promise<ServiceResponse<ProcessMessageResponse>> => {
  if (!payload.session_id || !payload.user_message) {
    return {
      success: false,
      error: "Missing required fields: session_id and user_message are required",
      statusCode: 400,
    };
  }

  const requestPayload = {
    session_id: payload.session_id,
    user_message: payload.user_message,
    include_audio: payload.include_audio !== undefined ? payload.include_audio : true,
  };

  return makeRequest<ProcessMessageResponse>("POST", "/voice-interview/process", requestPayload);
};

/**
 * Get current state of the interview session
 */
export const getVoiceInterviewState = async (
  sessionId: string
): Promise<ServiceResponse<InterviewStateResponse>> => {
  if (!sessionId || sessionId.trim() === "") {
    return {
      success: false,
      error: "session_id is required",
      statusCode: 400,
    };
  }

  return makeRequest<InterviewStateResponse>("GET", `/voice-interview/${sessionId}/state`);
};

/**
 * Get session status information
 */
export const getVoiceSessionStatus = async (
  sessionId: string
): Promise<ServiceResponse<SessionStatusResponse>> => {
  if (!sessionId || sessionId.trim() === "") {
    return {
      success: false,
      error: "session_id is required",
      statusCode: 400,
    };
  }

  return makeRequest<SessionStatusResponse>("GET", `/voice-interview/${sessionId}/status`);
};

/**
 * Get comprehensive analysis of completed interview
 */
export const getVoiceInterviewAnalysis = async (
  sessionId: string
): Promise<ServiceResponse<AnalysisResponse>> => {
  if (!sessionId || sessionId.trim() === "") {
    return {
      success: false,
      error: "session_id is required",
      statusCode: 400,
    };
  }

  return makeRequest<AnalysisResponse>("GET", `/voice-interview/${sessionId}/analysis`);
};

