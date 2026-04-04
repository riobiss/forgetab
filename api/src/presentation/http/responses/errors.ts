import { AppError } from "@/shared/errors/AppError"
import { jsonResponse } from "@api/presentation/http/responses/jsonResponse"

export function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return jsonResponse({ message: error.message }, { status: error.status })
  }

  return jsonResponse({ message: fallbackMessage }, { status: 500 })
}
