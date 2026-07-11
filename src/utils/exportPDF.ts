import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Export a DOM element as a paginated A4 PDF.
 */
export async function exportToPDF(
  element: HTMLElement,
  filename = 'resume.pdf',
  marginMM = 0,
): Promise<void> {
  // 1. Render the element to a high-DPI canvas
  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  // 2. A4 dimensions (mm)
  const pageW = 210
  const pageH = 297
  const contentW = pageW - marginMM * 2
  const contentH = pageH - marginMM * 2

  // 3. How many px fit in 1 mm on the canvas (based on width)
  const pxPerMM = canvas.width / contentW
  if (!pxPerMM || pxPerMM <= 0) {
    throw new Error(`Invalid pxPerMM: ${pxPerMM} (canvas.width=${canvas.width})`)
  }

  // 4. How many canvas px correspond to one page of content height
  const pagePx = Math.floor(contentH * pxPerMM)

  const pdf = new jsPDF('p', 'mm', 'a4')
  let cursor = 0 // top of current slice in canvas px

  while (cursor < canvas.height) {
    if (cursor > 0) pdf.addPage()

    const remaining = canvas.height - cursor
    const slicePx = Math.min(pagePx, remaining)

    // Create a temporary canvas for this slice
    const slice = document.createElement('canvas')
    slice.width = canvas.width
    slice.height = slicePx

    const ctx = slice.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, slice.width, slice.height)
    ctx.drawImage(
      canvas,
      0, cursor,             // src x, y
      canvas.width, slicePx, // src w, h
      0, 0,                  // dst x, y
      slice.width, slicePx,  // dst w, h
    )

    const imgData = slice.toDataURL('image/jpeg', 0.92)
    const imgH = +(slicePx / pxPerMM).toFixed(1) // round to 1 decimal for jsPDF

    pdf.addImage(imgData, 'JPEG', marginMM, marginMM, contentW, imgH)

    cursor += slicePx
  }

  pdf.save(filename)
}
