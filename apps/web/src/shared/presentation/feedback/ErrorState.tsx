"use client"

import Link from "next/link"
import styles from "./ErrorState.module.css"

type ErrorStateLink = {
  href: string
  label: string
}

type ErrorStateProps = {
  description: string
  eyebrow: string
  headingId: string
  title: string
  global?: boolean
  primaryLink?: ErrorStateLink
  retry?: () => void
  secondaryLink?: ErrorStateLink
}

export function ErrorState({
  description,
  eyebrow,
  global = false,
  headingId,
  primaryLink,
  retry,
  secondaryLink,
  title
}: ErrorStateProps) {
  return (
    <main className={`${styles.page} ${global ? styles.globalPage : ""}`}>
      <section className={styles.panel} aria-labelledby={headingId}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 id={headingId} className={styles.title}>
          {title}
        </h1>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          {retry ? (
            <button
              className={styles.primaryAction}
              type="button"
              onClick={retry}
            >
              Tentar novamente
            </button>
          ) : primaryLink ? (
            <Link className={styles.primaryAction} href={primaryLink.href}>
              {primaryLink.label}
            </Link>
          ) : null}
          {secondaryLink ? (
            <Link className={styles.secondaryAction} href={secondaryLink.href}>
              {secondaryLink.label}
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  )
}
