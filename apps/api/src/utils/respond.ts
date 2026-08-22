import type { Response } from "express";
import type { ApiResponse } from "@upchaar/types";

/** Build the shared envelope — see docs/API_CONTRACT.md. */
export function envelope<T>(success: boolean, message: string, data: T | null): ApiResponse<T> {
  return { success, message, data };
}

export function send<T>(res: Response, status: number, message: string, data: T): void {
  res.status(status).json(envelope(true, message, data));
}

export function ok<T>(res: Response, message: string, data: T): void {
  send(res, 200, message, data);
}

export function created<T>(res: Response, message: string, data: T): void {
  send(res, 201, message, data);
}

export function fail(res: Response, status: number, message: string): void {
  res.status(status).json(envelope(false, message, null));
}
