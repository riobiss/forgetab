import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import SkillsDashboardClient from "./SkillsDashboardClient"

type OwnedRpg = {
  id: string
  title: string
}

type PageProps = {
  searchParams?: Promise<{
    rpgId?: string
  }>
}

export default async function DashboardSkillsPage({ searchParams }: PageProps) {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value

  if (!token) {
    redirect("/login")
  }

  let userId = ""
  try {
    const payload = await verifyAuthToken(token)
    userId = payload.userId
  } catch {
    redirect("/login")
  }

  const rpgs = await prisma.rpg.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      title: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const ownedRpgs: OwnedRpg[] = rpgs.map((rpg) => ({
    id: rpg.id,
    title: rpg.title,
  }))

  const params = searchParams ? await searchParams : undefined
  const initialRpgId = params?.rpgId

  return <SkillsDashboardClient ownedRpgs={ownedRpgs} initialRpgId={initialRpgId} />
}
