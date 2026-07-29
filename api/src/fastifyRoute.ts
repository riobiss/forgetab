import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteGenericInterface,
} from "fastify"

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
    (request, reply) =>
      handler(request as FastifyRequest<{ Params: TParams }>, reply),
  )
}
