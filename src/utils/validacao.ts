const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emailValido(email: string): boolean {
  return FORMATO_EMAIL.test(email.trim())
}

export type Erros<Campos extends string> = Partial<Record<Campos, string>>

export function temErros(erros: object): boolean {
  return Object.keys(erros).length > 0
}

export function errosDaApi<Campos extends string>(campos: { campo: string; mensagem: string }[]): Erros<Campos> {
  const erros: Record<string, string> = {}
  for (const item of campos) {
    erros[item.campo] = item.mensagem
  }
  return erros as Erros<Campos>
}
