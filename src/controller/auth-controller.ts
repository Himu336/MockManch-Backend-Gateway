import type { Request, Response } from "express";
import {
  signUp,
  signIn,
  signOut,
  refreshToken,
  getCurrentUser,
  updateProfile,
  verifyEmail,
  requestPasswordReset,
  getGoogleOAuthUrl,
  verifyOAuthSession,
  type SignUpRequest,
  type SignInRequest,
} from "../services/auth-service.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

/**
 * Controller to sign up a new user
 */
export const signUpController = async (req: Request, res: Response) => {
  try {
    const payload: SignUpRequest = {
      email: req.body.email,
      password: req.body.password,
      fullName: req.body.fullName || req.body.full_name,
      phoneNumber: req.body.phoneNumber || req.body.phone_number,
    };

    const result = await signUp(payload);

    if (result.success && result.data) {
      return res.status(result.statusCode || 201).json({
        success: true,
        data: {
          user: {
            id: result.data.user.id,
            email: result.data.user.email,
          },
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        },
      });
    } else {
      return res.status(result.statusCode || 500).json({
        success: false,
        error: result.error || "Failed to sign up",
      });
    }
  } catch (err: any) {
    console.error("Sign up controller error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to sign in an existing user
 */
export const signInController = async (req: Request, res: Response) => {
  try {
    const payload: SignInRequest = {
      email: req.body.email,
      password: req.body.password,
    };

    const result = await signIn(payload);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: {
          user: {
            id: result.data.user.id,
            email: result.data.user.email,
          },
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        },
      });
    } else {
      return res.status(result.statusCode || 401).json({
        success: false,
        error: result.error || "Invalid credentials",
      });
    }
  } catch (err: any) {
    console.error("Sign in controller error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to sign out the current user
 */
export const signOutController = async (req: Request, res: Response) => {
  try {
    const refreshTokenValue = req.body.refreshToken || req.headers["x-refresh-token"];

    if (!refreshTokenValue) {
      return res.status(400).json({
        success: false,
        error: "Refresh token is required",
      });
    }

    const result = await signOut(refreshTokenValue);

    if (result.success) {
      return res.status(result.statusCode || 200).json({
        success: true,
        message: "Signed out successfully",
      });
    } else {
      return res.status(result.statusCode || 400).json({
        success: false,
        error: result.error || "Failed to sign out",
      });
    }
  } catch (err: any) {
    console.error("Sign out controller error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to refresh access token
 */
export const refreshTokenController = async (req: Request, res: Response) => {
  try {
    const refreshTokenValue = req.body.refreshToken || req.headers["x-refresh-token"];

    if (!refreshTokenValue) {
      return res.status(400).json({
        success: false,
        error: "Refresh token is required",
      });
    }

    const result = await refreshToken(refreshTokenValue);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: {
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        },
      });
    } else {
      return res.status(result.statusCode || 401).json({
        success: false,
        error: result.error || "Failed to refresh token",
      });
    }
  } catch (err: any) {
    console.error("Refresh token controller error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to get current user profile
 * Requires authentication
 */
export const getCurrentUserController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const result = await getCurrentUser(req.user.id);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: result.data,
      });
    } else {
      return res.status(result.statusCode || 404).json({
        success: false,
        error: result.error || "User not found",
      });
    }
  } catch (err: any) {
    console.error("Get current user controller error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to update user profile
 * Requires authentication
 */
export const updateProfileController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const updates = {
      fullName: req.body.fullName || req.body.full_name,
      phoneNumber: req.body.phoneNumber || req.body.phone_number,
      bio: req.body.bio,
      avatarUrl: req.body.avatarUrl || req.body.avatar_url,
    };

    const result = await updateProfile(req.user.id, updates);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: result.data,
      });
    } else {
      return res.status(result.statusCode || 400).json({
        success: false,
        error: result.error || "Failed to update profile",
      });
    }
  } catch (err: any) {
    console.error("Update profile controller error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to verify email
 */
export const verifyEmailController = async (req: Request, res: Response) => {
  try {
    const token = req.body.token || req.query.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Verification token is required",
      });
    }

    const result = await verifyEmail(token);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: {
          user: {
            id: result.data.user.id,
            email: result.data.user.email,
          },
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        },
      });
    } else {
      return res.status(result.statusCode || 400).json({
        success: false,
        error: result.error || "Invalid verification token",
      });
    }
  } catch (err: any) {
    console.error("Verify email controller error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to request password reset
 */
export const requestPasswordResetController = async (req: Request, res: Response) => {
  try {
    const email = req.body.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const result = await requestPasswordReset(email);

    if (result.success) {
      return res.status(result.statusCode || 200).json({
        success: true,
        message: "Password reset email sent",
      });
    } else {
      return res.status(result.statusCode || 400).json({
        success: false,
        error: result.error || "Failed to send password reset email",
      });
    }
  } catch (err: any) {
    console.error("Request password reset controller error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to get Google OAuth URL
 * GET /api/v1/auth/oauth/google?redirect_to=https://yourapp.com/callback
 */
export const getGoogleOAuthUrlController = async (req: Request, res: Response) => {
  try {
    const redirectTo = req.query.redirect_to as string || req.body.redirectTo as string;

    if (!redirectTo) {
      return res.status(400).json({
        success: false,
        error: "redirect_to parameter is required",
      });
    }

    const result = await getGoogleOAuthUrl(redirectTo);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: result.data,
      });
    } else {
      return res.status(result.statusCode || 400).json({
        success: false,
        error: result.error || "Failed to generate OAuth URL",
      });
    }
  } catch (err: any) {
    console.error("Get Google OAuth URL controller error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to verify OAuth session
 * POST /api/v1/auth/oauth/verify
 * Body: { accessToken: "..." }
 * 
 * This should be called after the frontend exchanges the OAuth code for tokens
 * It ensures the user profile and wallet are set up
 */
export const verifyOAuthSessionController = async (req: Request, res: Response) => {
  try {
    const accessToken = req.body.accessToken || req.headers.authorization?.replace("Bearer ", "");

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: "Access token is required",
      });
    }

    const result = await verifyOAuthSession(accessToken);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: result.data,
      });
    } else {
      return res.status(result.statusCode || 401).json({
        success: false,
        error: result.error || "Failed to verify OAuth session",
      });
    }
  } catch (err: any) {
    console.error("Verify OAuth session controller error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

