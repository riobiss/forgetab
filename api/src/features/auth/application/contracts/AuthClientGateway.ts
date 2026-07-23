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
  login(payload: LoginPayload): Promise<{ message?: string }>
  register(payload: RegisterPayload): Promise<{ message?: string }>
}
