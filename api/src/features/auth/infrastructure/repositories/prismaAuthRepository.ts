import { Prisma } from "../../../../../generated/prisma/client.js"
import type {
  AuthRepository,
  CreateAuthUserInput
} from "@/features/auth/application/ports/AuthRepository.js"
import { prisma } from "@/features/shared/infrastructure/database/prisma"
import { AuthRepositoryError } from "@/features/auth/application/errors/AuthRepositoryError.js"

async function createUser(input: CreateAuthUserInput) {
  try {
    return await prisma.user.create({ data: input })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const rawTarget = error.meta?.target
      const target = Array.isArray(rawTarget)
        ? rawTarget
        : typeof rawTarget === "string"
          ? [rawTarget]
          : []
      if (target.includes("username")) {
        throw new AuthRepositoryError("username_conflict")
      }
      throw new AuthRepositoryError("email_conflict")
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
      select: { id: true }
    })
  },
  createUser
}
