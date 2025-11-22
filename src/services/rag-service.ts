import axios, { AxiosError } from "axios";
import ServerConfig from "../config/serverConfig.js";

interface RAGRequestPayload {
  message: string;
  user_id: string;
}

interface RAGResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Service to handle RAG requests by forwarding them to Python microservice
 * @param payload - The RAG request payload containing message and user_id
 * @returns Promise with the response from Python microservice
 */
export const processRAGRequest = async (payload: RAGRequestPayload): Promise<RAGResponse> => {
  try {
    // Validate required fields
    if (!payload.message || !payload.user_id) {
      throw new Error("Missing required fields: message and user_id are required");
    }

    // Make request to Python microservice
    const response = await axios.post(
      `${ServerConfig.PYTHON_MICROSERVICE_URL}/rag`,
      {
        message: payload.message,
        user_id: payload.user_id,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 seconds timeout for production
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      }
    );

    // Handle successful responses
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        data: response.data,
      };
    }

    // Handle client errors (4xx)
    return {
      success: false,
      error: response.data?.error || `Request failed with status ${response.status}`,
      data: response.data,
    };
  } catch (error) {
    // Handle network errors, timeouts, etc.
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === "ECONNREFUSED") {
        return {
          success: false,
          error: "Python microservice is not available. Connection refused.",
        };
      }
      
      if (axiosError.code === "ETIMEDOUT" || axiosError.code === "ECONNABORTED") {
        return {
          success: false,
          error: "Request to Python microservice timed out",
        };
      }

      if (axiosError.response) {
        // Server responded with error status
        const responseData = axiosError.response.data as any;
        return {
          success: false,
          error: responseData?.error || `Error from Python microservice: ${axiosError.response.status}`,
          data: responseData,
        };
      }
    }

    // Handle other errors
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

