interface StoryPdfOptions {
  title: string;
  body: string;          // paragraphs separated by blank lines
  subtitle?: string;     // e.g. persona name / setting line
  footer?: string;       // e.g. disclaimer
  coverImage?: string;   // portrait data URL (PNG) shown on a cover page
  fileName?: string;
}

/** Render a generated story to a downloadable, multi-page A4 PDF.
 *  jsPDF is loaded lazily so it stays out of the initial bundle. */
export async function storyToPdf({ title, body, subtitle, footer, coverImage, fileName = 'selfscape-story.pdf' }: StoryPdfOptions) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 64;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // ── Cover page (portrait + title), when an image is supplied ────────────────
  let coverRendered = false;
  if (coverImage) {
    try {
      const imgSize = Math.min(maxW, 400);
      const imgX = (pageW - imgSize) / 2;
      doc.addImage(coverImage, 'PNG', imgX, margin + 24, imgSize, imgSize);
      let cy = margin + 24 + imgSize + 40;

      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(30, 27, 45);
      doc.splitTextToSize(title, maxW).forEach((line: string) => {
        doc.text(line, pageW / 2, cy, { align: 'center' });
        cy += 32;
      });

      if (subtitle) {
        cy += 4;
        doc.setFont('times', 'italic');
        doc.setFontSize(12);
        doc.setTextColor(120, 110, 140);
        doc.splitTextToSize(subtitle, maxW).forEach((line: string) => {
          doc.text(line, pageW / 2, cy, { align: 'center' });
          cy += 17;
        });
      }

      doc.addPage();
      y = margin;
      coverRendered = true;
    } catch {
      // Image couldn't be embedded — fall back to a plain text title below.
      coverRendered = false;
    }
  }

  // ── Title + subtitle (skipped when already shown on the cover) ──────────────
  if (!coverRendered) {
    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(30, 27, 45);
    doc.splitTextToSize(title, maxW).forEach((line: string) => {
      ensureSpace(30);
      doc.text(line, margin, y);
      y += 30;
    });
    y += 4;

    if (subtitle) {
      doc.setFont('times', 'italic');
      doc.setFontSize(12);
      doc.setTextColor(120, 110, 140);
      doc.splitTextToSize(subtitle, maxW).forEach((line: string) => {
        ensureSpace(18);
        doc.text(line, margin, y);
        y += 18;
      });
    }

    y += 16;
  }

  // Body paragraphs
  doc.setFont('times', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 25);
  const lineHeight = 19;
  const paragraphs = body.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  paragraphs.forEach(para => {
    const lines = doc.splitTextToSize(para, maxW);
    lines.forEach((line: string) => {
      ensureSpace(lineHeight);
      doc.text(line, margin, y);
      y += lineHeight;
    });
    y += 10; // paragraph gap
  });

  // Footer / disclaimer
  if (footer) {
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 155);
    const footLines = doc.splitTextToSize(footer, maxW);
    footLines.forEach((line: string) => {
      ensureSpace(13);
      doc.text(line, margin, y);
      y += 13;
    });
  }

  doc.save(fileName);
}
