import { Prisma } from "../../../../generated/prisma/client.js"
import type { AuthRepository, CreateAuthUserInput } from "@/application/auth/ports/AuthRepository"
import { prisma } from "@/lib/prisma"
import { AppError } from "@/shared/errors/AppError"

const GENERIC_REGISTER_CONFLICT_MESSAGE =
  "Nao foi possivel concluir o cadastro com os dados informados."
const USERNAME_CONFLICT_MESSAGE = "Username ja esta em uso. Tente outro."

async function createUser(input: CreateAuthUserInput) {
  try {
    return await prisma.user.create({ data: input })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target) ? error.meta.target : []
      if (target.includes("username")) {
        throw new AppError(USERNAME_CONFLICT_MESSAGE, 409)
      }
      throw new AppError(GENERIC_REGISTER_CONFLICT_MESSAGE, 409)
    }

    throw error
  }
}

export const prismaAuthRepository: AuthRepository = {
  findUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } })
  },
  findUserByUsername(username) {
    return prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })
  },
  createUser,
}
