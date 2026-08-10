export interface AuthPasswordService {
  verify(password: string, passwordHash: string | null): Promise<boolean>
  hash(password: string): Promise<string>
}
