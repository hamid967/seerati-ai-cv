// Client-only high-res image PDF export. Never import this at module top-level
// on server-rendered code paths — html2canvas/jspdf touch the DOM/window.

import { PAGE_SIZES, type ResumePageSize } from "@/lib/resume-layout";

export async function exportResumePdf(
  el: HTMLElement,
  fileBaseName: string,
  pageSize: ResumePageSize = "a4",
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

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

    const page = PAGE_SIZES[pageSize];
    const pdf = new jsPDF({
      unit: "mm",
      format: [page.widthMm, page.heightMm],
      orientation: "portrait",
    });
    const pageWidthMm = page.widthMm;
    const pageHeightMm = page.heightMm;

    const pxToMm = pageWidthMm / canvas.width;
    const pageHeightPx = pageHeightMm / pxToMm;
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - pageIndex * pageHeightPx);
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
        pageIndex * pageHeightPx,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx,
      );

      const imgData = sliceCanvas.toDataURL("image/jpeg", 0.95);
      if (pageIndex > 0) pdf.addPage([page.widthMm, page.heightMm], "portrait");
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
