export class CreatureGatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "CreatureGatewayError"
  }
}
