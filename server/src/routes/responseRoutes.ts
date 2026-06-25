import { Router } from "express";
import { createResponse, listResponses } from "../controllers/responseController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/", asyncHandler(createResponse));
router.get("/", asyncHandler(listResponses));

export default router;
