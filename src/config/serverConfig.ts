import dotenv from "dotenv";

dotenv.config();

export default {
    PORT: process.env.PORT,
    AGORA_APP_ID: process.env.AGORA_APP_ID,
    AGORA_APP_CERT: process.env.AGORA_APP_CERT,
    PYTHON_MICROSERVICE_URL: process.env.PYTHON_MICROSERVICE_URL || "http://127.0.0.1:8000",
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
};