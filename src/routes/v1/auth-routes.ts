import express from "express";
import {
  signUpController,
  signInController,
  signOutController,
  refreshTokenController,
  getCurrentUserController,
  updateProfileController,
  verifyEmailController,
  requestPasswordResetController,
  getGoogleOAuthUrlController,
  verifyOAuthSessionController,
} from "../../controller/auth-controller.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";

const authRouter = express.Router();

// Public routes
authRouter.post("/signup", signUpController);
authRouter.post("/signin", signInController);
authRouter.post("/signout", signOutController);
authRouter.post("/refresh", refreshTokenController);
authRouter.post("/verify-email", verifyEmailController);
authRouter.post("/forgot-password", requestPasswordResetController);

// OAuth routes
authRouter.get("/oauth/google", getGoogleOAuthUrlController);
authRouter.post("/oauth/verify", verifyOAuthSessionController);

// Protected routes (require authentication)
authRouter.get("/me", authenticateToken, getCurrentUserController);
authRouter.put("/profile", authenticateToken, updateProfileController);

export default authRouter;

