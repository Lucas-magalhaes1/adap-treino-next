/**
 * Calcula a idade com base na data de nascimento
 */
export function calculateAge(birthDate: Date | string | null | undefined): number | undefined {
  if (!birthDate) return undefined

  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  // Ajustar se o aniversário ainda não aconteceu este ano
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age >= 0 ? age : undefined
}

/**
 * Formata gênero para exibição
 */
export function formatGender(gender: 'male' | 'female' | 'other' | null | undefined): string {
  if (!gender) return 'Não informado'

  const genderMap = {
    male: 'Masculino',
    female: 'Feminino',
    other: 'Outro',
  }

  return genderMap[gender] || 'Não informado'
}

/**
 * Formata peso para exibição (kg)
 */
export function formatWeight(weight: number | null | undefined): string {
  if (!weight) return '-'
  return `${weight.toFixed(1)} kg`
}

/**
 * Formata altura para exibição (cm)
 */
export function formatHeight(height: number | null | undefined): string {
  if (!height) return '-'
  return `${height.toFixed(0)} cm`
}
