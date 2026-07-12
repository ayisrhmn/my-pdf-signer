export type SignaturePlacement = {
  id: string;
  pageIndex: number;
  /** Ratio 0-1: left edge relative to page width */
  x: number;
  /** Ratio 0-1: top edge relative to page height */
  y: number;
  /** Ratio 0-1: width relative to page width */
  width: number;
  /** Ratio 0-1: height relative to page height */
  height: number;
};

export type PageDimensions = {
  width: number;
  height: number;
};
