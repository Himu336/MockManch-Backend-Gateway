import axios, { AxiosError } from "axios";
import ServerConfig from "../config/serverConfig.js";

// Type definitions for Interview API
export interface CreateInterviewRequest {
  job_role: string;
  experience_level: string;
  company?: string;
  job_description?: string;
  interview_type: string;
  user_id: string;
  num_questions?: number; // default: 5, range: 3-15
}

export interface CreateInterviewResponse {
  session_id: string;
  total_questions: number;
  config: any;
  created_at: string;
}

export interface QuestionResponse {
  session_id: string;
  current_question: {
    question_id: number;
    question_text: string;
    difficulty: string;
    hint?: {
      text: string;
      framework: string;
    };
    interview_type: string;
  };
  question_number: number;
  total_questions: number;
  progress_percentage: number;
  is_complete: boolean;
}

export interface SubmitAnswerRequest {
  answer: string;
  question_id: number;
}

export interface SubmitAnswerResponse {
  session_id: string;
  question_id: number;
  answer_saved: boolean;
  next_question_available: boolean;
  is_complete: boolean;
}

export interface AnalysisResponse {
  overall_score: number;
  evaluations: Array<{
    question_text: string;
    score: number;
    feedback: string;
  }>;
  overall_feedback: string;
  strengths_summary: string[];
  improvement_areas: string[];
  recommendations?: string[]; // Optional field mentioned in migration guide
}

export interface StatusResponse {
  session_id: string;
  is_complete: boolean;
  current_question: number;
  total_questions: number;
  progress_percentage: number;
  answers_submitted: number;
  created_at: string;
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
      timeout: 60000, // 60 seconds timeout for AI operations
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
 * Create a new interview session
 */
export const createInterviewSession = async (
  payload: CreateInterviewRequest
): Promise<ServiceResponse<CreateInterviewResponse>> => {
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

  return makeRequest<CreateInterviewResponse>("POST", "/interview/create", payload);
};

/**
 * Get current question for an interview session
 */
export const getCurrentQuestion = async (
  sessionId: string
): Promise<ServiceResponse<QuestionResponse>> => {
  // Enhanced validation
  if (!sessionId || sessionId === 'undefined' || sessionId === 'null' || sessionId.trim() === '') {
    console.error("getCurrentQuestion - Invalid sessionId:", sessionId);
    return {
      success: false,
      error: `session_id is required. Received: ${sessionId || 'undefined'}`,
      statusCode: 400,
    };
  }

  // Ensure sessionId is properly formatted (no extra spaces)
  const cleanSessionId = sessionId.trim();
  console.log("getCurrentQuestion - Making request with sessionId:", cleanSessionId);
  
  return makeRequest<QuestionResponse>("GET", `/interview/${cleanSessionId}/question`);
};

/**
 * Submit an answer for the current question
 */
export const submitAnswer = async (
  sessionId: string,
  payload: SubmitAnswerRequest
): Promise<ServiceResponse<SubmitAnswerResponse>> => {
  if (!sessionId) {
    return {
      success: false,
      error: "session_id is required",
      statusCode: 400,
    };
  }

  if (!payload.answer || payload.question_id === undefined) {
    return {
      success: false,
      error: "Missing required fields: answer and question_id are required",
      statusCode: 400,
    };
  }

  return makeRequest<SubmitAnswerResponse>("POST", `/interview/${sessionId}/answer`, payload);
};

/**
 * Get comprehensive analysis after interview completion
 */
export const getAnalysis = async (
  sessionId: string
): Promise<ServiceResponse<AnalysisResponse>> => {
  if (!sessionId) {
    return {
      success: false,
      error: "session_id is required",
      statusCode: 400,
    };
  }

  return makeRequest<AnalysisResponse>("GET", `/interview/${sessionId}/analysis`);
};

/**
 * Get current status of an interview session
 */
export const getSessionStatus = async (
  sessionId: string
): Promise<ServiceResponse<StatusResponse>> => {
  if (!sessionId) {
    return {
      success: false,
      error: "session_id is required",
      statusCode: 400,
    };
  }

  return makeRequest<StatusResponse>("GET", `/interview/${sessionId}/status`);
};

