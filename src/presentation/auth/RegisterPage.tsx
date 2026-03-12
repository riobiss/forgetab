"use client"

import Link from "next/link"
import { FormEvent, Suspense, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-hot-toast"
import { registerClientUseCase } from "@/application/auth/use-cases/authClient"
import { httpAuthClientGateway } from "@/infrastructure/auth/gateways/httpAuthClientGateway"
import { dismissToast } from "@/lib/toast"
import styles from "@/presentation/auth/AuthPage.module.css"

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
      toast.error("As senhas nao coincidem.")
      submittingRef.current = false
      return
    }

    setLoading(true)
    const loadingToastId = toast.loading("Criando conta...")

    try {
      await registerClientUseCase(
        { gateway: httpAuthClientGateway },
        { name, username, email, password },
      )
      toast.success("Conta criada com sucesso.")
      router.replace(nextPath)
      router.refresh()
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Nao foi possivel cadastrar."
      setError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
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
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>Entrar</Link>
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
