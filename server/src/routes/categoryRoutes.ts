import { Router } from "express";
import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
} from "../controllers/categoryController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listCategories));
router.post("/", asyncHandler(createCategory));
router.get("/:id", asyncHandler(getCategory));
router.put("/:id", asyncHandler(updateCategory));

export default router;
