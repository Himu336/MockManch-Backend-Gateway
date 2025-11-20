// src/routes/v1/room-test.routes.ts
import { Router } from "express";
import type { Request, Response } from "express";
import { generateAgoraToken } from "../../utils/helper/agora-utils.js";

const router = Router();

router.get("/token", (req: Request, res: Response) => {
  try {
    const channel = req.query.channel as string || `test-room`;
    const uid = req.query.uid as string || `${Date.now() % 100000}`;
    const token = generateAgoraToken(channel, uid);
    return res.json({ success: true, channel, uid, token });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
