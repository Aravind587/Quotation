/**
 * pdfExport.js
 * Client-side PDF generation: captures a DOM element via html2canvas
 * then tiles it across A4 jsPDF pages.
 */

/**
 * Download a PDF of the element with the given DOM id.
 * @param {string} elementId  - id of the element to capture
 * @param {string} filename   - output file name without extension
 */
export async function downloadPDF(elementId = 'quotation-print-area', filename = 'quotation') {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const el = document.getElementById(elementId);
  if (!el) throw new Error(`Element #${elementId} not found`);

  /* Temporarily remove overflow clipping so the full element is captured */
  const prevOverflow  = el.style.overflow;
  const prevMaxHeight = el.style.maxHeight;
  el.style.overflow  = 'visible';
  el.style.maxHeight = 'none';

  let canvas;
  try {
    canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#f3f4f6',   // stone-100 background
    });
  } finally {
    el.style.overflow  = prevOverflow;
    el.style.maxHeight = prevMaxHeight;
  }

  const imgData    = canvas.toDataURL('image/png');
  const pdf        = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW      = pdf.internal.pageSize.getWidth();
  const pageH      = pdf.internal.pageSize.getHeight();
  const margin     = 8;  // mm
  const contentW   = pageW - margin * 2;

  /* Scale image to fit page width */
  const imgWpx     = canvas.width;
  const imgHpx     = canvas.height;
  const scaledImgH = (imgHpx / imgWpx) * contentW;  // mm

  const usablePH   = pageH - margin * 2;
  let offsetMM     = 0;
  let page         = 0;

  while (offsetMM < scaledImgH) {
    if (page > 0) pdf.addPage();

    /* Draw image shifted up so the current page slice shows */
    pdf.addImage(imgData, 'PNG', margin, margin - offsetMM, contentW, scaledImgH);

    /* White mask below page bottom edge */
    pdf.setFillColor(243, 244, 246);
    pdf.rect(0, pageH - margin + 0.1, pageW, margin + 1, 'F');
    /* White mask above page top edge (for pages after first) */
    if (page > 0) {
      pdf.setFillColor(243, 244, 246);
      pdf.rect(0, 0, pageW, margin, 'F');
    }

    offsetMM += usablePH;
    page++;
  }

  pdf.save(`${filename}.pdf`);
}

/** Trigger the browser's print dialog */
export function printQuotation() {
  window.print();
}
