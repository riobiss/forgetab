import ItemEditorFeature from "@/presentation/items-editor/ItemEditorFeature"

type Props = {
  params: Promise<{
    rpgId: string
    itemId: string
  }>
}

export default async function EditItemPage({ params }: Props) {
  const { rpgId, itemId } = await params
  return (
    <ItemEditorFeature
      rpgId={rpgId}
      mode="edit"
      itemId={itemId}
      gatewayFactory="http"
    />
  )
}
