import { pgSchema, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const groupRoomSchema = pgSchema("group_room");

export const rooms = groupRoomSchema.table("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  hostId: varchar("host_id").notNull(),
  agoraChannel: varchar("agora_channel").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const participants = groupRoomSchema.table("participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
});
