export type AuthTokenPayload = {
  userId: string
  email: string
}

export interface AuthTokenVerifier {
  verify(token: string): Promise<AuthTokenPayload>
}
