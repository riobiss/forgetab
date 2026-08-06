export type UpdateCharacterStatusCurrentInput = {
  rpgId: string
  characterId: string
  key: string
  value: number
}

export type UpdateCharacterStatusCurrentResult = {
  message: string
  key: string
  value: number
  max: number
}

export interface CharacterStatusCurrentGateway {
  update(
    input: UpdateCharacterStatusCurrentInput
  ): Promise<UpdateCharacterStatusCurrentResult>
}

export type CharacterStatusCurrentDependencies = {
  gateway: CharacterStatusCurrentGateway
}
