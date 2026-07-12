import { useState, useCallback } from "react";
import type { SignaturePlacement } from "../types/placement";

const DEFAULT_WIDTH_RATIO = 0.2;

export function useSignaturePlacement() {
  const [placements, setPlacements] = useState<SignaturePlacement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addPlacement = useCallback(
    (
      pageIndex: number,
      pageWidth: number,
      pageHeight: number,
      imageAspectRatio: number,
    ) => {
      const width = Math.min(
        DEFAULT_WIDTH_RATIO,
        (DEFAULT_WIDTH_RATIO * pageHeight * imageAspectRatio) / pageWidth,
      );
      const height = (pageWidth * width) / imageAspectRatio / pageHeight;
      const x = (1 - width) / 2;
      const y = (1 - height) / 2;

      const placement: SignaturePlacement = {
        id: crypto.randomUUID(),
        pageIndex,
        x,
        y,
        width,
        height,
      };

      setPlacements((prev) => [...prev, placement]);
      setSelectedId(placement.id);
      return placement.id;
    },
    [],
  );

  const updatePlacement = useCallback(
    (
      id: string,
      updates: Partial<Omit<SignaturePlacement, "id" | "pageIndex">>,
    ) => {
      setPlacements((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    },
    [],
  );

  const removePlacement = useCallback((id: string) => {
    setPlacements((prev) => prev.filter((p) => p.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const selectPlacement = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const clearPlacements = useCallback(() => {
    setPlacements([]);
    setSelectedId(null);
  }, []);

  return {
    placements,
    selectedId,
    addPlacement,
    updatePlacement,
    removePlacement,
    selectPlacement,
    clearPlacements,
  };
}
