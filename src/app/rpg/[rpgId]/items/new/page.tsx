import ItemEditorFeature from "@/presentation/items-editor/ItemEditorFeature"

type Props = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function NewItemPage({ params }: Props) {
  const { rpgId } = await params
  return <ItemEditorFeature rpgId={rpgId} mode="create" gatewayFactory="http" />
}
