import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

/** Wraps a route handler: turns HttpError / unknown into clean JSON responses. */
export function route<T extends unknown[]>(fn: (...args: T) => Promise<NextResponse>) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return json({ message: e.message, statusCode: e.status }, e.status);
      console.error(e);
      return json({ message: "Internal error", statusCode: 500 }, 500);
    }
  };
}
