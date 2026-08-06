import type { Area } from "react-easy-crop"

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", () =>
      reject(new Error("Nao foi possivel carregar a imagem."))
    )
    image.src = src
  })
}

export async function createRoundCroppedFile(
  imageSrc: string,
  crop: Area
): Promise<File> {
  const image = await loadImage(imageSrc)
  const size = Math.min(crop.width, crop.height)
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Nao foi possivel preparar o recorte.")
  }

  context.clearRect(0, 0, size, size)
  context.save()
  context.beginPath()
  context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  context.closePath()
  context.clip()
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size,
    size
  )
  context.restore()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  )

  if (!blob) {
    throw new Error("Nao foi possivel gerar a imagem.")
  }

  return new File([blob], "profile-image.png", { type: "image/png" })
}
