export interface AuthPasswordService {
  compare(password: string, passwordHash: string): Promise<boolean>
  hash(password: string): Promise<string>
}
