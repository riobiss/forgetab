import ItemEditorForm from "@/presentation/items-editor/ItemEditorForm"

type Props = {
  params: Promise<{
    rpgId: string
    itemId: string
  }>
}

export default async function EditItemPage({ params }: Props) {
  const { rpgId, itemId } = await params
  return <ItemEditorForm rpgId={rpgId} mode="edit" itemId={itemId} />
}
