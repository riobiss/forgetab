"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import styles from "./page.module.css"

export default function NewRpgPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"private" | "public">("private")
  const [costsEnabled, setCostsEnabled] = useState(false)
  const [costResourceName, setCostResourceName] = useState("Skill Points")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/rpg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          visibility,
          costsEnabled,
          costResourceName,
        }),
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setError(payload.message ?? "Nao foi possivel criar o RPG.")
        return
      }

      router.push("/rpg")
      router.refresh()
    } catch {
      setError("Erro de conexao ao criar RPG.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Criar RPG</h1>
        <p>Defina as informacoes iniciais da campanha.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Titulo</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Descricao</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              minLength={10}
              rows={5}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Visibilidade</span>
            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as "private" | "public")
              }
            >
              <option value="private">Privado</option>
              <option value="public">Publico</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Sistema de Custos</span>
            <select
              value={costsEnabled ? "enabled" : "disabled"}
              onChange={(event) => setCostsEnabled(event.target.value === "enabled")}
            >
              <option value="disabled">Desativado</option>
              <option value="enabled">Ativado</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Nome do recurso de custo</span>
            <input
              type="text"
              value={costResourceName}
              onChange={(event) => setCostResourceName(event.target.value)}
              minLength={1}
              maxLength={60}
              required
            />
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.actions}>
            <button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar RPG"}
            </button>

            <Link href="/rpg">Cancelar</Link>
          </div>
        </form>
      </section>
    </main>
  )
}
