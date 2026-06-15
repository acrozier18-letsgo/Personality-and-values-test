import { toPng, toBlob } from 'html-to-image';

export async function toImage(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, { cacheBust: true, pixelRatio: 1 });
  if (!blob) throw new Error('html-to-image returned null');
  return blob;
}

export async function downloadImage(node: HTMLElement, filename = 'selfscape-persona.png') {
  const url = await toPng(node, { cacheBust: true, pixelRatio: 1 });
  const a = document.createElement('a');
  a.download = filename;
  a.href = url;
  a.click();
}
