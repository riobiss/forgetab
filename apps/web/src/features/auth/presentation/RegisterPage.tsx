"use client"

import Link from "next/link"
import { FormEvent, Suspense, useState } from "react"
import { registerClientUseCase } from "@/features/auth/application/use-cases/authClient"
import { authClientDependencies } from "@/features/auth/presentation/dependencies"
import { useAuthSubmission } from "@/features/auth/presentation/useAuthSubmission"
import styles from "@/features/auth/presentation/AuthPage.module.css"

function RegisterContent() {
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const { error, loading, nextPath, reportError, submit } = useAuthSubmission({
    loadingMessage: "Criando conta...",
    successMessage: "Conta criada com sucesso.",
    fallbackError: "Nao foi possivel cadastrar."
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== confirmPassword) {
      reportError("As senhas nao coincidem.")
      return
    }

    void submit(() =>
      registerClientUseCase(authClientDependencies, {
        name,
        username,
        email,
        password
      })
    )
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
              onChange={(event) =>
                setUsername(event.target.value.toLowerCase())
              }
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

export function RegisterPageFeature() {
  return (
    <Suspense fallback={<main className={styles.page}>Carregando...</main>}>
      <RegisterContent />
    </Suspense>
  )
}
