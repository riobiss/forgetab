import ItemEditorForm from "@/presentation/items-editor/ItemEditorForm"

type Props = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function NewItemPage({ params }: Props) {
  const { rpgId } = await params
  return <ItemEditorForm rpgId={rpgId} mode="create" />
}
