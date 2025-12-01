// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./src/db/schema/*.ts"], // Explicit glob pattern for schema files
  out: "./drizzle",

  dialect: "postgresql",
  
  // 💡 THIS IS THE CRITICAL ADDITION 
  schemaFilter: ["public", "group_room", "dashboard", "auth", "wallet"],

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  
  // Verbose output for debugging
  verbose: true,
  strict: true,
});