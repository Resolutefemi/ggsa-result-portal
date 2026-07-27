'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Downloads the result sheet element as a PDF file.
 * Uses html2canvas to capture the element, then jsPDF to create the PDF.
 */
export async function downloadResultPDF(): Promise<void> {
  const sheet = document.querySelector('.result-sheet') as HTMLElement;
  if (!sheet) {
    console.error('No .result-sheet element found');
    return;
  }

  // Show a temporary loading state
  const btn = document.activeElement as HTMLElement;
  if (btn) btn.setAttribute('data-original-text', btn.textContent || '');
  if (btn) btn.textContent = 'Generating PDF...';

  try {
    // Capture the result sheet as a canvas image
    const canvas = await html2canvas(sheet, {
      scale: 2, // Higher quality
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Create PDF — A4 portrait
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate the image dimensions to fit the PDF page
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    // Center on the page
    const x = (pdfWidth - scaledWidth) / 2;
    const y = 5; // Small top margin

    pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);

    // If the content is taller than one page, split across pages
    if (scaledHeight > pdfHeight - 10) {
      // Content fits within one page after scaling — just use it
      // (html2canvas captures everything, jsPDF scales it down)
    }

    // Download the PDF
    pdf.save('result-sheet.pdf');
  } catch (err) {
    console.error('PDF generation failed:', err);
    alert('Could not generate PDF. Please try again.');
  } finally {
    // Restore button text
    if (btn && btn.getAttribute('data-original-text')) {
      btn.textContent = btn.getAttribute('data-original-text');
      btn.removeAttribute('data-original-text');
    }
  }
}
