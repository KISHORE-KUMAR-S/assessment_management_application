import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { factorSchema, type IFactor } from "./subdocs.js";

export interface ICategory extends Document {
  name: string;
  factors: IFactor[];
  createdBy?: Types.ObjectId;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    factors: { type: [factorSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", categorySchema);
