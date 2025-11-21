import express from "express";
import http from "http";
import bodyParser from "body-parser";
import ServerConfig from "./config/serverConfig.js";
import apiRouter from "./routes/index.js";
import { initWebSocket } from "./events/ws-gateway.js";
import cors from "cors";

const app = express();
app.use(cors());
const server = http.createServer(app);

// middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());

// routes
app.use("/api", apiRouter);

// init WebSocket
initWebSocket(server);

// start server
server.listen(ServerConfig.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${ServerConfig.PORT}`);
});
