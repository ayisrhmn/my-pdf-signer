import { PDFDocument } from "pdf-lib";
import { convertToPdfCoordinates } from "./coordinate";
import type { SignaturePlacement } from "../types/placement";

export async function exportSignedPdf(
  pdfFile: File,
  signatureBlob: Blob,
  signatureMimeType: string,
  placements: SignaturePlacement[],
): Promise<Blob> {
  const pdfBytes = await pdfFile.arrayBuffer();
  const pdfDocument = await PDFDocument.load(pdfBytes);

  const signatureBytes = await signatureBlob.arrayBuffer();
  const embeddedSignature =
    signatureMimeType === "image/png"
      ? await pdfDocument.embedPng(signatureBytes)
      : await pdfDocument.embedJpg(signatureBytes);

  for (const placement of placements) {
    const page = pdfDocument.getPage(placement.pageIndex);
    const { width, height } = page.getSize();
    const coords = convertToPdfCoordinates(placement, width, height);

    page.drawImage(embeddedSignature, {
      x: coords.x,
      y: coords.y,
      width: coords.width,
      height: coords.height,
    });
  }

  const signedPdfBytes = await pdfDocument.save();
  return new Blob([signedPdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}
