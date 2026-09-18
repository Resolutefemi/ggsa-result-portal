'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Downloads the result sheet as a SINGLE-PAGE A4 PDF file.
 *
 * Guarantees (per school requirement):
 *   1. The downloaded result is ALWAYS exactly one A4 page — never sliced
 *      across multiple pages. If the captured sheet is taller than one page,
 *      it is scaled down proportionally to fit.
 *   2. The content breadth is REDUCED relative to the A4 paper: the sheet is
 *      captured at 186mm width and placed with 12mm side margins. The image
 *      is TOP-ALIGNED 9mm from the paper edge (same as the printed sheet's
 *      @page margin), so there is no large empty band above the header.
 *   3. The capture uses the same compact "print" typography as the printed
 *      sheet (styles inlined below, kept in sync with the @media print block
 *      in globals.css).
 *   4. The PDF file is named after the student (e.g. "Ariyo Oluwasegun.pdf").
 *
 * Uses html2canvas-pro (supports oklch/modern CSS) + jsPDF.
 */

/* A4 capture width: 186mm at 96dpi = 703px. Narrower than the 210mm paper —
 * the PDF then places it with 12mm margins (186 + 12 + 12 = 210mm). */
const CAPTURE_WIDTH_PX = 703;

/* Compact A4 styles applied to the off-screen clone (mirrors @media print in
 * globals.css — update both together). All rules use !important so they win
 * over the Tailwind screen utilities on the cloned markup.
 *
 * Sizing goal: the sheet should fill most of the A4 page height
 * (~267mm of the 273mm printable area) so the content looks properly
 * sized on the paper. */
const A4_COMPACT_CSS = `
  .result-sheet {
    font-size: 11px !important;
    width: 100% !important;
    max-width: none !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    background: #ffffff !important;
  }
  .result-sheet > * + * { margin-top: 10px !important; }

  /* Header */
  .result-sheet .rs-header { padding-bottom: 8px !important; }
  .result-sheet .rs-header img { width: 74px !important; height: 74px !important; }
  .result-sheet .school-title { font-size: 19px !important; }
  .result-sheet .rs-addr { font-size: 9.5px !important; margin-top: 3px !important; }
  .result-sheet .rs-contact { font-size: 9px !important; }
  .result-sheet .rs-motto { padding: 4px 8px !important; font-size: 8.5px !important; }
  .result-sheet .rs-motto span { font-size: 8.5px !important; }
  .result-sheet .rs-pill { font-size: 10px !important; padding: 3px 14px !important; }

  /* Student bio grid */
  .result-sheet .rs-bio { padding: 9px 10px !important; font-size: 10px !important; }
  .result-sheet .rs-bio span { font-size: 10px !important; }
  .result-sheet .rs-bio .text-\\[11px\\] { font-size: 8px !important; }

  /* Academic table */
  .result-sheet .rs-table-wrap { overflow: visible !important; }
  .result-sheet .table-report { min-width: 0 !important; width: 100% !important; font-size: 10px !important; }
  .result-sheet .table-report th { font-size: 8.5px !important; padding: 4.5px 2px !important; letter-spacing: 0.02em !important; }
  .result-sheet .table-report td { padding: 7px 2px !important; font-size: 10px !important; line-height: 1.3 !important; word-wrap: break-word; overflow: hidden; }

  /* Skills / Behaviour cards */
  .result-sheet .rs-card .bg-brand-900 { padding: 4px 10px !important; font-size: 9px !important; }
  .result-sheet .rs-card > div:last-child { padding: 8px 10px !important; }
  .result-sheet .rs-card span { font-size: 9.5px !important; }

  /* Reports */
  .result-sheet .rs-report { padding: 9px 10px !important; }
  .result-sheet .rs-report p { font-size: 10px !important; margin-top: 3px !important; }
  .result-sheet .rs-report span { font-size: 9.5px !important; }
  .result-sheet .rs-report img { max-height: 30px !important; }
  .result-sheet .rs-report .mt-3 { margin-top: 5px !important; }
  .result-sheet .rs-report .mt-4 { margin-top: 5px !important; }

  /* Rating keys / next term */
  .result-sheet .rs-keys { padding: 8px 10px !important; }
  .result-sheet .rs-keys h4 { font-size: 9.5px !important; margin-bottom: 3px !important; }
  .result-sheet .rs-keys div { font-size: 9px !important; }
  .result-sheet .rs-next { padding: 8px 8px !important; }
  .result-sheet .rs-next span { font-size: 9px !important; }
  .result-sheet .rs-next div { font-size: 10.5px !important; margin-top: 2px !important; }

  /* Footer */
  .result-sheet .rs-footer { padding-top: 6px !important; }
  .result-sheet .rs-footer div { font-size: 8.5px !important; }
`;

/* Filesystem-safe filename from the student's name. */
function studentFileName(studentName?: string | null): string {
  const base = (studentName || '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '') // strip characters not allowed in filenames
    .replace(/\s+/g, ' ');
  return base ? `${base}.pdf` : 'GGSA-Result-Sheet.pdf';
}

export async function downloadResultPDF(studentName?: string | null): Promise<void> {
  const sheet = document.querySelector('.result-sheet') as HTMLElement;
  if (!sheet) {
    alert('Could not find the result sheet to download.');
    return;
  }

  const btn = document.activeElement as HTMLElement;
  const originalText = btn?.textContent || '';
  if (btn) btn.textContent = 'Downloading...';

  try {
    // Clone the sheet and render it in an off-screen container with the
    // compact A4 print styles inlined, so the captured image is exactly the
    // same compact layout that fits one printed A4 page.
    const clone = sheet.cloneNode(true) as HTMLElement;

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${CAPTURE_WIDTH_PX}px`; // 186mm @ 96dpi
    container.style.background = '#ffffff';

    const styleEl = document.createElement('style');
    styleEl.textContent = A4_COMPACT_CSS;
    container.appendChild(styleEl);

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

    // Create PDF — A4 portrait, single page only
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Page margins — 12mm on every side, so the content breadth (186mm) is
    // visibly narrower than the A4 paper, like a well-margined document.
    const margin = 12; // mm
    const availW = pdfWidth - margin * 2; // 186mm
    const availH = pdfHeight - margin * 2; // 273mm

    // Fit the image inside the printable area, preserving aspect ratio.
    // NEVER create a second page: scale down if needed.
    let drawW = availW;
    let drawH = imgHeight * (availW / imgWidth);
    if (drawH > availH) {
      drawH = availH;
      drawW = imgWidth * (availH / imgHeight);
    }

    const x = (pdfWidth - drawW) / 2; // horizontally centred
    // Top-aligned 9mm from the paper edge — matches the printed sheet's
    // @page margin, so the download does not show a large empty band above
    // the school header. Any leftover space stays at the bottom.
    const y = 9;

    pdf.addImage(imgData, 'JPEG', x, y, drawW, drawH);

    // File is named after the student, e.g. "Ariyo Oluwasegun.pdf"
    pdf.save(studentFileName(studentName));
  } catch (err) {
    console.error('PDF download failed:', err);
    // Fallback: just trigger window.print() so user can Save as PDF
    window.print();
  } finally {
    if (btn) btn.textContent = originalText;
  }
}
