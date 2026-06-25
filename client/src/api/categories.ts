import api from "./client";
import type { Category } from "@/types";

export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function createCategory(payload: Omit<Category, "_id">): Promise<Category> {
  const { data } = await api.post<Category>("/categories", payload);
  return data;
}
