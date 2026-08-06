"use client"

import Link from "next/link"
import { FormEvent, Suspense, useState } from "react"
import { loginClientUseCase } from "@/features/auth/application/use-cases/authClient"
import { authClientDependencies } from "@/features/auth/presentation/dependencies"
import { useAuthSubmission } from "@/features/auth/presentation/useAuthSubmission"
import styles from "@/features/auth/presentation/AuthPage.module.css"

function LoginContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { error, loading, nextPath, submit } = useAuthSubmission({
    loadingMessage: "Entrando...",
    successMessage: "Login realizado com sucesso.",
    fallbackError: "Nao foi possivel autenticar.",
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submit(() =>
      loginClientUseCase(authClientDependencies, { email, password }),
    )
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
          <Link href={`/register?next=${encodeURIComponent(nextPath)}`}>
            Criar conta
          </Link>
        </p>
      </section>
    </main>
  )
}

export function LoginPageFeature() {
  return (
    <Suspense fallback={<main className={styles.page}>Carregando...</main>}>
      <LoginContent />
    </Suspense>
  )
}
