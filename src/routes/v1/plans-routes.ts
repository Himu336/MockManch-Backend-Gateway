import express from "express";
import { getPlansController } from "../../controller/wallet-controller.js";

const plansRouter = express.Router();

// GET /api/v1/plans - Get all available plans (public)
plansRouter.get("/", getPlansController);

export default plansRouter;

