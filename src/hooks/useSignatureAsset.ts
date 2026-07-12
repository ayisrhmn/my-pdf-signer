import { useCallback, useEffect, useRef, useState } from "react";
import type { SignatureAsset } from "../types/signature";

function decodeImage(url: string): Promise<{ naturalWidth: number; naturalHeight: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      });
    image.onerror = () => reject(new Error("Failed to decode image"));
    image.src = url;
  });
}

export function useSignatureAsset() {
  const [signature, setSignature] = useState<SignatureAsset | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  const loadSignature = useCallback(async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    try {
      const { naturalWidth, naturalHeight } = await decodeImage(objectUrl);
      if (!Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight) || naturalWidth <= 0 || naturalHeight <= 0) {
        throw new Error("Invalid image dimensions");
      }
      const asset: SignatureAsset = {
        id: crypto.randomUUID(),
        blob: file,
        objectUrl,
        fileName: file.name,
        mimeType: file.type,
        naturalWidth,
        naturalHeight,
      };
      setSignature(asset);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = objectUrl;
      return asset;
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      throw error;
    }
  }, []);

  const removeSignature = useCallback(() => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setSignature(null);
  }, []);

  return { signature, loadSignature, removeSignature };
}
