import crypto from "crypto";
import { generateAgoraToken } from "../utils/helper/agora-utils.js";

export const createRoomService = async (payload: any) => {
  const roomId = crypto.randomUUID();
  const hostUid = payload.user_id || String(Date.now());

  const agoraToken = generateAgoraToken(roomId, hostUid);

  return {
    room_id: roomId,
    host_uid: hostUid,
    agora_token: agoraToken,
    agora_app_id: process.env.AGORA_APP_ID,
    created_at: new Date(),
  };
};

export const joinRoomService = async (payload: any) => {
  const { room_id, user_id } = payload;

  if (!room_id || !user_id)
    throw new Error("Missing room_id or user_id");

  const agoraToken = generateAgoraToken(room_id, user_id);

  return {
    room_id,
    user_id,
    agora_app_id: process.env.AGORA_APP_ID,
    agora_token: agoraToken,
    joined_at: new Date(),
  };
};
