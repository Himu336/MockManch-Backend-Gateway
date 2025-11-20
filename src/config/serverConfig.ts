import dotenv from "dotenv";

dotenv.config();

export default {
    PORT: process.env.PORT,
    AGORA_APP_ID: process.env.AGORA_APP_ID,
    AGORA_APP_CERT: process.env.AGORA_APP_CERT,
};