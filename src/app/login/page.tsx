"use client"

import Link from "next/link"
import { FormEvent, Suspense, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import styles from "./page.module.css"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)

  const rawNextPath = searchParams.get("next") || "/"
  const nextPath =
    rawNextPath.startsWith("/") && !rawNextPath.startsWith("//")
      ? rawNextPath
      : "/"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setError(payload.message ?? "Nao foi possivel autenticar.")
        return
      }

      router.replace(nextPath)
      router.refresh()
    } catch {
      setError("Erro de conexao ao autenticar.")
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Login</h1>
        <p>Acesse sua conta para continuar.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seuemail@exemplo.com"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
              minLength={6}
              required
            />
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className={styles.switchAuth}>
          Nao possui conta?{" "}
          <Link href={`/register?next=${encodeURIComponent(nextPath)}`}>Criar conta</Link>
        </p>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className={styles.page}>Carregando...</main>}>
      <LoginContent />
    </Suspense>
  )
}
