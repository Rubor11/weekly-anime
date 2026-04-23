import { Router } from "express";
import {
  getOnePiece,
} from "../controllers/homepage.controller.js";

const router = Router();

router.get("/one-piece", getOnePiece);

export default router;