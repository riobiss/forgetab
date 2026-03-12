"use client"

import { useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus } from "lucide-react"
import { formatDateInBrasilia } from "@/lib/date"
import type { RpgCatalogData } from "@/application/rpgCatalog/types"
import { createRpgCatalogDependencies, type RpgCatalogGatewayFactory } from "@/presentation/rpg-catalog/dependencies"
import OwnedRpgActions from "@/presentation/rpg-catalog/components/OwnedRpgActions"
import styles from "./RpgCatalogPage.module.css"

type Props = {
  data: RpgCatalogData
  gatewayFactory?: RpgCatalogGatewayFactory
}

export default function RpgCatalogPage({ data, gatewayFactory = "http" }: Props) {
  const deps = useMemo(() => createRpgCatalogDependencies(gatewayFactory), [gatewayFactory])

  return (
    <div className={styles.container}>
      <div className={styles.topbar}>
        <h2 className={styles.title}>RPGs</h2>
        <Link href="/rpg/new" className={styles.createButton}>
          <Plus size={16} />
          <span>Criar RPG</span>
        </Link>
      </div>

      {data.userId ? (
        <section className={styles.createdSection}>
          <h3 className={styles.sectionTitle}>Seus RPGs</h3>

          {data.createdRpgs.length > 0 ? (
            <div className={styles.createdGrid}>
              {data.createdRpgs.map((item) => (
                <article key={item.id} className={styles.createdCard}>
                  <Link href={`/rpg/${item.id}`} className={styles.cardLink}>
                    {item.image ? (
                      <div className={styles.createdCardImageWrap}>
                        <Image
                          src={item.image}
                          alt={`Capa do RPG ${item.title}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 360px"
                          unoptimized
                          className={styles.createdCardImage}
                        />
                      </div>
                    ) : null}
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    <small>
                      {item.visibility === "public" ? "Publico" : "Privado"} | {formatDateInBrasilia(item.createdAt)}
                    </small>
                  </Link>
                  <OwnedRpgActions deps={deps} rpgId={item.id} />
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.authMessage}>Voce ainda nao criou RPGs.</p>
          )}
        </section>
      ) : (
        <p className={styles.authMessage}>Faca login para ver os RPGs que voce criou.</p>
      )}

      {data.publicRpgs.length > 0 ? (
        <section className={styles.createdSection}>
          <h3 className={styles.sectionTitle}>RPGs Publicos</h3>
          <div className={styles.createdGrid}>
            {data.publicRpgs.map((item) => (
              <Link key={item.id} href={`/rpg/${item.id}`} className={styles.createdCard}>
                {item.image ? (
                  <div className={styles.createdCardImageWrap}>
                    <Image
                      src={item.image}
                      alt={`Capa do RPG ${item.title}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 360px"
                      unoptimized
                      className={styles.createdCardImage}
                    />
                  </div>
                ) : null}
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <small>Publico | {formatDateInBrasilia(item.createdAt)}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
