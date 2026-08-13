import type { AuthClientSession } from "@/features/session/application/ports/AuthClientSession"

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  name: string
  username: string
  email: string
  password: string
}

export interface AuthClientGateway {
  login(
    payload: LoginPayload
  ): Promise<{ message?: string; token: string; maxAge: number }>
  register(
    payload: RegisterPayload
  ): Promise<{ message?: string; token: string; maxAge: number }>
  logout(): Promise<void>
}

export type AuthClientDependencies = {
  gateway: AuthClientGateway
  session: AuthClientSession
  offlineData?: { clear(): Promise<void> }
}
