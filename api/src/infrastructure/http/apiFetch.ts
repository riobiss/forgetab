import { buildApiUrl, resolveApiUrl } from "@/infrastructure/http/backendUrls"

export { buildApiUrl } from "@/infrastructure/http/backendUrls"

export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = await resolveApiUrl(path)

  try {
    return await fetch(url, {
      credentials: init.credentials ?? "include",
      ...init,
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Falha ao conectar com a API em ${url}. Verifique \`NEXT_PUBLIC_API_BASE_URL\`/\`API_INTERNAL_BASE_URL\` e se a API separada esta rodando.`,
        { cause: error },
      )
    }

    throw error
  }
}
