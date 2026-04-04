export interface ImageGateway {
  deleteRpgImageByUrl(params: {
    ownerId: string
    imageUrl: string | null
  }): Promise<void>
}
