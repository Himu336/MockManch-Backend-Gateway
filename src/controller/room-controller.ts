import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { createRoomService, joinRoomService } from "../services/room-service.js";
import { generateAgoraToken } from "../utils/helper/agora-utils.js";
import { deductTokensForService } from "../utils/token-deduction.js";

/**
 * Controller to create a new group practice room
 * STRICT TOKEN DEDUCTION: Tokens are deducted BEFORE creating room
 */
export const createRoomController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Authentication is required (enforced by middleware)
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. Please include a valid Authorization token.",
      });
    }

    // ============================================
    // CRITICAL: Deduct tokens BEFORE creating room
    // ============================================
    const tokensDeducted = await deductTokensForService(
      req,
      res,
      "group_practice",
      {
        service: "group_practice",
        action: "create_room",
      }
    );

    if (!tokensDeducted) {
      // Error response already sent by deductTokensForService
      return;
    }

    const room = await createRoomService({
      ...req.body,
      user_id: req.user.id, // Use authenticated user ID
    });

    if (!room) {
      return res.status(500).json({ success: false, error: "Failed to create room" });
    }

    const token = generateAgoraToken(room.id, room.hostId);

    return res.status(201).json({
      success: true,
      room,
      agora_app_id: process.env.AGORA_APP_ID,
      agora_token: token,
      channel: room.id
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Controller to join a group practice room
 * STRICT TOKEN DEDUCTION: Tokens are deducted BEFORE joining room
 */
export const joinRoomController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Authentication is required (enforced by middleware)
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. Please include a valid Authorization token.",
      });
    }

    // ============================================
    // CRITICAL: Deduct tokens BEFORE joining room
    // ============================================
    const tokensDeducted = await deductTokensForService(
      req,
      res,
      "group_practice",
      {
        service: "group_practice",
        action: "join_room",
        room_id: req.body.room_id,
      }
    );

    if (!tokensDeducted) {
      // Error response already sent by deductTokensForService
      return;
    }

    const { room, participant } = await joinRoomService({
      ...req.body,
      userId: req.user.id, // Use authenticated user ID
    });

    if (!participant) {
      return res.status(404).json({ success: false, error: "Participant not found" });
    }

    const token = generateAgoraToken(room.id, participant.userId);

    return res.status(200).json({
      success: true,
      room,
      participant,
      agora_app_id: process.env.AGORA_APP_ID,
      agora_token: token,
      channel: room.id
    });
    
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
