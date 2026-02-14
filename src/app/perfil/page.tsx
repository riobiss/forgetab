import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import styles from "./page.module.css"

export default async function PerfilPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value

  if (!token) {
    redirect("/login")
  }

  let userId = ""
  let email = ""

  try {
    const payload = await verifyAuthToken(token)
    userId = payload.userId
    email = payload.email
  } catch {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      createdAt: true,
    },
  })

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Perfil</h1>
        <p>Informacoes da sua conta.</p>

        <div className={styles.infoGrid}>
          <div>
            <span>Nome</span>
            <strong>{user?.name ?? "-"}</strong>
          </div>

          <div>
            <span>Email</span>
            <strong>{user?.email ?? email}</strong>
          </div>

          <div>
            <span>Criado em</span>
            <strong>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("pt-BR")
                : "-"}
            </strong>
          </div>
        </div>
      </section>
    </main>
  )
}
