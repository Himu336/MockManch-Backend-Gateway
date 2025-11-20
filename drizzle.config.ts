// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema", // Assuming this path is now correct
  out: "./drizzle",

  dialect: "postgresql",
  
  // 💡 THIS IS THE CRITICAL ADDITION 
  schemaFilter: ["public", "group_room"],

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});