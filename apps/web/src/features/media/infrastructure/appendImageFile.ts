import type { UploadImageFile } from "@/features/media/application/types"

export async function appendImageFile(
  formData: FormData,
  fieldName: string,
  file: UploadImageFile
) {
  if (file instanceof Blob) {
    formData.append(fieldName, file, file.name)
    return
  }

  const content = await file.arrayBuffer()
  formData.append(
    fieldName,
    new Blob([content], { type: file.type }),
    file.name
  )
}
