import { NextResponse } from "next/server"
import { AuthRateLimitError } from "@/application/auth/errors/AuthRateLimitError"
import { AppError } from "@/shared/errors/AppError"

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

  if (error instanceof AppError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 500 })
}
