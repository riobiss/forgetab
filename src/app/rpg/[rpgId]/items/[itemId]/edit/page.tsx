import ItemEditorForm from "../../components/ItemEditorForm"

type Props = {
  params: Promise<{
    itemId: string
  }>
}

export default async function EditItemPage({ params }: Props) {
  const { itemId } = await params
  return <ItemEditorForm mode="edit" itemId={itemId} />
}
