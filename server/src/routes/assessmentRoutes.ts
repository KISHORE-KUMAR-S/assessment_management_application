import { Router } from "express";
import {
  listAssessments,
  getAssessment,
  createAssessment,
} from "../controllers/assessmentController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listAssessments));
router.post("/", asyncHandler(createAssessment));
router.get("/:id", asyncHandler(getAssessment));

export default router;
