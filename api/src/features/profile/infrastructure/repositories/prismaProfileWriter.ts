import { Prisma } from "../../../../../generated/prisma/client.js"
import type { ProfileWriter } from "@/features/profile/application/ports/ProfileWriter"
import { prisma } from "@/lib/prisma"
import { AppError } from "@/features/shared/application/errors/AppError.js"

export const prismaProfileWriter: ProfileWriter = {
  async updateByUserId(userId, data) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          name: true,
          username: true
        }
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError("Username ja esta em uso. Tente outro.", 409)
      }

      throw error
    }
  }
}
