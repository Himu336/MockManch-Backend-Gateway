import { db } from "../db/client.js";
import { rooms, participants } from "../db/schema/group-room.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const createRoomService = async (payload: any) => {
  const hostId = payload.user_id;
  if (!hostId) throw new Error("Missing user_id");

  const channelName = `room_${Date.now()}`;

  const [room] = await db.insert(rooms)
    .values({
      id: crypto.randomUUID(),
      hostId: hostId,
      agoraChannel: channelName
    })
    .returning();

  return room;
};

export const joinRoomService = async (payload: any) => {
  const { room_id, user_id } = payload;

  if (!room_id || !user_id) {
    throw new Error("Missing room_id or user_id");
  }

  // check room exists
  const [existingRoom] = await db.select().from(rooms).where(eq(rooms.id, room_id)).limit(1);

  if (!existingRoom) {
    throw new Error("Room not found");
  }

  // insert participant
  const [joined] = await db.insert(participants)
    .values({
      id: crypto.randomUUID(),
      roomId: room_id,
      userId: user_id
    })
    .returning();

  return {
    room: existingRoom,
    participant: joined
  };
};
