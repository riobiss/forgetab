import { NextResponse } from "next/server"
import { AuthRateLimitError } from "@/application/auth/errors/AuthRateLimitError"
import { toErrorResponse as toSharedErrorResponse } from "@/presentation/api/shared/toErrorResponse"

export function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthRateLimitError) {
    return NextResponse.json(
      { message: error.message },
      {
        status: error.status,
        headers: { "Retry-After": String(error.retryAfterSeconds) },
      },
    )
  }
  return toSharedErrorResponse(error, fallbackMessage)
}
