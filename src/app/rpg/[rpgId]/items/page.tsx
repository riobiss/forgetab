import ItemsDashboardFeature from "@/presentation/items-dashboard/ItemsDashboardFeature"

type Props = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function ItemsPage({ params }: Props) {
  const { rpgId } = await params
  return <ItemsDashboardFeature rpgId={rpgId} />
}
