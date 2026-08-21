import type { Server as HttpServer } from "node:http"
import { Server } from "socket.io"
import type { Socket } from "socket.io"
import { jwtAuthTokenService } from "@/features/auth/infrastructure/services/jwtAuthTokenService"
import { resolveAllowedOrigin } from "@/features/http/presentation/cors"
import { prismaRpgCampaignRepository } from "@/features/world/campaign/infrastructure/repositories/prismaRpgCampaignRepository"
import { rpgCampaignAccessService } from "@/features/world/campaign/infrastructure/services/rpgCampaignAccessService"

type CampaignSocket = Socket & {
  data: {
    userId?: string
  }
}

type JoinRoomPayload = {
  rpgId: string
  campaignId: string
}

let io: Server | null = null

function getRoomName(campaignId: string) {
  return `campaign:${campaignId}`
}

async function resolveSocketUserId(socket: Socket) {
  const authToken =
    (typeof socket.handshake.auth?.token === "string"
      ? socket.handshake.auth.token
      : null) ??
    (typeof socket.handshake.headers.authorization === "string"
      ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, "").trim()
      : null)

  if (!authToken) {
    return null
  }

  try {
    const payload = await jwtAuthTokenService.verifyToken(authToken)
    return payload.userId
  } catch {
    return null
  }
}

async function canJoinCampaignRoom(payload: JoinRoomPayload, userId: string) {
  const permission = await rpgCampaignAccessService.getPermission(
    payload.rpgId,
    userId
  )
  if (!permission.exists) {
    return false
  }

  if (permission.isOwner) {
    return true
  }

  const campaign = await prismaRpgCampaignRepository.getCampaignSummary(
    payload.rpgId,
    payload.campaignId
  )
  if (!campaign?.isActive) {
    return false
  }

  return prismaRpgCampaignRepository.hasJoinedCampaign(
    payload.campaignId,
    userId
  )
}

export function initializeCampaignSocketServer(server: HttpServer) {
  if (io) {
    return io
  }

  io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true)
          return
        }

        const allowedOrigin = resolveAllowedOrigin(new Headers({ origin }))
        callback(
          allowedOrigin ? null : new Error("Origin nao permitida."),
          Boolean(allowedOrigin)
        )
      },
      credentials: true
    }
  })

  io.use(async (socket, next) => {
    const userId = await resolveSocketUserId(socket)
    if (!userId) {
      next(new Error("Usuario nao autenticado."))
      return
    }

    ;(socket as CampaignSocket).data.userId = userId
    next()
  })

  io.on("connection", (socket) => {
    socket.on("campaign:join-room", async (payload: JoinRoomPayload) => {
      const userId = (socket as CampaignSocket).data.userId
      if (!userId) {
        socket.emit("campaign:error", { message: "Usuario nao autenticado." })
        return
      }

      const allowed = await canJoinCampaignRoom(payload, userId)
      if (!allowed) {
        socket.emit("campaign:error", {
          message: "Voce nao pode entrar nessa sala."
        })
        return
      }

      await socket.join(getRoomName(payload.campaignId))
      socket.emit("campaign:joined-room", { campaignId: payload.campaignId })
    })
  })

  return io
}

export function emitCampaignRoomRefresh(campaignId: string) {
  io?.to(getRoomName(campaignId)).emit("campaign:refresh", { campaignId })
}
