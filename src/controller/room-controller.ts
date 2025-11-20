import type { Request, Response } from "express";
import {
  createRoomService,
  joinRoomService
} from "../services/room-service.js";

export const createRoomController = async (req: Request, res: Response) => {
  try {
    const data = await createRoomService(req.body);
    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const joinRoomController = async (req: Request, res: Response) => {
  try {
    const data = await joinRoomService(req.body);
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
