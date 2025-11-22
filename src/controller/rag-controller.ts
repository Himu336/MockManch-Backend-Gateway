import type { Request, Response } from "express";
import { processRAGRequest } from "../services/rag-service.js";

/**
 * Controller to handle RAG requests from frontend
 * Acts as a gateway between frontend and Python microservice
 */
export const ragController = async (req: Request, res: Response) => {
  try {
    const { message, user_id } = req.body;

    // Validate request body
    if (!message || !user_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: message and user_id are required",
      });
    }

    // Process RAG request through service
    const result = await processRAGRequest({
      message,
      user_id,
    });

    // Return appropriate status code based on result
    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      // Determine status code based on error type
      const statusCode = result.error?.includes("not available") || result.error?.includes("Connection refused")
        ? 503 // Service Unavailable
        : result.error?.includes("timed out")
        ? 504 // Gateway Timeout
        : 500; // Internal Server Error

      return res.status(statusCode).json({
        success: false,
        error: result.error,
        data: result.data,
      });
    }
  } catch (err: any) {
    console.error("RAG Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

