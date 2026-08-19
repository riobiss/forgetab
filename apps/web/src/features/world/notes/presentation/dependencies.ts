import { createNoteLabelsService } from "@/features/world/notes/application/services/NoteLabelsService"
import { createNotesSyncService } from "@/features/world/notes/application/services/NotesSyncService"
import { httpNotesGateway } from "@/features/world/notes/infrastructure/gateways/httpNotesGateway"
import { notesCacheRepository } from "@/features/world/notes/infrastructure/storage/notesCacheRepository"
import { legacyNotesSource } from "@/features/world/notes/infrastructure/storage/legacyNotesSource"

export const notesDependencies = {
  syncService: createNotesSyncService({
    gateway: httpNotesGateway,
    cache: notesCacheRepository,
    legacySource: legacyNotesSource
  }),
  labelsService: createNoteLabelsService(httpNotesGateway)
} as const
