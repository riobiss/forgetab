import { notFound } from "next/navigation"
import Link from "next/link"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { normalizeEntityCatalogMeta } from "@/domain/entityCatalog/catalogMeta"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { normalizeRaceLore } from "@/lib/rpg/raceLore"
import RichTextPreview from "@/presentation/entity-catalog/RichTextPreview"
import styles from "./page.module.css"

type Params = {
  params: Promise<{
    rpgId: string
    raceKey: string
  }>
}

type RaceRow = {
  label: string
  category: string | null
  lore?: Prisma.JsonValue
  catalogMeta?: Prisma.JsonValue
}

function toList(items: string[]) {
  if (items.length === 0) {
    return <p className={styles.empty}>Sem dados.</p>
  }

  return (
    <ul className={styles.list}>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  )
}

export default async function RaceDetailsPage({ params }: Params) {
  const { rpgId, raceKey } = await params

  const rpg = await prisma.rpg.findUnique({
    where: { id: rpgId },
    select: { id: true, ownerId: true, visibility: true },
  })

  if (!rpg) {
    notFound()
  }

  const userId = await getUserIdFromCookieStore()
  const isOwner = userId === rpg.ownerId
  let isAcceptedMember = false

  if (userId && !isOwner) {
    isAcceptedMember = (await getMembershipStatus(rpgId, userId)) === "accepted"
  }

  if (rpg.visibility === "private" && !isOwner && !isAcceptedMember) {
    notFound()
  }

  let rows: RaceRow[] = []
  try {
    rows = await prisma.$queryRaw<RaceRow[]>`
      SELECT label, category, lore, catalog_meta AS "catalogMeta"
      FROM rpg_race_templates
      WHERE rpg_id = ${rpgId} AND key = ${raceKey}
      LIMIT 1
    `
  } catch (error) {
    if (
      !(error instanceof Error) ||
      (!error.message.includes('column "lore" does not exist') &&
        !error.message.includes('column "catalog_meta" does not exist') &&
        !error.message.includes('column "category" does not exist'))
    ) {
      throw error
    }

    rows = await prisma.$queryRaw<RaceRow[]>`
      SELECT label, 'geral'::text AS category
      FROM rpg_race_templates
      WHERE rpg_id = ${rpgId} AND key = ${raceKey}
      LIMIT 1
    `
  }

  const row = rows[0]
  if (!row) {
    notFound()
  }

  const lore = normalizeRaceLore(row.lore, row.label)
  const catalogMeta = normalizeEntityCatalogMeta(row.catalogMeta)
  const richSections = [
    { key: "description", label: "Descricao" },
    { key: "origin", label: "Origem" },
    { key: "kingdoms", label: "Reinos" },
    { key: "lore", label: "Lore" },
    { key: "notes", label: "Observacoes" },
  ].filter((section) =>
    Boolean(
      catalogMeta.richText[
        section.key as "description" | "origin" | "kingdoms" | "lore" | "notes"
      ],
    ),
  )

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h2>{row.label}</h2>
        <div className={styles.actions}>
          <Link href={`/rpg/${rpgId}/races`} className={styles.backLink}>
            Voltar para racas
          </Link>
          {isOwner ? (
            <Link href={`/rpg/${rpgId}/edit/advanced/race/${raceKey}`} className={styles.editLink}>
              Editar raca
            </Link>
          ) : null}
        </div>
      </header>

      <article>
        {catalogMeta.shortDescription ? (
          <section>
            <h3>Descricao curta</h3>
            <p>{catalogMeta.shortDescription}</p>
          </section>
        ) : null}

        {richSections.map((section) => (
          <section key={section.key}>
            <h3>{section.label}</h3>
            <RichTextPreview
              value={
                catalogMeta.richText[
                  section.key as "description" | "origin" | "kingdoms" | "lore" | "notes"
                ] as Record<string, unknown>
              }
            />
          </section>
        ))}

        <section>
          <h3>Resumo</h3>
          <p>{lore.summary}</p>
        </section>

        <section>
          <h3>Origem</h3>
          <p>{lore.origin}</p>
        </section>

        <section>
          <h3>O que alguns pensam</h3>
          {toList(lore.thoughts)}
        </section>

        <section>
          <h3>Reinos</h3>
          {lore.kingdoms.length === 0 ? <p className={styles.empty}>Sem dados.</p> : null}
          {lore.kingdoms.map((kingdom, index) => (
            <article key={`${kingdom.name}-${index}`} className={styles.kingdom}>
              <h3>{kingdom.name || `Reino ${index + 1}`}</h3>
              {kingdom.description ? <p>{kingdom.description}</p> : <p className={styles.empty}>Sem descricao.</p>}
              <h4>Cultura</h4>
              {toList(kingdom.culture)}
              <h4>Caracteristicas fisicas</h4>
              {toList(kingdom.physicalTraits)}
              <h4>Vestuario</h4>
              {toList(kingdom.clothing)}
              <h4>Nomes comuns</h4>
              {toList(kingdom.commonNames)}
            </article>
          ))}
        </section>

        <section>
          <h3>Figuras marcantes</h3>
          {toList(lore.notableFigures)}
        </section>

        <section>
          <h3>Tracos raciais</h3>
          {toList(lore.racialTraits)}
        </section>

        <section>
          <h3>Classes comuns</h3>
          {toList(lore.commonClasses)}
        </section>

        <section>
          <h3>Variacoes</h3>
          {lore.variations.length === 0 ? <p className={styles.empty}>Sem dados.</p> : null}
          {lore.variations.map((variation, index) => (
            <article className={styles.variation} key={`${variation.name}-${index}`}>
              <h3>{variation.name || `Variacao ${index + 1}`}</h3>
              {variation.description ? <p>{variation.description}</p> : <p className={styles.empty}>Sem descricao.</p>}
              <h4>Tracos</h4>
              {toList(variation.traits)}
            </article>
          ))}
        </section>
      </article>
    </main>
  )
}
