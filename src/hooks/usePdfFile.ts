import { useState, useCallback, useEffect, useRef } from "react";
import type { PdfDocumentState } from "../types/pdf";

export function usePdfFile() {
  const [pdf, setPdf] = useState<PdfDocumentState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  const loadPdf = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);

    const objectUrl = URL.createObjectURL(file);
    setPdf((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      return { file, objectUrl, name: file.name, pageCount: 0 };
    });
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = objectUrl;
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
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setPdf(null);
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
