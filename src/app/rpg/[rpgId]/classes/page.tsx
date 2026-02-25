import { notFound } from "next/navigation"
import styles from "./page.module.css"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import ClassCategoryManager from "./components/ClassCategoryManager"
import ClassCategoryToggleList from "./components/ClassCategoryToggleList"
import { Prisma } from "../../../../../generated/prisma/client.js"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

type DbClassRow = {
  id: string
  key: string
  label: string
  category: string | null
  attributeBonuses: Prisma.JsonValue
  skillBonuses: Prisma.JsonValue
}

export default async function ClassesPage({ params }: Params) {
  const { rpgId } = await params

  const dbRpg = await prisma.rpg.findUnique({
    where: { id: rpgId },
    select: { id: true, ownerId: true, visibility: true },
  })

  if (!dbRpg) {
    notFound()
  }

  const userId = await getUserIdFromCookieStore()
  const isOwner = userId === dbRpg.ownerId
  let isAcceptedMember = false

  if (userId && !isOwner) {
    isAcceptedMember = (await getMembershipStatus(rpgId, userId)) === "accepted"
  }

  if (dbRpg.visibility === "private" && !isOwner && !isAcceptedMember) {
    notFound()
  }

  let dbClasses: DbClassRow[] = []
  try {
    dbClasses = await prisma.$queryRaw<DbClassRow[]>`
      SELECT
        id,
        key,
        label,
        category,
        attribute_bonuses AS "attributeBonuses",
        skill_bonuses AS "skillBonuses"
      FROM rpg_class_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `
  } catch {
    dbClasses = []
  }

  const initialClasses = dbClasses.map((item) => ({
    id: item.id,
    key: item.key,
    label: item.label,
    category: item.category?.trim() || "geral",
    attributeBonuses:
      item.attributeBonuses && typeof item.attributeBonuses === "object" && !Array.isArray(item.attributeBonuses)
        ? (item.attributeBonuses as Record<string, number>)
        : {},
    skillBonuses:
      item.skillBonuses && typeof item.skillBonuses === "object" && !Array.isArray(item.skillBonuses)
        ? (item.skillBonuses as Record<string, number>)
        : {},
  }))

  const groupedClasses = dbClasses.reduce<Record<string, DbClassRow[]>>((acc, item) => {
    const category = item.category?.trim() || "geral"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {})

  const classGroups = Object.entries(groupedClasses).map(([category, items]) => ({
    category,
    items: items.map((item) => ({
      id: item.id,
      title: item.label,
      subtitle: item.key,
      href: `/rpg/${rpgId}/classes/${item.id}`,
      editHref: isOwner ? `/rpg/${rpgId}/edit/advanced/class/${item.key}` : undefined,
    })),
  }))

  return (
    <main className={styles.container}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Classes</h1>
      </div>

      {isOwner ? (
        <ClassCategoryManager rpgId={rpgId} initialClasses={initialClasses} />
      ) : (
        <ClassCategoryToggleList groups={classGroups} />
      )}

      {!isOwner && dbClasses.length === 0 ? <p>Nenhuma classe cadastrada.</p> : null}
    </main>
  )
}
