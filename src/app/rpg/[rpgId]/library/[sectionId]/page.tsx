import { useParams } from "next/navigation"
import LibrarySectionBooksFeature from "@/presentation/library/LibrarySectionBooksFeature"

export default function LibraryBooksPage() {
  const params = useParams<{ rpgId: string; sectionId: string }>()
  return (
    <LibrarySectionBooksFeature
      rpgId={params.rpgId}
      sectionId={params.sectionId}
      gatewayFactory="http"
    />
  )
}
