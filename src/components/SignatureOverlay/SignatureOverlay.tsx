import { useEffect, useRef, useState } from "react";
import type { SignaturePlacement, PageDimensions } from "../../types/placement";

type Props = {
  placements: SignaturePlacement[];
  pageDimensions: PageDimensions;
  signatureUrl: string;
  selectedId: string | null;
  onUpdatePlacement: (
    id: string,
    updates: Partial<Omit<SignaturePlacement, "id" | "pageIndex">>,
  ) => void;
  onSelectPlacement: (id: string | null) => void;
  onRemovePlacement: (id: string) => void;
};

export default function SignatureOverlay({
  placements,
  pageDimensions,
  signatureUrl,
  selectedId,
  onUpdatePlacement,
  onSelectPlacement,
  onRemovePlacement,
}: Props) {
  const pw = pageDimensions.width;
  const ph = pageDimensions.height;

  const [interaction, setInteraction] = useState<{
    id: string;
    type: "drag" | "resize";
    handle?: "nw" | "ne" | "se" | "sw";
  } | null>(null);

  const [localCoords, setLocalCoords] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const localCoordsRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const pointerRef = useRef<{ clientX: number; clientY: number; pageX: number; pageY: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const startScrollLoop = (
    activeInt: { id: string; type: "drag" | "resize"; handle?: "nw" | "ne" | "se" | "sw" },
    startX: number,
    startY: number,
    initialX: number,
    initialY: number,
    initialW: number,
    initialH: number,
    aspectRatio: number,
  ) => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    const tick = () => {
      if (!pointerRef.current) {
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      const { clientX, clientY } = pointerRef.current;
      let speedY = 0;
      const edge = 64;
      const viewHeight = window.innerHeight;

      if (clientY < edge) {
        speedY = -Math.min(15, (edge - clientY) / 3);
      } else if (clientY > viewHeight - edge) {
        speedY = Math.min(15, (clientY - (viewHeight - edge)) / 3);
      }

      if (speedY !== 0) {
        window.scrollBy(0, speedY);
      }

      const currentPageX = clientX + window.scrollX;
      const currentPageY = clientY + window.scrollY;

      const dx = currentPageX - startX;
      const dy = currentPageY - startY;

      if (activeInt.type === "drag") {
        let x = initialX + dx;
        let y = initialY + dy;
        x = Math.max(0, Math.min(pw - initialW, x));
        y = Math.max(0, Math.min(ph - initialH, y));
        const coords = { x, y, w: initialW, h: initialH };
        setLocalCoords(coords);
        localCoordsRef.current = coords;
      } else {
        const minW = 32;
        let newX = initialX;
        let newY = initialY;
        let newW = initialW;
        let newH = initialH;

        const handle = activeInt.handle;

        if (handle === "se") {
          newW = Math.max(minW, initialW + dx);
          newH = newW / aspectRatio;
          if (newX + newW > pw) {
            newW = pw - newX;
            newH = newW / aspectRatio;
          }
          if (newY + newH > ph) {
            newH = ph - newY;
            newW = newH * aspectRatio;
          }
        } else if (handle === "sw") {
          newW = Math.max(minW, initialW - dx);
          newH = newW / aspectRatio;
          if (newW > initialX + initialW) {
            newW = initialX + initialW;
            newH = newW / aspectRatio;
          }
          if (newY + newH > ph) {
            newH = ph - newY;
            newW = newH * aspectRatio;
          }
          newX = initialX + initialW - newW;
        } else if (handle === "ne") {
          newW = Math.max(minW, initialW + dx);
          newH = newW / aspectRatio;
          if (newX + newW > pw) {
            newW = pw - newX;
            newH = newW / aspectRatio;
          }
          if (newH > initialY + initialH) {
            newH = initialY + initialH;
            newW = newH * aspectRatio;
          }
          newY = initialY + initialH - newH;
        } else if (handle === "nw") {
          newW = Math.max(minW, initialW - dx);
          newH = newW / aspectRatio;
          if (newW > initialX + initialW) {
            newW = initialX + initialW;
            newH = newW / aspectRatio;
          }
          if (newH > initialY + initialH) {
            newH = initialY + initialH;
            newW = newH * aspectRatio;
          }
          newX = initialX + initialW - newW;
          newY = initialY + initialH - newH;
        }

        const coords = { x: newX, y: newY, w: newW, h: newH };
        setLocalCoords(coords);
        localCoordsRef.current = coords;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  };

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    placement: SignaturePlacement,
    handle?: "nw" | "ne" | "se" | "sw",
  ) => {
    if (e.button !== 0) return; // Only left click

    const target = e.target as HTMLElement;
    if (target.closest("button[data-remove-btn]")) return;

    e.preventDefault();
    onSelectPlacement(placement.id);

    const startX = e.pageX;
    const startY = e.pageY;
    const initialX = placement.x * pw;
    const initialY = placement.y * ph;
    const initialW = placement.width * pw;
    const initialH = placement.height * ph;
    const aspectRatio = initialW / initialH;

    const newInteraction = {
      id: placement.id,
      type: handle ? ("resize" as const) : ("drag" as const),
      handle,
    };

    setInteraction(newInteraction);
    const coords = { x: initialX, y: initialY, w: initialW, h: initialH };
    setLocalCoords(coords);
    localCoordsRef.current = coords;

    pointerRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      pageX: startX,
      pageY: startY,
    };

    startScrollLoop(
      newInteraction,
      startX,
      startY,
      initialX,
      initialY,
      initialW,
      initialH,
      aspectRatio,
    );
  };

  useEffect(() => {
    if (!interaction) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      pointerRef.current = null;
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        pageX: e.pageX,
        pageY: e.pageY,
      };
    };

    const handlePointerUp = () => {
      if (localCoordsRef.current) {
        onUpdatePlacement(interaction.id, {
          x: localCoordsRef.current.x / pw,
          y: localCoordsRef.current.y / ph,
          width: localCoordsRef.current.w / pw,
          height: localCoordsRef.current.h / ph,
        });
      }
      setInteraction(null);
      setLocalCoords(null);
      localCoordsRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [interaction, pw, ph, onUpdatePlacement]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <>
      {placements.map((placement) => {
        const isSelected = placement.id === selectedId;
        const isCurrentInteraction = interaction?.id === placement.id;

        const x = isCurrentInteraction && localCoords ? localCoords.x : placement.x * pw;
        const y = isCurrentInteraction && localCoords ? localCoords.y : placement.y * ph;
        const w = isCurrentInteraction && localCoords ? localCoords.w : placement.width * pw;
        const h = isCurrentInteraction && localCoords ? localCoords.h : placement.height * ph;

        return (
          <div
            key={placement.id}
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${y}px`,
              width: `${w}px`,
              height: `${h}px`,
            }}
            onPointerDown={(e) => handlePointerDown(e, placement)}
            className={`signature-placement cursor-move rounded-sm touch-none select-none ${
              isSelected
                ? "shadow-[0_0_0_2px_rgba(59,130,246,0.5)]"
                : "hover:shadow-[0_0_0_2px_rgba(59,130,246,0.2)]"
            }`}
          >
            <img
              src={signatureUrl}
              alt="Signature"
              className="h-full w-full select-none object-contain pointer-events-none"
              draggable={false}
            />
            {isSelected && (
              <>
                <button
                  type="button"
                  data-remove-btn="true"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePlacement(placement.id);
                  }}
                  className="absolute -top-2.5 -right-2.5 z-50 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-red-500 text-xs text-white shadow hover:bg-red-600"
                  aria-label="Remove signature placement"
                >
                  ×
                </button>
                <div
                  data-handle="nw"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    handlePointerDown(e, placement, "nw");
                  }}
                  className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nwse-resize z-40 touch-none"
                />
                <div
                  data-handle="ne"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    handlePointerDown(e, placement, "ne");
                  }}
                  className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nesw-resize z-40 touch-none"
                />
                <div
                  data-handle="sw"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    handlePointerDown(e, placement, "sw");
                  }}
                  className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nesw-resize z-40 touch-none"
                />
                <div
                  data-handle="se"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    handlePointerDown(e, placement, "se");
                  }}
                  className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nwse-resize z-40 touch-none"
                />
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
