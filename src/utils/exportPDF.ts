import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function exportComponentToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Elemento com ID "${elementId}" não encontrado`)
    return
  }

  try {
    // Captura o elemento como imagem
    const canvas = await html2canvas(element, {
      scale: 2, // Qualidade 2x para melhor resolução
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      ignoreElements: (element) => {
        // Ignora elementos que podem causar problemas
        return element.classList?.contains('MuiBackdrop-root') || false
      },
    })

    const imgData = canvas.toDataURL('image/png')

    // Cria PDF no formato A4
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)

    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 10

    // Adiciona a imagem ao PDF
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)

    // Salva o arquivo
    pdf.save(filename)
  } catch (error) {
    console.error('Erro ao exportar PDF:', error)
    throw error
  }
}
