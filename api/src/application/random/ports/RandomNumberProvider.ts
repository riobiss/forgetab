export type RandomIntegerRequest = {
  count: number
  min: number
  max: number
}

export type RandomIntegerResult = {
  numbers: number[]
  provider: "local" | "random-org"
}

export interface RandomNumberProvider {
  generateIntegers(request: RandomIntegerRequest): Promise<RandomIntegerResult>
}
