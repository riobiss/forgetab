export interface ItemImageStorageService {
  deleteItemImageByUrl(userId: string, imageUrl: string | null): Promise<void>
}
