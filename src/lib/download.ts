export function generateSignedFilename(originalName: string): string {
  const lastDot = originalName.lastIndexOf(".");
  if (lastDot === -1) {
    return `${originalName}-signed.pdf`;
  }
  const base = originalName.substring(0, lastDot);
  return `${base}_my-pdf-signer.pdf`;
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
