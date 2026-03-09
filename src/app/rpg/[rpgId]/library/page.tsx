import { useParams } from "next/navigation"
import LibrarySectionsFeature from "@/presentation/library/LibrarySectionsFeature"

export default function LibrarySectionsPage() {
  const params = useParams<{ rpgId: string }>()
  return <LibrarySectionsFeature rpgId={params.rpgId} gatewayFactory="http" />
}
