// html-to-image is loaded lazily so it stays out of the initial bundle —
// it's only needed when the user captures/exports a share card.

export async function toImage(node: HTMLElement): Promise<Blob> {
  const { toBlob } = await import('html-to-image');
  const blob = await toBlob(node, { cacheBust: true, pixelRatio: 1 });
  if (!blob) throw new Error('html-to-image returned null');
  return blob;
}

export async function downloadImage(node: HTMLElement, filename = 'selfscape-persona.png') {
  const { toPng } = await import('html-to-image');
  const url = await toPng(node, { cacheBust: true, pixelRatio: 1 });
  const a = document.createElement('a');
  a.download = filename;
  a.href = url;
  a.click();
}
