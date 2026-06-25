import { type Request, type Response } from "express";
import { Category } from "../models/Category.js";

export async function listCategories(req: Request, res: Response): Promise<void> {
  // Scope to owner: never expose other users' categories (IDOR).
  const categories = await Category.find({ createdBy: req.user?.id }).sort({ createdAt: -1 });
  res.json(categories);
}

export async function getCategory(req: Request, res: Response): Promise<void> {
  // Owner-scoped lookup so a guessed _id cannot read another user's data.
  const cat = await Category.findOne({ _id: req.params.id, createdBy: req.user?.id });
  if (!cat) {
    res.status(404).json({ error: "category not found" });
    return;
  }
  res.json(cat);
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const { name, factors } = req.body ?? {};
  // Reject non-string name to prevent NoSQL operator injection downstream.
  if (typeof name !== "string" || !name) {
    res.status(400).json({ error: "name required" });
    return;
  }
  const cat = await Category.create({
    name,
    factors: Array.isArray(factors) ? factors : [],
    createdBy: req.user?.id,
  });
  res.status(201).json(cat);
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const { name, factors } = req.body ?? {};
  if (name !== undefined && typeof name !== "string") {
    res.status(400).json({ error: "name must be a string" });
    return;
  }
  // Owner-scoped update so a user cannot overwrite another user's category (IDOR).
  const cat = await Category.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user?.id },
    { ...(name !== undefined && { name }), ...(factors !== undefined && { factors }) },
    { new: true, runValidators: true }
  );
  if (!cat) {
    res.status(404).json({ error: "category not found" });
    return;
  }
  res.json(cat);
}
