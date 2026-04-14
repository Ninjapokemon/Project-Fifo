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

export type ClientMessage = FrameMessage | ClearMessage;
