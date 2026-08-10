// Client-only high-res image PDF export. Never import this at module top-level
// on server-rendered code paths — html2canvas/jspdf touch the DOM/window.

export async function exportResumePdf(el: HTMLElement, fileBaseName: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // Neutralize any preview-only transforms/shadows that would clip or distort the capture.
  const prevTransform = el.style.transform;
  const prevBoxShadow = el.style.boxShadow;
  const prevTransformOrigin = el.style.transformOrigin;
  el.style.transform = "none";
  el.style.boxShadow = "none";
  el.style.transformOrigin = "top left";

  try {
    const captureWidth = el.scrollWidth;
    const canvas = await html2canvas(el, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
      windowWidth: captureWidth,
      width: captureWidth,
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidthMm = 210;
    const pageHeightMm = 297;

    // Map the canvas (px) to mm using the page width as the scale reference.
    const pxToMm = pageWidthMm / canvas.width;
    const pageHeightPx = pageHeightMm / pxToMm;

    const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

    for (let page = 0; page < totalPages; page++) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - page * pageHeightPx);
      if (sliceHeightPx <= 0) break;

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      const ctx = sliceCanvas.getContext("2d");
      if (!ctx) continue;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        page * pageHeightPx,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx,
      );

      const imgData = sliceCanvas.toDataURL("image/jpeg", 0.95);
      if (page > 0) pdf.addPage();
      const sliceHeightMm = sliceHeightPx * pxToMm;
      pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, sliceHeightMm);
    }

    pdf.save(`${fileBaseName}.pdf`);
  } finally {
    el.style.transform = prevTransform;
    el.style.boxShadow = prevBoxShadow;
    el.style.transformOrigin = prevTransformOrigin;
  }
}
