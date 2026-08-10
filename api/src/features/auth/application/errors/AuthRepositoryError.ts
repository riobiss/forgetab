export type AuthRepositoryErrorCode = "email_conflict" | "username_conflict"

export class AuthRepositoryError extends Error {
  constructor(readonly code: AuthRepositoryErrorCode) {
    super(code)
    this.name = "AuthRepositoryError"
  }
}
