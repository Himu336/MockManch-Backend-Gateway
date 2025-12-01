import express from "express";
import roomRoutes from "./room-routes.js";
import roomTestRoutes from "./room-test-routes.js";
import ragRoutes from "./rag-routes.js";
import interviewRoutes from "./interview-routes.js";
import voiceInterviewRoutes from "./voice-interview-routes.js";
import dashboardRoutes from "./dashboard-routes.js";
import analyticsRoutes from "./analytics-routes.js";
import authRoutes from "./auth-routes.js";
import walletRoutes from "./wallet-routes.js";
import plansRoutes from "./plans-routes.js";
import transactionsRoutes from "./transactions-routes.js";

const v1Router = express.Router();

v1Router.get('/status', (_req, res) => {
    res.json({ status: "ok" });
});
v1Router.use("/auth", authRoutes);
v1Router.use("/room-test", roomTestRoutes);
v1Router.use("/room", roomRoutes);
v1Router.use("/rag", ragRoutes);
v1Router.use("/interview", interviewRoutes);
v1Router.use("/voice-interview", voiceInterviewRoutes);
v1Router.use("/dashboard", dashboardRoutes);
v1Router.use("/analytics", analyticsRoutes);
v1Router.use("/wallet", walletRoutes);
v1Router.use("/plans", plansRoutes);
v1Router.use("/transactions", transactionsRoutes);

export default v1Router;