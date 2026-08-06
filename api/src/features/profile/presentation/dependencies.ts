import { prismaProfileReader } from "@/features/profile/infrastructure/repositories/prismaProfileReader"
import { prismaProfileWriter } from "@/features/profile/infrastructure/repositories/prismaProfileWriter"
import { prismaRpgUserProfileWriter } from "@/features/profile/infrastructure/repositories/prismaRpgUserProfileWriter"
import { prismaRpgProfileAccessService } from "@/features/profile/infrastructure/services/prismaRpgProfileAccessService"

export const profileRouteDeps = {
  reader: prismaProfileReader,
  writer: prismaProfileWriter,
  rpgProfileWriter: prismaRpgUserProfileWriter,
  rpgProfileAccessService: prismaRpgProfileAccessService
} as const
