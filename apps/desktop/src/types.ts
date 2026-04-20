export type FrameMessage = {
  type: "frame";
  version: 1;
  width: number;
  height: number;
  pixels: number[];
};

export type SavedBoardLayoutEntry = {
  id: string;
  chainIndex: number;
  visualGridX: number;
  visualGridY: number;
  viewRotation: number;
  viewMirror: boolean;
  groupId: string;
  width: number;
  height: number;
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

export type GetStateMessage = {
  type: "get_state";
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
  boardLayout?: SavedBoardLayoutEntry[];
  boardGroups?: string[];
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

export type ProjectFrame = {
  id: string;
  name: string;
  pixels: number[];
};

export type ProjectAnimationStep = {
  frameId: string;
  durationMs: number;
};

export type ProjectAnimation = {
  id: string;
  name: string;
  loop: boolean;
  channelId?: string | null;
  steps: ProjectAnimationStep[];
};

export type ProjectChannel = {
  id: string;
  name: string;
  priority: number;
  blendMode: "overwrite";
  mask: null;
};

export type ProjectChannelDefaults = Record<string, unknown> | null;

export type SavedProject = {
  name: string;
  width: number;
  height: number;
  boardLayout?: SavedBoardLayoutEntry[];
  boardGroups?: string[];
  frames: ProjectFrame[];
  animations: ProjectAnimation[];
  channels?: ProjectChannel[];
  channelDefaults?: ProjectChannelDefaults;
  defaultFrameId: string | null;
  defaultAnimationId: string | null;
};

export type SaveProjectMessage = SavedProject & {
  type: "save_project";
  version: 1;
};

export type ListProjectsMessage = {
  type: "list_projects";
  version: 1;
};

export type GetProjectMessage = {
  type: "get_project";
  version: 1;
  name: string;
};

export type ActivateProjectMessage = {
  type: "activate_project";
  version: 1;
  name: string;
};

export type SetBootProjectMessage = {
  type: "set_boot_project";
  version: 1;
  name: string;
};

export type ClearBootProjectMessage = {
  type: "clear_boot_project";
  version: 1;
};

export type ResumeProjectMessage = {
  type: "resume_project";
  version: 1;
};

export type DeleteProjectMessage = {
  type: "delete_project";
  version: 1;
  name: string;
};

export type ClientMessage =
  | FrameMessage
  | ClearMessage
  | BrightnessMessage
  | GetLayoutMessage
  | GetStateMessage
  | LayoutMessage
  | SaveLayoutMessage
  | SaveDrawingMessage
  | LoadDrawingMessage
  | ListDrawingsMessage
  | SaveProjectMessage
  | ListProjectsMessage
  | GetProjectMessage
  | ActivateProjectMessage
  | SetBootProjectMessage
  | ClearBootProjectMessage
  | ResumeProjectMessage
  | DeleteProjectMessage;
