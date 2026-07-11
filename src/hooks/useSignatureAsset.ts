import { useState, useCallback } from "react";
import type { SignatureAsset } from "../types/signature";

export function useSignatureAsset() {
  const [signature, setSignature] = useState<SignatureAsset | null>(null);

  const loadSignature = useCallback((file: File) => {
    setSignature((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      return {
        id: crypto.randomUUID(),
        blob: file,
        objectUrl: URL.createObjectURL(file),
        fileName: file.name,
        mimeType: file.type,
      };
    });
  }, []);

  const removeSignature = useCallback(() => {
    setSignature((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
  }, []);

  return { signature, loadSignature, removeSignature };
}
