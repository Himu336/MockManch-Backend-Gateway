import { pgSchema, uuid, varchar, timestamp, boolean, text } from "drizzle-orm/pg-core";

/**
 * Auth schema - separate from dashboard schema
 * This schema stores user profile and auth-related data
 * Note: Supabase Auth handles authentication (users table in auth schema)
 * This schema is for additional user profile data
 */
export const authSchema = pgSchema("auth");

/**
 * User profiles - extends Supabase Auth users with additional profile data
 * The user_id references auth.users.id from Supabase Auth
 */
export const userProfiles = authSchema.table("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(), // References auth.users.id
  email: varchar("email").notNull().unique(),
  fullName: varchar("full_name"),
  avatarUrl: text("avatar_url"),
  phoneNumber: varchar("phone_number"),
  bio: text("bio"),
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Refresh tokens - for managing refresh token rotation
 * Supabase handles access tokens, but we can track refresh tokens here if needed
 */
export const refreshTokens = authSchema.table("refresh_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(), // References auth.users.id
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revoked: boolean("revoked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

