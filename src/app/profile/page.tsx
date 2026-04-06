import { redirect } from "next/navigation"
import { loadProfilePageUseCase } from "@/application/profile/use-cases/loadProfilePage"
import {
  httpProfileRepository,
  HttpProfileError,
} from "@/infrastructure/profile/repositories/httpProfileRepository"
import { cookieProfileSessionService } from "@/infrastructure/profile/services/cookieProfileSessionService"
import ProfilePage from "@/presentation/profile/ProfilePage"

export default async function PerfilPage() {
  let result

  try {
    result = await loadProfilePageUseCase({
      repository: httpProfileRepository,
      sessionService: cookieProfileSessionService,
    })
  } catch (error) {
    if (error instanceof HttpProfileError && error.status === 401) {
      redirect("/login")
    }

    throw error
  }

  if (result.status === "unauthenticated") {
    redirect("/login")
  }

  return <ProfilePage data={result.data} />
}
