import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isAxiosError } from "axios"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Pull a readable message out of an API error. Server sends { error: string };
// long Mongoose validation strings get trimmed to the first failure.
export function apiError(e: unknown, fallback = "Something went wrong"): string {
  if (isAxiosError(e)) {
    const msg = e.response?.data?.error
    if (typeof msg === "string" && msg) {
      return msg.split(",")[0].trim()
    }
  }
  return fallback
}
