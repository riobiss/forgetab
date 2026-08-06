import { redirect } from "next/navigation"
import { loadProfilePageUseCase } from "@/features/profile/application/use-cases/loadProfilePage"
import {
  httpProfileReader,
  HttpProfileError
} from "@/features/profile/infrastructure/repositories/httpProfileRepository"
import ProfilePage from "@/features/profile/presentation/ProfilePage"

export const dynamic = "force-dynamic"

export default async function PerfilPage() {
  let result

  try {
    result = await loadProfilePageUseCase({ reader: httpProfileReader })
  } catch (error) {
    if (error instanceof HttpProfileError && error.status === 401) {
      redirect("/login")
    }

    throw error
  }

  return <ProfilePage data={result} />
}
