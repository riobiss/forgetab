import { redirect } from "next/navigation"
import { loadProfilePageUseCase } from "@/application/profile/use-cases/loadProfilePage"
import { prismaProfileRepository } from "@/infrastructure/profile/repositories/prismaProfileRepository"
import { cookieProfileSessionService } from "@/infrastructure/profile/services/cookieProfileSessionService"
import ProfilePage from "@/presentation/profile/ProfilePage"

export default async function PerfilPage() {
  const result = await loadProfilePageUseCase({
    repository: prismaProfileRepository,
    sessionService: cookieProfileSessionService,
  })

  if (result.status === "unauthenticated") {
    redirect("/login")
  }

  return <ProfilePage data={result.data} />
}
