import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabaseConfig.js";

/**
 * Extend Express Request to include user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

/**
 * Authentication middleware to verify Supabase JWT tokens
 * Extracts token from Authorization header and verifies it with Supabase
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "No authorization token provided",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
      return;
    }

    // Attach user to request object
    req.user = {
      ...user,
      id: user.id,
      email: user.email || "",
    };

    next();
  } catch (err: any) {
    console.error("Auth middleware error:", err);
    res.status(500).json({
      success: false,
      error: "Authentication error",
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if token is missing
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (!error && user) {
        req.user = {
          ...user,
          id: user.id,
          email: user.email || "",
        };
      }
    }

    next();
  } catch (err: any) {
    // Continue even if there's an error
    next();
  }
};

