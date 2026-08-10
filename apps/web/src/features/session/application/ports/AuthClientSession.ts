export interface AuthClientSession {
  persist(token: string, maxAge: number): void
  clear(): void
}
