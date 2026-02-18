"use client"

import { FormEvent, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import styles from "./page.module.css"
import { NativeSelectField } from "@/components/select/NativeSelectField"

type UploadImagePayload = {
  message?: string
  url?: string
}

export default function NewRpgPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState("")
  const [visibility, setVisibility] = useState<"private" | "public">("private")
  const [costsEnabled, setCostsEnabled] = useState(false)
  const [costResourceName, setCostResourceName] = useState("Skill Points")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const creatingRef = useRef(false)

  async function handleImageUpload(file: File) {
    setUploadingImage(true)
    setUploadError("")
    setError("")

    try {
      const payload = new FormData()
      payload.append("file", file)

      const response = await fetch("/api/uploads/rpg-image", {
        method: "POST",
        body: payload,
      })

      const body = (await response.json()) as UploadImagePayload
      if (!response.ok || !body.url) {
        setUploadError(body.message ?? "Nao foi possivel enviar imagem.")
        return
      }

      setImage(body.url)
    } catch {
      setUploadError("Erro de conexao ao enviar imagem.")
    } finally {
      setUploadingImage(false)
    }
  }

  function handleRemoveImage() {
    setImage("")
    setUploadError("")
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (creatingRef.current) return
    creatingRef.current = true
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/rpg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          ...(image.trim() ? { image: image.trim() } : {}),
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
      creatingRef.current = false
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
            <NativeSelectField
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as "private" | "public")
              }
            >
              <option value="private">Privado</option>
              <option value="public">Publico</option>
            </NativeSelectField>
          </label>

         
          <label className={styles.field}>
            <span>imagem do RPG</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  void handleImageUpload(file)
                }
              }}
            />
          </label>

          {image ? (
            <div className={styles.actions}>
              <button type="button" onClick={handleRemoveImage} disabled={uploadingImage || loading}>
                Remover imagem
              </button>
            </div>
          ) : null}

          {uploadingImage ? <p>Enviando imagem...</p> : null}
          {uploadError ? <p className={styles.error}>{uploadError}</p> : null}

          <label className={styles.field}>
            <span>Sistema de Custos</span>
            <NativeSelectField
              value={costsEnabled ? "enabled" : "disabled"}
              onChange={(event) => setCostsEnabled(event.target.value === "enabled")}
            >
              <option value="disabled">Desativado</option>
              <option value="enabled">Ativado</option>
            </NativeSelectField>
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
