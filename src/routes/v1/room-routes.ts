import { Router } from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import {
  createRoomController,
  joinRoomController
} from "../../controller/room-controller.js";

const router = Router();

// POST /api/v1/room/create - Create a new group practice room (REQUIRES AUTH & TOKENS)
router.post("/create", authenticateToken, createRoomController);

// POST /api/v1/room/join - Join a group practice room (REQUIRES AUTH & TOKENS)
router.post("/join", authenticateToken, joinRoomController);

export default router;
