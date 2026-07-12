import type { SignaturePlacement } from "../types/placement";

export type PdfCoordinates = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Converts a normalized ratio placement (origin top-left, 0-1)
 * to PDF coordinates (origin bottom-left, points).
 */
export function convertToPdfCoordinates(
  placement: SignaturePlacement,
  pageWidth: number,
  pageHeight: number,
): PdfCoordinates {
  const width = placement.width * pageWidth;
  const height = placement.height * pageHeight;
  const x = placement.x * pageWidth;
  const y = pageHeight - placement.y * pageHeight - height;

  return { x, y, width, height };
}
