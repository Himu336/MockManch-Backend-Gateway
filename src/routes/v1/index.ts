import express from "express";
import roomRoutes from "./room-routes.js";
import roomTestRoutes from "./room-test-routes.js";
import ragRoutes from "./rag-routes.js";

const v1Router = express.Router();

v1Router.get('/status', (_req, res) => {
    res.json({ status: "ok" });
});
v1Router.use("/room-test", roomTestRoutes);
v1Router.use("/room", roomRoutes);
v1Router.use("/rag", ragRoutes);

export default v1Router;