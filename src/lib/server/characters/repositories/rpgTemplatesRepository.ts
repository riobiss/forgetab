import { Prisma } from "../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type {
  AttributeTemplateRow,
  CharacterCharacteristicTemplateRow,
  CharacterIdentityTemplateRow,
  IdentityTemplateRow,
  SkillTemplateRow,
  StatusTemplateRow,
} from "../types"

export interface RpgTemplatesRepository {
  getAttributeTemplates(rpgId: string): Promise<AttributeTemplateRow[]>
  getStatusTemplates(rpgId: string): Promise<StatusTemplateRow[]>
  getSkillTemplates(rpgId: string): Promise<SkillTemplateRow[]>
  getIdentityTemplates(rpgId: string): Promise<CharacterIdentityTemplateRow[]>
  getCharacteristicTemplates(rpgId: string): Promise<CharacterCharacteristicTemplateRow[]>
  getRaceTemplates(rpgId: string): Promise<IdentityTemplateRow[]>
  getClassTemplates(rpgId: string): Promise<IdentityTemplateRow[]>
}

export const prismaRpgTemplatesRepository: RpgTemplatesRepository = {
  async getAttributeTemplates(rpgId) {
    try {
      return await prisma.$queryRaw<AttributeTemplateRow[]>(Prisma.sql`
        SELECT key, label, position
        FROM rpg_attribute_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (error instanceof Error && error.message.includes('relation "rpg_attribute_templates" does not exist')) {
        return []
      }
      throw error
    }
  },

  async getStatusTemplates(rpgId) {
    try {
      return await prisma.$queryRaw<StatusTemplateRow[]>(Prisma.sql`
        SELECT key, label, position
        FROM rpg_status_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (error instanceof Error && error.message.includes('relation "rpg_status_templates" does not exist')) {
        return []
      }
      throw error
    }
  },

  async getSkillTemplates(rpgId) {
    try {
      return await prisma.$queryRaw<SkillTemplateRow[]>(Prisma.sql`
        SELECT key, label, position
        FROM rpg_skill_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (error instanceof Error && error.message.includes('relation "rpg_skill_templates" does not exist')) {
        return []
      }
      throw error
    }
  },

  async getIdentityTemplates(rpgId) {
    try {
      return await prisma.$queryRaw<CharacterIdentityTemplateRow[]>(Prisma.sql`
        SELECT key, label, required, position
        FROM rpg_character_identity_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('relation "rpg_character_identity_templates" does not exist')
      ) {
        return []
      }
      throw error
    }
  },

  async getCharacteristicTemplates(rpgId) {
    try {
      return await prisma.$queryRaw<CharacterCharacteristicTemplateRow[]>(Prisma.sql`
        SELECT key, label, required, position
        FROM rpg_character_characteristic_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('relation "rpg_character_characteristic_templates" does not exist')
      ) {
        return []
      }
      throw error
    }
  },

  async getRaceTemplates(rpgId) {
    return prisma.$queryRaw<IdentityTemplateRow[]>(Prisma.sql`
      SELECT key, attribute_bonuses AS "attributeBonuses", skill_bonuses AS "skillBonuses"
      FROM rpg_race_templates
      WHERE rpg_id = ${rpgId}
    `)
  },

  async getClassTemplates(rpgId) {
    return prisma.$queryRaw<IdentityTemplateRow[]>(Prisma.sql`
      SELECT key, attribute_bonuses AS "attributeBonuses", skill_bonuses AS "skillBonuses"
      FROM rpg_class_templates
      WHERE rpg_id = ${rpgId}
    `)
  },
}
