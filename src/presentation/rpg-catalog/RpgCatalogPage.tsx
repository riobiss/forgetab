"use client"

import Link from "next/link"
import Image from "next/image"
import { Plus } from "lucide-react"
import { formatDateInBrasilia } from "@/lib/date"
import type { RpgCatalogData } from "@/application/rpgCatalog/types"
import styles from "./RpgCatalogPage.module.css"

type Props = {
  data: RpgCatalogData
}

export default function RpgCatalogPage({ data }: Props) {
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
                  <small>
                    {item.visibility === "public" ? "Publico" : "Privado"} | {formatDateInBrasilia(item.createdAt)}
                  </small>
                </Link>
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
