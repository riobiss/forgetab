import type { RpgMapViewDto } from "@/application/rpgMap/types"
import { MundiMap } from "@/presentation/rpg-map/WorldMap"
import styles from "./RpgMapPage.module.css"

type RpgMapPageProps = {
  viewModel: RpgMapViewDto
}

export function RpgMapPage({ viewModel }: RpgMapPageProps) {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Mapa Mundi</h1>
      <MundiMap
        rpgId={viewModel.rpgId}
        isOwner={viewModel.isOwner}
        initialMapSrc={viewModel.initialMapSrc}
      />
      <section className={styles.extraArea}>
        <h2 className={styles.extraTitle}>Regioes</h2>
        <p className={styles.extraText}>
          {viewModel.isOwner
            ? "Voce pode enviar a imagem do mapa e ajustar no modo de mapa completo."
            : "Somente mestre ou moderador podem alterar a imagem. Todos os membros podem visualizar o mapa."}
        </p>
      </section>
    </div>
  )
}
