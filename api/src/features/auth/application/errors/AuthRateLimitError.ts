import { AppError } from "@/features/shared/infrastructure/errors/AppError"

export class AuthRateLimitError extends AppError {
  readonly retryAfterSeconds: number

  constructor(message: string, retryAfterSeconds: number) {
    super(message, 429)
    this.name = "AuthRateLimitError"
    this.retryAfterSeconds = retryAfterSeconds
  }
}
