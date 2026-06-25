import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { factorSchema, type IFactor } from "./subdocs.js";

// Assessment embeds copies of categories (with factors/questions) for stability.
export interface IAssessmentCategory {
  name: string;
  factors: IFactor[];
}

export interface IAssessment extends Document {
  title: string;
  categories: IAssessmentCategory[];
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const assessmentCategorySchema = new Schema<IAssessmentCategory>(
  {
    name: { type: String, required: true, trim: true },
    factors: { type: [factorSchema], default: [] },
  },
  { _id: true }
);

const assessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true, trim: true },
    categories: { type: [assessmentCategorySchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Assessment: Model<IAssessment> =
  mongoose.models.Assessment ||
  mongoose.model<IAssessment>("Assessment", assessmentSchema);
