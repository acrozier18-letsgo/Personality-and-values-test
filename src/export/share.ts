export async function sharePersona(archetypeName: string, identitySentence: string, imageBlob: Blob) {
  const title = `My Selfscape persona: ${archetypeName}`;
  const text = `${identitySentence}\n\nDiscover your own persona at Selfscape.`;
  const file = new File([imageBlob], 'selfscape-persona.png', { type: 'image/png' });

  // Try Web Share API (best on mobile)
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ title, text, files: [file] });
    return;
  }

  // Fallback: trigger download + copy caption
  const url = URL.createObjectURL(imageBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'selfscape-persona.png';
  a.click();
  URL.revokeObjectURL(url);

  try {
    await navigator.clipboard.writeText(`${title}\n${text}`);
    alert('Image downloaded! Caption copied to clipboard.\nPaste it when sharing on social.');
  } catch {
    alert('Image downloaded! Share it on social with your persona.');
  }
}

export function twitterShareUrl(archetypeName: string): string {
  const text = encodeURIComponent(`I got "${archetypeName}" on Selfscape — a persona quiz that uses real psychology. What's yours?`);
  return `https://twitter.com/intent/tweet?text=${text}`;
}

export function linkedInShareUrl(): string {
  return 'https://www.linkedin.com/sharing/share-offsite/';
}
