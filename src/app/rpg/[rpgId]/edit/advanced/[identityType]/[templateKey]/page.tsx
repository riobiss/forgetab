import AdvancedIdentityFeature from "@/presentation/rpg-editor/edit/advanced/AdvancedIdentityFeature"

type Params = {
  params: Promise<{
    rpgId: string
    identityType: string
    templateKey: string
  }>
}

export default async function AdvancedIdentityPage({ params }: Params) {
  const { rpgId, identityType, templateKey } = await params

  return (
    <AdvancedIdentityFeature
      rpgId={rpgId}
      identityType={identityType}
      templateKey={templateKey}
    />
  )
}
