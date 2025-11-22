import express from "express";
import { ragController } from "../../controller/rag-controller.js";

const ragRouter = express.Router();

// POST /api/v1/rag - Forward RAG requests to Python microservice
ragRouter.post("/", ragController);

export default ragRouter;

