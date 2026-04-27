import { Router } from "express";
import {
  getOnePiece,
  getHomepageDaily
} from "../controllers/homepage.controller.js";

const router = Router();

router.get("/one-piece", getOnePiece);
router.get("/daily", getHomepageDaily);

export default router;