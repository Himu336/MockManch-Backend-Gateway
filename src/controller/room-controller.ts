import type { Request, Response } from "express";
import { createRoomService, joinRoomService } from "../services/room-service.js";
import { generateAgoraToken } from "../utils/helper/agora-utils.js";

export const createRoomController = async (req: Request, res: Response) => {
  try {
    const room = await createRoomService(req.body);

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

export const joinRoomController = async (req: Request, res: Response) => {
  try {
    const { room, participant } = await joinRoomService(req.body);

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
