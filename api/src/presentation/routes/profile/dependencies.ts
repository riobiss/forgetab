import { prismaProfileReader } from "@/infrastructure/profile/repositories/prismaProfileReader"
import { prismaProfileWriter } from "@/infrastructure/profile/repositories/prismaProfileWriter"
import { prismaRpgUserProfileWriter } from "@/infrastructure/profile/repositories/prismaRpgUserProfileWriter"
import { prismaRpgProfileAccessService } from "@/infrastructure/profile/services/prismaRpgProfileAccessService"

export const profileRouteDeps = {
  reader: prismaProfileReader,
  writer: prismaProfileWriter,
  rpgProfileWriter: prismaRpgUserProfileWriter,
  rpgProfileAccessService: prismaRpgProfileAccessService,
} as const
