import { Router } from "express";
import {
  createRoomController,
  joinRoomController
} from "../../controller/room-controller.js";

const router = Router();

router.post("/create", createRoomController);
router.post("/join", joinRoomController);

export default router;
