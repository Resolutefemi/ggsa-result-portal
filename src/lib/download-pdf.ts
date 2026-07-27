'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Downloads the result sheet element as a PDF file.
 * Uses html2canvas-pro (supports oklch/modern CSS) + jsPDF.
 */
export async function downloadResultPDF(): Promise<void> {
  const sheet = document.querySelector('.result-sheet') as HTMLElement;
  if (!sheet) {
    alert('Could not find the result sheet to download.');
    return;
  }

  const btn = document.activeElement as HTMLElement;
  const originalText = btn?.textContent || '';
  if (btn) btn.textContent = 'Downloading...';

  try {
    // Clone the sheet and render it in an off-screen container with
    // inline styles so html2canvas doesn't need to resolve external CSS
    const clone = sheet.cloneNode(true) as HTMLElement;

    // Create an off-screen container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.background = '#ffffff';

    // Force inline styles on the clone for reliable rendering
    clone.style.maxWidth = 'none';
    clone.style.width = '100%';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.margin = '0';
    clone.style.padding = '0';

    container.appendChild(clone);
    document.body.appendChild(container);

    // Capture as canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Remove the off-screen container
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
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

    // Fit the image to the PDF page width
    const ratio = pdfWidth / imgWidth;
    const scaledWidth = pdfWidth;
    const scaledHeight = imgHeight * ratio;

    if (scaledHeight <= pdfHeight) {
      // Fits on one page
      pdf.addImage(imgData, 'JPEG', 0, 0, scaledWidth, scaledHeight);
    } else {
      // Content is taller than one page — slice into multiple pages
      let heightLeft = scaledHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, scaledWidth, scaledHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = -(scaledHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, scaledWidth, scaledHeight);
        heightLeft -= pdfHeight;
      }
    }

    pdf.save('result-sheet.pdf');
  } catch (err) {
    console.error('PDF download failed:', err);
    // Fallback: just trigger window.print() so user can Save as PDF
    window.print();
  } finally {
    if (btn) btn.textContent = originalText;
  }
}
