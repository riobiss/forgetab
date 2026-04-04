import { buildApiUrl } from "@/infrastructure/http/backendUrls"

export { buildApiUrl } from "@/infrastructure/http/backendUrls"

export function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(buildApiUrl(path), {
    credentials: init.credentials ?? "include",
    ...init,
  })
}
