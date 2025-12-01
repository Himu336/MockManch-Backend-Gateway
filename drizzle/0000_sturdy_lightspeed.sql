CREATE SCHEMA IF NOT EXISTS "group_room";
--> statement-breakpoint
CREATE TABLE "group_room"."participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "group_room"."rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
