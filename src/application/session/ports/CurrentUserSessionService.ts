export interface CurrentUserSessionService {
  getCurrentUserId(): Promise<string | null>
}
