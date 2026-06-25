import { Schema } from "mongoose";

export type QuestionType = "multiple_choice" | "rating" | "text";

export interface IQuestion {
  text: string;
  type: QuestionType;
  options?: string[]; // for multiple_choice
  maxRating?: number; // for rating
}

export interface IFactor {
  name: string;
  questions: IQuestion[];
}

export const questionSchema = new Schema<IQuestion>(
  {
    text: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["multiple_choice", "rating", "text"],
      required: true,
    },
    options: { type: [String], default: undefined },
    maxRating: { type: Number, default: undefined },
  },
  { _id: true }
);

export const factorSchema = new Schema<IFactor>(
  {
    name: { type: String, required: true, trim: true },
    questions: { type: [questionSchema], default: [] },
  },
  { _id: true }
);
