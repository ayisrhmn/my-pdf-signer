import { useState, useCallback } from "react";
import type { PdfDocumentState } from "../types/pdf";

export function usePdfFile() {
  const [pdf, setPdf] = useState<PdfDocumentState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPdf = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);

    setPdf((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      const objectUrl = URL.createObjectURL(file);
      return { file, objectUrl, name: file.name, pageCount: 0 };
    });
  }, []);

  const setPageCount = useCallback((count: number) => {
    setPdf((prev) => (prev ? { ...prev, pageCount: count } : prev));
    setIsLoading(false);
  }, []);

  const handleError = useCallback((msg: string) => {
    setError(msg);
    setIsLoading(false);
  }, []);

  const resetPdf = useCallback(() => {
    setPdf((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    pdf,
    isLoading,
    error,
    loadPdf,
    setPageCount,
    handleError,
    resetPdf,
  };
}
