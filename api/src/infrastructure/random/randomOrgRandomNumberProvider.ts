import { randomUUID } from "node:crypto"
import type {
  RandomIntegerRequest,
  RandomIntegerResult,
  RandomNumberProvider,
} from "@/application/random/ports/RandomNumberProvider"

type RandomOrgGenerateIntegersResponse = {
  result?: {
    random?: {
      data?: number[]
    }
  }
  error?: {
    message?: string
  }
}

const RANDOM_ORG_ENDPOINT =
  process.env.RANDOM_ORG_API_URL?.trim() || "https://api.random.org/json-rpc/2/invoke"

function generateLocalIntegers(request: RandomIntegerRequest): RandomIntegerResult {
  return {
    provider: "local",
    numbers: Array.from(
      { length: request.count },
      () => Math.floor(Math.random() * (request.max - request.min + 1)) + request.min,
    ),
  }
}

export const randomOrgRandomNumberProvider: RandomNumberProvider = {
  async generateIntegers(request) {
    const apiKey = process.env.RANDOM_ORG_API_KEY?.trim()
    if (!apiKey) {
      return generateLocalIntegers(request)
    }

    try {
      const response = await fetch(RANDOM_ORG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "generateIntegers",
          params: {
            apiKey,
            n: request.count,
            min: request.min,
            max: request.max,
            replacement: true,
            base: 10,
          },
          id: randomUUID(),
        }),
      })

      if (!response.ok) {
        return generateLocalIntegers(request)
      }

      const payload = (await response.json()) as RandomOrgGenerateIntegersResponse
      const numbers = payload.result?.random?.data
      if (payload.error || !Array.isArray(numbers) || numbers.length !== request.count) {
        return generateLocalIntegers(request)
      }

      return {
        provider: "random-org",
        numbers,
      }
    } catch {
      return generateLocalIntegers(request)
    }
  },
}
