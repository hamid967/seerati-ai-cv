// Client-only thumbnail capture for the admin template designer.
// html2canvas touches the DOM, so this module must only be imported lazily
// from event handlers inside the browser.

const THUMB_WIDTH = 420;

/** Captures a rendered resume element into a compact JPEG data URL. */
export async function captureTemplateThumbnail(el: HTMLElement): Promise<string> {
  const { default: html2canvas } = await import("html2canvas");
  const width = el.scrollWidth || 794;

  const canvas = await html2canvas(el, {
    scale: 1,
    backgroundColor: "#ffffff",
    useCORS: true,
    windowWidth: width,
    width,
  });

  const ratio = THUMB_WIDTH / canvas.width;
  const out = document.createElement("canvas");
  out.width = THUMB_WIDTH;
  out.height = Math.round(canvas.height * ratio);
  const ctx = out.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/jpeg", 0.72);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out.toDataURL("image/jpeg", 0.72);
}

export const waitForPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 60)));
  });
