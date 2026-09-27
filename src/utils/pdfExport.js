/**
 * pdfExport.js — Client-side PDF generation using jsPDF + html2canvas.
 * Captures the #quotation-printable element and exports it as a PDF.
 */

/**
 * Generate and download a PDF of the quotation.
 * @param {string} elementId   DOM id of the printable element
 * @param {string} filename    Output filename (without .pdf)
 */
export async function downloadQuotationPDF(elementId = 'quotation-printable', filename = 'quotation') {
  // Dynamically import to keep initial bundle small
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  // Temporarily expand element for full capture
  const originalOverflow = element.style.overflow;
  const originalMaxH = element.style.maxHeight;
  element.style.overflow = 'visible';
  element.style.maxHeight = 'none';

  try {
    const canvas = await html2canvas(element, {
      scale: 2,           // 2x for crisp text
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    element.style.overflow = originalOverflow;
    element.style.maxHeight = originalMaxH;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = contentWidth / (imgWidth / 3.7795); // px → mm at 96dpi

    // If content is taller than one page, tile across multiple pages
    const scaledImgWidth = contentWidth;
    const scaledImgHeight = (imgHeight / imgWidth) * scaledImgWidth;

    const usablePageHeight = pageHeight - margin * 2;
    let yPosition = 0;
    let pageNum = 0;

    while (yPosition < scaledImgHeight) {
      if (pageNum > 0) pdf.addPage();

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin - yPosition,
        scaledImgWidth,
        scaledImgHeight
      );

      // White mask to hide content below page bottom
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, pageHeight - margin + 0.5, pageWidth, margin + 1, 'F');

      yPosition += usablePageHeight;
      pageNum++;
    }

    pdf.save(`${filename}.pdf`);
  } catch (err) {
    element.style.overflow = originalOverflow;
    element.style.maxHeight = originalMaxH;
    console.error('PDF generation failed:', err);
    throw err;
  }
}

/**
 * Trigger the browser's print dialog for the quotation.
 */
export function printQuotation() {
  window.print();
}
