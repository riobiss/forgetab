import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteGenericInterface,
} from "fastify"
import { resolveAllowedOrigin } from "./features/http/presentation/cors"

type FastifyNativeHandler<
  TParams extends Record<string, string> = Record<string, string>,
> = (
  request: FastifyRequest<{ Params: TParams }>,
  reply: FastifyReply,
) => Promise<unknown>

export function registerFastifyRoute<
  TParams extends Record<string, string> = Record<string, string>,
>(
  app: FastifyInstance,
  method: "get" | "post" | "patch" | "put" | "delete",
  url: string,
  handler: FastifyNativeHandler<TParams>,
) {
  app[method]<RouteGenericInterface & { Params: TParams }>(
    url,
    async (request, reply) => {
      const allowedOrigin = resolveAllowedOrigin(request.headers)
      if (allowedOrigin) {
        reply.header("Access-Control-Allow-Origin", allowedOrigin)
        reply.header("Access-Control-Allow-Credentials", "true")
        reply.header("Vary", "Origin")
      }
      return handler(request as FastifyRequest<{ Params: TParams }>, reply)
    },
  )
}
