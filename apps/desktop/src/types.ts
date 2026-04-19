export type FrameMessage = {
  type: "frame";
  version: 1;
  width: number;
  height: number;
  pixels: number[];
};

export type ClearMessage = {
  type: "clear";
  version: 1;
};

export type BrightnessMessage = {
  type: "brightness";
  version: 1;
  value: number;
};

export type GetLayoutMessage = {
  type: "get_layout";
  version: 1;
};

export type LayoutMessage = {
  type: "layout";
  version: 1;
  rotate: number;
  block_orientation: number;
  reverse_order: boolean;
  panel_order: number[] | null;
  panel_rotations: number[] | null;
  panel_mirrors: boolean[] | null;
  panel_flips: boolean[] | null;
};

export type SaveLayoutMessage = {
  type: "save_layout";
  version: 1;
  rotate: number;
  block_orientation: number;
  reverse_order: boolean;
  panel_order: number[] | null;
  panel_rotations: number[] | null;
  panel_mirrors: boolean[] | null;
  panel_flips: boolean[] | null;
};

export type SavedDrawing = FrameMessage & {
  name: string;
};

export type SaveDrawingMessage = SavedDrawing & {
  type: "save_drawing";
  version: 1;
};

export type LoadDrawingMessage = {
  type: "load_drawing";
  version: 1;
  name: string;
};

export type ListDrawingsMessage = {
  type: "list_drawings";
  version: 1;
};

export type ClientMessage =
  | FrameMessage
  | ClearMessage
  | BrightnessMessage
  | GetLayoutMessage
  | LayoutMessage
  | SaveLayoutMessage
  | SaveDrawingMessage
  | LoadDrawingMessage
  | ListDrawingsMessage;
