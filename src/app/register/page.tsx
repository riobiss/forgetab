"use client"

import Link from "next/link"
import { FormEvent, Suspense, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import styles from "./page.module.css"

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
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
    setError("")

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.")
      submittingRef.current = false
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setError(payload.message ?? "Nao foi possivel cadastrar.")
        return
      }

      router.replace(nextPath)
      router.refresh()
    } catch {
      setError("Erro de conexao ao cadastrar.")
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Cadastro</h1>
        <p>Crie sua conta para acessar o sistema.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Nome</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              minLength={3}
              required
            />
          </label>

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
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value.toLowerCase())}
              placeholder="ex: mestre_dado"
              minLength={3}
              maxLength={24}
              pattern="[a-z0-9_]+"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo de 8 caracteres"
              minLength={8}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Confirme a senha</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Digite a senha novamente"
              minLength={8}
              required
            />
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? "Criando conta..." : "Cadastrar"}
          </button>
        </form>

        <p className={styles.switchAuth}>
          Ja possui conta?{" "}
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>
            Entrar
          </Link>
        </p>
      </section>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className={styles.page}>Carregando...</main>}>
      <RegisterContent />
    </Suspense>
  )
}
