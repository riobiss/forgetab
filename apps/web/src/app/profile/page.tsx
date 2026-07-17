import { redirect } from "next/navigation"
import { loadProfilePageUseCase } from "@/features/profile/application/use-cases/loadProfilePage"
import {
  httpProfileReader,
  HttpProfileError,
} from "@/features/profile/infrastructure/repositories/httpProfileRepository"
import { cookieProfileSessionService } from "@/features/profile/infrastructure/services/cookieProfileSessionService"
import ProfilePage from "@/features/profile/presentation/ProfilePage"

export default async function PerfilPage() {
  let result

  try {
    result = await loadProfilePageUseCase({
      reader: httpProfileReader,
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
