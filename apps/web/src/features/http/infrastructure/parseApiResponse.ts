type ApiErrorPayload = {
  message?: unknown
}

type ParseApiResponseOptions = {
  fallbackMessage?: string
  invalidResponseMessage?: string
  errorFactory?: (message: string, status: number) => Error
}

function readErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null

  const message = (payload as ApiErrorPayload).message
  return typeof message === "string" && message.trim() ? message : null
}

export async function parseApiResponse<T>(
  response: Response,
  options: ParseApiResponseOptions = {},
): Promise<T> {
  const rawBody = await response.text()
  let payload: unknown = null

  if (rawBody.trim()) {
    try {
      payload = JSON.parse(rawBody)
    } catch {
      // A resposta invalida recebe uma mensagem estavel abaixo.
    }
  }

  if (!response.ok) {
    const message =
      readErrorMessage(payload) ??
      options.fallbackMessage ??
      "Erro na requisicao."
    throw options.errorFactory?.(message, response.status) ?? new Error(message)
  }

  if (payload == null) {
    throw new Error(
      options.invalidResponseMessage ?? "Resposta invalida da API.",
    )
  }

  return payload as T
}

export function createApiResponseParser(options: ParseApiResponseOptions) {
  return <T>(response: Response) => parseApiResponse<T>(response, options)
}
