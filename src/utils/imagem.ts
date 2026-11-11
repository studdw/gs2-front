const LADO_MAXIMO = 1024
const TAMANHO_MAXIMO = 1_000_000 // caracteres da data URL (~750 KB de imagem)

/**
 * Reduz e comprime a foto no navegador antes de enviar (RNF09).
 * Redesenhar a imagem em um canvas também descarta os metadados EXIF (como o GPS da câmera).
 * Devolve a imagem em data URL (JPEG).
 */
export async function comprimirImagem(arquivo: File): Promise<string> {
  if (!arquivo.type.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem (foto).')
  }

  const imagem = await carregarImagem(arquivo)
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(imagem.width * escala)
  canvas.height = Math.round(imagem.height * escala)
  const contexto = canvas.getContext('2d')
  if (!contexto) {
    throw new Error('Seu navegador não conseguiu preparar a foto.')
  }
  contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height)

  // Tenta qualidades cada vez menores até caber no limite
  for (const qualidade of [0.75, 0.6, 0.45, 0.3]) {
    const dataUrl = canvas.toDataURL('image/jpeg', qualidade)
    if (dataUrl.length <= TAMANHO_MAXIMO) {
      return dataUrl
    }
  }
  throw new Error('A foto ficou grande demais. Tente outra imagem.')
}

function carregarImagem(arquivo: File): Promise<HTMLImageElement> {
  return new Promise((resolver, rejeitar) => {
    const url = URL.createObjectURL(arquivo)
    const imagem = new Image()
    imagem.onload = () => {
      URL.revokeObjectURL(url)
      resolver(imagem)
    }
    imagem.onerror = () => {
      URL.revokeObjectURL(url)
      rejeitar(new Error('Não conseguimos abrir essa foto. Tente outra imagem.'))
    }
    imagem.src = url
  })
}
