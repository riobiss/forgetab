const BRASILIA_TIME_ZONE = "America/Sao_Paulo"

export function formatDateInBrasilia(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRASILIA_TIME_ZONE,
  }).format(new Date(date))
}

