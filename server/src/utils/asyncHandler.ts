import { type Request, type Response, type NextFunction, type RequestHandler } from "express";

// Wrap async route handlers so rejected promises hit the error middleware.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
