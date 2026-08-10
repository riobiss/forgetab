import { ErrorState } from "@/shared/presentation/feedback/ErrorState"

export default function NotFound() {
  return (
    <ErrorState
      eyebrow="404"
      headingId="not-found-title"
      title="Página não encontrada"
      description="O conteúdo solicitado não existe, foi removido ou você não tem acesso a ele."
      primaryLink={{ href: "/rpg", label: "Ir para campanhas" }}
      secondaryLink={{ href: "/", label: "Voltar ao início" }}
    />
  )
}
