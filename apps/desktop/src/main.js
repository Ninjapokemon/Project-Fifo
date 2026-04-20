const DEFAULT_WIDTH = 24;
const DEFAULT_HEIGHT = 8;
const SEND_DELAY_MS = 40;
const DEFAULT_BRIGHTNESS = 3;
const MIN_BRIGHTNESS = 0;
const MAX_BRIGHTNESS = 15;
const DEFAULT_MOVING_DOT_SPEED = 1;
const DEFAULT_MOVING_DOT_FPS = 12;
const MIN_MOVING_DOT_SPEED = 1;
const MAX_MOVING_DOT_SPEED = 32;
const MIN_MOVING_DOT_FPS = 1;
const MAX_MOVING_DOT_FPS = 60;
const PANEL_SIZE = 8;
const PANEL_ROTATION_VALUES = [0, 90, 180, 270];
const PANEL_INDEX_TEST_FPS = 2;
const HISTORY_LIMIT = 48;
const DEFAULT_FRAME_ID = "frame-1";
const DEFAULT_FRAME_NAME = "Frame 1";
const DEFAULT_ANIMATION_STEP_DURATION_MS = 120;
const MIN_ANIMATION_STEP_DURATION_MS = 40;
const MAX_ANIMATION_STEP_DURATION_MS = 5000;
const DEFAULT_TARGET_AUTO_VALUE = "__auto__";
const AUTOSAVE_STORAGE_KEY = "project-fifo.autosave";
const PI_ENDPOINTS_STORAGE_KEY = "project-fifo.pi-endpoints";
const PIXEL_COLOR_STORAGE_KEY = "project-fifo.pixel-color";
const STUDIO_SIDEBAR_WIDTH_STORAGE_KEY = "project-fifo.studio-sidebar-width";
const WORKSPACE_ANIMATION_PANE_WIDTH_STORAGE_KEY = "project-fifo.workspace-animation-pane-width";
const WORKSPACE_STUDIO_HEIGHT_STORAGE_KEY = "project-fifo.workspace-studio-height-v2";
const DEFAULT_ENDPOINT_NAME = "Workshop Pi";
const DEFAULT_PIXEL_COLOR = "#7CF7D4";
const DEFAULT_STUDIO_SIDEBAR_WIDTH = 330;
const MIN_STUDIO_SIDEBAR_WIDTH = 220;
const MAX_STUDIO_SIDEBAR_WIDTH = 920;
const MIN_STUDIO_MAIN_WIDTH = 280;
const MAX_STUDIO_SIDEBAR_VIEWPORT_RATIO = 0.48;
const STUDIO_RESIZER_WIDTH = 18;
const STUDIO_SIDEBAR_RESIZE_STEP = 24;
const DEFAULT_WORKSPACE_ANIMATION_PANE_WIDTH = 420;
const MIN_WORKSPACE_ANIMATION_PANE_WIDTH = 220;
const MAX_WORKSPACE_ANIMATION_PANE_WIDTH = 1200;
const MIN_WORKSPACE_GRID_WIDTH = 520;
const MIN_WORKSPACE_GRID_COMPACT_WIDTH = 120;
const WORKSPACE_GRID_MIN_WIDTH_RATIO = 0.12;
const WORKSPACE_PANEL_RESIZER_WIDTH = 18;
const WORKSPACE_ANIMATION_PANE_RESIZE_STEP = 24;
const DEFAULT_WORKSPACE_STUDIO_HEIGHT = 760;
const MIN_WORKSPACE_STUDIO_HEIGHT = 160;
const MAX_WORKSPACE_STUDIO_HEIGHT = 1400;
const MIN_WORKSPACE_TIMELINE_HEIGHT = 140;
const WORKSPACE_STUDIO_VIEWPORT_BOTTOM_GUTTER = 16;
const WORKSPACE_STUDIO_HEIGHT_RESIZE_STEP = 32;
const WORKSPACE_TIMELINE_PANEL_DRAG_ZONE_HEIGHT = 28;
const PIXEL_CELL_SIZE = 28;
const BOARD_GRID_COLUMN_GAP = 7;
const BOARD_GRID_ROW_GAP = 1;
const BOARD_CARD_PADDING = 14;
const BOARD_CARD_BORDER = 2;
const BOARD_HEADER_HEIGHT = 112;
const BOARD_LABEL_GAP = 12;
const BOARD_WORKSPACE_GAP = 18;
const BOARD_SLOT_WIDTH = (PANEL_SIZE * PIXEL_CELL_SIZE)
  + ((PANEL_SIZE - 1) * BOARD_GRID_COLUMN_GAP)
  + (BOARD_CARD_PADDING * 2)
  + (BOARD_CARD_BORDER * 2);
const BOARD_SLOT_HEIGHT = BOARD_HEADER_HEIGHT
  + BOARD_LABEL_GAP
  + (PANEL_SIZE * PIXEL_CELL_SIZE)
  + ((PANEL_SIZE - 1) * BOARD_GRID_ROW_GAP)
  + (BOARD_CARD_PADDING * 2)
  + (BOARD_CARD_BORDER * 2);
const BOARD_SLOT_PITCH_X = BOARD_SLOT_WIDTH + BOARD_WORKSPACE_GAP;
const BOARD_SLOT_PITCH_Y = BOARD_SLOT_HEIGHT + BOARD_WORKSPACE_GAP;
const BOARD_WORKSPACE_INSET_X = 24;
const BOARD_WORKSPACE_INSET_Y = 40;
const GROUP_SHELL_SIDE_PADDING = 18;
const GROUP_SHELL_TOP_PADDING = 32;
const GROUP_SHELL_BOTTOM_PADDING = 18;
const DEFAULT_BOARD_GROUP_ID = "group-1";
const DEFAULT_LAYOUT = {
  rotate: 0,
  blockOrientation: 90,
  reverseOrder: false,
  panelOrder: null,
  panelRotations: null,
  panelMirrors: null,
};
const LAYOUT_PRESETS = {
  custom: null,
  "horizontal-ltr": {
    label: "Horizontal L to R",
    rotate: 0,
    blockOrientation: 90,
    reverseOrder: false,
  },
  "horizontal-rtl": {
    label: "Horizontal R to L",
    rotate: 0,
    blockOrientation: 90,
    reverseOrder: true,
  },
  "horizontal-ltr-flipped": {
    label: "Horizontal L to R Flipped",
    rotate: 2,
    blockOrientation: -90,
    reverseOrder: false,
  },
  "horizontal-rtl-flipped": {
    label: "Horizontal R to L Flipped",
    rotate: 2,
    blockOrientation: -90,
    reverseOrder: true,
  },
};
const PANEL_INDEX_DIGITS = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "001", "001", "001"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
};

const state = {
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  pixels: Array(DEFAULT_WIDTH * DEFAULT_HEIGHT).fill(0),
  drawingName: "fifo-drawing",
  endpointName: DEFAULT_ENDPOINT_NAME,
  connectionPanelCollapsed: false,
  piDrawings: [],
  piProjects: [],
  savedEndpoints: [],
  brightness: DEFAULT_BRIGHTNESS,
  layout: { ...DEFAULT_LAYOUT },
  runtime: {
    mode: "idle",
    liveOverrideActive: false,
    activeProject: null,
    bootProject: null,
    activeTargetType: null,
    activeTargetName: null,
    activeProjectPersisted: false,
  },
  connectedDisplayWidth: null,
  connectedDisplayHeight: null,
  pixelColor: DEFAULT_PIXEL_COLOR,
  boardLayout: [],
  boardGroups: [DEFAULT_BOARD_GROUP_ID],
  project: {
    frames: [
      {
        id: DEFAULT_FRAME_ID,
        name: DEFAULT_FRAME_NAME,
        pixels: Array(DEFAULT_WIDTH * DEFAULT_HEIGHT).fill(0),
      },
    ],
    animations: [],
    activeFrameId: DEFAULT_FRAME_ID,
    activeAnimationId: null,
    selectedStepIndex: null,
    defaultFrameId: DEFAULT_FRAME_ID,
    defaultAnimationId: null,
    previewTimer: null,
    previewAnimationId: null,
    previewStepIndex: 0,
  },
  boardDrag: null,
  sidebarResize: null,
  workspacePaneResize: null,
  workspaceTimelineResize: null,
  boardWorkspaceScale: 1,
  boardWorkspaceScaleFrame: null,
  boardWorkspaceResizeObserver: null,
  boardWorkspaceViewportWidth: null,
  boardWorkspaceViewportHeight: null,
  drawValue: 1,
  socket: null,
  sendTimer: null,
  isPointerDown: false,
  strokeHasChanges: false,
  movingDotSpeed: DEFAULT_MOVING_DOT_SPEED,
  movingDotFps: DEFAULT_MOVING_DOT_FPS,
  activePattern: null,
  patternTimer: null,
  patternFrame: 0,
  history: {
    entries: [],
    index: -1,
  },
};

const elements = {
  heroPanel: document.querySelector("#heroPanel"),
  connectionCard: document.querySelector("#connectionCard"),
  connectionCardBody: document.querySelector("#connectionCardBody"),
  connectionCardSummary: document.querySelector("#connectionCardSummary"),
  connectionSummaryText: document.querySelector("#connectionSummaryText"),
  studioShell: document.querySelector("#studioShell"),
  controlsSidebar: document.querySelector("#controlsSidebar"),
  studioMain: document.querySelector("#studioMain"),
  studioResizer: document.querySelector("#studioResizer"),
  workspacePanel: document.querySelector("#workspacePanel"),
  workspaceBody: document.querySelector("#workspaceBody"),
  workspaceGridPane: document.querySelector("#workspaceGridPane"),
  workspaceAnimationPane: document.querySelector("#workspaceAnimationPane"),
  workspacePanelResizer: document.querySelector("#workspacePanelResizer"),
  workspaceTimelinePanel: document.querySelector("#workspaceTimelinePanel"),
  workspaceTimelineResizer: document.querySelector("#workspaceTimelineResizer"),
  savedEndpointSelect: document.querySelector("#savedEndpointSelect"),
  applySavedEndpointButton: document.querySelector("#applySavedEndpointButton"),
  deleteSavedEndpointButton: document.querySelector("#deleteSavedEndpointButton"),
  endpointName: document.querySelector("#endpointName"),
  saveEndpointButton: document.querySelector("#saveEndpointButton"),
  endpoint: document.querySelector("#endpoint"),
  connectButton: document.querySelector("#connectButton"),
  disconnectButton: document.querySelector("#disconnectButton"),
  connectionStatus: document.querySelector("#connectionStatus"),
  gridWidth: document.querySelector("#gridWidth"),
  gridHeight: document.querySelector("#gridHeight"),
  resizeButton: document.querySelector("#resizeButton"),
  drawingName: document.querySelector("#drawingName"),
  brightnessRange: document.querySelector("#brightnessRange"),
  brightnessValue: document.querySelector("#brightnessValue"),
  layoutPreset: document.querySelector("#layoutPreset"),
  applyLayoutPresetButton: document.querySelector("#applyLayoutPresetButton"),
  refreshLayoutButton: document.querySelector("#refreshLayoutButton"),
  saveLayoutButton: document.querySelector("#saveLayoutButton"),
  projectSummary: document.querySelector("#projectSummary"),
  newFrameButton: document.querySelector("#newFrameButton"),
  duplicateFrameButton: document.querySelector("#duplicateFrameButton"),
  deleteFrameButton: document.querySelector("#deleteFrameButton"),
  moveFrameLeftButton: document.querySelector("#moveFrameLeftButton"),
  moveFrameRightButton: document.querySelector("#moveFrameRightButton"),
  frameStrip: document.querySelector("#frameStrip"),
  frameName: document.querySelector("#frameName"),
  defaultTargetSelect: document.querySelector("#defaultTargetSelect"),
  animationSelect: document.querySelector("#animationSelect"),
  newAnimationButton: document.querySelector("#newAnimationButton"),
  deleteAnimationButton: document.querySelector("#deleteAnimationButton"),
  previewAnimationButton: document.querySelector("#previewAnimationButton"),
  stopAnimationPreviewButton: document.querySelector("#stopAnimationPreviewButton"),
  animationName: document.querySelector("#animationName"),
  animationLoopInput: document.querySelector("#animationLoopInput"),
  animationPreviewStatus: document.querySelector("#animationPreviewStatus"),
  animationPreviewGrid: document.querySelector("#animationPreviewGrid"),
  addAnimationStepButton: document.querySelector("#addAnimationStepButton"),
  animationStepList: document.querySelector("#animationStepList"),
  rotateSelect: document.querySelector("#rotateSelect"),
  blockOrientationSelect: document.querySelector("#blockOrientationSelect"),
  reverseOrderInput: document.querySelector("#reverseOrderInput"),
  panelOrderInput: document.querySelector("#panelOrderInput"),
  pixelColor: document.querySelector("#pixelColor"),
  pixelColorValue: document.querySelector("#pixelColorValue"),
  paintModeButton: document.querySelector("#paintModeButton"),
  eraseModeButton: document.querySelector("#eraseModeButton"),
  undoButton: document.querySelector("#undoButton"),
  redoButton: document.querySelector("#redoButton"),
  clearButton: document.querySelector("#clearButton"),
  fillButton: document.querySelector("#fillButton"),
  newBoardGroupButton: document.querySelector("#newBoardGroupButton"),
  checkerButton: document.querySelector("#checkerButton"),
  borderButton: document.querySelector("#borderButton"),
  horizontalLineButton: document.querySelector("#horizontalLineButton"),
  verticalLineButton: document.querySelector("#verticalLineButton"),
  movingDotButton: document.querySelector("#movingDotButton"),
  panelIndexTestButton: document.querySelector("#panelIndexTestButton"),
  stopPatternButton: document.querySelector("#stopPatternButton"),
  movingDotSpeed: document.querySelector("#movingDotSpeed"),
  movingDotFps: document.querySelector("#movingDotFps"),
  saveButton: document.querySelector("#saveButton"),
  loadButton: document.querySelector("#loadButton"),
  saveToPiButton: document.querySelector("#saveToPiButton"),
  piDrawingSelect: document.querySelector("#piDrawingSelect"),
  refreshPiDrawingsButton: document.querySelector("#refreshPiDrawingsButton"),
  loadFromPiButton: document.querySelector("#loadFromPiButton"),
  piRuntimeStatus: document.querySelector("#piRuntimeStatus"),
  saveProjectToPiButton: document.querySelector("#saveProjectToPiButton"),
  piProjectSelect: document.querySelector("#piProjectSelect"),
  refreshPiProjectsButton: document.querySelector("#refreshPiProjectsButton"),
  loadProjectFromPiButton: document.querySelector("#loadProjectFromPiButton"),
  activateProjectButton: document.querySelector("#activateProjectButton"),
  setBootProjectButton: document.querySelector("#setBootProjectButton"),
  clearBootProjectButton: document.querySelector("#clearBootProjectButton"),
  resumeProjectButton: document.querySelector("#resumeProjectButton"),
  deleteProjectButton: document.querySelector("#deleteProjectButton"),
  saveWorkflowStatus: document.querySelector("#saveWorkflowStatus"),
  projectDeployStatus: document.querySelector("#projectDeployStatus"),
  loadInput: document.querySelector("#loadInput"),
  sendButton: document.querySelector("#sendButton"),
  grid: document.querySelector("#grid"),
  gridMeta: document.querySelector("#gridMeta"),
  logOutput: document.querySelector("#logOutput"),
  clearLogButton: document.querySelector("#clearLogButton"),
  autosaveStatus: document.querySelector("#autosaveStatus"),
};

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  elements.logOutput.textContent = `[${timestamp}] ${message}\n${elements.logOutput.textContent}`.trimEnd();
}

function setStatus(label, variant) {
  elements.connectionStatus.textContent = label;
  elements.connectionStatus.className = `status-pill ${variant}`;
}

function syncConnectionSummary() {
  if (!elements.connectionSummaryText) {
    return;
  }

  const endpoint = elements.endpoint?.value.trim() || "";
  const fallbackName = endpoint ? inferEndpointName(endpoint) : (state.endpointName || DEFAULT_ENDPOINT_NAME);
  const name = sanitizeEndpointName(elements.endpointName?.value || fallbackName);
  elements.connectionSummaryText.textContent = endpoint
    ? `${name} - ${endpoint}`
    : `${name} - No endpoint set`;
}

function getCollapsibleCardParts(card) {
  if (!card) {
    return { toggle: null, body: null };
  }

  const toggle = card.querySelector(".card-title-toggle[aria-controls]");
  const bodyId = toggle?.getAttribute("aria-controls");
  const body = bodyId ? document.getElementById(bodyId) : null;
  return { toggle, body };
}

function applyConnectionCollapseState(collapsed) {
  const nextCollapsed = Boolean(collapsed);
  state.connectionPanelCollapsed = nextCollapsed;
  syncConnectionSummary();
  elements.heroPanel?.classList.toggle("is-connection-collapsed", nextCollapsed);
  elements.connectionCard?.classList.toggle("is-collapsed", nextCollapsed);

  if (elements.connectionCardSummary) {
    elements.connectionCardSummary.hidden = !nextCollapsed;
  }
}

function setCollapsibleCardState(card, collapsed) {
  const { toggle, body } = getCollapsibleCardParts(card);
  if (!card || !toggle || !body) {
    return;
  }

  const nextCollapsed = Boolean(collapsed);
  card.classList.toggle("is-collapsed", nextCollapsed);
  body.hidden = nextCollapsed;
  toggle.setAttribute("aria-expanded", String(!nextCollapsed));

  if (card === elements.connectionCard) {
    applyConnectionCollapseState(nextCollapsed);
  }
}

function initializeCollapsibleCards() {
  document.querySelectorAll("[data-collapsible-card]").forEach((card) => {
    const { toggle, body } = getCollapsibleCardParts(card);
    if (!toggle || !body) {
      return;
    }

    setCollapsibleCardState(card, card.classList.contains("is-collapsed"));
    toggle.addEventListener("click", () => {
      setCollapsibleCardState(card, !card.classList.contains("is-collapsed"));
    });
  });
}

function updateModeButtons() {
  const paintActive = state.drawValue === 1;
  elements.paintModeButton.disabled = paintActive;
  elements.eraseModeButton.disabled = !paintActive;
}

function updateHistoryButtons() {
  elements.undoButton.disabled = state.history.index <= 0;
  elements.redoButton.disabled = state.history.index >= state.history.entries.length - 1;
}

function setAutosaveStatus(message) {
  elements.autosaveStatus.textContent = message;
}

function normalizeHexColor(value) {
  if (typeof value !== "string") {
    return DEFAULT_PIXEL_COLOR;
  }

  const normalized = value.trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : DEFAULT_PIXEL_COLOR;
}

function hexToRgb(color) {
  const normalized = normalizeHexColor(color);
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function applyPixelColor() {
  const color = normalizeHexColor(state.pixelColor);
  const { r, g, b } = hexToRgb(color);
  document.documentElement.style.setProperty("--pixel-on-color", color);
  document.documentElement.style.setProperty("--pixel-on-glow", `rgba(${r}, ${g}, ${b}, 0.3)`);
  elements.pixelColor.value = color;
  elements.pixelColorValue.textContent = color;
}

function savePixelColorPreference() {
  window.localStorage.setItem(PIXEL_COLOR_STORAGE_KEY, normalizeHexColor(state.pixelColor));
}

function loadPixelColorPreference() {
  const savedColor = window.localStorage.getItem(PIXEL_COLOR_STORAGE_KEY);
  state.pixelColor = normalizeHexColor(savedColor || DEFAULT_PIXEL_COLOR);
}

function getStudioSidebarWidthLimits() {
  const minimum = MIN_STUDIO_SIDEBAR_WIDTH;
  if (!elements.studioShell || window.matchMedia("(max-width: 900px)").matches) {
    return { minimum, maximum: minimum };
  }

  const shellWidth = elements.studioShell.clientWidth;
  const viewportMaximum = Math.round(window.innerWidth * MAX_STUDIO_SIDEBAR_VIEWPORT_RATIO);
  const maximum = Math.max(
    minimum,
    Math.min(
      MAX_STUDIO_SIDEBAR_WIDTH,
      viewportMaximum,
      shellWidth - MIN_STUDIO_MAIN_WIDTH - STUDIO_RESIZER_WIDTH,
    ),
  );
  return { minimum, maximum };
}

function getStoredStudioSidebarWidth() {
  const rawValue = window.localStorage.getItem(STUDIO_SIDEBAR_WIDTH_STORAGE_KEY);
  const parsedValue = Number.parseFloat(rawValue || "");
  return Number.isFinite(parsedValue) ? parsedValue : DEFAULT_STUDIO_SIDEBAR_WIDTH;
}

function getCurrentStudioSidebarWidth() {
  if (!elements.studioShell) {
    return DEFAULT_STUDIO_SIDEBAR_WIDTH;
  }

  const rawValue = window.getComputedStyle(elements.studioShell).getPropertyValue("--studio-sidebar-width");
  const parsedValue = Number.parseFloat(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : DEFAULT_STUDIO_SIDEBAR_WIDTH;
}

function updateStudioResizerAccessibility(width = getCurrentStudioSidebarWidth()) {
  if (!elements.studioResizer) {
    return;
  }

  const { minimum, maximum } = getStudioSidebarWidthLimits();
  elements.studioResizer.setAttribute("aria-valuemin", String(minimum));
  elements.studioResizer.setAttribute("aria-valuemax", String(maximum));
  elements.studioResizer.setAttribute("aria-valuenow", String(width));
  elements.studioResizer.setAttribute("aria-valuetext", `${width}px sidebar width`);
}

function applyStudioSidebarWidth(width, options = {}) {
  if (!elements.studioShell) {
    return DEFAULT_STUDIO_SIDEBAR_WIDTH;
  }

  const { minimum, maximum } = getStudioSidebarWidthLimits();
  const fallback = clampNumber(DEFAULT_STUDIO_SIDEBAR_WIDTH, minimum, maximum, minimum);
  const clampedWidth = clampNumber(width, minimum, maximum, fallback);
  elements.studioShell.style.setProperty("--studio-sidebar-width", `${clampedWidth}px`);
  updateStudioResizerAccessibility(clampedWidth);

  if (options.persist) {
    window.localStorage.setItem(STUDIO_SIDEBAR_WIDTH_STORAGE_KEY, String(clampedWidth));
  }

  scheduleGridWorkspaceScaleUpdate();
  return clampedWidth;
}

function loadStudioSidebarWidthPreference() {
  applyStudioSidebarWidth(getStoredStudioSidebarWidth());
}

function resetStudioSidebarWidth() {
  applyStudioSidebarWidth(DEFAULT_STUDIO_SIDEBAR_WIDTH, { persist: true });
}

function cleanupStudioSidebarResize() {
  if (!state.sidebarResize) {
    return;
  }

  const pointerId = state.sidebarResize.pointerId;
  if (
    elements.studioResizer
    && typeof elements.studioResizer.hasPointerCapture === "function"
    && typeof elements.studioResizer.releasePointerCapture === "function"
  ) {
    try {
      if (elements.studioResizer.hasPointerCapture(pointerId)) {
        elements.studioResizer.releasePointerCapture(pointerId);
      }
    } catch (error) {
      // Pointer capture cleanup is optional here, so ignore failures.
    }
  }

  state.sidebarResize = null;
  elements.studioShell?.classList.remove("is-resizing");
  document.body.classList.remove("sidebar-resizing");
}

function startStudioSidebarResize(event) {
  if (!elements.studioResizer || window.matchMedia("(max-width: 900px)").matches) {
    return;
  }

  event.preventDefault();
  state.isPointerDown = false;
  state.strokeHasChanges = false;
  state.sidebarResize = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startWidth: getCurrentStudioSidebarWidth(),
  };
  elements.studioShell?.classList.add("is-resizing");
  document.body.classList.add("sidebar-resizing");

  if (typeof elements.studioResizer.setPointerCapture === "function") {
    try {
      elements.studioResizer.setPointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture is helpful but not required for the resize interaction.
    }
  }
}

function updateStudioSidebarResize(event) {
  if (!state.sidebarResize || event.pointerId !== state.sidebarResize.pointerId) {
    return false;
  }

  const nextWidth = state.sidebarResize.startWidth + (event.clientX - state.sidebarResize.startX);
  applyStudioSidebarWidth(nextWidth);
  return true;
}

function finishStudioSidebarResize(event) {
  if (!state.sidebarResize) {
    return false;
  }

  if (event?.pointerId != null && event.pointerId !== state.sidebarResize.pointerId) {
    return false;
  }

  applyStudioSidebarWidth(getCurrentStudioSidebarWidth(), { persist: true });
  cleanupStudioSidebarResize();
  if (state.project.previewTimer == null) {
    renderSelectedAnimationPreview();
  }
  return true;
}

function getWorkspaceAnimationPaneWidthLimits() {
  const minimum = MIN_WORKSPACE_ANIMATION_PANE_WIDTH;
  if (!elements.workspaceBody || window.matchMedia("(max-width: 900px)").matches) {
    return { minimum, maximum: minimum };
  }

  const bodyWidth = elements.workspaceBody.clientWidth;
  const protectedGridWidth = Math.max(
    MIN_WORKSPACE_GRID_COMPACT_WIDTH,
    Math.min(
      MIN_WORKSPACE_GRID_WIDTH,
      Math.round(bodyWidth * WORKSPACE_GRID_MIN_WIDTH_RATIO),
    ),
  );
  const maximum = Math.max(
    minimum,
    Math.min(
      MAX_WORKSPACE_ANIMATION_PANE_WIDTH,
      bodyWidth - protectedGridWidth - WORKSPACE_PANEL_RESIZER_WIDTH,
    ),
  );
  return { minimum, maximum };
}

function getStoredWorkspaceAnimationPaneWidth() {
  const rawValue = window.localStorage.getItem(WORKSPACE_ANIMATION_PANE_WIDTH_STORAGE_KEY);
  const parsedValue = Number.parseFloat(rawValue || "");
  return Number.isFinite(parsedValue) ? parsedValue : DEFAULT_WORKSPACE_ANIMATION_PANE_WIDTH;
}

function getCurrentWorkspaceAnimationPaneWidth() {
  if (!elements.workspacePanel) {
    return DEFAULT_WORKSPACE_ANIMATION_PANE_WIDTH;
  }

  const rawValue = window.getComputedStyle(elements.workspacePanel).getPropertyValue("--workspace-animation-pane-width");
  const parsedValue = Number.parseFloat(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : DEFAULT_WORKSPACE_ANIMATION_PANE_WIDTH;
}

function updateWorkspacePanelResizerAccessibility(width = getCurrentWorkspaceAnimationPaneWidth()) {
  if (!elements.workspacePanelResizer) {
    return;
  }

  const { minimum, maximum } = getWorkspaceAnimationPaneWidthLimits();
  elements.workspacePanelResizer.setAttribute("aria-valuemin", String(minimum));
  elements.workspacePanelResizer.setAttribute("aria-valuemax", String(maximum));
  elements.workspacePanelResizer.setAttribute("aria-valuenow", String(width));
  elements.workspacePanelResizer.setAttribute("aria-valuetext", `${width}px animation panel width`);
}

function applyWorkspaceAnimationPaneWidth(width, options = {}) {
  if (!elements.workspacePanel) {
    return DEFAULT_WORKSPACE_ANIMATION_PANE_WIDTH;
  }

  const { minimum, maximum } = getWorkspaceAnimationPaneWidthLimits();
  const fallback = clampNumber(
    DEFAULT_WORKSPACE_ANIMATION_PANE_WIDTH,
    minimum,
    maximum,
    minimum,
  );
  const clampedWidth = clampNumber(width, minimum, maximum, fallback);
  elements.workspacePanel.style.setProperty("--workspace-animation-pane-width", `${clampedWidth}px`);
  updateWorkspacePanelResizerAccessibility(clampedWidth);

  if (options.persist) {
    window.localStorage.setItem(WORKSPACE_ANIMATION_PANE_WIDTH_STORAGE_KEY, String(clampedWidth));
  }

  scheduleGridWorkspaceScaleUpdate();
  return clampedWidth;
}

function loadWorkspaceAnimationPaneWidthPreference() {
  applyWorkspaceAnimationPaneWidth(getStoredWorkspaceAnimationPaneWidth());
}

function resetWorkspaceAnimationPaneWidth() {
  applyWorkspaceAnimationPaneWidth(DEFAULT_WORKSPACE_ANIMATION_PANE_WIDTH, { persist: true });
}

function getWorkspaceStudioHeightLimits() {
  const minimum = MIN_WORKSPACE_STUDIO_HEIGHT;
  if (!elements.workspacePanel || window.matchMedia("(max-width: 900px)").matches) {
    return { minimum, maximum: minimum };
  }

  const panelRect = elements.workspacePanel.getBoundingClientRect();
  const viewportMaximum = Math.round(
    window.innerHeight - panelRect.top - MIN_WORKSPACE_TIMELINE_HEIGHT - WORKSPACE_STUDIO_VIEWPORT_BOTTOM_GUTTER,
  );
  const maximum = Math.max(
    minimum,
    Math.min(
      MAX_WORKSPACE_STUDIO_HEIGHT,
      viewportMaximum,
    ),
  );
  return { minimum, maximum };
}

function getStoredWorkspaceStudioHeight() {
  const rawValue = window.localStorage.getItem(WORKSPACE_STUDIO_HEIGHT_STORAGE_KEY);
  const parsedValue = Number.parseFloat(rawValue || "");
  return Number.isFinite(parsedValue) ? parsedValue : DEFAULT_WORKSPACE_STUDIO_HEIGHT;
}

function getCurrentWorkspaceStudioHeight() {
  if (!elements.workspacePanel) {
    return DEFAULT_WORKSPACE_STUDIO_HEIGHT;
  }

  const rawValue = window.getComputedStyle(elements.workspacePanel).getPropertyValue("--workspace-studio-height");
  const parsedValue = Number.parseFloat(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : DEFAULT_WORKSPACE_STUDIO_HEIGHT;
}

function updateWorkspaceTimelineResizerAccessibility(height = getCurrentWorkspaceStudioHeight()) {
  if (!elements.workspaceTimelineResizer) {
    return;
  }

  const { minimum, maximum } = getWorkspaceStudioHeightLimits();
  elements.workspaceTimelineResizer.setAttribute("aria-valuemin", String(minimum));
  elements.workspaceTimelineResizer.setAttribute("aria-valuemax", String(maximum));
  elements.workspaceTimelineResizer.setAttribute("aria-valuenow", String(height));
  elements.workspaceTimelineResizer.setAttribute("aria-valuetext", `${height}px studio height`);
}

function applyWorkspaceStudioHeight(height, options = {}) {
  if (!elements.workspacePanel) {
    return DEFAULT_WORKSPACE_STUDIO_HEIGHT;
  }

  const { minimum, maximum } = getWorkspaceStudioHeightLimits();
  const fallback = clampNumber(
    DEFAULT_WORKSPACE_STUDIO_HEIGHT,
    minimum,
    maximum,
    minimum,
  );
  const clampedHeight = clampNumber(height, minimum, maximum, fallback);
  elements.workspacePanel.style.setProperty("--workspace-studio-height", `${clampedHeight}px`);
  updateWorkspaceTimelineResizerAccessibility(clampedHeight);

  if (options.persist) {
    window.localStorage.setItem(WORKSPACE_STUDIO_HEIGHT_STORAGE_KEY, String(clampedHeight));
  }

  scheduleGridWorkspaceScaleUpdate();
  return clampedHeight;
}

function loadWorkspaceStudioHeightPreference() {
  applyWorkspaceStudioHeight(getStoredWorkspaceStudioHeight());
}

function resetWorkspaceStudioHeight() {
  applyWorkspaceStudioHeight(DEFAULT_WORKSPACE_STUDIO_HEIGHT, { persist: true });
}

function shouldStartWorkspaceTimelineResizeFromPanel(event) {
  if (!elements.workspaceTimelinePanel) {
    return false;
  }

  if (event.button !== 0) {
    return false;
  }

  const interactiveTarget = event.target instanceof Element
    ? event.target.closest("button, input, select, textarea, a, label, summary, [role='button']")
    : null;
  if (interactiveTarget) {
    return false;
  }

  const panelRect = elements.workspaceTimelinePanel.getBoundingClientRect();
  return (event.clientY - panelRect.top) <= WORKSPACE_TIMELINE_PANEL_DRAG_ZONE_HEIGHT;
}

function cleanupWorkspaceTimelineResize() {
  if (!state.workspaceTimelineResize) {
    return;
  }

  const pointerId = state.workspaceTimelineResize.pointerId;
  if (
    elements.workspaceTimelineResizer
    && typeof elements.workspaceTimelineResizer.hasPointerCapture === "function"
    && typeof elements.workspaceTimelineResizer.releasePointerCapture === "function"
  ) {
    try {
      if (elements.workspaceTimelineResizer.hasPointerCapture(pointerId)) {
        elements.workspaceTimelineResizer.releasePointerCapture(pointerId);
      }
    } catch (error) {
      // Pointer capture cleanup is optional here, so ignore failures.
    }
  }

  state.workspaceTimelineResize = null;
  elements.workspacePanel?.classList.remove("is-timeline-resizing");
  document.body.classList.remove("workspace-timeline-resizing");
}

function startWorkspaceTimelineResize(event) {
  if (!elements.workspaceTimelineResizer || window.matchMedia("(max-width: 900px)").matches) {
    return;
  }

  event.preventDefault();
  state.isPointerDown = false;
  state.strokeHasChanges = false;
  state.workspaceTimelineResize = {
    pointerId: event.pointerId,
    startY: event.clientY,
    startHeight: getCurrentWorkspaceStudioHeight(),
  };
  elements.workspacePanel?.classList.add("is-timeline-resizing");
  document.body.classList.add("workspace-timeline-resizing");

  if (typeof elements.workspaceTimelineResizer.setPointerCapture === "function") {
    try {
      elements.workspaceTimelineResizer.setPointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture is helpful but not required for the resize interaction.
    }
  }
}

function updateWorkspaceTimelineResize(event) {
  if (!state.workspaceTimelineResize || event.pointerId !== state.workspaceTimelineResize.pointerId) {
    return false;
  }

  const nextHeight = state.workspaceTimelineResize.startHeight
    + (event.clientY - state.workspaceTimelineResize.startY);
  applyWorkspaceStudioHeight(nextHeight);
  return true;
}

function finishWorkspaceTimelineResize(event) {
  if (!state.workspaceTimelineResize) {
    return false;
  }

  if (event?.pointerId != null && event.pointerId !== state.workspaceTimelineResize.pointerId) {
    return false;
  }

  applyWorkspaceStudioHeight(getCurrentWorkspaceStudioHeight(), { persist: true });
  cleanupWorkspaceTimelineResize();
  if (state.project.previewTimer == null) {
    renderSelectedAnimationPreview();
  }
  return true;
}

function cleanupWorkspaceAnimationPaneResize() {
  if (!state.workspacePaneResize) {
    return;
  }

  const pointerId = state.workspacePaneResize.pointerId;
  if (
    elements.workspacePanelResizer
    && typeof elements.workspacePanelResizer.hasPointerCapture === "function"
    && typeof elements.workspacePanelResizer.releasePointerCapture === "function"
  ) {
    try {
      if (elements.workspacePanelResizer.hasPointerCapture(pointerId)) {
        elements.workspacePanelResizer.releasePointerCapture(pointerId);
      }
    } catch (error) {
      // Pointer capture cleanup is optional here, so ignore failures.
    }
  }

  state.workspacePaneResize = null;
  elements.workspacePanel?.classList.remove("is-pane-resizing");
  document.body.classList.remove("workspace-pane-resizing");
}

function cancelActiveStudioResizeInteractions() {
  cleanupStudioSidebarResize();
  cleanupWorkspaceAnimationPaneResize();
  cleanupWorkspaceTimelineResize();
}

function startWorkspaceAnimationPaneResize(event) {
  if (!elements.workspacePanelResizer || window.matchMedia("(max-width: 900px)").matches) {
    return;
  }

  event.preventDefault();
  state.isPointerDown = false;
  state.strokeHasChanges = false;
  state.workspacePaneResize = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startWidth: getCurrentWorkspaceAnimationPaneWidth(),
  };
  elements.workspacePanel?.classList.add("is-pane-resizing");
  document.body.classList.add("workspace-pane-resizing");

  if (typeof elements.workspacePanelResizer.setPointerCapture === "function") {
    try {
      elements.workspacePanelResizer.setPointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture is helpful but not required for the resize interaction.
    }
  }
}

function updateWorkspaceAnimationPaneResize(event) {
  if (!state.workspacePaneResize || event.pointerId !== state.workspacePaneResize.pointerId) {
    return false;
  }

  const nextWidth = state.workspacePaneResize.startWidth
    - (event.clientX - state.workspacePaneResize.startX);
  applyWorkspaceAnimationPaneWidth(nextWidth);
  return true;
}

function finishWorkspaceAnimationPaneResize(event) {
  if (!state.workspacePaneResize) {
    return false;
  }

  if (event?.pointerId != null && event.pointerId !== state.workspacePaneResize.pointerId) {
    return false;
  }

  applyWorkspaceAnimationPaneWidth(getCurrentWorkspaceAnimationPaneWidth(), { persist: true });
  cleanupWorkspaceAnimationPaneResize();
  if (state.project.previewTimer == null) {
    renderSelectedAnimationPreview();
  }
  return true;
}

function updateGridMeta() {
  if (!elements.gridMeta) {
    return;
  }

  const boardCount = Math.max(state.boardLayout.length, 1);
  const groupCount = Math.max(getBoardGroups().length, 1);
  elements.gridMeta.textContent = `${state.width} x ${state.height} - ${boardCount} board${boardCount === 1 ? "" : "s"} - ${groupCount} group${groupCount === 1 ? "" : "s"}`;
}

function createEmptyPixels() {
  return Array(state.width * state.height).fill(0);
}

function getLayoutWidth() {
  return Math.max(1, state.connectedDisplayWidth || state.width);
}

function getLayoutHeight() {
  return Math.max(1, state.connectedDisplayHeight || state.height);
}

function getPanelColumnCount(width = getLayoutWidth()) {
  return Math.max(1, Math.ceil(width / PANEL_SIZE));
}

function getPanelRowCount(height = getLayoutHeight()) {
  return Math.max(1, Math.ceil(height / PANEL_SIZE));
}

function getPanelCount(width = getLayoutWidth(), height = getLayoutHeight()) {
  return getPanelColumnCount(width) * getPanelRowCount(height);
}

function getDefaultPanelOrderLabel(width = getLayoutWidth(), height = getLayoutHeight()) {
  return Array.from({ length: getPanelCount(width, height) }, (_, index) => String(index + 1)).join(", ");
}

function normalizePanelOrder(panelOrder, width = getLayoutWidth(), height = getLayoutHeight()) {
  if (panelOrder == null) {
    return null;
  }
  if (!Array.isArray(panelOrder)) {
    throw new Error("panel_order must be a list or null.");
  }

  const panelCount = getPanelCount(width, height);
  if (panelOrder.length !== panelCount) {
    throw new Error(`panel_order must contain exactly ${panelCount} entries.`);
  }

  const normalized = [];
  const seenIndexes = new Set();
  panelOrder.forEach((value) => {
    if (!Number.isInteger(value)) {
      throw new Error("panel_order entries must be integers.");
    }
    if (value < 0 || value >= panelCount) {
      throw new Error(`panel_order entries must be between 0 and ${panelCount - 1}.`);
    }
    if (seenIndexes.has(value)) {
      throw new Error("panel_order entries must be unique.");
    }

    seenIndexes.add(value);
    normalized.push(value);
  });

  return normalized.every((value, index) => value === index) ? null : normalized;
}

function normalizeLegacyPanelFlips(panelFlips, width = getLayoutWidth(), height = getLayoutHeight()) {
  if (panelFlips == null) {
    return null;
  }
  if (!Array.isArray(panelFlips)) {
    throw new Error("panel_flips must be a list or null.");
  }

  const panelCount = getPanelCount(width, height);
  if (panelFlips.length !== panelCount) {
    throw new Error(`panel_flips must contain exactly ${panelCount} entries.`);
  }

  const normalized = panelFlips.map((value) => {
    if (typeof value !== "boolean") {
      throw new Error("panel_flips entries must be true or false.");
    }
    return value;
  });

  return normalized.some(Boolean) ? normalized : null;
}

function normalizePanelRotations(panelRotations, width = getLayoutWidth(), height = getLayoutHeight()) {
  if (panelRotations == null) {
    return null;
  }
  if (!Array.isArray(panelRotations)) {
    throw new Error("panel_rotations must be a list or null.");
  }

  const panelCount = getPanelCount(width, height);
  if (panelRotations.length !== panelCount) {
    throw new Error(`panel_rotations must contain exactly ${panelCount} entries.`);
  }

  const normalized = panelRotations.map((value) => {
    if (!Number.isInteger(value) || !PANEL_ROTATION_VALUES.includes(value)) {
      throw new Error("panel_rotations entries must be 0, 90, 180, or 270.");
    }
    return value;
  });

  return normalized.some((value) => value !== 0) ? normalized : null;
}

function panelRotationsFromFlips(panelFlips, width = getLayoutWidth(), height = getLayoutHeight()) {
  const normalizedFlips = normalizeLegacyPanelFlips(panelFlips, width, height);
  if (!normalizedFlips) {
    return null;
  }

  return normalizePanelRotations(
    normalizedFlips.map((value) => (value ? 180 : 0)),
    width,
    height,
  );
}

function buildLegacyPanelFlips(panelRotations, width = getLayoutWidth(), height = getLayoutHeight()) {
  const normalizedRotations = normalizePanelRotations(panelRotations, width, height);
  if (!normalizedRotations) {
    return null;
  }
  if (normalizedRotations.some((value) => value !== 0 && value !== 180)) {
    return null;
  }

  return normalizedRotations.map((value) => value === 180);
}

function normalizePanelMirrors(panelMirrors, width = getLayoutWidth(), height = getLayoutHeight()) {
  if (panelMirrors == null) {
    return null;
  }
  if (!Array.isArray(panelMirrors)) {
    throw new Error("panel_mirrors must be a list or null.");
  }

  const panelCount = getPanelCount(width, height);
  if (panelMirrors.length !== panelCount) {
    throw new Error(`panel_mirrors must contain exactly ${panelCount} entries.`);
  }

  const normalized = panelMirrors.map((value) => {
    if (typeof value !== "boolean") {
      throw new Error("panel_mirrors entries must be true or false.");
    }
    return value;
  });

  return normalized.some(Boolean) ? normalized : null;
}

function formatPanelOrder(panelOrder, width = getLayoutWidth(), height = getLayoutHeight()) {
  const normalized = normalizePanelOrder(panelOrder, width, height);
  if (!normalized) {
    return "";
  }

  return normalized.map((value) => String(value + 1)).join(", ");
}

function parsePanelOrderInput(value, width = getLayoutWidth(), height = getLayoutHeight()) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return null;
  }

  const panelCount = getPanelCount(width, height);
  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
  if (tokens.length !== panelCount) {
    throw new Error(`Panel order needs ${panelCount} numbers for a ${width}x${height} display.`);
  }

  const usesZeroBasedIndexes = tokens.some((token) => token === "0");
  const parsedOrder = tokens.map((token) => {
    if (!/^-?\d+$/.test(token)) {
      throw new Error("Panel order must use whole numbers separated by commas or spaces.");
    }

    const rawValue = Number(token);
    const normalizedValue = usesZeroBasedIndexes ? rawValue : rawValue - 1;
    const minimumValue = usesZeroBasedIndexes ? 0 : 1;
    const maximumValue = usesZeroBasedIndexes ? panelCount - 1 : panelCount;
    if (normalizedValue < 0 || normalizedValue >= panelCount) {
      throw new Error(`Panel order entries must be between ${minimumValue} and ${maximumValue}.`);
    }

    return normalizedValue;
  });

  return normalizePanelOrder(parsedOrder, width, height);
}

function syncPanelOrderInput() {
  elements.panelOrderInput.placeholder = getDefaultPanelOrderLabel();
  elements.panelOrderInput.value = formatPanelOrder(state.layout.panelOrder);
}

function setConnectedDisplaySize(width, height) {
  if (Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0) {
    state.connectedDisplayWidth = width;
    state.connectedDisplayHeight = height;
  }
}

function clearConnectedDisplaySize() {
  state.connectedDisplayWidth = null;
  state.connectedDisplayHeight = null;

  try {
    state.layout.panelOrder = normalizePanelOrder(state.layout.panelOrder, state.width, state.height);
  } catch (error) {
    state.layout.panelOrder = null;
  }

  try {
    state.layout.panelRotations = normalizePanelRotations(
      state.layout.panelRotations,
      state.width,
      state.height,
    );
  } catch (error) {
    state.layout.panelRotations = null;
  }

  try {
    state.layout.panelMirrors = normalizePanelMirrors(
      state.layout.panelMirrors,
      state.width,
      state.height,
    );
  } catch (error) {
    state.layout.panelMirrors = null;
  }
}

function resizePixelBuffer(pixels, sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const resizedPixels = Array(targetWidth * targetHeight).fill(0);
  const copyWidth = Math.min(sourceWidth, targetWidth);
  const copyHeight = Math.min(sourceHeight, targetHeight);

  for (let y = 0; y < copyHeight; y += 1) {
    const sourceRowOffset = y * sourceWidth;
    const targetRowOffset = y * targetWidth;

    for (let x = 0; x < copyWidth; x += 1) {
      resizedPixels[targetRowOffset + x] = pixels[sourceRowOffset + x] === 1 ? 1 : 0;
    }
  }

  return resizedPixels;
}

function syncGridToConnectedDisplay(reason) {
  const targetWidth = state.connectedDisplayWidth;
  const targetHeight = state.connectedDisplayHeight;
  if (!Number.isInteger(targetWidth) || targetWidth <= 0 || !Number.isInteger(targetHeight) || targetHeight <= 0) {
    return false;
  }
  if (state.width === targetWidth && state.height === targetHeight) {
    return false;
  }

  syncActiveFrameIntoProject();
  const resizedProject = {
    ...buildCurrentProjectPayload({ includeEditorState: true }),
    width: targetWidth,
    height: targetHeight,
    frames: resizeProjectFrames(state.project.frames, state.width, state.height, targetWidth, targetHeight),
  };

  applyProjectToEditor(resizedProject, reason, { syncFrame: false });
  pushHistorySnapshot(reason);
  log(
    `Synced the editor grid to the Pi display (${state.width}x${state.height}) after ${reason}. `
    + "Preserved overlapping pixels in every frame.",
  );
  return true;
}

function fitFrameToConnectedDisplay(frame) {
  const targetWidth = state.connectedDisplayWidth;
  const targetHeight = state.connectedDisplayHeight;
  if (!Number.isInteger(targetWidth) || targetWidth <= 0 || !Number.isInteger(targetHeight) || targetHeight <= 0) {
    return {
      width: frame.width,
      height: frame.height,
      pixels: [...frame.pixels],
      resized: false,
    };
  }
  if (frame.width === targetWidth && frame.height === targetHeight) {
    return {
      width: frame.width,
      height: frame.height,
      pixels: [...frame.pixels],
      resized: false,
    };
  }

  return {
    width: targetWidth,
    height: targetHeight,
    pixels: resizePixelBuffer(frame.pixels, frame.width, frame.height, targetWidth, targetHeight),
    resized: true,
  };
}

function indexForDimensions(x, y, width) {
  return (y * width) + x;
}

function indexFor(x, y) {
  return indexForDimensions(x, y, state.width);
}

function extractBoardGroupNumber(groupId) {
  const match = /^group-(\d+)$/.exec(String(groupId || "").trim());
  return match ? Number(match[1]) : 1;
}

function compareGroupIds(left, right) {
  return extractBoardGroupNumber(left) - extractBoardGroupNumber(right);
}

function getBoardGroupLabel(groupId) {
  return `Group ${extractBoardGroupNumber(groupId)}`;
}

function getBoardChainLabel(board) {
  return `Chain ${board.chainIndex + 1}`;
}

function getBoardGroups(layout = state.boardLayout, preferredGroups = state.boardGroups) {
  const groups = new Set(preferredGroups || []);
  layout.forEach((board) => {
    groups.add(board.groupId || DEFAULT_BOARD_GROUP_ID);
  });

  if (groups.size === 0) {
    groups.add(DEFAULT_BOARD_GROUP_ID);
  }

  return [...groups].sort(compareGroupIds);
}

function syncBoardGroups(layout = state.boardLayout, preferredGroups = state.boardGroups) {
  state.boardGroups = getBoardGroups(layout, preferredGroups);
  return state.boardGroups;
}

function cloneBoard(board) {
  return {
    id: board.id,
    chainIndex: board.chainIndex,
    logicalGridX: board.logicalGridX,
    logicalGridY: board.logicalGridY,
    visualGridX: board.visualGridX,
    visualGridY: board.visualGridY,
    viewRotation: board.viewRotation,
    viewMirror: board.viewMirror,
    groupId: board.groupId,
    width: board.width,
    height: board.height,
    pixels: [...board.pixels],
  };
}

function cloneBoardLayout(layout = state.boardLayout) {
  return layout.map((board) => cloneBoard(board));
}

function serializeBoardLayout(layout = state.boardLayout) {
  return layout.map((board) => ({
    id: board.id,
    chainIndex: board.chainIndex,
    visualGridX: board.visualGridX,
    visualGridY: board.visualGridY,
    viewRotation: board.viewRotation,
    viewMirror: board.viewMirror,
    groupId: board.groupId,
    width: board.width,
    height: board.height,
  }));
}

function createBoardId(index) {
  return `board-${index + 1}`;
}

function claimBoardId(preferredId, fallbackId, index, usedIds) {
  const candidates = [];
  if (typeof preferredId === "string" && preferredId.trim()) {
    candidates.push(preferredId.trim());
  }
  if (typeof fallbackId === "string" && fallbackId.trim()) {
    candidates.push(fallbackId.trim());
  }

  for (const candidate of candidates) {
    if (!usedIds.has(candidate)) {
      usedIds.add(candidate);
      return candidate;
    }
  }

  let nextIndex = index;
  let candidate = createBoardId(nextIndex);
  while (usedIds.has(candidate)) {
    nextIndex += 1;
    candidate = createBoardId(nextIndex);
  }

  usedIds.add(candidate);
  return candidate;
}

function createBoardPositionKey(x, y) {
  return `${x},${y}`;
}

function claimVisualBoardPosition(preferredX, preferredY, fallbackX, fallbackY, occupiedKeys, fallbackPositions) {
  const candidates = [];
  if (Number.isInteger(preferredX) && preferredX >= 0 && Number.isInteger(preferredY) && preferredY >= 0) {
    candidates.push({ x: preferredX, y: preferredY });
  }
  candidates.push({ x: fallbackX, y: fallbackY });
  fallbackPositions.forEach((position) => {
    candidates.push(position);
  });

  for (const candidate of candidates) {
    const key = createBoardPositionKey(candidate.x, candidate.y);
    if (!occupiedKeys.has(key)) {
      occupiedKeys.add(key);
      return candidate;
    }
  }

  let scanY = 0;
  while (true) {
    for (let scanX = 0; scanX <= occupiedKeys.size; scanX += 1) {
      const key = createBoardPositionKey(scanX, scanY);
      if (!occupiedKeys.has(key)) {
        occupiedKeys.add(key);
        return { x: scanX, y: scanY };
      }
    }
    scanY += 1;
  }
}

function orderPersistedBoardsByChainIndex(persistedBoardLayout, expectedCount) {
  const orderedBoards = Array(expectedCount).fill(null);
  const extras = [];

  persistedBoardLayout.forEach((board, index) => {
    const chainIndex = Number.isInteger(board?.chainIndex) ? board.chainIndex : index;
    if (chainIndex >= 0 && chainIndex < expectedCount && orderedBoards[chainIndex] == null) {
      orderedBoards[chainIndex] = board;
      return;
    }

    extras.push(board);
  });

  for (let index = 0; index < expectedCount; index += 1) {
    if (orderedBoards[index] == null) {
      orderedBoards[index] = extras.shift() || null;
    }
  }

  return orderedBoards;
}

function buildPanelPositions(panelOrder, width = getLayoutWidth(), height = getLayoutHeight()) {
  const normalizedOrder = normalizePanelOrder(panelOrder, width, height);
  if (!normalizedOrder) {
    return null;
  }

  const panelPositions = Array(normalizedOrder.length).fill(0);
  normalizedOrder.forEach((logicalPanelIndex, physicalPanelIndex) => {
    panelPositions[logicalPanelIndex] = physicalPanelIndex;
  });
  return panelPositions;
}

function getPhysicalPanelIndex(logicalPanelIndex, layout = state.layout, width = getLayoutWidth(), height = getLayoutHeight()) {
  const panelPositions = buildPanelPositions(layout.panelOrder, width, height);
  return panelPositions ? panelPositions[logicalPanelIndex] : logicalPanelIndex;
}

function getBoardOutputRotation(board, layout = state.layout) {
  const panelRotations = normalizePanelRotations(layout.panelRotations);
  if (!panelRotations) {
    return 0;
  }
  const physicalPanelIndex = getPhysicalPanelIndex(board.chainIndex, layout);
  return panelRotations[physicalPanelIndex] ?? 0;
}

function normalizeBoardViewRotation(value) {
  return PANEL_ROTATION_VALUES.includes(value) ? value : 0;
}

function normalizeBoardViewMirror(value) {
  return value === true;
}

function formatBoardOutputRotationLabel(rotation) {
  return `LED ${rotation}`;
}

function getBoardOutputMirrored(board, layout = state.layout) {
  const panelMirrors = normalizePanelMirrors(layout.panelMirrors);
  if (!panelMirrors) {
    return false;
  }

  const physicalPanelIndex = getPhysicalPanelIndex(board.chainIndex, layout);
  return panelMirrors[physicalPanelIndex] === true;
}

function formatBoardOutputMirrorLabel(mirrored) {
  return mirrored ? "LED Mir On" : "LED Mir Off";
}

function getBoardViewRotation(board) {
  return normalizeBoardViewRotation(board.viewRotation);
}

function getBoardViewMirrored(board) {
  return normalizeBoardViewMirror(board.viewMirror);
}

function formatBoardViewRotationLabel(rotation) {
  return `View ${rotation}`;
}

function formatBoardViewMirrorLabel(mirrored) {
  return mirrored ? "View Mir On" : "View Mir Off";
}

function getBoardDisplayWidth(board) {
  const rotation = getBoardViewRotation(board);
  return rotation === 90 || rotation === 270 ? board.height : board.width;
}

function getBoardDisplayHeight(board) {
  const rotation = getBoardViewRotation(board);
  return rotation === 90 || rotation === 270 ? board.width : board.height;
}

function mapBoardLogicalToDisplayCoordinates(board, localX, localY) {
  const rotation = getBoardViewRotation(board);
  let displayX = localX;
  let displayY = localY;

  if (rotation === 90) {
    displayX = board.height - 1 - localY;
    displayY = localX;
  } else if (rotation === 180) {
    displayX = board.width - 1 - localX;
    displayY = board.height - 1 - localY;
  } else if (rotation === 270) {
    displayX = localY;
    displayY = board.width - 1 - localX;
  }

  if (getBoardViewMirrored(board)) {
    displayX = getBoardDisplayWidth(board) - 1 - displayX;
  }

  return { x: displayX, y: displayY };
}

function boardOriginX(board) {
  return board.logicalGridX * PANEL_SIZE;
}

function boardOriginY(board) {
  return board.logicalGridY * PANEL_SIZE;
}

function boardVisualLeft(board) {
  return BOARD_WORKSPACE_INSET_X + (board.visualGridX * BOARD_SLOT_PITCH_X);
}

function boardVisualTop(board) {
  return BOARD_WORKSPACE_INSET_Y + (board.visualGridY * BOARD_SLOT_PITCH_Y);
}

function boardOuterWidth(board) {
  const displayWidth = getBoardDisplayWidth(board);
  return (displayWidth * PIXEL_CELL_SIZE)
    + (Math.max(displayWidth - 1, 0) * BOARD_GRID_COLUMN_GAP)
    + (BOARD_CARD_PADDING * 2)
    + (BOARD_CARD_BORDER * 2);
}

function boardOuterHeight(board) {
  const displayHeight = getBoardDisplayHeight(board);
  return BOARD_HEADER_HEIGHT
    + BOARD_LABEL_GAP
    + (displayHeight * PIXEL_CELL_SIZE)
    + (Math.max(displayHeight - 1, 0) * BOARD_GRID_ROW_GAP)
    + (BOARD_CARD_PADDING * 2)
    + (BOARD_CARD_BORDER * 2);
}

function extractBoardPixelsFromFrame(board, frameWidth = state.width, frameHeight = state.height, framePixels = state.pixels) {
  const pixels = [];
  const startX = boardOriginX(board);
  const startY = boardOriginY(board);

  for (let localY = 0; localY < board.height; localY += 1) {
    for (let localX = 0; localX < board.width; localX += 1) {
      const x = startX + localX;
      const y = startY + localY;
      if (x < 0 || x >= frameWidth || y < 0 || y >= frameHeight) {
        pixels.push(0);
      } else {
        pixels.push(framePixels[indexForDimensions(x, y, frameWidth)] ?? 0);
      }
    }
  }

  return pixels;
}

function createBoardLayoutFromFrame(frameWidth = state.width, frameHeight = state.height, framePixels = state.pixels) {
  const boardLayout = [];
  const boardColumns = Math.max(Math.ceil(frameWidth / PANEL_SIZE), 1);
  const boardRows = Math.max(Math.ceil(frameHeight / PANEL_SIZE), 1);

  for (let boardY = 0; boardY < boardRows; boardY += 1) {
    for (let boardX = 0; boardX < boardColumns; boardX += 1) {
      const startX = boardX * PANEL_SIZE;
      const startY = boardY * PANEL_SIZE;
      const width = Math.min(PANEL_SIZE, Math.max(frameWidth - startX, 0));
      const height = Math.min(PANEL_SIZE, Math.max(frameHeight - startY, 0));
      if (width <= 0 || height <= 0) {
        continue;
      }

      const board = {
        id: createBoardId(boardLayout.length),
        chainIndex: boardLayout.length,
        logicalGridX: boardX,
        logicalGridY: boardY,
        visualGridX: boardX,
        visualGridY: boardY,
        viewRotation: 0,
        viewMirror: false,
        groupId: DEFAULT_BOARD_GROUP_ID,
        width,
        height,
        pixels: [],
      };

      board.pixels = extractBoardPixelsFromFrame(board, frameWidth, frameHeight, framePixels);
      boardLayout.push(board);
    }
  }

  return boardLayout;
}

function normalizePersistedBoardWorkspace(frameWidth, frameHeight, framePixels, persistedBoardLayout, persistedBoardGroups) {
  const fallbackLayout = createBoardLayoutFromFrame(frameWidth, frameHeight, framePixels);
  if (!Array.isArray(persistedBoardLayout) || persistedBoardLayout.length === 0) {
    return {
      boardLayout: fallbackLayout,
      boardGroups: getBoardGroups(fallbackLayout, persistedBoardGroups),
    };
  }

  const persistedBoards = orderPersistedBoardsByChainIndex(persistedBoardLayout, fallbackLayout.length);
  const fallbackVisualPositions = fallbackLayout.map((board) => ({
    x: board.visualGridX,
    y: board.visualGridY,
  }));
  const occupiedVisualKeys = new Set();
  const usedIds = new Set();
  const normalizedBoardLayout = fallbackLayout.map((fallbackBoard, index) => {
    const persistedBoard = persistedBoards[index];
    const visualPosition = claimVisualBoardPosition(
      persistedBoard?.visualGridX ?? persistedBoard?.gridX,
      persistedBoard?.visualGridY ?? persistedBoard?.gridY,
      fallbackBoard.visualGridX,
      fallbackBoard.visualGridY,
      occupiedVisualKeys,
      fallbackVisualPositions,
    );
    const board = {
      ...fallbackBoard,
      id: claimBoardId(persistedBoard?.id, fallbackBoard.id, index, usedIds),
      chainIndex: index,
      visualGridX: visualPosition.x,
      visualGridY: visualPosition.y,
      viewRotation: normalizeBoardViewRotation(persistedBoard?.viewRotation),
      viewMirror: normalizeBoardViewMirror(persistedBoard?.viewMirror),
      groupId: typeof persistedBoard?.groupId === "string" && persistedBoard.groupId.trim()
        ? persistedBoard.groupId.trim()
        : DEFAULT_BOARD_GROUP_ID,
    };

    board.pixels = extractBoardPixelsFromFrame(board, frameWidth, frameHeight, framePixels);
    return board;
  });

  return {
    boardLayout: normalizedBoardLayout,
    boardGroups: getBoardGroups(normalizedBoardLayout, persistedBoardGroups),
  };
}

function normalizeLogicalBoardLayoutCoordinates(boardLayout) {
  if (boardLayout.length === 0) {
    return [];
  }

  const minGridX = Math.min(...boardLayout.map((board) => board.logicalGridX));
  const minGridY = Math.min(...boardLayout.map((board) => board.logicalGridY));

  return boardLayout.map((board) => ({
    ...cloneBoard(board),
    logicalGridX: board.logicalGridX - minGridX,
    logicalGridY: board.logicalGridY - minGridY,
  }));
}

function buildFrameFromBoardLayout(boardLayout) {
  const normalizedBoardLayout = normalizeLogicalBoardLayoutCoordinates(boardLayout);
  const frameWidth = Math.max(
    1,
    ...normalizedBoardLayout.map((board) => boardOriginX(board) + board.width),
  );
  const frameHeight = Math.max(
    1,
    ...normalizedBoardLayout.map((board) => boardOriginY(board) + board.height),
  );
  const pixels = Array(frameWidth * frameHeight).fill(0);

  normalizedBoardLayout.forEach((board) => {
    for (let localY = 0; localY < board.height; localY += 1) {
      for (let localX = 0; localX < board.width; localX += 1) {
        const frameX = boardOriginX(board) + localX;
        const frameY = boardOriginY(board) + localY;
        const value = board.pixels[(localY * board.width) + localX] ?? 0;
        pixels[indexForDimensions(frameX, frameY, frameWidth)] = value;
      }
    }
  });

  return {
    width: frameWidth,
    height: frameHeight,
    pixels,
    boardLayout: normalizedBoardLayout,
  };
}

function applyBoardFrame(boardLayout, boardGroups = state.boardGroups) {
  const frame = buildFrameFromBoardLayout(boardLayout);
  state.width = frame.width;
  state.height = frame.height;
  state.pixels = frame.pixels;
  state.boardLayout = frame.boardLayout;
  syncBoardGroups(frame.boardLayout, boardGroups);
  elements.gridWidth.value = String(state.width);
  elements.gridHeight.value = String(state.height);
}

function syncBoardPixelsFromFrame() {
  state.boardLayout = state.boardLayout.map((board) => ({
    ...cloneBoard(board),
    pixels: extractBoardPixelsFromFrame(board),
  }));
}

function setBoardPixelValue(board, x, y, value) {
  const localX = x - boardOriginX(board);
  const localY = y - boardOriginY(board);
  if (localX < 0 || localX >= board.width || localY < 0 || localY >= board.height) {
    return false;
  }

  board.pixels[(localY * board.width) + localX] = value;
  return true;
}

function findBoardByCoordinate(x, y) {
  return state.boardLayout.find((board) => (
    x >= boardOriginX(board)
    && x < boardOriginX(board) + board.width
    && y >= boardOriginY(board)
    && y < boardOriginY(board) + board.height
  )) || null;
}

function boardLayoutMetadataMatches(leftLayout = [], rightLayout = []) {
  if (leftLayout.length !== rightLayout.length) {
    return false;
  }

  return leftLayout.every((leftBoard, index) => {
    const rightBoard = rightLayout[index];
    if (!rightBoard) {
      return false;
    }

    return leftBoard.id === rightBoard.id
      && leftBoard.chainIndex === rightBoard.chainIndex
      && leftBoard.logicalGridX === rightBoard.logicalGridX
      && leftBoard.logicalGridY === rightBoard.logicalGridY
      && leftBoard.visualGridX === rightBoard.visualGridX
      && leftBoard.visualGridY === rightBoard.visualGridY
      && getBoardViewRotation(leftBoard) === getBoardViewRotation(rightBoard)
      && getBoardViewMirrored(leftBoard) === getBoardViewMirrored(rightBoard)
      && leftBoard.groupId === rightBoard.groupId
      && leftBoard.width === rightBoard.width
      && leftBoard.height === rightBoard.height
      && leftBoard.pixels.length === rightBoard.pixels.length
      && leftBoard.pixels.every((value, pixelIndex) => value === rightBoard.pixels[pixelIndex]);
  });
}

function setPixelInArray(pixels, x, y, value = 1) {
  if (x < 0 || x >= state.width || y < 0 || y >= state.height) {
    return;
  }

  pixels[indexFor(x, y)] = value;
}

function createMovedBoardLayout(boardId, visualGridX, visualGridY) {
  const nextLayout = cloneBoardLayout();
  const board = nextLayout.find((entry) => entry.id === boardId);
  if (!board) {
    return nextLayout;
  }

  board.visualGridX = visualGridX;
  board.visualGridY = visualGridY;
  return nextLayout;
}

function boardKey(board) {
  return `${board.visualGridX},${board.visualGridY}`;
}

function boardLayoutsOverlap(boardLayout) {
  const occupied = new Set();

  for (const board of boardLayout) {
    const key = boardKey(board);
    if (occupied.has(key)) {
      return true;
    }
    occupied.add(key);
  }

  return false;
}

function validateBoardLayout(boardLayout) {
  if (boardLayoutsOverlap(boardLayout)) {
    return {
      valid: false,
      reason: "Boards cannot overlap. Drop the panel in an empty slot.",
    };
  }

  return {
    valid: true,
    reason: "",
  };
}

function getRenderedBoardLayout() {
  if (!state.boardDrag) {
    return cloneBoardLayout();
  }

  return createMovedBoardLayout(
    state.boardDrag.boardId,
    state.boardDrag.candidateGridX,
    state.boardDrag.candidateGridY,
  );
}

function calculateWorkspaceSize(boardLayout) {
  if (boardLayout.length === 0) {
    return {
      width: BOARD_WORKSPACE_INSET_X + BOARD_SLOT_WIDTH + GROUP_SHELL_SIDE_PADDING,
      height: BOARD_WORKSPACE_INSET_Y + BOARD_SLOT_HEIGHT + GROUP_SHELL_BOTTOM_PADDING,
    };
  }

  const width = Math.max(
    BOARD_WORKSPACE_INSET_X + BOARD_SLOT_WIDTH + GROUP_SHELL_SIDE_PADDING,
    ...boardLayout.map((board) => boardVisualLeft(board) + boardOuterWidth(board) + GROUP_SHELL_SIDE_PADDING),
  );
  const height = Math.max(
    BOARD_WORKSPACE_INSET_Y + BOARD_SLOT_HEIGHT + GROUP_SHELL_BOTTOM_PADDING,
    ...boardLayout.map((board) => boardVisualTop(board) + boardOuterHeight(board) + GROUP_SHELL_BOTTOM_PADDING),
  );

  return { width, height };
}

function getCurrentBoardWorkspaceScale() {
  return Number.isFinite(state.boardWorkspaceScale) && state.boardWorkspaceScale > 0
    ? state.boardWorkspaceScale
    : 1;
}

function getPixelGridContentBoxSize() {
  if (!elements.grid) {
    return { width: 0, height: 0 };
  }

  const styles = window.getComputedStyle(elements.grid);
  const horizontalPadding = (Number.parseFloat(styles.paddingLeft) || 0)
    + (Number.parseFloat(styles.paddingRight) || 0);
  const verticalPadding = (Number.parseFloat(styles.paddingTop) || 0)
    + (Number.parseFloat(styles.paddingBottom) || 0);

  return {
    width: Math.max(elements.grid.clientWidth - horizontalPadding, 0),
    height: Math.max(elements.grid.clientHeight - verticalPadding, 0),
  };
}

function calculateGridWorkspaceScale(workspaceWidth, workspaceHeight, availableSize = getPixelGridContentBoxSize()) {
  if (availableSize.width <= 0 || availableSize.height <= 0) {
    return 1;
  }

  const nextScale = Math.min(
    1,
    availableSize.width / workspaceWidth,
    availableSize.height / workspaceHeight,
  );

  return Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1;
}

function updateGridWorkspaceScale() {
  const stage = elements.grid?.querySelector(".pixel-grid-stage");
  const workspace = stage?.querySelector(".pixel-grid-workspace");

  if (!stage || !workspace || !elements.grid) {
    state.boardWorkspaceScale = 1;
    return 1;
  }

  const workspaceWidth = Number.parseFloat(workspace.dataset.workspaceWidth || workspace.style.width);
  const workspaceHeight = Number.parseFloat(workspace.dataset.workspaceHeight || workspace.style.height);
  if (!Number.isFinite(workspaceWidth) || !Number.isFinite(workspaceHeight) || workspaceWidth <= 0 || workspaceHeight <= 0) {
    state.boardWorkspaceScale = 1;
    return 1;
  }

  const availableSize = getPixelGridContentBoxSize();
  if (availableSize.width <= 0 || availableSize.height <= 0) {
    state.boardWorkspaceScale = 1;
    state.boardWorkspaceViewportWidth = availableSize.width;
    state.boardWorkspaceViewportHeight = availableSize.height;
    return 1;
  }

  const fitScale = calculateGridWorkspaceScale(workspaceWidth, workspaceHeight, availableSize);
  const lockedScale = state.boardDrag?.workspaceScale;
  const previousScale = getCurrentBoardWorkspaceScale();
  const viewportChanged = !Number.isFinite(state.boardWorkspaceViewportWidth)
    || !Number.isFinite(state.boardWorkspaceViewportHeight)
    || Math.abs(availableSize.width - state.boardWorkspaceViewportWidth) > 0.5
    || Math.abs(availableSize.height - state.boardWorkspaceViewportHeight) > 0.5;
  const safeScale = Number.isFinite(lockedScale) && lockedScale > 0
    ? Math.min(lockedScale, 1)
    : (
      viewportChanged
      || !Number.isFinite(previousScale)
      || previousScale <= 0
        ? fitScale
        : previousScale
    );
  stage.style.width = `${Math.max(1, Math.round(workspaceWidth * safeScale))}px`;
  stage.style.height = `${Math.max(1, Math.round(workspaceHeight * safeScale))}px`;
  workspace.style.transform = safeScale < 0.999 ? `scale(${safeScale})` : "";
  workspace.dataset.workspaceScale = String(safeScale);
  state.boardWorkspaceScale = safeScale;
  state.boardWorkspaceViewportWidth = availableSize.width;
  state.boardWorkspaceViewportHeight = availableSize.height;
  elements.grid.scrollTop = 0;
  elements.grid.scrollLeft = 0;
  return safeScale;
}

function scheduleGridWorkspaceScaleUpdate() {
  if (state.boardDrag) {
    if (state.boardWorkspaceScaleFrame != null) {
      window.cancelAnimationFrame(state.boardWorkspaceScaleFrame);
      state.boardWorkspaceScaleFrame = null;
    }
    return;
  }

  if (state.boardWorkspaceScaleFrame != null) {
    window.cancelAnimationFrame(state.boardWorkspaceScaleFrame);
  }

  state.boardWorkspaceScaleFrame = window.requestAnimationFrame(() => {
    state.boardWorkspaceScaleFrame = null;
    updateGridWorkspaceScale();
  });
}

function initializeGridWorkspaceObserver() {
  if (!elements.grid || typeof ResizeObserver !== "function" || state.boardWorkspaceResizeObserver) {
    return;
  }

  state.boardWorkspaceResizeObserver = new ResizeObserver(() => {
    scheduleGridWorkspaceScaleUpdate();
  });
  state.boardWorkspaceResizeObserver.observe(elements.grid);
}

function startBoardDrag(boardId, event) {
  if (event.button !== 0) {
    return;
  }

  const board = state.boardLayout.find((entry) => entry.id === boardId);
  if (!board) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  cancelActiveStudioResizeInteractions();
  state.isPointerDown = false;

  state.boardDrag = {
    boardId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    originGridX: board.visualGridX,
    originGridY: board.visualGridY,
    workspaceScale: getCurrentBoardWorkspaceScale(),
    candidateGridX: board.visualGridX,
    candidateGridY: board.visualGridY,
    hasMoved: false,
    isValid: true,
    invalidReason: "",
  };

  renderGrid();
}

function updateBoardDrag(event) {
  if (!state.boardDrag) {
    return;
  }

  const workspaceScale = Math.max(state.boardDrag.workspaceScale || 1, 0.0001);
  const nextGridX = Math.max(
    0,
    state.boardDrag.originGridX + Math.round((event.clientX - state.boardDrag.startClientX) / (BOARD_SLOT_PITCH_X * workspaceScale)),
  );
  const nextGridY = Math.max(
    0,
    state.boardDrag.originGridY + Math.round((event.clientY - state.boardDrag.startClientY) / (BOARD_SLOT_PITCH_Y * workspaceScale)),
  );

  if (nextGridX === state.boardDrag.candidateGridX && nextGridY === state.boardDrag.candidateGridY) {
    return;
  }

  const previewLayout = createMovedBoardLayout(state.boardDrag.boardId, nextGridX, nextGridY);
  const validation = validateBoardLayout(previewLayout);
  state.boardDrag = {
    ...state.boardDrag,
    candidateGridX: nextGridX,
    candidateGridY: nextGridY,
    hasMoved: nextGridX !== state.boardDrag.originGridX || nextGridY !== state.boardDrag.originGridY,
    isValid: validation.valid,
    invalidReason: validation.reason,
  };

  renderGrid();
}

function finishBoardDrag() {
  if (!state.boardDrag) {
    return false;
  }

  const dragState = state.boardDrag;
  state.boardDrag = null;

  if (!dragState.hasMoved) {
    renderGrid();
    return true;
  }

  const nextLayout = createMovedBoardLayout(
    dragState.boardId,
    dragState.candidateGridX,
    dragState.candidateGridY,
  );
  const validation = validateBoardLayout(nextLayout);

  if (!validation.valid) {
    renderGrid();
    log(validation.reason);
    return true;
  }

  if (boardLayoutMetadataMatches(state.boardLayout, nextLayout)) {
    renderGrid();
    return true;
  }

  state.boardLayout = nextLayout;
  syncBoardGroups(nextLayout);
  renderGrid();
  saveAutosave();
  pushHistorySnapshot("board layout move");
  log("Updated the visual board layout.");
  return true;
}

function createCell(x, y, value) {
  const cell = document.createElement("button");
  cell.type = "button";
  cell.className = value === 1 ? "pixel-cell on" : "pixel-cell";
  cell.dataset.x = String(x);
  cell.dataset.y = String(y);
  cell.setAttribute("aria-label", `Pixel ${x}, ${y}`);

  cell.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    cancelActiveStudioResizeInteractions();
    const value = event.button === 2 ? 0 : state.drawValue;
    state.isPointerDown = true;
    applyCellValue(x, y, value);
  });

  cell.addEventListener("pointerenter", () => {
    if (!state.isPointerDown) {
      return;
    }
    applyCellValue(x, y, state.drawValue);
  });

  cell.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    applyCellValue(x, y, 0);
  });

  return cell;
}

function createGroupShell(groupId, boards) {
  const shell = document.createElement("div");
  const label = document.createElement("div");
  const left = Math.min(...boards.map((board) => boardVisualLeft(board))) - GROUP_SHELL_SIDE_PADDING;
  const top = Math.min(...boards.map((board) => boardVisualTop(board))) - GROUP_SHELL_TOP_PADDING;
  const right = Math.max(...boards.map((board) => boardVisualLeft(board) + boardOuterWidth(board))) + GROUP_SHELL_SIDE_PADDING;
  const bottom = Math.max(...boards.map((board) => boardVisualTop(board) + boardOuterHeight(board))) + GROUP_SHELL_BOTTOM_PADDING;

  shell.className = "pixel-board-group";
  shell.style.left = `${left}px`;
  shell.style.top = `${top}px`;
  shell.style.width = `${Math.max(right - left, boardOuterWidth(boards[0]) + (GROUP_SHELL_SIDE_PADDING * 2))}px`;
  shell.style.height = `${Math.max(bottom - top, boardOuterHeight(boards[0]) + GROUP_SHELL_TOP_PADDING + GROUP_SHELL_BOTTOM_PADDING)}px`;

  label.className = "pixel-board-group-label";
  label.textContent = getBoardGroupLabel(groupId);

  shell.appendChild(label);
  return shell;
}

function assignBoardToGroup(boardId, nextGroupId) {
  const nextLayout = cloneBoardLayout();
  const board = nextLayout.find((entry) => entry.id === boardId);
  if (!board || !nextGroupId) {
    return;
  }

  board.groupId = nextGroupId;
  state.boardLayout = nextLayout;
  syncBoardGroups(nextLayout, [...state.boardGroups, nextGroupId]);
  renderGrid();
  saveAutosave();
  pushHistorySnapshot("board group change");
  log(`Assigned ${getBoardChainLabel(board)} to ${getBoardGroupLabel(nextGroupId)}.`);
}

function cycleBoardOutputRotation(boardId) {
  const board = state.boardLayout.find((entry) => entry.id === boardId);
  if (!board) {
    return;
  }

  const panelCount = getPanelCount();
  const currentPanelRotations = normalizePanelRotations(state.layout.panelRotations) || Array(panelCount).fill(0);
  const physicalPanelIndex = getPhysicalPanelIndex(board.chainIndex);
  const currentRotation = currentPanelRotations[physicalPanelIndex] ?? 0;
  const currentRotationIndex = PANEL_ROTATION_VALUES.indexOf(currentRotation);
  const nextRotation = PANEL_ROTATION_VALUES[(currentRotationIndex + 1) % PANEL_ROTATION_VALUES.length];
  currentPanelRotations[physicalPanelIndex] = nextRotation;

  applyLayoutState({
    ...state.layout,
    panelRotations: normalizePanelRotations(currentPanelRotations),
  });
  renderGrid();

  const sent = sendMessage(buildLayoutMessage());
  if (sent) {
    sendMessage(buildFrameMessage());
    log(`Set output rotation for ${getBoardChainLabel(board)} on physical panel ${physicalPanelIndex + 1} to ${nextRotation} degrees and re-sent the current frame.`);
    return;
  }

  log(`Set output rotation for ${getBoardChainLabel(board)} on physical panel ${physicalPanelIndex + 1} to ${nextRotation} degrees locally. Connect to send it to the Pi.`);
}

function toggleBoardOutputMirror(boardId) {
  const board = state.boardLayout.find((entry) => entry.id === boardId);
  if (!board) {
    return;
  }

  const panelCount = getPanelCount();
  const currentPanelMirrors = normalizePanelMirrors(state.layout.panelMirrors) || Array(panelCount).fill(false);
  const physicalPanelIndex = getPhysicalPanelIndex(board.chainIndex);
  const nextMirrorValue = !currentPanelMirrors[physicalPanelIndex];
  currentPanelMirrors[physicalPanelIndex] = nextMirrorValue;

  applyLayoutState({
    ...state.layout,
    panelMirrors: normalizePanelMirrors(currentPanelMirrors),
  });
  renderGrid();

  const sent = sendMessage(buildLayoutMessage());
  if (sent) {
    sendMessage(buildFrameMessage());
    log(`Turned ${nextMirrorValue ? "on" : "off"} output mirror for ${getBoardChainLabel(board)} on physical panel ${physicalPanelIndex + 1} and re-sent the current frame.`);
    return;
  }

  log(`Turned ${nextMirrorValue ? "on" : "off"} output mirror for ${getBoardChainLabel(board)} on physical panel ${physicalPanelIndex + 1} locally. Connect to send it to the Pi.`);
}

function cycleBoardViewRotation(boardId) {
  const nextLayout = cloneBoardLayout();
  const board = nextLayout.find((entry) => entry.id === boardId);
  if (!board) {
    return;
  }

  const currentRotation = getBoardViewRotation(board);
  const currentRotationIndex = PANEL_ROTATION_VALUES.indexOf(currentRotation);
  board.viewRotation = PANEL_ROTATION_VALUES[(currentRotationIndex + 1) % PANEL_ROTATION_VALUES.length];
  state.boardLayout = nextLayout;
  renderGrid();
  saveAutosave();
  pushHistorySnapshot("board website rotation");
  log(`Set website view rotation for ${getBoardChainLabel(board)} to ${board.viewRotation} degrees.`);
}

function toggleBoardViewMirror(boardId) {
  const nextLayout = cloneBoardLayout();
  const board = nextLayout.find((entry) => entry.id === boardId);
  if (!board) {
    return;
  }

  board.viewMirror = !getBoardViewMirrored(board);
  state.boardLayout = nextLayout;
  renderGrid();
  saveAutosave();
  pushHistorySnapshot("board website mirror");
  log(`Turned ${board.viewMirror ? "on" : "off"} website view mirror for ${getBoardChainLabel(board)}.`);
}

function createNewBoardGroup() {
  const highestGroupNumber = Math.max(...getBoardGroups().map((groupId) => extractBoardGroupNumber(groupId)));
  const nextGroupId = `group-${highestGroupNumber + 1}`;
  state.boardGroups = getBoardGroups(state.boardLayout, [...state.boardGroups, nextGroupId]);
  renderGrid();
  saveAutosave();
  pushHistorySnapshot("board group creation");
  log(`Created ${getBoardGroupLabel(nextGroupId)}.`);
}

function createBoard(boardData) {
  const board = document.createElement("section");
  const boardHeader = document.createElement("div");
  const boardLabel = document.createElement("button");
  const groupSelect = document.createElement("select");
  const rotationButton = document.createElement("button");
  const mirrorButton = document.createElement("button");
  const viewRotationButton = document.createElement("button");
  const viewMirrorButton = document.createElement("button");
  const boardGrid = document.createElement("div");
  const dragState = state.boardDrag && state.boardDrag.boardId === boardData.id ? state.boardDrag : null;
  const physicalPanelIndex = getPhysicalPanelIndex(boardData.chainIndex);
  const outputRotation = getBoardOutputRotation(boardData);
  const outputMirrored = getBoardOutputMirrored(boardData);
  const viewRotation = getBoardViewRotation(boardData);
  const viewMirrored = getBoardViewMirrored(boardData);
  const displayWidth = getBoardDisplayWidth(boardData);
  const displayHeight = getBoardDisplayHeight(boardData);

  board.className = "pixel-board";
  board.setAttribute("aria-label", getBoardChainLabel(boardData));
  board.dataset.boardId = boardData.id;
  board.style.left = `${boardVisualLeft(boardData)}px`;
  board.style.top = `${boardVisualTop(boardData)}px`;
  board.style.width = `${boardOuterWidth(boardData)}px`;
  board.style.height = `${boardOuterHeight(boardData)}px`;
  board.classList.toggle("dragging", Boolean(dragState));
  board.classList.toggle("drag-valid", Boolean(dragState && dragState.hasMoved && dragState.isValid));
  board.classList.toggle("drag-invalid", Boolean(dragState && dragState.hasMoved && !dragState.isValid));

  boardHeader.className = "pixel-board-header";
  boardHeader.style.minHeight = `${BOARD_HEADER_HEIGHT}px`;

  boardLabel.type = "button";
  boardLabel.className = "pixel-board-label";
  boardLabel.textContent = getBoardChainLabel(boardData);
  boardLabel.setAttribute("aria-label", `Drag ${getBoardChainLabel(boardData)}`);
  boardLabel.addEventListener("pointerdown", (event) => {
    startBoardDrag(boardData.id, event);
  });

  groupSelect.className = "pixel-board-group-select";
  groupSelect.setAttribute("aria-label", `${getBoardChainLabel(boardData)} group`);
  getBoardGroups().forEach((groupId) => {
    const option = document.createElement("option");
    option.value = groupId;
    option.textContent = getBoardGroupLabel(groupId);
    groupSelect.appendChild(option);
  });
  groupSelect.value = boardData.groupId || DEFAULT_BOARD_GROUP_ID;
  groupSelect.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  groupSelect.addEventListener("change", () => {
    assignBoardToGroup(boardData.id, groupSelect.value);
  });

  rotationButton.type = "button";
  rotationButton.className = "pixel-board-rotation-button";
  rotationButton.classList.toggle("active", outputRotation !== 0);
  rotationButton.textContent = formatBoardOutputRotationLabel(outputRotation);
  rotationButton.setAttribute("aria-pressed", outputRotation !== 0 ? "true" : "false");
  rotationButton.setAttribute(
    "aria-label",
    `${getBoardChainLabel(boardData)} maps to physical panel ${physicalPanelIndex + 1} and currently uses ${outputRotation} degrees of LED output rotation. Click to cycle 0, 90, 180, and 270 degrees.`,
  );
  rotationButton.title = `Cycle physical panel ${physicalPanelIndex + 1} through 0, 90, 180, and 270 degrees on the LED hardware while keeping the editor preview upright.`;
  rotationButton.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  rotationButton.addEventListener("click", () => {
    cycleBoardOutputRotation(boardData.id);
  });

  mirrorButton.type = "button";
  mirrorButton.className = "pixel-board-mirror-button";
  mirrorButton.classList.toggle("active", outputMirrored);
  mirrorButton.textContent = formatBoardOutputMirrorLabel(outputMirrored);
  mirrorButton.setAttribute("aria-pressed", outputMirrored ? "true" : "false");
  mirrorButton.setAttribute(
    "aria-label",
    `${getBoardChainLabel(boardData)} maps to physical panel ${physicalPanelIndex + 1} and currently has ${outputMirrored ? "horizontal mirroring enabled" : "horizontal mirroring disabled"}. Click to toggle hardware mirroring.`,
  );
  mirrorButton.title = `Toggle horizontal mirroring for physical panel ${physicalPanelIndex + 1} on the LED hardware while keeping the editor preview upright.`;
  mirrorButton.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  mirrorButton.addEventListener("click", () => {
    toggleBoardOutputMirror(boardData.id);
  });

  viewRotationButton.type = "button";
  viewRotationButton.className = "pixel-board-view-rotation-button";
  viewRotationButton.classList.toggle("active", viewRotation !== 0);
  viewRotationButton.textContent = formatBoardViewRotationLabel(viewRotation);
  viewRotationButton.setAttribute("aria-pressed", viewRotation !== 0 ? "true" : "false");
  viewRotationButton.setAttribute(
    "aria-label",
    `${getBoardChainLabel(boardData)} currently uses ${viewRotation} degrees of website-only view rotation. Click to cycle 0, 90, 180, and 270 degrees without changing the LED hardware output.`,
  );
  viewRotationButton.title = "Cycle how this board is shown on the website only.";
  viewRotationButton.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  viewRotationButton.addEventListener("click", () => {
    cycleBoardViewRotation(boardData.id);
  });

  viewMirrorButton.type = "button";
  viewMirrorButton.className = "pixel-board-view-mirror-button";
  viewMirrorButton.classList.toggle("active", viewMirrored);
  viewMirrorButton.textContent = formatBoardViewMirrorLabel(viewMirrored);
  viewMirrorButton.setAttribute("aria-pressed", viewMirrored ? "true" : "false");
  viewMirrorButton.setAttribute(
    "aria-label",
    `${getBoardChainLabel(boardData)} currently has ${viewMirrored ? "website-only mirroring enabled" : "website-only mirroring disabled"}. Click to toggle how this board is shown in the editor without changing the LED hardware output.`,
  );
  viewMirrorButton.title = "Toggle how this board is mirrored on the website only.";
  viewMirrorButton.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  viewMirrorButton.addEventListener("click", () => {
    toggleBoardViewMirror(boardData.id);
  });

  boardHeader.appendChild(boardLabel);
  boardHeader.appendChild(groupSelect);
  boardHeader.appendChild(rotationButton);
  boardHeader.appendChild(mirrorButton);
  boardHeader.appendChild(viewRotationButton);
  boardHeader.appendChild(viewMirrorButton);

  boardGrid.className = "pixel-board-grid";
  boardGrid.style.gridTemplateColumns = `repeat(${displayWidth}, ${PIXEL_CELL_SIZE}px)`;
  boardGrid.style.gridTemplateRows = `repeat(${displayHeight}, ${PIXEL_CELL_SIZE}px)`;

  const displayCells = Array(displayWidth * displayHeight);
  for (let localY = 0; localY < boardData.height; localY += 1) {
    for (let localX = 0; localX < boardData.width; localX += 1) {
      const displayCoordinates = mapBoardLogicalToDisplayCoordinates(boardData, localX, localY);
      const x = boardOriginX(boardData) + localX;
      const y = boardOriginY(boardData) + localY;
      const value = boardData.pixels[(localY * boardData.width) + localX] ?? 0;
      const displayIndex = indexForDimensions(displayCoordinates.x, displayCoordinates.y, displayWidth);
      displayCells[displayIndex] = createCell(x, y, value);
    }
  }
  displayCells.forEach((cell) => {
    if (cell) {
      boardGrid.appendChild(cell);
    }
  });

  board.appendChild(boardHeader);
  board.appendChild(boardGrid);
  return board;
}

function renderGrid() {
  elements.grid.innerHTML = "";
  const boardLayout = getRenderedBoardLayout()
    .sort((left, right) => (left.visualGridY - right.visualGridY) || (left.visualGridX - right.visualGridX) || left.chainIndex - right.chainIndex);
  const stage = document.createElement("div");
  const workspace = document.createElement("div");
  const workspaceSize = calculateWorkspaceSize(boardLayout);
  const boardsByGroup = new Map();

  stage.className = "pixel-grid-stage";
  workspace.className = "pixel-grid-workspace";
  workspace.dataset.workspaceWidth = String(workspaceSize.width);
  workspace.dataset.workspaceHeight = String(workspaceSize.height);
  workspace.style.width = `${workspaceSize.width}px`;
  workspace.style.height = `${workspaceSize.height}px`;

  boardLayout.forEach((board) => {
    const groupId = board.groupId || DEFAULT_BOARD_GROUP_ID;
    const groupedBoards = boardsByGroup.get(groupId) || [];
    groupedBoards.push(board);
    boardsByGroup.set(groupId, groupedBoards);
  });

  getBoardGroups(boardLayout).forEach((groupId) => {
    const groupedBoards = boardsByGroup.get(groupId) || [];
    if (groupedBoards.length > 0) {
      workspace.appendChild(createGroupShell(groupId, groupedBoards));
    }
  });

  boardLayout.forEach((board) => {
    workspace.appendChild(createBoard(board));
  });

  stage.appendChild(workspace);
  elements.grid.appendChild(stage);
  updateGridWorkspaceScale();
  scheduleGridWorkspaceScaleUpdate();
  updateGridMeta();

  if (state.project.previewTimer == null) {
    renderSelectedAnimationPreview();
  }
}

function createAnimationPreviewMetrics(cellSize) {
  const gridGap = cellSize <= 6 ? 1 : 2;
  const cardPadding = cellSize <= 6 ? 6 : 8;
  const labelHeight = cellSize <= 6 ? 16 : 18;
  const labelGap = 6;
  const cardBorder = 1;
  const workspaceGap = cellSize <= 6 ? 10 : 12;
  const workspaceInsetX = 12;
  const workspaceInsetY = 18;
  const groupSidePadding = cellSize <= 6 ? 8 : 10;
  const groupTopPadding = cellSize <= 6 ? 16 : 18;
  const groupBottomPadding = cellSize <= 6 ? 8 : 10;
  const slotWidth = (PANEL_SIZE * cellSize)
    + ((PANEL_SIZE - 1) * gridGap)
    + (cardPadding * 2)
    + (cardBorder * 2);
  const slotHeight = labelHeight
    + labelGap
    + (PANEL_SIZE * cellSize)
    + ((PANEL_SIZE - 1) * gridGap)
    + (cardPadding * 2)
    + (cardBorder * 2);

  return {
    cellSize,
    gridGap,
    cardPadding,
    labelHeight,
    labelGap,
    cardBorder,
    workspaceGap,
    workspaceInsetX,
    workspaceInsetY,
    groupSidePadding,
    groupTopPadding,
    groupBottomPadding,
    slotWidth,
    slotHeight,
    slotPitchX: slotWidth + workspaceGap,
    slotPitchY: slotHeight + workspaceGap,
  };
}

function animationPreviewBoardLeft(board, metrics) {
  return metrics.workspaceInsetX + (board.visualGridX * metrics.slotPitchX);
}

function animationPreviewBoardTop(board, metrics) {
  return metrics.workspaceInsetY + (board.visualGridY * metrics.slotPitchY);
}

function animationPreviewBoardOuterWidth(board, metrics) {
  const displayWidth = getBoardDisplayWidth(board);
  return (displayWidth * metrics.cellSize)
    + (Math.max(displayWidth - 1, 0) * metrics.gridGap)
    + (metrics.cardPadding * 2)
    + (metrics.cardBorder * 2);
}

function animationPreviewBoardOuterHeight(board, metrics) {
  const displayHeight = getBoardDisplayHeight(board);
  return metrics.labelHeight
    + metrics.labelGap
    + (displayHeight * metrics.cellSize)
    + (Math.max(displayHeight - 1, 0) * metrics.gridGap)
    + (metrics.cardPadding * 2)
    + (metrics.cardBorder * 2);
}

function calculateAnimationPreviewWorkspaceSize(boardLayout, metrics) {
  if (boardLayout.length === 0) {
    return {
      width: metrics.workspaceInsetX + metrics.slotWidth + metrics.groupSidePadding,
      height: metrics.workspaceInsetY + metrics.slotHeight + metrics.groupBottomPadding,
    };
  }

  const width = Math.max(
    metrics.workspaceInsetX + metrics.slotWidth + metrics.groupSidePadding,
    ...boardLayout.map((board) => (
      animationPreviewBoardLeft(board, metrics)
      + animationPreviewBoardOuterWidth(board, metrics)
      + metrics.groupSidePadding
    )),
  );
  const height = Math.max(
    metrics.workspaceInsetY + metrics.slotHeight + metrics.groupBottomPadding,
    ...boardLayout.map((board) => (
      animationPreviewBoardTop(board, metrics)
      + animationPreviewBoardOuterHeight(board, metrics)
      + metrics.groupBottomPadding
    )),
  );

  return { width, height };
}

function getAnimationPreviewBoardLayout(pixels, width = state.width, height = state.height) {
  const safeWidth = Math.max(Number(width) || 0, 1);
  const safeHeight = Math.max(Number(height) || 0, 1);
  const fallbackPixels = Array.isArray(pixels) ? pixels : Array(safeWidth * safeHeight).fill(0);
  const baseLayout = getRenderedBoardLayout();
  const layout = baseLayout.length > 0
    ? baseLayout
    : createBoardLayoutFromFrame(safeWidth, safeHeight, fallbackPixels);

  return layout
    .map((board) => ({
      ...cloneBoard(board),
      pixels: extractBoardPixelsFromFrame(board, safeWidth, safeHeight, fallbackPixels),
    }))
    .sort((left, right) => (left.visualGridY - right.visualGridY) || (left.visualGridX - right.visualGridX) || left.chainIndex - right.chainIndex);
}

function selectAnimationPreviewMetrics(boardLayout) {
  const preferredCellSizes = [12, 10, 8, 6, 5];
  const availableWidth = Math.max(
    240,
    (elements.animationPreviewGrid.parentElement?.clientWidth ?? 0) - 8,
  );
  let fallbackMetrics = createAnimationPreviewMetrics(preferredCellSizes[preferredCellSizes.length - 1]);

  for (const cellSize of preferredCellSizes) {
    const metrics = createAnimationPreviewMetrics(cellSize);
    const workspaceSize = calculateAnimationPreviewWorkspaceSize(boardLayout, metrics);
    fallbackMetrics = metrics;
    if (workspaceSize.width <= availableWidth) {
      return metrics;
    }
  }

  return fallbackMetrics;
}

function createAnimationPreviewGroupShell(groupId, boards, metrics) {
  const shell = document.createElement("div");
  const label = document.createElement("div");
  const left = Math.min(...boards.map((board) => animationPreviewBoardLeft(board, metrics))) - metrics.groupSidePadding;
  const top = Math.min(...boards.map((board) => animationPreviewBoardTop(board, metrics))) - metrics.groupTopPadding;
  const right = Math.max(...boards.map((board) => (
    animationPreviewBoardLeft(board, metrics) + animationPreviewBoardOuterWidth(board, metrics)
  ))) + metrics.groupSidePadding;
  const bottom = Math.max(...boards.map((board) => (
    animationPreviewBoardTop(board, metrics) + animationPreviewBoardOuterHeight(board, metrics)
  ))) + metrics.groupBottomPadding;

  shell.className = "animation-preview-group";
  shell.style.left = `${left}px`;
  shell.style.top = `${top}px`;
  shell.style.width = `${Math.max(right - left, animationPreviewBoardOuterWidth(boards[0], metrics) + (metrics.groupSidePadding * 2))}px`;
  shell.style.height = `${Math.max(bottom - top, animationPreviewBoardOuterHeight(boards[0], metrics) + metrics.groupTopPadding + metrics.groupBottomPadding)}px`;

  label.className = "animation-preview-group-label";
  label.textContent = getBoardGroupLabel(groupId);
  shell.appendChild(label);
  return shell;
}

function createAnimationPreviewCell(value) {
  const cell = document.createElement("div");
  cell.className = value === 1 ? "animation-preview-board-cell on" : "animation-preview-board-cell";
  return cell;
}

function createAnimationPreviewBoard(board, metrics) {
  const boardElement = document.createElement("section");
  const label = document.createElement("div");
  const boardGrid = document.createElement("div");
  const displayWidth = getBoardDisplayWidth(board);
  const displayHeight = getBoardDisplayHeight(board);
  const displayCells = Array(displayWidth * displayHeight);

  boardElement.className = "animation-preview-board";
  boardElement.setAttribute("aria-label", `${getBoardChainLabel(board)} preview`);
  boardElement.style.left = `${animationPreviewBoardLeft(board, metrics)}px`;
  boardElement.style.top = `${animationPreviewBoardTop(board, metrics)}px`;
  boardElement.style.width = `${animationPreviewBoardOuterWidth(board, metrics)}px`;
  boardElement.style.height = `${animationPreviewBoardOuterHeight(board, metrics)}px`;
  boardElement.style.padding = `${metrics.cardPadding}px`;

  label.className = "animation-preview-board-label";
  label.textContent = getBoardChainLabel(board);
  label.style.minHeight = `${metrics.labelHeight}px`;

  boardGrid.className = "animation-preview-board-grid";
  boardGrid.style.setProperty("--preview-cell-size", `${metrics.cellSize}px`);
  boardGrid.style.gridTemplateColumns = `repeat(${displayWidth}, ${metrics.cellSize}px)`;
  boardGrid.style.gridTemplateRows = `repeat(${displayHeight}, ${metrics.cellSize}px)`;
  boardGrid.style.columnGap = `${metrics.gridGap}px`;
  boardGrid.style.rowGap = `${metrics.gridGap}px`;

  for (let localY = 0; localY < board.height; localY += 1) {
    for (let localX = 0; localX < board.width; localX += 1) {
      const displayCoordinates = mapBoardLogicalToDisplayCoordinates(board, localX, localY);
      const displayIndex = indexForDimensions(displayCoordinates.x, displayCoordinates.y, displayWidth);
      const value = board.pixels[(localY * board.width) + localX] ?? 0;
      displayCells[displayIndex] = createAnimationPreviewCell(value);
    }
  }

  displayCells.forEach((cell) => {
    boardGrid.appendChild(cell || createAnimationPreviewCell(0));
  });

  boardElement.appendChild(label);
  boardElement.appendChild(boardGrid);
  return boardElement;
}

function renderAnimationPreviewFrame(pixels, width = state.width, height = state.height) {
  const boardLayout = getAnimationPreviewBoardLayout(pixels, width, height);
  const metrics = selectAnimationPreviewMetrics(boardLayout);
  const workspaceSize = calculateAnimationPreviewWorkspaceSize(boardLayout, metrics);
  const workspace = document.createElement("div");
  const boardsByGroup = new Map();

  elements.animationPreviewGrid.innerHTML = "";
  elements.animationPreviewGrid.style.width = `${workspaceSize.width}px`;
  elements.animationPreviewGrid.style.minHeight = `${workspaceSize.height}px`;

  workspace.className = "animation-preview-workspace";
  workspace.style.width = `${workspaceSize.width}px`;
  workspace.style.height = `${workspaceSize.height}px`;

  boardLayout.forEach((board) => {
    const groupId = board.groupId || DEFAULT_BOARD_GROUP_ID;
    const groupedBoards = boardsByGroup.get(groupId) || [];
    groupedBoards.push(board);
    boardsByGroup.set(groupId, groupedBoards);
  });

  getBoardGroups(boardLayout).forEach((groupId) => {
    const groupedBoards = boardsByGroup.get(groupId) || [];
    if (groupedBoards.length > 0) {
      workspace.appendChild(createAnimationPreviewGroupShell(groupId, groupedBoards, metrics));
    }
  });

  boardLayout.forEach((board) => {
    workspace.appendChild(createAnimationPreviewBoard(board, metrics));
  });

  elements.animationPreviewGrid.appendChild(workspace);
}

function renderSelectedAnimationPreview(statusMessage = null) {
  const frames = getProjectFramesSnapshot();
  const framesById = new Map(frames.map((frame) => [frame.id, frame]));
  const activeAnimation = getProjectAnimation();
  const activeFrame = getProjectFrame(state.project.activeFrameId, frames) || frames[0] || null;
  const previewFrame = activeAnimation?.steps?.[0]
    ? framesById.get(activeAnimation.steps[0].frameId) || activeFrame
    : activeFrame;

  renderAnimationPreviewFrame(previewFrame?.pixels || Array(state.width * state.height).fill(0));

  if (statusMessage) {
    elements.animationPreviewStatus.textContent = statusMessage;
    return;
  }

  if (activeAnimation) {
    elements.animationPreviewStatus.textContent = `Ready to preview clip "${activeAnimation.name}".`;
    return;
  }

  elements.animationPreviewStatus.textContent = "Select or create a clip to preview timing.";
}

function updateAnimationTimelinePlaybackState() {
  const activeAnimation = getProjectAnimation();
  const selectedStepIndex = getSelectedAnimationStepIndex(activeAnimation);
  const playingStepIndex = activeAnimation && state.project.previewAnimationId === activeAnimation.id
    ? state.project.previewStepIndex
    : -1;

  elements.animationStepList.querySelectorAll("[data-step-block='true']").forEach((block) => {
    const stepIndex = Number(block.dataset.stepIndex);
    if (!Number.isInteger(stepIndex)) {
      return;
    }

    block.classList.toggle("is-selected", stepIndex === selectedStepIndex);
    block.classList.toggle("is-playing", stepIndex === playingStepIndex);

    const statusBadge = block.querySelector("[data-step-status='true']");
    if (!statusBadge) {
      return;
    }

    if (stepIndex === playingStepIndex) {
      statusBadge.hidden = false;
      statusBadge.classList.add("playing");
      statusBadge.textContent = "Playing";
      return;
    }

    if (stepIndex === selectedStepIndex) {
      statusBadge.hidden = false;
      statusBadge.classList.remove("playing");
      statusBadge.textContent = "Selected";
      return;
    }

    statusBadge.hidden = true;
    statusBadge.classList.remove("playing");
  });
}

function stopAnimationPreview(options = {}) {
  const { logStop = false, statusMessage = null } = options;
  const wasRunning = state.project.previewTimer != null;

  if (state.project.previewTimer != null) {
    window.clearTimeout(state.project.previewTimer);
  }

  state.project.previewTimer = null;
  state.project.previewAnimationId = null;
  state.project.previewStepIndex = 0;

  if (wasRunning && logStop) {
    log("Stopped animation preview.");
  }

  renderSelectedAnimationPreview(statusMessage);
  updateProjectEditorControls();
  updateAnimationTimelinePlaybackState();
}

function scheduleAnimationPreviewStep(animation, framesById, stepIndex) {
  const step = animation.steps[stepIndex];
  const frame = step ? framesById.get(step.frameId) : null;
  if (!step || !frame) {
    stopAnimationPreview({
      statusMessage: `Could not preview clip "${animation.name}" because one of its steps is missing a frame.`,
    });
    return;
  }

  state.project.previewAnimationId = animation.id;
  state.project.previewStepIndex = stepIndex;
  renderAnimationPreviewFrame(frame.pixels);
  elements.animationPreviewStatus.textContent = `Previewing clip "${animation.name}" step ${stepIndex + 1} of ${animation.steps.length}.`;
  updateAnimationTimelinePlaybackState();

  state.project.previewTimer = window.setTimeout(() => {
    const nextStepIndex = stepIndex + 1;
    if (nextStepIndex < animation.steps.length) {
      scheduleAnimationPreviewStep(animation, framesById, nextStepIndex);
      return;
    }

    if (animation.loop) {
      scheduleAnimationPreviewStep(animation, framesById, 0);
      return;
    }

    state.project.previewTimer = null;
    state.project.previewAnimationId = null;
    state.project.previewStepIndex = 0;
    renderSelectedAnimationPreview(`Previewed clip "${animation.name}" once.`);
    updateProjectEditorControls();
    updateAnimationTimelinePlaybackState();
  }, step.durationMs);
}

function startAnimationPreview() {
  const animation = getProjectAnimation();
  if (!animation) {
    log("Select or create a clip first.");
    return;
  }

  stopAnimationPreview();

  const frames = getProjectFramesSnapshot();
  const framesById = new Map(frames.map((frame) => [frame.id, frame]));
  scheduleAnimationPreviewStep(animation, framesById, 0);
  renderProjectEditor();
  log(`Started previewing clip "${animation.name}".`);
}

function getDefaultTargetValue() {
  if (state.project.defaultAnimationId) {
    return `animation:${state.project.defaultAnimationId}`;
  }
  if (state.project.defaultFrameId) {
    return `frame:${state.project.defaultFrameId}`;
  }
  return DEFAULT_TARGET_AUTO_VALUE;
}

function updateProjectSummary() {
  const frameCount = state.project.frames.length;
  const animationCount = state.project.animations.length;
  const activeFrame = getProjectFrame();
  let defaultLabel = "Auto choose first clip or frame";

  if (state.project.defaultAnimationId) {
    const defaultAnimation = getProjectAnimation(state.project.defaultAnimationId);
    defaultLabel = defaultAnimation ? `Default clip: ${defaultAnimation.name}` : defaultLabel;
  } else if (state.project.defaultFrameId) {
    const defaultFrame = getProjectFrame(state.project.defaultFrameId, getProjectFramesSnapshot());
    defaultLabel = defaultFrame ? `Default frame: ${defaultFrame.name}` : defaultLabel;
  }

  elements.projectSummary.textContent = `${frameCount} frame${frameCount === 1 ? "" : "s"}, `
    + `${animationCount} clip${animationCount === 1 ? "" : "s"}. `
    + `Editing "${activeFrame?.name || DEFAULT_FRAME_NAME}". ${defaultLabel}.`;
}

function renderFrameStrip() {
  elements.frameStrip.innerHTML = "";

  state.project.frames.forEach((frame, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `frame-chip${frame.id === state.project.activeFrameId ? " active" : ""}`;
    button.dataset.frameId = frame.id;
    button.textContent = `${index + 1}. ${frame.name}`;
    elements.frameStrip.appendChild(button);
  });
}

function syncDefaultTargetOptions() {
  const previousValue = getDefaultTargetValue();
  elements.defaultTargetSelect.innerHTML = "";

  const autoOption = document.createElement("option");
  autoOption.value = DEFAULT_TARGET_AUTO_VALUE;
  autoOption.textContent = "Auto choose first clip or frame";
  elements.defaultTargetSelect.appendChild(autoOption);

  state.project.frames.forEach((frame) => {
    const option = document.createElement("option");
    option.value = `frame:${frame.id}`;
    option.textContent = `Frame: ${frame.name}`;
    elements.defaultTargetSelect.appendChild(option);
  });

  state.project.animations.forEach((animation) => {
    const option = document.createElement("option");
    option.value = `animation:${animation.id}`;
    option.textContent = `Clip: ${animation.name}`;
    elements.defaultTargetSelect.appendChild(option);
  });

  elements.defaultTargetSelect.value = previousValue;
}

function syncAnimationOptions() {
  const previousValue = state.project.activeAnimationId || "";
  elements.animationSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "No clip selected";
  elements.animationSelect.appendChild(placeholder);

  state.project.animations.forEach((animation) => {
    const option = document.createElement("option");
    option.value = animation.id;
    option.textContent = animation.name;
    elements.animationSelect.appendChild(option);
  });

  elements.animationSelect.value = previousValue;
}

function formatTimelineDuration(durationMs) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return "0 ms";
  }

  if (durationMs >= 1000) {
    const seconds = durationMs / 1000;
    return Number.isInteger(seconds) ? `${seconds} s` : `${seconds.toFixed(1)} s`;
  }

  return `${durationMs} ms`;
}

function formatTimelineRange(startMs, endMs) {
  return `${formatTimelineDuration(startMs)} to ${formatTimelineDuration(endMs)}`;
}

function buildAnimationTimelineMetrics(steps = []) {
  const totalDurationMs = steps.reduce((sum, step) => sum + step.durationMs, 0);
  const baseTimelineWidth = Math.max(540, steps.length * 150);
  let elapsedMs = 0;

  const stepLayouts = steps.map((step) => {
    const startMs = elapsedMs;
    const endMs = startMs + step.durationMs;
    const proportionalWidth = totalDurationMs > 0
      ? Math.round((step.durationMs / totalDurationMs) * baseTimelineWidth)
      : 0;

    elapsedMs = endMs;

    return {
      startMs,
      endMs,
      width: Math.max(120, Math.min(320, proportionalWidth)),
    };
  });

  return {
    totalDurationMs,
    stepLayouts,
  };
}

function countAnimationStepFrameUsage(frameId) {
  return state.project.animations.reduce((count, animation) => (
    count + animation.steps.filter((step) => step.frameId === frameId).length
  ), 0);
}

function getSelectedAnimationStepIndex(animation = getProjectAnimation()) {
  if (!animation || !Array.isArray(animation.steps) || animation.steps.length === 0) {
    return -1;
  }

  const rawIndex = Number.isInteger(state.project.selectedStepIndex)
    ? state.project.selectedStepIndex
    : 0;

  return Math.max(0, Math.min(animation.steps.length - 1, rawIndex));
}

function createAnimationTimelineBadge(label, value) {
  const badge = document.createElement("div");
  badge.className = "animation-timeline-badge";

  const labelElement = document.createElement("span");
  labelElement.className = "animation-timeline-badge-label";
  labelElement.textContent = label;

  const valueElement = document.createElement("span");
  valueElement.className = "animation-timeline-badge-value";
  valueElement.textContent = value;

  badge.appendChild(labelElement);
  badge.appendChild(valueElement);
  return badge;
}

function createAnimationInsertButton(insertIndex) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "animation-step-insert secondary";
  button.dataset.stepAction = "insert-at";
  button.dataset.insertIndex = String(insertIndex);
  button.textContent = "+";
  button.title = "Insert the current frame here";
  button.setAttribute("aria-label", `Insert current frame at position ${insertIndex + 1}`);
  return button;
}

function renderAnimationStepList() {
  elements.animationStepList.innerHTML = "";
  const activeAnimation = getProjectAnimation();

  if (!activeAnimation) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "animation-step-empty";

    const emptyTitle = document.createElement("strong");
    emptyTitle.textContent = "No clip selected yet.";

    const emptyCopy = document.createElement("p");
    emptyCopy.textContent = "Create a clip from the current frame, then build timing visually by selecting blocks and inserting frames where the motion should change.";

    const emptyActions = document.createElement("div");
    emptyActions.className = "animation-step-empty-actions";

    const newClipButton = document.createElement("button");
    newClipButton.type = "button";
    newClipButton.className = "secondary";
    newClipButton.dataset.stepAction = "new-animation";
    newClipButton.textContent = "New Clip From Current Frame";
    emptyActions.appendChild(newClipButton);

    const emptyHint = document.createElement("span");
    emptyHint.className = "animation-step-empty-hint";
    emptyHint.textContent = `A new clip starts with one ${formatTimelineDuration(DEFAULT_ANIMATION_STEP_DURATION_MS)} block.`;

    emptyMessage.appendChild(emptyTitle);
    emptyMessage.appendChild(emptyCopy);
    emptyMessage.appendChild(emptyActions);
    emptyMessage.appendChild(emptyHint);
    elements.animationStepList.appendChild(emptyMessage);
    return;
  }

  const metrics = buildAnimationTimelineMetrics(activeAnimation.steps);
  const framesById = new Map(state.project.frames.map((frame) => [frame.id, frame]));
  const selectedStepIndex = getSelectedAnimationStepIndex(activeAnimation);
  const selectedStep = activeAnimation.steps[selectedStepIndex];
  const selectedFrame = framesById.get(selectedStep?.frameId) || null;
  const selectedLayout = metrics.stepLayouts[selectedStepIndex] || null;
  const playingStepIndex = state.project.previewAnimationId === activeAnimation.id
    ? state.project.previewStepIndex
    : -1;

  const shell = document.createElement("div");
  shell.className = "animation-timeline-shell";

  const summary = document.createElement("div");
  summary.className = "animation-timeline-summary";

  const summaryHeading = document.createElement("div");
  summaryHeading.className = "animation-timeline-summary-heading";

  const summaryTitle = document.createElement("div");
  summaryTitle.className = "animation-timeline-summary-title";

  const summaryEyebrow = document.createElement("span");
  summaryEyebrow.className = "animation-timeline-eyebrow";
  summaryEyebrow.textContent = "Clip Timeline";

  const summaryName = document.createElement("h4");
  summaryName.textContent = activeAnimation.name;

  const summaryCopy = document.createElement("p");
  summaryCopy.textContent = `${activeAnimation.loop !== false ? "Looping clip." : "One-shot clip."} `
    + "Click a block to load that frame into the canvas, then tune timing below.";

  summaryTitle.appendChild(summaryEyebrow);
  summaryTitle.appendChild(summaryName);
  summaryTitle.appendChild(summaryCopy);

  const summaryBadges = document.createElement("div");
  summaryBadges.className = "animation-timeline-badges";
  summaryBadges.appendChild(createAnimationTimelineBadge("Steps", String(activeAnimation.steps.length)));
  summaryBadges.appendChild(createAnimationTimelineBadge("Total", formatTimelineDuration(metrics.totalDurationMs)));
  summaryBadges.appendChild(createAnimationTimelineBadge("Loop", activeAnimation.loop !== false ? "On" : "Off"));
  summaryBadges.appendChild(createAnimationTimelineBadge("Selected", `Step ${selectedStepIndex + 1}`));

  summaryHeading.appendChild(summaryTitle);
  summaryHeading.appendChild(summaryBadges);
  summary.appendChild(summaryHeading);
  shell.appendChild(summary);

  const trackWrap = document.createElement("div");
  trackWrap.className = "animation-timeline-track-wrap";

  const track = document.createElement("div");
  track.className = "animation-timeline-track";
  track.appendChild(createAnimationInsertButton(0));

  activeAnimation.steps.forEach((step, index) => {
    const frame = framesById.get(step.frameId);
    const frameUsageCount = countAnimationStepFrameUsage(step.frameId);
    const layout = metrics.stepLayouts[index];
    const stepButton = document.createElement("button");
    stepButton.type = "button";
    stepButton.className = "animation-step-block";
    stepButton.dataset.stepAction = "select";
    stepButton.dataset.stepIndex = String(index);
    stepButton.dataset.stepBlock = "true";
    stepButton.style.width = `${layout.width}px`;
    stepButton.title = `Load "${frame?.name || "Missing frame"}" into the editor`;

    if (index === selectedStepIndex) {
      stepButton.classList.add("is-selected");
    }
    if (index === playingStepIndex) {
      stepButton.classList.add("is-playing");
    }

    const stepTop = document.createElement("div");
    stepTop.className = "animation-step-block-top";

    const stepBadge = document.createElement("span");
    stepBadge.className = "animation-step-badge";
    stepBadge.textContent = `Step ${index + 1}`;
    stepTop.appendChild(stepBadge);

    const statusBadge = document.createElement("span");
    statusBadge.className = `animation-step-status${index === playingStepIndex ? " playing" : ""}`;
    statusBadge.dataset.stepStatus = "true";
    statusBadge.hidden = index !== playingStepIndex && index !== selectedStepIndex;
    statusBadge.textContent = index === playingStepIndex ? "Playing" : "Selected";
    stepTop.appendChild(statusBadge);

    const stepFrame = document.createElement("div");
    stepFrame.className = "animation-step-frame";
    stepFrame.textContent = frame?.name || "Missing frame";

    const stepSubtle = document.createElement("div");
    stepSubtle.className = "animation-step-subtle";
    stepSubtle.textContent = frame
      ? `${frameUsageCount} clip step${frameUsageCount === 1 ? "" : "s"} use this frame`
      : "This block points to a frame that no longer exists.";

    const stepMeta = document.createElement("div");
    stepMeta.className = "animation-step-meta";

    const stepDuration = document.createElement("span");
    stepDuration.className = "animation-step-duration";
    stepDuration.textContent = formatTimelineDuration(step.durationMs);

    const stepRange = document.createElement("span");
    stepRange.className = "animation-step-range";
    stepRange.textContent = formatTimelineRange(layout.startMs, layout.endMs);

    stepMeta.appendChild(stepDuration);
    stepMeta.appendChild(stepRange);

    stepButton.appendChild(stepTop);
    stepButton.appendChild(stepFrame);
    stepButton.appendChild(stepSubtle);
    stepButton.appendChild(stepMeta);
    track.appendChild(stepButton);
    track.appendChild(createAnimationInsertButton(index + 1));
  });

  trackWrap.appendChild(track);
  shell.appendChild(trackWrap);

  if (!selectedStep || !selectedLayout) {
    elements.animationStepList.appendChild(shell);
    return;
  }

  const inspector = document.createElement("div");
  inspector.className = "animation-step-detail";
  inspector.dataset.stepIndex = String(selectedStepIndex);

  const inspectorHeader = document.createElement("div");
  inspectorHeader.className = "animation-step-detail-header";

  const inspectorTitle = document.createElement("div");
  inspectorTitle.className = "animation-step-detail-title";

  const inspectorHeading = document.createElement("h4");
  inspectorHeading.textContent = `Selected Step ${selectedStepIndex + 1}`;

  const inspectorCopy = document.createElement("p");
  inspectorCopy.textContent = `This block uses "${selectedFrame?.name || "Missing frame"}" `
    + `from ${formatTimelineDuration(selectedLayout.startMs)} to ${formatTimelineDuration(selectedLayout.endMs)}.`;

  inspectorTitle.appendChild(inspectorHeading);
  inspectorTitle.appendChild(inspectorCopy);

  const inspectorBadges = document.createElement("div");
  inspectorBadges.className = "animation-timeline-badges";
  inspectorBadges.appendChild(createAnimationTimelineBadge("Start", formatTimelineDuration(selectedLayout.startMs)));
  inspectorBadges.appendChild(createAnimationTimelineBadge("End", formatTimelineDuration(selectedLayout.endMs)));
  inspectorBadges.appendChild(createAnimationTimelineBadge("Uses", String(countAnimationStepFrameUsage(selectedStep.frameId))));

  inspectorHeader.appendChild(inspectorTitle);
  inspectorHeader.appendChild(inspectorBadges);
  inspector.appendChild(inspectorHeader);

  const inspectorGrid = document.createElement("div");
  inspectorGrid.className = "animation-step-detail-grid";

  const frameField = document.createElement("label");
  frameField.className = "field";

  const frameLabel = document.createElement("span");
  frameLabel.textContent = "Frame";

  const frameSelect = document.createElement("select");
  frameSelect.dataset.stepField = "frame";

  state.project.frames.forEach((frame) => {
    const option = document.createElement("option");
    option.value = frame.id;
    option.textContent = frame.name;
    frameSelect.appendChild(option);
  });

  frameSelect.value = selectedStep.frameId;
  frameField.appendChild(frameLabel);
  frameField.appendChild(frameSelect);

  const durationStack = document.createElement("div");
  durationStack.className = "animation-step-field-stack";

  const durationField = document.createElement("label");
  durationField.className = "field";

  const durationLabel = document.createElement("span");
  durationLabel.textContent = "Duration (ms)";

  const durationInput = document.createElement("input");
  durationInput.type = "number";
  durationInput.min = String(MIN_ANIMATION_STEP_DURATION_MS);
  durationInput.max = String(MAX_ANIMATION_STEP_DURATION_MS);
  durationInput.step = "10";
  durationInput.value = String(selectedStep.durationMs);
  durationInput.dataset.stepField = "duration";

  durationField.appendChild(durationLabel);
  durationField.appendChild(durationInput);
  durationStack.appendChild(durationField);

  const presetRow = document.createElement("div");
  presetRow.className = "animation-step-preset-row";
  [80, 120, 200, 320].forEach((durationMs) => {
    const presetButton = document.createElement("button");
    presetButton.type = "button";
    presetButton.className = "animation-step-preset secondary";
    presetButton.dataset.stepAction = "duration-preset";
    presetButton.dataset.durationMs = String(durationMs);
    presetButton.textContent = `${durationMs} ms`;
    if (selectedStep.durationMs === durationMs) {
      presetButton.classList.add("is-active");
    }
    presetRow.appendChild(presetButton);
  });
  durationStack.appendChild(presetRow);

  inspectorGrid.appendChild(frameField);
  inspectorGrid.appendChild(durationStack);
  inspector.appendChild(inspectorGrid);

  const actions = document.createElement("div");
  actions.className = "animation-step-detail-actions";

  const insertBeforeButton = document.createElement("button");
  insertBeforeButton.type = "button";
  insertBeforeButton.className = "secondary";
  insertBeforeButton.dataset.stepAction = "insert-before";
  insertBeforeButton.textContent = "Insert Before";
  actions.appendChild(insertBeforeButton);

  const insertAfterButton = document.createElement("button");
  insertAfterButton.type = "button";
  insertAfterButton.className = "secondary";
  insertAfterButton.dataset.stepAction = "insert-after";
  insertAfterButton.textContent = "Insert After";
  actions.appendChild(insertAfterButton);

  const loadFrameButton = document.createElement("button");
  loadFrameButton.type = "button";
  loadFrameButton.className = "secondary";
  loadFrameButton.dataset.stepAction = "focus-frame";
  loadFrameButton.textContent = "Load Step Frame";
  loadFrameButton.disabled = selectedStep.frameId === state.project.activeFrameId;
  actions.appendChild(loadFrameButton);

  const moveUpButton = document.createElement("button");
  moveUpButton.type = "button";
  moveUpButton.className = "secondary";
  moveUpButton.dataset.stepAction = "move-up";
  moveUpButton.textContent = "Move Earlier";
  moveUpButton.disabled = selectedStepIndex === 0;
  actions.appendChild(moveUpButton);

  const moveDownButton = document.createElement("button");
  moveDownButton.type = "button";
  moveDownButton.className = "secondary";
  moveDownButton.dataset.stepAction = "move-down";
  moveDownButton.textContent = "Move Later";
  moveDownButton.disabled = selectedStepIndex >= activeAnimation.steps.length - 1;
  actions.appendChild(moveDownButton);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "secondary";
  deleteButton.dataset.stepAction = "delete";
  deleteButton.textContent = "Delete Step";
  deleteButton.disabled = activeAnimation.steps.length <= 1;
  actions.appendChild(deleteButton);

  inspector.appendChild(actions);
  shell.appendChild(inspector);
  elements.animationStepList.appendChild(shell);
}

function updateProjectEditorControls() {
  const activeFrameIndex = getProjectFrameIndex();
  const activeFrame = getProjectFrame();
  const activeAnimation = getProjectAnimation();

  elements.frameName.disabled = !activeFrame;
  elements.deleteFrameButton.disabled = state.project.frames.length <= 1;
  elements.moveFrameLeftButton.disabled = activeFrameIndex <= 0;
  elements.moveFrameRightButton.disabled = activeFrameIndex < 0 || activeFrameIndex >= state.project.frames.length - 1;
  elements.defaultTargetSelect.disabled = state.project.frames.length === 0;
  elements.deleteAnimationButton.disabled = !activeAnimation;
  elements.animationName.disabled = !activeAnimation;
  elements.animationLoopInput.disabled = !activeAnimation;
  elements.addAnimationStepButton.disabled = !activeAnimation;
  elements.previewAnimationButton.disabled = !activeAnimation || state.project.previewTimer != null;
  elements.stopAnimationPreviewButton.disabled = state.project.previewTimer == null;
}

function renderProjectEditor() {
  normalizeProjectState();
  updateProjectSummary();
  renderFrameStrip();
  syncDefaultTargetOptions();
  syncAnimationOptions();
  renderAnimationStepList();
  updateProjectEditorControls();

  const activeFrame = getProjectFrame();
  elements.frameName.value = activeFrame?.name || DEFAULT_FRAME_NAME;

  const activeAnimation = getProjectAnimation();
  elements.animationName.value = activeAnimation?.name || "";
  elements.animationLoopInput.checked = activeAnimation?.loop !== false;

  const frameCount = state.project.frames.length;
  const animationCount = state.project.animations.length;
  const hasProjectSave = frameCount > 1 || animationCount > 0;
  elements.saveButton.textContent = hasProjectSave ? "Save Project JSON" : "Save Drawing JSON";
  elements.loadButton.textContent = "Load JSON";
  elements.saveWorkflowStatus.textContent = hasProjectSave
    ? `Saving here exports the full project with ${frameCount} frame${frameCount === 1 ? "" : "s"} and `
      + `${animationCount} clip${animationCount === 1 ? "" : "s"} as one JSON file.`
    : "Saving here exports a single drawing JSON. Add more frames or clips and it will switch to a full project save.";
  elements.projectDeployStatus.textContent = animationCount > 0
    ? `Save Project To Pi uploads all ${frameCount} frames and ${animationCount} clip${animationCount === 1 ? "" : "s"} together. Then choose that project below to run it or set it as boot.`
    : frameCount > 1
      ? `Save Project To Pi uploads all ${frameCount} frames together as one project. Then choose that project below to run it or set it as boot.`
      : "Save Project To Pi uploads the current one-frame project. Choose it below to run it or set it as boot.";

  if (state.project.previewTimer == null) {
    renderSelectedAnimationPreview();
  }
}

function selectProjectFrame(frameId, reason = "frame switch") {
  const nextFrame = getProjectFrame(frameId, state.project.frames);
  if (!nextFrame || nextFrame.id === state.project.activeFrameId) {
    return;
  }

  stopPatternPlayback(`for ${reason}`);
  syncActiveFrameIntoProject();
  state.project.activeFrameId = nextFrame.id;
  state.pixels = [...nextFrame.pixels];
  syncBoardPixelsFromFrame();
  syncGridDom();
  renderProjectEditor();
  saveAutosave();
  scheduleFrameSend(reason, { immediate: true, logSend: false });
}

function selectProjectAnimation(animationId) {
  if (!animationId) {
    state.project.activeAnimationId = null;
    state.project.selectedStepIndex = null;
    stopAnimationPreview();
    renderProjectEditor();
    saveAutosave();
    return;
  }

  const animation = getProjectAnimation(animationId, state.project.animations);
  if (!animation) {
    return;
  }

  state.project.activeAnimationId = animation.id;
  state.project.selectedStepIndex = 0;
  stopAnimationPreview();
  renderProjectEditor();
  saveAutosave();
}

function selectAnimationStep(index, options = {}) {
  const animation = getProjectAnimation();
  const step = animation?.steps?.[index];
  if (!step) {
    return;
  }

  state.project.selectedStepIndex = index;

  if (options.stopPreview !== false && state.project.previewTimer != null) {
    stopAnimationPreview({
      statusMessage: "Preview stopped while you edited the clip timeline.",
    });
  }

  if (options.syncFrame === false || step.frameId === state.project.activeFrameId) {
    renderProjectEditor();
    saveAutosave();
    return;
  }

  selectProjectFrame(step.frameId, options.reason || "clip timeline selection");
}

function addProjectFrame() {
  stopAnimationPreview();
  syncActiveFrameIntoProject();

  const existingIds = new Set(state.project.frames.map((frame) => frame.id));
  const nextFrameName = `Frame ${state.project.frames.length + 1}`;
  const frame = {
    id: createUniqueProjectEntityId(existingIds, nextFrameName, "frame"),
    name: nextFrameName,
    pixels: Array(state.width * state.height).fill(0),
  };
  const activeFrameIndex = Math.max(getProjectFrameIndex(), 0);
  const nextFrames = [...state.project.frames];
  nextFrames.splice(activeFrameIndex + 1, 0, frame);
  state.project.frames = nextFrames;
  state.project.activeFrameId = frame.id;
  state.pixels = [...frame.pixels];
  syncBoardPixelsFromFrame();
  syncGridDom();
  renderProjectEditor();
  pushHistorySnapshot("new frame");
  log(`Added frame "${frame.name}".`);
}

function duplicateProjectFrame() {
  const activeFrame = getProjectFrame();
  if (!activeFrame) {
    return;
  }

  stopAnimationPreview();
  syncActiveFrameIntoProject();

  const existingIds = new Set(state.project.frames.map((frame) => frame.id));
  const copy = {
    id: createUniqueProjectEntityId(existingIds, `${activeFrame.name} copy`, "frame"),
    name: sanitizeProjectEntityLabel(`${activeFrame.name} Copy`, DEFAULT_FRAME_NAME),
    pixels: [...state.pixels],
  };
  const activeFrameIndex = Math.max(getProjectFrameIndex(), 0);
  const nextFrames = [...state.project.frames];
  nextFrames.splice(activeFrameIndex + 1, 0, copy);
  state.project.frames = nextFrames;
  state.project.activeFrameId = copy.id;
  state.pixels = [...copy.pixels];
  syncBoardPixelsFromFrame();
  syncGridDom();
  renderProjectEditor();
  pushHistorySnapshot("frame duplicate");
  log(`Duplicated frame "${activeFrame.name}" as "${copy.name}".`);
}

function deleteProjectFrame() {
  if (state.project.frames.length <= 1) {
    log("Projects need at least one frame.");
    return;
  }

  stopAnimationPreview();
  syncActiveFrameIntoProject();

  const activeFrameIndex = getProjectFrameIndex();
  const [deletedFrame] = state.project.frames.splice(activeFrameIndex, 1);
  const nextFrame = state.project.frames[Math.min(activeFrameIndex, state.project.frames.length - 1)];
  state.project.animations = state.project.animations
    .map((animation) => ({
      ...cloneProjectAnimation(animation),
      steps: animation.steps.filter((step) => step.frameId !== deletedFrame.id),
    }))
    .filter((animation) => animation.steps.length > 0);
  state.project.activeFrameId = nextFrame.id;
  state.project.activeAnimationId = getProjectAnimation(state.project.activeAnimationId, state.project.animations)?.id || state.project.animations[0]?.id || null;
  if (state.project.defaultFrameId === deletedFrame.id) {
    state.project.defaultFrameId = nextFrame.id;
  }
  if (!getProjectAnimation(state.project.defaultAnimationId, state.project.animations)) {
    state.project.defaultAnimationId = null;
  }
  state.pixels = [...nextFrame.pixels];
  syncBoardPixelsFromFrame();
  syncGridDom();
  renderProjectEditor();
  pushHistorySnapshot("frame delete");
  log(`Deleted frame "${deletedFrame.name}".`);
}

function moveProjectFrame(direction) {
  const activeFrameIndex = getProjectFrameIndex();
  const targetIndex = activeFrameIndex + direction;
  if (activeFrameIndex < 0 || targetIndex < 0 || targetIndex >= state.project.frames.length) {
    return;
  }

  syncActiveFrameIntoProject();

  const nextFrames = [...state.project.frames];
  const [movedFrame] = nextFrames.splice(activeFrameIndex, 1);
  nextFrames.splice(targetIndex, 0, movedFrame);
  state.project.frames = nextFrames;
  renderProjectEditor();
  pushHistorySnapshot(direction < 0 ? "frame move left" : "frame move right");
}

function renameActiveFrame() {
  const activeFrameIndex = getProjectFrameIndex();
  if (activeFrameIndex < 0) {
    return;
  }

  const nextName = sanitizeProjectEntityLabel(elements.frameName.value, DEFAULT_FRAME_NAME);
  if (state.project.frames[activeFrameIndex].name === nextName) {
    elements.frameName.value = nextName;
    return;
  }

  state.project.frames[activeFrameIndex] = {
    ...state.project.frames[activeFrameIndex],
    name: nextName,
  };
  renderProjectEditor();
  pushHistorySnapshot("frame rename");
}

function createProjectAnimation() {
  const activeFrame = getProjectFrame();
  if (!activeFrame) {
    return;
  }

  stopAnimationPreview();
  syncActiveFrameIntoProject();

  const existingIds = new Set(state.project.animations.map((animation) => animation.id));
  const nextAnimationName = `Clip ${state.project.animations.length + 1}`;
  const animation = {
    id: createUniqueProjectEntityId(existingIds, nextAnimationName, "animation"),
    name: nextAnimationName,
    loop: true,
    steps: [
      {
        frameId: activeFrame.id,
        durationMs: DEFAULT_ANIMATION_STEP_DURATION_MS,
      },
    ],
  };

  state.project.animations = [...state.project.animations, animation];
  state.project.activeAnimationId = animation.id;
  state.project.selectedStepIndex = 0;
  renderProjectEditor();
  pushHistorySnapshot("new animation");
  log(`Created clip "${animation.name}" from frame "${activeFrame.name}".`);
}

function deleteActiveAnimation() {
  const activeAnimation = getProjectAnimation();
  if (!activeAnimation) {
    log("Pick a clip first.");
    return;
  }

  stopAnimationPreview();
  state.project.animations = state.project.animations.filter((animation) => animation.id !== activeAnimation.id);
  state.project.activeAnimationId = state.project.animations[0]?.id || null;
  state.project.selectedStepIndex = state.project.activeAnimationId ? 0 : null;
  if (state.project.defaultAnimationId === activeAnimation.id) {
    state.project.defaultAnimationId = null;
  }
  renderProjectEditor();
  pushHistorySnapshot("animation delete");
  log(`Deleted clip "${activeAnimation.name}".`);
}

function renameActiveAnimation() {
  const activeAnimationIndex = getProjectAnimationIndex();
  if (activeAnimationIndex < 0) {
    return;
  }

  const nextName = sanitizeProjectEntityLabel(elements.animationName.value, "Clip");
  if (state.project.animations[activeAnimationIndex].name === nextName) {
    elements.animationName.value = nextName;
    return;
  }

  state.project.animations[activeAnimationIndex] = {
    ...state.project.animations[activeAnimationIndex],
    name: nextName,
  };
  renderProjectEditor();
  pushHistorySnapshot("animation rename");
}

function setActiveAnimationLoop(loopValue) {
  const activeAnimationIndex = getProjectAnimationIndex();
  if (activeAnimationIndex < 0) {
    return;
  }

  const loop = loopValue === true;
  if (state.project.animations[activeAnimationIndex].loop === loop) {
    return;
  }

  state.project.animations[activeAnimationIndex] = {
    ...state.project.animations[activeAnimationIndex],
    loop,
  };
  renderProjectEditor();
  pushHistorySnapshot(loop ? "animation loop on" : "animation loop off");
}

function setProjectDefaultTarget() {
  const selectedValue = elements.defaultTargetSelect.value;
  if (selectedValue === DEFAULT_TARGET_AUTO_VALUE) {
    state.project.defaultFrameId = null;
    state.project.defaultAnimationId = null;
  } else if (selectedValue.startsWith("frame:")) {
    const frameId = selectedValue.slice("frame:".length);
    if (!getProjectFrame(frameId, state.project.frames)) {
      renderProjectEditor();
      return;
    }
    state.project.defaultFrameId = frameId;
    state.project.defaultAnimationId = null;
  } else if (selectedValue.startsWith("animation:")) {
    const animationId = selectedValue.slice("animation:".length);
    if (!getProjectAnimation(animationId, state.project.animations)) {
      renderProjectEditor();
      return;
    }
    state.project.defaultAnimationId = animationId;
    state.project.defaultFrameId = null;
  }

  renderProjectEditor();
  pushHistorySnapshot("default target change");
}

function addAnimationStepFromCurrentFrame(insertIndex = null) {
  const activeAnimationIndex = getProjectAnimationIndex();
  const activeFrame = getProjectFrame();
  if (activeAnimationIndex < 0 || !activeFrame) {
    log("Pick or create a clip first.");
    return;
  }

  stopAnimationPreview();
  syncActiveFrameIntoProject();

  const animation = state.project.animations[activeAnimationIndex];
  const nextSteps = [...animation.steps];
  const boundedInsertIndex = Number.isInteger(insertIndex)
    ? Math.max(0, Math.min(nextSteps.length, insertIndex))
    : nextSteps.length;
  nextSteps.splice(boundedInsertIndex, 0, {
    frameId: activeFrame.id,
    durationMs: DEFAULT_ANIMATION_STEP_DURATION_MS,
  });

  state.project.animations[activeAnimationIndex] = {
    ...animation,
    steps: nextSteps,
  };
  state.project.selectedStepIndex = boundedInsertIndex;
  renderProjectEditor();
  pushHistorySnapshot("animation step add");
}

function updateAnimationStep(index, field, rawValue) {
  const activeAnimationIndex = getProjectAnimationIndex();
  if (activeAnimationIndex < 0) {
    return;
  }

  const animation = state.project.animations[activeAnimationIndex];
  const step = animation.steps[index];
  if (!step) {
    return;
  }

  let nextStep = step;
  if (field === "frame") {
    if (!getProjectFrame(rawValue, state.project.frames) || step.frameId === rawValue) {
      renderProjectEditor();
      return;
    }
    nextStep = {
      ...step,
      frameId: rawValue,
    };
  } else if (field === "duration") {
    const durationMs = clampAnimationStepDuration(Number(rawValue));
    if (step.durationMs === durationMs) {
      renderProjectEditor();
      return;
    }
    nextStep = {
      ...step,
      durationMs,
    };
  } else {
    return;
  }

  stopAnimationPreview();
  const nextSteps = animation.steps.map((candidate, stepIndex) => (stepIndex === index ? nextStep : candidate));
  state.project.animations[activeAnimationIndex] = {
    ...animation,
    steps: nextSteps,
  };
  state.project.selectedStepIndex = index;

  if (field === "frame") {
    if (nextStep.frameId === state.project.activeFrameId) {
      renderProjectEditor();
    } else {
      selectProjectFrame(nextStep.frameId, "clip step frame change");
    }
  } else {
    renderProjectEditor();
  }
  pushHistorySnapshot("animation step edit");
}

function moveAnimationStep(index, direction) {
  const activeAnimationIndex = getProjectAnimationIndex();
  if (activeAnimationIndex < 0) {
    return;
  }

  const targetIndex = index + direction;
  const animation = state.project.animations[activeAnimationIndex];
  if (targetIndex < 0 || targetIndex >= animation.steps.length) {
    return;
  }

  stopAnimationPreview();
  const nextSteps = [...animation.steps];
  const [movedStep] = nextSteps.splice(index, 1);
  nextSteps.splice(targetIndex, 0, movedStep);
  state.project.animations[activeAnimationIndex] = {
    ...animation,
    steps: nextSteps,
  };
  const selectedStepIndex = getSelectedAnimationStepIndex(animation);
  if (selectedStepIndex === index) {
    state.project.selectedStepIndex = targetIndex;
  } else if (selectedStepIndex === targetIndex) {
    state.project.selectedStepIndex = index;
  }
  renderProjectEditor();
  pushHistorySnapshot(direction < 0 ? "animation step move up" : "animation step move down");
}

function deleteAnimationStep(index) {
  const activeAnimationIndex = getProjectAnimationIndex();
  if (activeAnimationIndex < 0) {
    return;
  }

  const animation = state.project.animations[activeAnimationIndex];
  if (animation.steps.length <= 1) {
    log("Clips need at least one step. Delete the clip instead.");
    return;
  }

  stopAnimationPreview();
  state.project.animations[activeAnimationIndex] = {
    ...animation,
    steps: animation.steps.filter((_, stepIndex) => stepIndex !== index),
  };
  state.project.selectedStepIndex = Math.max(0, Math.min(index, animation.steps.length - 2));
  renderProjectEditor();
  pushHistorySnapshot("animation step delete");
}

function syncGridDom() {
  const cells = elements.grid.querySelectorAll(".pixel-cell");
  cells.forEach((cell) => {
    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    const value = state.pixels[indexFor(x, y)];
    cell.classList.toggle("on", value === 1);
  });
}

function buildFrameMessage() {
  return {
    type: "frame",
    version: 1,
    width: state.width,
    height: state.height,
    pixels: state.pixels,
  };
}

function buildBrightnessMessage() {
  return {
    type: "brightness",
    version: 1,
    value: state.brightness,
  };
}

function buildGetLayoutMessage() {
  return {
    type: "get_layout",
    version: 1,
  };
}

function buildGetStateMessage() {
  return {
    type: "get_state",
    version: 1,
  };
}

function buildLayoutMessage() {
  return {
    type: "layout",
    version: 1,
    rotate: state.layout.rotate,
    block_orientation: state.layout.blockOrientation,
    reverse_order: state.layout.reverseOrder,
    panel_order: state.layout.panelOrder,
    panel_rotations: state.layout.panelRotations,
    panel_mirrors: state.layout.panelMirrors,
    panel_flips: buildLegacyPanelFlips(state.layout.panelRotations),
  };
}

function buildSaveLayoutMessage() {
  return {
    type: "save_layout",
    version: 1,
    rotate: state.layout.rotate,
    block_orientation: state.layout.blockOrientation,
    reverse_order: state.layout.reverseOrder,
    panel_order: state.layout.panelOrder,
    panel_rotations: state.layout.panelRotations,
    panel_mirrors: state.layout.panelMirrors,
    panel_flips: buildLegacyPanelFlips(state.layout.panelRotations),
  };
}

function buildSaveDrawingMessage() {
  const drawingName = getCurrentDrawingExportName();
  return {
    type: "save_drawing",
    version: 1,
    name: drawingName,
    width: state.width,
    height: state.height,
    pixels: [...state.pixels],
    boardLayout: serializeBoardLayout(),
    boardGroups: [...state.boardGroups],
  };
}

function buildListDrawingsMessage() {
  return {
    type: "list_drawings",
    version: 1,
  };
}

function buildLoadDrawingMessage(name) {
  return {
    type: "load_drawing",
    version: 1,
    name,
  };
}

function buildSaveProjectMessage() {
  const project = buildCurrentProjectPayload();
  return {
    type: "save_project",
    version: 1,
    ...project,
  };
}

function buildListProjectsMessage() {
  return {
    type: "list_projects",
    version: 1,
  };
}

function buildGetProjectMessage(name) {
  return {
    type: "get_project",
    version: 1,
    name,
  };
}

function buildActivateProjectMessage(name) {
  return {
    type: "activate_project",
    version: 1,
    name,
  };
}

function buildSetBootProjectMessage(name) {
  return {
    type: "set_boot_project",
    version: 1,
    name,
  };
}

function buildClearBootProjectMessage() {
  return {
    type: "clear_boot_project",
    version: 1,
  };
}

function buildResumeProjectMessage() {
  return {
    type: "resume_project",
    version: 1,
  };
}

function buildDeleteProjectMessage(name) {
  return {
    type: "delete_project",
    version: 1,
    name,
  };
}

function clampNumber(value, minimum, maximum, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function clampBrightness(value) {
  return clampNumber(value, MIN_BRIGHTNESS, MAX_BRIGHTNESS, DEFAULT_BRIGHTNESS);
}

function clampRotate(value) {
  return clampNumber(value, 0, 3, DEFAULT_LAYOUT.rotate);
}

function normalizeBlockOrientation(value) {
  const normalized = Number(value);
  if ([0, 90, -90, 180].includes(normalized)) {
    return normalized;
  }
  return DEFAULT_LAYOUT.blockOrientation;
}

function clampMovingDotSpeed(value) {
  return clampNumber(value, MIN_MOVING_DOT_SPEED, MAX_MOVING_DOT_SPEED, DEFAULT_MOVING_DOT_SPEED);
}

function clampMovingDotFps(value) {
  return clampNumber(value, MIN_MOVING_DOT_FPS, MAX_MOVING_DOT_FPS, DEFAULT_MOVING_DOT_FPS);
}

function sanitizeDrawingName(value) {
  const trimmed = value.trim();
  return trimmed || "fifo-drawing";
}

function sanitizeEndpointName(value) {
  const trimmed = value.trim();
  return trimmed || DEFAULT_ENDPOINT_NAME;
}

function sanitizeProjectEntityLabel(value, fallback) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || fallback;
}

function clampAnimationStepDuration(value) {
  return clampNumber(
    value,
    MIN_ANIMATION_STEP_DURATION_MS,
    MAX_ANIMATION_STEP_DURATION_MS,
    DEFAULT_ANIMATION_STEP_DURATION_MS,
  );
}

function createUniqueProjectEntityId(existingIds, preferredLabel, fallbackPrefix) {
  const baseId = String(preferredLabel || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallbackPrefix;

  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let suffix = 2;
  while (existingIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseId}-${suffix}`;
}

function cloneProjectFrame(frame) {
  return {
    id: frame.id,
    name: frame.name,
    pixels: [...frame.pixels],
  };
}

function cloneProjectFrames(frames = state.project.frames) {
  return frames.map((frame) => cloneProjectFrame(frame));
}

function cloneProjectAnimation(animation) {
  return {
    id: animation.id,
    name: animation.name,
    loop: animation.loop !== false,
    steps: animation.steps.map((step) => ({
      frameId: step.frameId,
      durationMs: step.durationMs,
    })),
  };
}

function cloneProjectAnimations(animations = state.project.animations) {
  return animations.map((animation) => cloneProjectAnimation(animation));
}

function getProjectFrameIndex(frameId = state.project.activeFrameId, frames = state.project.frames) {
  return frames.findIndex((frame) => frame.id === frameId);
}

function getProjectFrame(frameId = state.project.activeFrameId, frames = state.project.frames) {
  const index = getProjectFrameIndex(frameId, frames);
  return index >= 0 ? frames[index] : null;
}

function getProjectAnimationIndex(animationId = state.project.activeAnimationId, animations = state.project.animations) {
  return animations.findIndex((animation) => animation.id === animationId);
}

function getProjectAnimation(animationId = state.project.activeAnimationId, animations = state.project.animations) {
  const index = getProjectAnimationIndex(animationId, animations);
  return index >= 0 ? animations[index] : null;
}

function getProjectFramesSnapshot() {
  return state.project.frames.map((frame) => ({
    ...cloneProjectFrame(frame),
    pixels: frame.id === state.project.activeFrameId ? [...state.pixels] : [...frame.pixels],
  }));
}

function getProjectAnimationsSnapshot() {
  return cloneProjectAnimations();
}

function syncActiveFrameIntoProject() {
  const index = getProjectFrameIndex();
  if (index < 0) {
    return;
  }

  state.project.frames[index] = {
    ...state.project.frames[index],
    pixels: [...state.pixels],
  };
}

function normalizeProjectState(projectState = state.project) {
  if (!Array.isArray(projectState.frames) || projectState.frames.length === 0) {
    projectState.frames = [
      {
        id: DEFAULT_FRAME_ID,
        name: DEFAULT_FRAME_NAME,
        pixels: Array(state.width * state.height).fill(0),
      },
    ];
  }

  const frameIds = new Set(projectState.frames.map((frame) => frame.id));
  if (!frameIds.has(projectState.activeFrameId)) {
    projectState.activeFrameId = projectState.frames[0].id;
  }
  if (!frameIds.has(projectState.defaultFrameId)) {
    projectState.defaultFrameId = null;
  }

  const animationIds = new Set(projectState.animations.map((animation) => animation.id));
  if (!animationIds.has(projectState.activeAnimationId)) {
    projectState.activeAnimationId = projectState.animations[0]?.id || null;
  }
  if (!animationIds.has(projectState.defaultAnimationId)) {
    projectState.defaultAnimationId = null;
  }

  const activeAnimation = getProjectAnimation(projectState.activeAnimationId, projectState.animations);
  if (!activeAnimation || !Array.isArray(activeAnimation.steps) || activeAnimation.steps.length === 0) {
    projectState.selectedStepIndex = null;
    return;
  }

  const rawStepIndex = Number.isInteger(projectState.selectedStepIndex)
    ? projectState.selectedStepIndex
    : 0;
  projectState.selectedStepIndex = Math.max(0, Math.min(activeAnimation.steps.length - 1, rawStepIndex));
}

function resolveProjectEditorFrameId(project, preferredFrameId = null) {
  const framesById = new Map(project.frames.map((frame) => [frame.id, frame]));
  if (preferredFrameId && framesById.has(preferredFrameId)) {
    return preferredFrameId;
  }

  if (project.defaultFrameId && framesById.has(project.defaultFrameId)) {
    return project.defaultFrameId;
  }

  if (project.defaultAnimationId) {
    const defaultAnimation = project.animations.find((animation) => animation.id === project.defaultAnimationId);
    const defaultStepFrameId = defaultAnimation?.steps?.[0]?.frameId;
    if (defaultStepFrameId && framesById.has(defaultStepFrameId)) {
      return defaultStepFrameId;
    }
  }

  const firstAnimationStepFrameId = project.animations[0]?.steps?.[0]?.frameId;
  if (firstAnimationStepFrameId && framesById.has(firstAnimationStepFrameId)) {
    return firstAnimationStepFrameId;
  }

  return project.frames[0].id;
}

function resolveProjectEditorAnimationId(project, preferredAnimationId = null) {
  const animationIds = new Set(project.animations.map((animation) => animation.id));
  if (preferredAnimationId && animationIds.has(preferredAnimationId)) {
    return preferredAnimationId;
  }
  if (project.defaultAnimationId && animationIds.has(project.defaultAnimationId)) {
    return project.defaultAnimationId;
  }
  return project.animations[0]?.id || null;
}

function createProjectFromDrawing(drawing, options = {}) {
  const frameId = typeof options.frameId === "string" && options.frameId.trim()
    ? options.frameId.trim()
    : DEFAULT_FRAME_ID;
  const frameName = sanitizeProjectEntityLabel(options.frameName || drawing.name, DEFAULT_FRAME_NAME);

  return {
    name: drawing.name,
    width: drawing.width,
    height: drawing.height,
    boardLayout: drawing.boardLayout,
    boardGroups: drawing.boardGroups,
    frames: [
      {
        id: frameId,
        name: frameName,
        pixels: [...drawing.pixels],
      },
    ],
    animations: [],
    defaultFrameId: frameId,
    defaultAnimationId: null,
    activeFrameId: frameId,
    activeAnimationId: null,
    selectedStepIndex: null,
  };
}

function resizeProjectFrames(frames, sourceWidth, sourceHeight, targetWidth, targetHeight) {
  return frames.map((frame) => ({
    ...cloneProjectFrame(frame),
    pixels: resizePixelBuffer(frame.pixels, sourceWidth, sourceHeight, targetWidth, targetHeight),
  }));
}

function fitProjectToConnectedDisplay(project) {
  const targetWidth = state.connectedDisplayWidth;
  const targetHeight = state.connectedDisplayHeight;
  const clonedProject = {
    ...project,
    frames: cloneProjectFrames(project.frames),
    animations: cloneProjectAnimations(project.animations),
  };

  if (!Number.isInteger(targetWidth) || targetWidth <= 0 || !Number.isInteger(targetHeight) || targetHeight <= 0) {
    return {
      ...clonedProject,
      resized: false,
    };
  }

  if (project.width === targetWidth && project.height === targetHeight) {
    return {
      ...clonedProject,
      resized: false,
    };
  }

  return {
    ...clonedProject,
    width: targetWidth,
    height: targetHeight,
    frames: resizeProjectFrames(project.frames, project.width, project.height, targetWidth, targetHeight),
    resized: true,
  };
}

function buildCurrentProjectPayload(options = {}) {
  normalizeProjectState();

  const frames = getProjectFramesSnapshot();
  const animations = getProjectAnimationsSnapshot();
  const frameIds = new Set(frames.map((frame) => frame.id));
  const animationIds = new Set(animations.map((animation) => animation.id));
  const payload = {
    name: state.drawingName,
    width: state.width,
    height: state.height,
    boardLayout: serializeBoardLayout(),
    boardGroups: [...state.boardGroups],
    frames,
    animations,
    defaultFrameId: frameIds.has(state.project.defaultFrameId) ? state.project.defaultFrameId : null,
    defaultAnimationId: animationIds.has(state.project.defaultAnimationId) ? state.project.defaultAnimationId : null,
  };

  if (options.includeEditorState) {
    payload.activeFrameId = frameIds.has(state.project.activeFrameId)
      ? state.project.activeFrameId
      : frames[0]?.id || null;
    payload.activeAnimationId = animationIds.has(state.project.activeAnimationId)
      ? state.project.activeAnimationId
      : null;
    payload.selectedStepIndex = animationIds.has(state.project.activeAnimationId)
      ? getSelectedAnimationStepIndex()
      : null;
  }

  return payload;
}

function getCurrentDrawingExportName() {
  const activeFrame = getProjectFrame();
  if (!activeFrame) {
    return state.drawingName;
  }

  if (state.project.frames.length === 1) {
    return state.drawingName;
  }

  return sanitizeDrawingName(`${state.drawingName}-${activeFrame.name}`);
}

function createEditorSnapshot() {
  return {
    width: state.width,
    height: state.height,
    drawingName: state.drawingName,
    boardLayout: cloneBoardLayout(),
    boardGroups: [...state.boardGroups],
    project: {
      frames: getProjectFramesSnapshot(),
      animations: getProjectAnimationsSnapshot(),
      activeFrameId: state.project.activeFrameId,
      activeAnimationId: state.project.activeAnimationId,
      selectedStepIndex: state.project.selectedStepIndex,
      defaultFrameId: state.project.defaultFrameId,
      defaultAnimationId: state.project.defaultAnimationId,
    },
  };
}

function pixelsMatch(leftPixels, rightPixels) {
  if (!Array.isArray(leftPixels) || !Array.isArray(rightPixels) || leftPixels.length !== rightPixels.length) {
    return false;
  }

  return leftPixels.every((value, index) => value === rightPixels[index]);
}

function projectFramesMatch(leftFrames, rightFrames) {
  if (!Array.isArray(leftFrames) || !Array.isArray(rightFrames) || leftFrames.length !== rightFrames.length) {
    return false;
  }

  return leftFrames.every((frame, index) => (
    frame.id === rightFrames[index].id
    && frame.name === rightFrames[index].name
    && pixelsMatch(frame.pixels, rightFrames[index].pixels)
  ));
}

function projectAnimationsMatch(leftAnimations, rightAnimations) {
  if (!Array.isArray(leftAnimations) || !Array.isArray(rightAnimations) || leftAnimations.length !== rightAnimations.length) {
    return false;
  }

  return leftAnimations.every((animation, index) => {
    const candidate = rightAnimations[index];
    if (
      animation.id !== candidate.id
      || animation.name !== candidate.name
      || animation.loop !== candidate.loop
      || animation.steps.length !== candidate.steps.length
    ) {
      return false;
    }

    return animation.steps.every((step, stepIndex) => (
      step.frameId === candidate.steps[stepIndex].frameId
      && step.durationMs === candidate.steps[stepIndex].durationMs
    ));
  });
}

function applyProjectToEditor(project, reason, options = {}) {
  stopPatternPlayback(`for ${reason}`);
  stopAnimationPreview();

  const previousWidth = state.width;
  const previousHeight = state.height;
  const previousPixels = [...state.pixels];
  const fittedProject = fitProjectToConnectedDisplay(project);
  const activeFrameId = resolveProjectEditorFrameId(fittedProject, project.activeFrameId);
  const activeAnimationId = resolveProjectEditorAnimationId(fittedProject, project.activeAnimationId);
  const activeFrame = getProjectFrame(activeFrameId, fittedProject.frames) || fittedProject.frames[0];
  const normalizedWorkspace = normalizePersistedBoardWorkspace(
    fittedProject.width,
    fittedProject.height,
    activeFrame.pixels,
    fittedProject.boardLayout,
    fittedProject.boardGroups,
  );

  state.drawingName = sanitizeDrawingName(fittedProject.name);
  state.project.frames = cloneProjectFrames(fittedProject.frames);
  state.project.animations = cloneProjectAnimations(fittedProject.animations);
  state.project.activeFrameId = activeFrame.id;
  state.project.activeAnimationId = activeAnimationId;
  state.project.selectedStepIndex = Number.isInteger(fittedProject.selectedStepIndex)
    ? fittedProject.selectedStepIndex
    : null;
  state.project.defaultFrameId = fittedProject.defaultFrameId ?? null;
  state.project.defaultAnimationId = fittedProject.defaultAnimationId ?? null;
  normalizeProjectState();

  applyBoardFrame(normalizedWorkspace.boardLayout, normalizedWorkspace.boardGroups);
  elements.gridWidth.value = String(state.width);
  elements.gridHeight.value = String(state.height);
  elements.drawingName.value = state.drawingName;
  renderGrid();
  renderProjectEditor();
  saveAutosave();

  if (fittedProject.resized) {
    log(
      `Adjusted the loaded project to the connected Pi display `
      + `(${state.width}x${state.height}) so live updates stay in sync.`,
    );
  }

  const pixelsChanged = previousWidth !== state.width
    || previousHeight !== state.height
    || !pixelsMatch(previousPixels, state.pixels);

  if (options.syncFrame !== false && pixelsChanged) {
    scheduleFrameSend(reason, options);
  }
}

function restoreSnapshot(snapshot, reason, options = {}) {
  const snapshotProject = {
    name: snapshot.drawingName,
    width: snapshot.width,
    height: snapshot.height,
    boardLayout: snapshot.boardLayout,
    boardGroups: snapshot.boardGroups,
    frames: cloneProjectFrames(snapshot.project.frames),
    animations: cloneProjectAnimations(snapshot.project.animations),
    defaultFrameId: snapshot.project.defaultFrameId,
    defaultAnimationId: snapshot.project.defaultAnimationId,
    activeFrameId: snapshot.project.activeFrameId,
    activeAnimationId: snapshot.project.activeAnimationId,
    selectedStepIndex: snapshot.project.selectedStepIndex,
  };

  applyProjectToEditor(snapshotProject, reason, options);
}

function snapshotsMatch(left, right) {
  if (!left || !right) {
    return false;
  }

  if (left.width !== right.width || left.height !== right.height || left.drawingName !== right.drawingName) {
    return false;
  }

  if (
    left.project.activeFrameId !== right.project.activeFrameId
    || left.project.activeAnimationId !== right.project.activeAnimationId
    || left.project.defaultFrameId !== right.project.defaultFrameId
    || left.project.defaultAnimationId !== right.project.defaultAnimationId
  ) {
    return false;
  }

  if (!projectFramesMatch(left.project.frames, right.project.frames)) {
    return false;
  }

  if (!projectAnimationsMatch(left.project.animations, right.project.animations)) {
    return false;
  }

  if (!boardLayoutMetadataMatches(left.boardLayout, right.boardLayout)) {
    return false;
  }

  const leftGroups = [...(left.boardGroups || [])].sort(compareGroupIds);
  const rightGroups = [...(right.boardGroups || [])].sort(compareGroupIds);
  if (leftGroups.length !== rightGroups.length) {
    return false;
  }

  return leftGroups.every((value, index) => value === rightGroups[index]);
}

function pushHistorySnapshot(reason) {
  const snapshot = createEditorSnapshot();
  const current = state.history.entries[state.history.index];
  if (snapshotsMatch(current, snapshot)) {
    updateHistoryButtons();
    return;
  }

  const nextEntries = state.history.entries.slice(0, state.history.index + 1);
  nextEntries.push(snapshot);
  if (nextEntries.length > HISTORY_LIMIT) {
    nextEntries.shift();
  }

  state.history.entries = nextEntries;
  state.history.index = nextEntries.length - 1;
  updateHistoryButtons();
  saveAutosave();

  if (reason) {
    setAutosaveStatus(`Autosaved after ${reason}.`);
  }
}

function undoHistory() {
  if (state.history.index <= 0) {
    log("Nothing to undo.");
    return;
  }

  state.history.index -= 1;
  restoreSnapshot(state.history.entries[state.history.index], "undo", { immediate: true });
  updateHistoryButtons();
  log("Undid the last edit.");
  setAutosaveStatus("Autosaved after undo.");
}

function redoHistory() {
  if (state.history.index >= state.history.entries.length - 1) {
    log("Nothing to redo.");
    return;
  }

  state.history.index += 1;
  restoreSnapshot(state.history.entries[state.history.index], "redo", { immediate: true });
  updateHistoryButtons();
  log("Redid the last edit.");
  setAutosaveStatus("Autosaved after redo.");
}

function saveAutosave() {
  const autosave = {
    ...buildCurrentProjectPayload({ includeEditorState: true }),
    savedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(autosave));
}

function loadAutosave() {
  const rawValue = window.localStorage.getItem(AUTOSAVE_STORAGE_KEY);
  if (!rawValue) {
    setAutosaveStatus("Autosave ready.");
    return;
  }

  try {
    const parsedAutosave = JSON.parse(rawValue);
    const autosaveProject = Array.isArray(parsedAutosave.frames)
      ? validateLoadedProject(parsedAutosave)
      : createProjectFromDrawing(validateLoadedDrawing(parsedAutosave));
    autosaveProject.activeFrameId = typeof parsedAutosave.activeFrameId === "string" ? parsedAutosave.activeFrameId : null;
    autosaveProject.activeAnimationId = typeof parsedAutosave.activeAnimationId === "string" ? parsedAutosave.activeAnimationId : null;
    autosaveProject.selectedStepIndex = Number.isInteger(parsedAutosave.selectedStepIndex)
      ? parsedAutosave.selectedStepIndex
      : null;
    applyProjectToEditor(autosaveProject, "autosave restore", { immediate: true, syncFrame: false });
    pushHistorySnapshot("autosave restore");
    log(`Restored autosaved project "${autosaveProject.name}".`);
    setAutosaveStatus(`Restored autosave from ${new Date(parsedAutosave.savedAt || Date.now()).toLocaleString()}.`);
  } catch (error) {
    window.localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
    setAutosaveStatus("Autosave data was invalid and has been cleared.");
    log("Cleared invalid autosave data.");
  }
}

function inferEndpointName(endpoint) {
  try {
    const url = new URL(endpoint);
    return url.hostname || url.host || DEFAULT_ENDPOINT_NAME;
  } catch (error) {
    return DEFAULT_ENDPOINT_NAME;
  }
}

function loadSavedEndpoints() {
  const rawValue = window.localStorage.getItem(PI_ENDPOINTS_STORAGE_KEY);
  if (!rawValue) {
    return;
  }

  try {
    const savedEndpoints = JSON.parse(rawValue);
    if (!Array.isArray(savedEndpoints)) {
      return;
    }

    state.savedEndpoints = savedEndpoints
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => ({
        name: sanitizeEndpointName(typeof entry.name === "string" ? entry.name : ""),
        url: typeof entry.url === "string" ? entry.url.trim() : "",
      }))
      .filter((entry) => entry.url);
  } catch (error) {
    state.savedEndpoints = [];
  }
}

function saveSavedEndpoints() {
  window.localStorage.setItem(PI_ENDPOINTS_STORAGE_KEY, JSON.stringify(state.savedEndpoints));
}

function syncSavedEndpointOptions(selectedUrl = elements.endpoint.value.trim()) {
  elements.savedEndpointSelect.innerHTML = "";

  if (state.savedEndpoints.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No saved endpoints";
    elements.savedEndpointSelect.appendChild(option);
    elements.savedEndpointSelect.value = "";
    return;
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a saved endpoint";
  elements.savedEndpointSelect.appendChild(placeholder);

  state.savedEndpoints.forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.url;
    option.textContent = `${entry.name} - ${entry.url}`;
    elements.savedEndpointSelect.appendChild(option);
  });

  const matchingEntry = state.savedEndpoints.find((entry) => entry.url === selectedUrl);
  elements.savedEndpointSelect.value = matchingEntry ? matchingEntry.url : "";
}

function upsertSavedEndpoint(reason) {
  const url = elements.endpoint.value.trim();
  if (!url) {
    log("Enter a Pi endpoint before saving it.");
    return false;
  }

  state.endpointName = sanitizeEndpointName(elements.endpointName.value || inferEndpointName(url));
  elements.endpointName.value = state.endpointName;

  const existingIndex = state.savedEndpoints.findIndex((entry) => entry.url === url || entry.name === state.endpointName);
  const nextEntry = {
    name: state.endpointName,
    url,
  };

  if (existingIndex >= 0) {
    state.savedEndpoints[existingIndex] = nextEntry;
  } else {
    state.savedEndpoints = [nextEntry, ...state.savedEndpoints];
  }

  state.savedEndpoints = state.savedEndpoints
    .filter((entry, index, entries) => entries.findIndex((candidate) => candidate.url === entry.url) === index)
    .slice(0, 8);
  saveSavedEndpoints();
  syncSavedEndpointOptions(url);
  syncConnectionSummary();
  log(`Saved Pi endpoint "${state.endpointName}" after ${reason}.`);
  return true;
}

function applySavedEndpoint() {
  const url = elements.savedEndpointSelect.value;
  if (!url) {
    log("Pick a saved endpoint first.");
    return;
  }

  const savedEndpoint = state.savedEndpoints.find((entry) => entry.url === url);
  if (!savedEndpoint) {
    log("That saved endpoint is no longer available.");
    syncSavedEndpointOptions();
    return;
  }

  elements.endpoint.value = savedEndpoint.url;
  state.endpointName = savedEndpoint.name;
  elements.endpointName.value = savedEndpoint.name;
  syncSavedEndpointOptions(savedEndpoint.url);
  syncConnectionSummary();
  log(`Loaded saved endpoint "${savedEndpoint.name}".`);
}

function deleteSavedEndpoint() {
  const url = elements.savedEndpointSelect.value || elements.endpoint.value.trim();
  const existingIndex = state.savedEndpoints.findIndex((entry) => entry.url === url);
  if (existingIndex < 0) {
    log("No saved endpoint is selected.");
    return;
  }

  const [removedEntry] = state.savedEndpoints.splice(existingIndex, 1);
  saveSavedEndpoints();
  syncSavedEndpointOptions();
  syncConnectionSummary();
  log(`Deleted saved endpoint "${removedEntry.name}".`);
}

function sendMessage(message) {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  state.socket.send(JSON.stringify(message));
  return true;
}

function cancelPendingFrameSend() {
  if (state.sendTimer) {
    window.clearTimeout(state.sendTimer);
    state.sendTimer = null;
  }
}

function scheduleFrameSend(reason, options = {}) {
  const { logSend = true, immediate = false } = options;
  cancelPendingFrameSend();

  if (immediate) {
    const sent = sendMessage(buildFrameMessage());
    if (sent && logSend) {
      log(`Sent frame (${state.width}x${state.height}) after ${reason}.`);
    }
    return;
  }

  state.sendTimer = window.setTimeout(() => {
    state.sendTimer = null;
    const sent = sendMessage(buildFrameMessage());
    if (sent && logSend) {
      log(`Sent frame (${state.width}x${state.height}) after ${reason}.`);
    }
  }, SEND_DELAY_MS);
}

function stopPatternPlayback(logReason) {
  if (state.patternTimer) {
    window.clearInterval(state.patternTimer);
    state.patternTimer = null;
  }

  if (state.activePattern && logReason) {
    log(`Stopped ${state.activePattern} pattern ${logReason}.`);
  }

  state.activePattern = null;
  state.patternFrame = 0;
}

function applyPixels(pixels, reason, options) {
  stopAnimationPreview();
  state.pixels = pixels;
  syncBoardPixelsFromFrame();
  syncActiveFrameIntoProject();
  syncGridDom();
  renderSelectedAnimationPreview();
  saveAutosave();
  scheduleFrameSend(reason, options);
}

function applyCellValue(x, y, value) {
  stopPatternPlayback("for manual drawing");
  stopAnimationPreview();
  if (x < 0 || x >= state.width || y < 0 || y >= state.height) {
    return;
  }

  const index = indexFor(x, y);
  if (state.pixels[index] === value) {
    return;
  }

  state.pixels[index] = value;
  const board = findBoardByCoordinate(x, y);
  if (board) {
    setBoardPixelValue(board, x, y, value);
  }
  state.strokeHasChanges = true;
  const target = elements.grid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
  if (target) {
    target.classList.toggle("on", value === 1);
  }
  syncActiveFrameIntoProject();
  renderSelectedAnimationPreview();
  saveAutosave();
  scheduleFrameSend("draw");
}

function resizeGrid() {
  stopPatternPlayback("for grid resize");
  stopAnimationPreview();
  const width = Number(elements.gridWidth.value);
  const height = Number(elements.gridHeight.value);

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    log("Width and height must be positive integers.");
    return;
  }

  if (
    Number.isInteger(state.connectedDisplayWidth)
    && Number.isInteger(state.connectedDisplayHeight)
    && (width !== state.connectedDisplayWidth || height !== state.connectedDisplayHeight)
  ) {
    elements.gridWidth.value = String(state.connectedDisplayWidth);
    elements.gridHeight.value = String(state.connectedDisplayHeight);
    log(
      `Connected Pi display is ${state.connectedDisplayWidth}x${state.connectedDisplayHeight}. `
      + "The editor grid stays synced to that size while connected.",
    );
    if (syncGridToConnectedDisplay("Pi display sync")) {
      scheduleFrameSend("Pi display sync", { immediate: true, logSend: false });
    }
    return;
  }

  syncActiveFrameIntoProject();
  const resizedProject = {
    ...buildCurrentProjectPayload({ includeEditorState: true }),
    width,
    height,
    frames: resizeProjectFrames(state.project.frames, state.width, state.height, width, height),
  };

  applyProjectToEditor(resizedProject, "grid resize", { syncFrame: false });
  pushHistorySnapshot("grid resize");
  scheduleFrameSend("resize");
  log(`Resized the project to ${width}x${height} and preserved overlapping pixels in every frame.`);
}

function applyDrawing(frame, reason) {
  const project = createProjectFromDrawing(frame, {
    frameName: frame.name,
  });
  applyProjectToEditor(project, reason, { syncFrame: false });
  pushHistorySnapshot(reason);
  scheduleFrameSend(reason);
}

function setAllPixels(value) {
  stopPatternPlayback(value === 0 ? "for clear" : "for fill");
  applyPixels(Array(state.width * state.height).fill(value), value === 0 ? "clear" : "fill");
}

function applyCheckerPattern() {
  stopPatternPlayback("for checker pattern");
  const pixels = state.pixels.map((_, index) => {
    const x = index % state.width;
    const y = Math.floor(index / state.width);
    return (x + y) % 2;
  });
  applyPixels(pixels, "checker pattern");
}

function applyBorderPattern() {
  stopPatternPlayback("for border pattern");
  const pixels = createEmptyPixels();

  for (let x = 0; x < state.width; x += 1) {
    setPixelInArray(pixels, x, 0);
    setPixelInArray(pixels, x, state.height - 1);
  }

  for (let y = 0; y < state.height; y += 1) {
    setPixelInArray(pixels, 0, y);
    setPixelInArray(pixels, state.width - 1, y);
  }

  applyPixels(pixels, "border pattern");
}

function applyHorizontalLinePattern() {
  stopPatternPlayback("for horizontal line pattern");
  const pixels = createEmptyPixels();
  const y = Math.floor(state.height / 2);

  for (let x = 0; x < state.width; x += 1) {
    setPixelInArray(pixels, x, y);
  }

  applyPixels(pixels, "horizontal line pattern");
}

function applyVerticalLinePattern() {
  stopPatternPlayback("for vertical line pattern");
  const pixels = createEmptyPixels();
  const x = Math.floor(state.width / 2);

  for (let y = 0; y < state.height; y += 1) {
    setPixelInArray(pixels, x, y);
  }

  applyPixels(pixels, "vertical line pattern");
}

function buildMovingDotPixels(frameIndex) {
  const pixels = createEmptyPixels();
  const totalPixels = state.width * state.height;
  const safeTotalPixels = Math.max(totalPixels, 1);
  const dotIndex = (frameIndex * state.movingDotSpeed) % safeTotalPixels;
  const x = dotIndex % state.width;
  const y = Math.floor(dotIndex / state.width);
  setPixelInArray(pixels, x, y);
  return pixels;
}

function buildPanelIndexTestPixels(frameIndex) {
  const pixels = createEmptyPixels();
  const orderedBoards = cloneBoardLayout()
    .sort((left, right) => left.chainIndex - right.chainIndex);
  const panelCount = Math.max(orderedBoards.length, 1);
  const activePanel = frameIndex % panelCount;
  const activeBoard = orderedBoards[activePanel];

  if (!activeBoard) {
    return pixels;
  }

  const startX = boardOriginX(activeBoard);
  const startY = boardOriginY(activeBoard);
  const endX = startX + activeBoard.width;
  const endY = startY + activeBoard.height;

  for (let x = startX; x < endX; x += 1) {
    setPixelInArray(pixels, x, startY);
    setPixelInArray(pixels, x, endY - 1);
  }

  for (let y = startY; y < endY; y += 1) {
    setPixelInArray(pixels, startX, y);
    setPixelInArray(pixels, endX - 1, y);
  }

  const digit = String((activePanel + 1) % 10);
  const glyph = PANEL_INDEX_DIGITS[digit] || PANEL_INDEX_DIGITS["0"];
  const glyphHeight = glyph.length;
  const glyphWidth = glyph[0].length;
  const interiorWidth = Math.max(0, endX - startX - 2);
  const interiorHeight = Math.max(0, endY - startY - 2);
  const offsetX = startX + 1 + Math.max(0, Math.floor((interiorWidth - glyphWidth) / 2));
  const offsetY = startY + 1 + Math.max(0, Math.floor((interiorHeight - glyphHeight) / 2));

  for (let row = 0; row < glyphHeight; row += 1) {
    for (let column = 0; column < glyphWidth; column += 1) {
      if (glyph[row][column] !== "1") {
        continue;
      }
      setPixelInArray(pixels, offsetX + column, offsetY + row);
    }
  }

  return pixels;
}

function renderPatternFrame(patternName) {
  let pixels = null;

  if (patternName === "moving dot") {
    pixels = buildMovingDotPixels(state.patternFrame);
  } else if (patternName === "panel index test") {
    pixels = buildPanelIndexTestPixels(state.patternFrame);
  }

  if (!pixels) {
    return;
  }

  applyPixels(pixels, patternName, { logSend: false, immediate: true });
  state.patternFrame += 1;
}

function startPatternPlayback(patternName) {
  stopPatternPlayback();
  state.activePattern = patternName;
  state.patternFrame = 0;
  renderPatternFrame(patternName);

  const fps = patternName === "moving dot" ? state.movingDotFps : PANEL_INDEX_TEST_FPS;
  const frameDelayMs = Math.max(16, Math.round(1000 / fps));
  state.patternTimer = window.setInterval(() => {
    renderPatternFrame(patternName);
  }, frameDelayMs);

  if (patternName === "moving dot") {
    log(`Started moving dot pattern at ${state.movingDotSpeed} pixel${state.movingDotSpeed === 1 ? "" : "s"} per frame and ${state.movingDotFps} FPS.`);
    return;
  }

  log(`Started ${patternName} pattern at ${fps} FPS.`);
}

function syncBrightnessInputs() {
  elements.brightnessRange.value = String(state.brightness);
  elements.brightnessValue.value = String(state.brightness);
}

function findMatchingLayoutPreset(layout = state.layout) {
  if (layout.panelOrder || layout.panelRotations || layout.panelMirrors) {
    return "custom";
  }

  return Object.entries(LAYOUT_PRESETS).find(([, preset]) => (
    preset
    && preset.rotate === layout.rotate
    && preset.blockOrientation === layout.blockOrientation
    && preset.reverseOrder === layout.reverseOrder
  ))?.[0] || "custom";
}

function syncLayoutInputs() {
  elements.rotateSelect.value = String(state.layout.rotate);
  elements.blockOrientationSelect.value = String(state.layout.blockOrientation);
  elements.reverseOrderInput.checked = state.layout.reverseOrder;
  syncPanelOrderInput();
  elements.layoutPreset.value = findMatchingLayoutPreset();
}

function applyLayoutState(layout) {
  state.layout = {
    rotate: clampRotate(layout.rotate),
    blockOrientation: normalizeBlockOrientation(layout.blockOrientation),
    reverseOrder: Boolean(layout.reverseOrder),
    panelOrder: normalizePanelOrder(layout.panelOrder),
    panelRotations: normalizePanelRotations(
      layout.panelRotations
        ?? layout.panel_rotations
        ?? panelRotationsFromFlips(layout.panelFlips ?? layout.panel_flips ?? null),
    ),
    panelMirrors: normalizePanelMirrors(
      layout.panelMirrors
        ?? layout.panel_mirrors
        ?? null,
    ),
  };
  syncLayoutInputs();
}

function syncMovingDotInputs() {
  elements.movingDotSpeed.value = String(state.movingDotSpeed);
  elements.movingDotFps.value = String(state.movingDotFps);
}

function setMovingDotSpeed(value) {
  state.movingDotSpeed = clampMovingDotSpeed(value);
  syncMovingDotInputs();

  if (state.activePattern === "moving dot") {
    startPatternPlayback("moving dot");
  }
}

function setMovingDotFps(value) {
  state.movingDotFps = clampMovingDotFps(value);
  syncMovingDotInputs();

  if (state.activePattern === "moving dot") {
    startPatternPlayback("moving dot");
  }
}

function setBrightness(value, reason) {
  const brightness = clampBrightness(value);
  const previous = state.brightness;
  state.brightness = brightness;
  syncBrightnessInputs();

  if (previous === brightness) {
    return;
  }

  const sent = sendMessage(buildBrightnessMessage());
  if (sent) {
    log(`Set brightness to ${brightness} after ${reason}.`);
    return;
  }

  log(`Brightness set to ${brightness} locally. Connect to send it to the Pi.`);
}

function requestLayoutState(reason) {
  const sent = sendMessage(buildGetLayoutMessage());
  if (sent) {
    log(`Requested Pi layout after ${reason}.`);
    return true;
  }

  log("Not connected. Could not request Pi layout.");
  return false;
}

function requestPiState(reason) {
  const sent = sendMessage(buildGetStateMessage());
  if (sent) {
    log(`Requested Pi state after ${reason}.`);
    return true;
  }

  log("Not connected. Could not request Pi state.");
  return false;
}

function setLayout(reason) {
  let panelOrder = state.layout.panelOrder;
  try {
    panelOrder = parsePanelOrderInput(elements.panelOrderInput.value);
  } catch (error) {
    syncLayoutInputs();
    log(error instanceof Error ? error.message : "Panel order is invalid.");
    return;
  }

  const nextLayout = {
    rotate: clampRotate(Number(elements.rotateSelect.value)),
    blockOrientation: normalizeBlockOrientation(elements.blockOrientationSelect.value),
    reverseOrder: elements.reverseOrderInput.checked,
    panelOrder,
    panelRotations: state.layout.panelRotations,
    panelMirrors: state.layout.panelMirrors,
  };
  const changed = state.layout.rotate !== nextLayout.rotate
    || state.layout.blockOrientation !== nextLayout.blockOrientation
    || state.layout.reverseOrder !== nextLayout.reverseOrder
    || JSON.stringify(state.layout.panelOrder) !== JSON.stringify(nextLayout.panelOrder);

  applyLayoutState(nextLayout);

  if (!changed) {
    return;
  }

  const sent = sendMessage(buildLayoutMessage());
  if (sent) {
    sendMessage(buildFrameMessage());
    log(
      `Applied layout after ${reason}: rotate ${state.layout.rotate * 90} degrees, `
      + `block orientation ${state.layout.blockOrientation} degrees, `
      + `reverse order ${state.layout.reverseOrder ? "on" : "off"}, `
      + `panel order ${formatPanelOrder(state.layout.panelOrder) || getDefaultPanelOrderLabel()}, `
      + `and re-sent the current frame.`,
    );
    return;
  }

  log("Layout updated locally. Connect to send it to the Pi.");
}

function applyLayoutPreset() {
  const presetKey = elements.layoutPreset.value;
  const preset = LAYOUT_PRESETS[presetKey];
  if (!preset) {
    log("Pick a layout preset first.");
    return;
  }

  applyLayoutState({
    ...preset,
    panelOrder: null,
    panelRotations: state.layout.panelRotations,
    panelMirrors: state.layout.panelMirrors,
  });
  const sent = sendMessage(buildLayoutMessage());
  if (sent) {
    sendMessage(buildFrameMessage());
    log(`Applied "${preset.label}" preset to the Pi and re-sent the current frame.`);
  } else {
    log(`Applied "${preset.label}" preset locally. Connect to send it to the Pi.`);
  }
}

function saveLayoutToPi() {
  const sent = sendMessage(buildSaveLayoutMessage());
  if (sent) {
    log("Sent current layout to the Pi config for persistence.");
    return;
  }

  log("Not connected. Could not save layout on the Pi.");
}

function triggerDownload(filename, content) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

function saveDrawing() {
  state.drawingName = sanitizeDrawingName(elements.drawingName.value);
  elements.drawingName.value = state.drawingName;
  saveAutosave();

  const project = buildCurrentProjectPayload({ includeEditorState: true });
  const safeFilename = state.drawingName.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "fifo-drawing";
  if (project.frames.length === 1 && project.animations.length === 0) {
    const drawing = {
      name: state.drawingName,
      width: project.width,
      height: project.height,
      pixels: [...project.frames[0].pixels],
      boardLayout: project.boardLayout,
      boardGroups: project.boardGroups,
    };
    triggerDownload(`${safeFilename}.json`, `${JSON.stringify(drawing, null, 2)}\n`);
    log(`Saved drawing "${state.drawingName}" to JSON.`);
    return;
  }

  triggerDownload(`${safeFilename}.json`, `${JSON.stringify(project, null, 2)}\n`);
  log(`Saved project "${state.drawingName}" to JSON with ${project.frames.length} frames and ${project.animations.length} clips.`);
}

function syncPiDrawingOptions() {
  const previousValue = elements.piDrawingSelect.value;
  elements.piDrawingSelect.innerHTML = "";

  if (state.piDrawings.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No Pi drawings loaded";
    elements.piDrawingSelect.appendChild(option);
    elements.piDrawingSelect.value = "";
    return;
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a Pi drawing";
  elements.piDrawingSelect.appendChild(placeholder);

  state.piDrawings.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    elements.piDrawingSelect.appendChild(option);
  });

  if (state.piDrawings.includes(previousValue)) {
    elements.piDrawingSelect.value = previousValue;
  } else {
    elements.piDrawingSelect.value = "";
  }
}

function applyPiRuntimeState(data) {
  state.runtime = {
    mode: typeof data.runtime_mode === "string" ? data.runtime_mode : "idle",
    liveOverrideActive: data.live_override_active === true,
    activeProject: typeof data.active_project === "string" ? sanitizeDrawingName(data.active_project) : null,
    bootProject: typeof data.boot_project === "string" ? sanitizeDrawingName(data.boot_project) : null,
    activeTargetType: typeof data.active_target_type === "string" ? data.active_target_type : null,
    activeTargetName: typeof data.active_target_name === "string" ? data.active_target_name : null,
    activeProjectPersisted: data.active_project_persisted === true,
  };
  updatePiRuntimeStatus();
}

function getPiRuntimeStatusText() {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
    return "Connect to a Pi to manage bootable projects and temporary live control.";
  }

  if (state.runtime.mode === "project" && state.runtime.activeProject) {
    const targetLabel = state.runtime.activeTargetType && state.runtime.activeTargetName
      ? ` running ${state.runtime.activeTargetType} "${state.runtime.activeTargetName}"`
      : "";
    const bootLabel = state.runtime.bootProject
      ? ` Boot project: "${state.runtime.bootProject}".`
      : " No boot project is set yet.";
    return `Pi is running project "${state.runtime.activeProject}"${targetLabel}.${bootLabel} Drawing on the website temporarily overrides it until you resume the project or disconnect.`;
  }

  if (state.runtime.mode === "live" && state.runtime.activeProject) {
    return `Website live control is temporarily overriding project "${state.runtime.activeProject}". Use Resume Project to hand control back to the Pi runtime, or disconnect to let the Pi resume it automatically.`;
  }

  if (state.runtime.mode === "live") {
    return "Pi is currently showing temporary live website frames. No Pi project is active yet.";
  }

  if (state.runtime.bootProject) {
    return `Pi is idle right now. Boot project "${state.runtime.bootProject}" is saved and can be started from the website or on reboot.`;
  }

  return "Pi is ready for live website editing. Save the current editor project when you want the Pi to run it on its own.";
}

function updatePiRuntimeStatus() {
  elements.piRuntimeStatus.textContent = getPiRuntimeStatusText();
}

function syncPiProjectOptions() {
  const previousValue = elements.piProjectSelect.value;
  elements.piProjectSelect.innerHTML = "";

  if (state.piProjects.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No Pi projects loaded";
    elements.piProjectSelect.appendChild(option);
    elements.piProjectSelect.value = "";
    return;
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a Pi project";
  elements.piProjectSelect.appendChild(placeholder);

  state.piProjects.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    elements.piProjectSelect.appendChild(option);
  });

  if (state.piProjects.includes(previousValue)) {
    elements.piProjectSelect.value = previousValue;
  } else {
    elements.piProjectSelect.value = "";
  }
}

function requestPiDrawingList(reason) {
  const sent = sendMessage(buildListDrawingsMessage());
  if (sent) {
    log(`Requested Pi drawing list after ${reason}.`);
  } else {
    log("Not connected. Could not request Pi drawing list.");
  }
}

function saveDrawingToPi() {
  state.drawingName = sanitizeDrawingName(elements.drawingName.value);
  elements.drawingName.value = state.drawingName;

  const drawingName = getCurrentDrawingExportName();
  const sent = sendMessage(buildSaveDrawingMessage());
  if (sent) {
    log(`Sent frame "${drawingName}" to the Pi drawing library.`);
  } else {
    log("Not connected. Could not save drawing to the Pi.");
  }
}

function loadDrawingFromPi() {
  const drawingName = elements.piDrawingSelect.value;
  if (!drawingName) {
    log("Pick a Pi drawing first.");
    return;
  }

  const sent = sendMessage(buildLoadDrawingMessage(drawingName));
  if (sent) {
    log(`Requested drawing "${drawingName}" from the Pi.`);
  } else {
    log("Not connected. Could not load drawing from the Pi.");
  }
}

function requestPiProjectList(reason) {
  const sent = sendMessage(buildListProjectsMessage());
  if (sent) {
    log(`Requested Pi project list after ${reason}.`);
  } else {
    log("Not connected. Could not request Pi project list.");
  }
}

function saveProjectToPi() {
  state.drawingName = sanitizeDrawingName(elements.drawingName.value);
  elements.drawingName.value = state.drawingName;

  const project = buildCurrentProjectPayload();
  const sent = sendMessage(buildSaveProjectMessage());
  if (sent) {
    log(`Sent "${state.drawingName}" to the Pi as a bootable project with ${project.frames.length} frames and ${project.animations.length} clips.`);
  } else {
    log("Not connected. Could not save a project to the Pi.");
  }
}

function loadProjectFromPi() {
  const projectName = elements.piProjectSelect.value;
  if (!projectName) {
    log("Pick a Pi project first.");
    return;
  }

  const sent = sendMessage(buildGetProjectMessage(projectName));
  if (sent) {
    log(`Requested project "${projectName}" from the Pi.`);
  } else {
    log("Not connected. Could not load a project from the Pi.");
  }
}

function activateProjectOnPi() {
  const projectName = elements.piProjectSelect.value;
  if (!projectName) {
    log("Pick a Pi project first.");
    return;
  }

  cancelPendingFrameSend();
  const sent = sendMessage(buildActivateProjectMessage(projectName));
  if (sent) {
    log(`Asked the Pi to run project "${projectName}".`);
  } else {
    log("Not connected. Could not activate a Pi project.");
  }
}

function setBootProjectOnPi() {
  const projectName = elements.piProjectSelect.value;
  if (!projectName) {
    log("Pick a Pi project first.");
    return;
  }

  const sent = sendMessage(buildSetBootProjectMessage(projectName));
  if (sent) {
    log(`Asked the Pi to use "${projectName}" as the boot project.`);
  } else {
    log("Not connected. Could not update the boot project.");
  }
}

function clearBootProjectOnPi() {
  const sent = sendMessage(buildClearBootProjectMessage());
  if (sent) {
    log("Asked the Pi to clear its boot project.");
  } else {
    log("Not connected. Could not clear the boot project.");
  }
}

function resumeProjectOnPi() {
  cancelPendingFrameSend();
  const sent = sendMessage(buildResumeProjectMessage());
  if (sent) {
    log("Asked the Pi to resume its active project runtime.");
  } else {
    log("Not connected. Could not resume the Pi project.");
  }
}

function deleteProjectFromPi() {
  const projectName = elements.piProjectSelect.value;
  if (!projectName) {
    log("Pick a Pi project first.");
    return;
  }

  const sent = sendMessage(buildDeleteProjectMessage(projectName));
  if (sent) {
    log(`Asked the Pi to delete project "${projectName}".`);
  } else {
    log("Not connected. Could not delete the Pi project.");
  }
}

function validateLoadedDrawing(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Drawing file must contain a JSON object.");
  }

  const width = data.width;
  const height = data.height;
  const pixels = data.pixels;

  if (!Number.isInteger(width) || width <= 0) {
    throw new Error("Drawing width must be a positive integer.");
  }
  if (!Number.isInteger(height) || height <= 0) {
    throw new Error("Drawing height must be a positive integer.");
  }
  if (!Array.isArray(pixels) || pixels.length !== width * height) {
    throw new Error("Drawing pixels must match width * height.");
  }

  const normalizedPixels = pixels.map((value) => {
    if (value !== 0 && value !== 1) {
      throw new Error("Drawing pixels must contain only 0 or 1.");
    }
    return value;
  });

  if (data.boardLayout != null && !Array.isArray(data.boardLayout)) {
    throw new Error("boardLayout must be an array when provided.");
  }
  if (data.boardLayout != null && data.boardLayout.some((entry) => !entry || typeof entry !== "object")) {
    throw new Error("Each boardLayout entry must be an object.");
  }
  if (data.boardGroups != null && !Array.isArray(data.boardGroups)) {
    throw new Error("boardGroups must be an array when provided.");
  }

  const normalizedWorkspace = normalizePersistedBoardWorkspace(
    width,
    height,
    normalizedPixels,
    data.boardLayout ?? null,
    data.boardGroups ?? null,
  );

  return {
    name: typeof data.name === "string" ? sanitizeDrawingName(data.name) : "fifo-drawing",
    width,
    height,
    pixels: normalizedPixels,
    boardLayout: normalizedWorkspace.boardLayout,
    boardGroups: normalizedWorkspace.boardGroups,
  };
}

function validateLoadedProject(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Project payload must contain a JSON object.");
  }

  const width = data.width;
  const height = data.height;
  if (!Number.isInteger(width) || width <= 0) {
    throw new Error("Project width must be a positive integer.");
  }
  if (!Number.isInteger(height) || height <= 0) {
    throw new Error("Project height must be a positive integer.");
  }
  if (!Array.isArray(data.frames) || data.frames.length === 0) {
    throw new Error("Project frames must be a non-empty array.");
  }

  const frames = data.frames.map((frame) => {
    if (!frame || typeof frame !== "object") {
      throw new Error("Each project frame must be an object.");
    }

    const id = typeof frame.id === "string" ? frame.id.trim() : "";
    if (!id) {
      throw new Error("Each project frame needs a non-empty id.");
    }
    if (!Array.isArray(frame.pixels) || frame.pixels.length !== width * height) {
      throw new Error(`Project frame "${id}" pixels must match width * height.`);
    }

    const pixels = frame.pixels.map((value) => {
      if (value !== 0 && value !== 1) {
        throw new Error(`Project frame "${id}" pixels must contain only 0 or 1.`);
      }
      return value;
    });

    return {
      id,
      name: typeof frame.name === "string" && frame.name.trim() ? frame.name.trim() : id,
      pixels,
    };
  });

  const frameIds = new Set(frames.map((frame) => frame.id));
  if (frameIds.size !== frames.length) {
    throw new Error("Project frame ids must be unique.");
  }
  const animations = Array.isArray(data.animations)
    ? data.animations.map((animation) => {
      if (!animation || typeof animation !== "object") {
        throw new Error("Each project animation must be an object.");
      }

      const id = typeof animation.id === "string" ? animation.id.trim() : "";
      if (!id) {
        throw new Error("Each project animation needs a non-empty id.");
      }
      if (!Array.isArray(animation.steps) || animation.steps.length === 0) {
        throw new Error(`Project animation "${id}" must have at least one step.`);
      }

      return {
        id,
        name: typeof animation.name === "string" && animation.name.trim() ? animation.name.trim() : id,
        loop: animation.loop !== false,
        steps: animation.steps.map((step) => {
          if (!step || typeof step !== "object") {
            throw new Error(`Project animation "${id}" steps must be objects.`);
          }

          const frameId = typeof step.frameId === "string" ? step.frameId.trim() : "";
          if (!frameId || !frameIds.has(frameId)) {
            throw new Error(`Project animation "${id}" references an unknown frame.`);
          }
          if (!Number.isInteger(step.durationMs) || step.durationMs <= 0) {
            throw new Error(`Project animation "${id}" needs positive durationMs values.`);
          }

          return {
            frameId,
            durationMs: step.durationMs,
          };
        }),
      };
    })
    : [];
  const animationIds = new Set(animations.map((animation) => animation.id));
  if (animationIds.size !== animations.length) {
    throw new Error("Project animation ids must be unique.");
  }

  const defaultFrameId = typeof data.defaultFrameId === "string" && data.defaultFrameId.trim()
    ? data.defaultFrameId.trim()
    : null;
  if (defaultFrameId && !frameIds.has(defaultFrameId)) {
    throw new Error("defaultFrameId must reference a known frame.");
  }

  const defaultAnimationId = typeof data.defaultAnimationId === "string" && data.defaultAnimationId.trim()
    ? data.defaultAnimationId.trim()
    : null;
  if (defaultAnimationId && !animationIds.has(defaultAnimationId)) {
    throw new Error("defaultAnimationId must reference a known animation.");
  }

  const normalizedWorkspace = normalizePersistedBoardWorkspace(
    width,
    height,
    frames[0].pixels,
    data.boardLayout ?? null,
    data.boardGroups ?? null,
  );

  return {
    name: typeof data.name === "string" ? sanitizeDrawingName(data.name) : "fifo-project",
    width,
    height,
    frames,
    animations,
    defaultFrameId,
    defaultAnimationId,
    boardLayout: normalizedWorkspace.boardLayout,
    boardGroups: normalizedWorkspace.boardGroups,
  };
}

function loadProjectIntoEditor(project, sourceLabel) {
  applyProjectToEditor(project, sourceLabel, { syncFrame: false });
  pushHistorySnapshot(sourceLabel);
  scheduleFrameSend(sourceLabel);
  log(`Loaded project "${project.name}" into the editor with ${project.frames.length} frames and ${project.animations.length} clips.`);
}

async function loadEditorStateFromFile(file) {
  const content = await file.text();
  const data = JSON.parse(content);

  if (Array.isArray(data.frames)) {
    const project = validateLoadedProject(data);
    project.activeFrameId = typeof data.activeFrameId === "string" ? data.activeFrameId.trim() : null;
    project.activeAnimationId = typeof data.activeAnimationId === "string" ? data.activeAnimationId.trim() : null;
    loadProjectIntoEditor(project, "load");
    return;
  }

  const drawing = validateLoadedDrawing(data);
  applyDrawing(drawing, "load");
  log(`Loaded drawing "${drawing.name}" (${drawing.width}x${drawing.height}).`);
}

function handleServerMessage(message) {
  if (!message || typeof message !== "object") {
    log("Pi sent an unsupported message.");
    return;
  }

  if (message.type === "error") {
    log(`Pi error: ${message.message}`);
    return;
  }

  if (message.type === "brightness" && Number.isInteger(message.value)) {
    state.brightness = clampBrightness(message.value);
    syncBrightnessInputs();
    log(`Pi brightness is now ${state.brightness}.`);
    return;
  }

  if (
    message.type === "state"
    && Number.isInteger(message.width)
    && Number.isInteger(message.height)
    && Number.isInteger(message.brightness)
    && Number.isInteger(message.rotate)
    && Number.isInteger(message.block_orientation)
    && typeof message.reverse_order === "boolean"
  ) {
    const previousRuntime = { ...state.runtime };
    setConnectedDisplaySize(message.width, message.height);
    state.brightness = clampBrightness(message.brightness);
    syncBrightnessInputs();
    applyLayoutState({
      rotate: message.rotate,
      blockOrientation: message.block_orientation,
      reverseOrder: message.reverse_order,
      panelOrder: message.panel_order ?? null,
      panelRotations: message.panel_rotations ?? panelRotationsFromFlips(message.panel_flips ?? null),
      panelMirrors: message.panel_mirrors ?? null,
    });
    const syncedGrid = syncGridToConnectedDisplay("Pi state sync");
    if (Array.isArray(message.drawings)) {
      state.piDrawings = message.drawings
        .filter((value) => typeof value === "string")
        .map((value) => sanitizeDrawingName(value));
      syncPiDrawingOptions();
    }
    if (Array.isArray(message.projects)) {
      state.piProjects = message.projects
        .filter((value) => typeof value === "string")
        .map((value) => sanitizeDrawingName(value));
      syncPiProjectOptions();
    }
    applyPiRuntimeState(message);
    log(
      `Pi state synced: ${message.width}x${message.height}, brightness ${state.brightness}, `
      + `${state.piDrawings.length} saved drawing${state.piDrawings.length === 1 ? "" : "s"}, `
      + `${state.piProjects.length} project${state.piProjects.length === 1 ? "" : "s"}.`,
    );
    if (syncedGrid) {
      log("Kept the local editor grid in sync with the connected Pi display.");
    }
    if (message.layout_persisted === false) {
      log("Pi layout has live changes that are not saved to config yet.");
    }
    if (message.brightness_persisted === false) {
      log("Pi brightness is currently a live value and is not saved to config yet.");
    }
    const enteredProjectMode = state.runtime.mode === "project"
      && state.runtime.activeProject
      && (
        previousRuntime.mode !== "project"
        || previousRuntime.activeProject !== state.runtime.activeProject
        || previousRuntime.activeTargetType !== state.runtime.activeTargetType
        || previousRuntime.activeTargetName !== state.runtime.activeTargetName
      );
    const enteredLiveMode = state.runtime.mode === "live"
      && (
        previousRuntime.mode !== "live"
        || previousRuntime.liveOverrideActive !== state.runtime.liveOverrideActive
      );
    const enteredIdleMode = state.runtime.mode === "idle" && previousRuntime.mode !== "idle";

    if (enteredProjectMode) {
      log(
        `Pi is running project "${state.runtime.activeProject}". `
        + "Draw on the website or click Send Now when you want temporary live control.",
      );
    } else if (enteredLiveMode) {
      if (state.runtime.activeProject) {
        log(
          `Website live control is now overriding project "${state.runtime.activeProject}". `
          + "Use Resume Saved Project or disconnect when you want the Pi runtime back.",
        );
      } else {
        log("Pi switched into live website control.");
      }
    } else if (enteredIdleMode || previousRuntime.mode == null) {
      log("Pi is ready. Draw on the website or click Send Now to start a temporary live session.");
    }
    return;
  }

  if (
    (message.type === "layout_state" || message.type === "layout_saved")
    && Number.isInteger(message.rotate)
    && Number.isInteger(message.block_orientation)
    && typeof message.reverse_order === "boolean"
  ) {
    setConnectedDisplaySize(message.width, message.height);
    applyLayoutState({
      rotate: message.rotate,
      blockOrientation: message.block_orientation,
      reverseOrder: message.reverse_order,
      panelOrder: message.panel_order ?? null,
      panelRotations: message.panel_rotations ?? panelRotationsFromFlips(message.panel_flips ?? null),
      panelMirrors: message.panel_mirrors ?? null,
    });
    const syncedGrid = syncGridToConnectedDisplay("Pi layout sync");
    log(
      message.type === "layout_saved"
        ? "Pi layout was saved to config."
        : "Pi layout is now in sync with the desktop controls.",
    );
    if (syncedGrid) {
      log("Kept the local editor grid aligned with the Pi display after the layout update.");
    }
    return;
  }

  if (message.type === "drawings_list" && Array.isArray(message.drawings)) {
    state.piDrawings = message.drawings
      .filter((value) => typeof value === "string")
      .map((value) => sanitizeDrawingName(value));
    syncPiDrawingOptions();
    log(`Pi has ${state.piDrawings.length} saved drawing${state.piDrawings.length === 1 ? "" : "s"}.`);
    return;
  }

  if (message.type === "projects_list" && Array.isArray(message.projects)) {
    state.piProjects = message.projects
      .filter((value) => typeof value === "string")
      .map((value) => sanitizeDrawingName(value));
    syncPiProjectOptions();
    log(`Pi has ${state.piProjects.length} project${state.piProjects.length === 1 ? "" : "s"}.`);
    return;
  }

  if (message.type === "drawing_saved" && typeof message.name === "string") {
    const savedName = sanitizeDrawingName(message.name);
    if (!state.piDrawings.includes(savedName)) {
      state.piDrawings = [...state.piDrawings, savedName].sort((left, right) => left.localeCompare(right));
      syncPiDrawingOptions();
    }
    log(`Pi saved drawing "${savedName}".`);
    return;
  }

  if (message.type === "project_saved" && typeof message.name === "string") {
    const savedName = sanitizeDrawingName(message.name);
    if (!state.piProjects.includes(savedName)) {
      state.piProjects = [...state.piProjects, savedName].sort((left, right) => left.localeCompare(right));
      syncPiProjectOptions();
    }
    log(`Pi saved project "${savedName}".`);
    return;
  }

  if (message.type === "drawing") {
    try {
      const drawing = validateLoadedDrawing(message);
      applyDrawing(drawing, "Pi load");
      log(`Loaded drawing "${drawing.name}" from the Pi.`);
      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load drawing from the Pi.";
      log(errorMessage);
      return;
    }
  }

  if (message.type === "project") {
    try {
      const project = validateLoadedProject(message);
      loadProjectIntoEditor(project, "Pi project load");
      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load project from the Pi.";
      log(errorMessage);
      return;
    }
  }

  if (message.type === "project_activated" && typeof message.name === "string") {
    log(`Pi is now running project "${sanitizeDrawingName(message.name)}".`);
    return;
  }

  if (message.type === "project_resumed" && typeof message.name === "string") {
    log(`Pi resumed project "${sanitizeDrawingName(message.name)}".`);
    return;
  }

  if (message.type === "project_deleted" && typeof message.name === "string") {
    const deletedName = sanitizeDrawingName(message.name);
    state.piProjects = state.piProjects.filter((value) => value !== deletedName);
    syncPiProjectOptions();
    log(`Pi deleted project "${deletedName}".`);
    return;
  }

  if (message.type === "boot_project_updated") {
    if (typeof message.name === "string" && message.name.trim()) {
      log(`Pi boot project is now "${sanitizeDrawingName(message.name)}".`);
      return;
    }

    log("Pi boot project was cleared.");
    return;
  }

  log(`Pi says: ${JSON.stringify(message)}`);
}

function connect() {
  if (state.socket && state.socket.readyState === WebSocket.OPEN) {
    log("Already connected.");
    return;
  }

  const endpoint = elements.endpoint.value.trim();
  if (!endpoint) {
    log("Enter a WebSocket endpoint first.");
    return;
  }

  state.endpointName = sanitizeEndpointName(elements.endpointName.value || inferEndpointName(endpoint));
  elements.endpointName.value = state.endpointName;
  syncConnectionSummary();
  upsertSavedEndpoint("connect");

  setStatus("Connecting", "connecting");
  log(`Connecting to ${endpoint} ...`);

  const socket = new WebSocket(endpoint);
  state.socket = socket;

  socket.addEventListener("open", () => {
    setStatus("Connected", "connected");
    log(`Connected to ${endpoint}.`);
    requestPiState("connect");
  });

  socket.addEventListener("close", () => {
    setStatus("Disconnected", "idle");
    clearConnectedDisplaySize();
    syncLayoutInputs();
    updatePiRuntimeStatus();
    if (state.runtime.mode === "live" && state.runtime.activeProject) {
      log(`Connection closed. The Pi can return to project "${state.runtime.activeProject}" once the live session ends.`);
    }
    log("Connection closed.");
    if (state.socket === socket) {
      state.socket = null;
    }
  });

  socket.addEventListener("error", () => {
    setStatus("Error", "error");
    log("WebSocket error. Check the endpoint and Pi server.");
  });

  socket.addEventListener("message", (event) => {
    try {
      handleServerMessage(JSON.parse(event.data));
    } catch (error) {
      log(`Pi says: ${event.data}`);
    }
  });
}

function disconnect() {
  if (!state.socket) {
    log("No active connection to close.");
    return;
  }

  state.socket.close();
}

function clearGrid() {
  setAllPixels(0);
  pushHistorySnapshot("clear");
  sendMessage({ type: "clear", version: 1 });
  log("Cleared local grid.");
}

function sendCurrentFrame() {
  const sent = sendMessage(buildFrameMessage());
  if (sent) {
    log(`Sent frame manually (${state.width}x${state.height}).`);
  } else {
    log("Not connected. Frame was not sent.");
  }
}

function bindEvents() {
  elements.studioResizer.addEventListener("pointerdown", startStudioSidebarResize);
  elements.studioResizer.addEventListener("dblclick", () => {
    resetStudioSidebarWidth();
  });
  elements.studioResizer.addEventListener("keydown", (event) => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      return;
    }

    const { minimum, maximum } = getStudioSidebarWidthLimits();
    const currentWidth = getCurrentStudioSidebarWidth();

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      applyStudioSidebarWidth(currentWidth - STUDIO_SIDEBAR_RESIZE_STEP, { persist: true });
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      applyStudioSidebarWidth(currentWidth + STUDIO_SIDEBAR_RESIZE_STEP, { persist: true });
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      applyStudioSidebarWidth(minimum, { persist: true });
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      applyStudioSidebarWidth(maximum, { persist: true });
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      resetStudioSidebarWidth();
    }
  });
  elements.workspacePanelResizer.addEventListener("pointerdown", startWorkspaceAnimationPaneResize);
  elements.workspacePanelResizer.addEventListener("dblclick", () => {
    resetWorkspaceAnimationPaneWidth();
  });
  elements.workspacePanelResizer.addEventListener("keydown", (event) => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      return;
    }

    const { minimum, maximum } = getWorkspaceAnimationPaneWidthLimits();
    const currentWidth = getCurrentWorkspaceAnimationPaneWidth();

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      applyWorkspaceAnimationPaneWidth(
        currentWidth + WORKSPACE_ANIMATION_PANE_RESIZE_STEP,
        { persist: true },
      );
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      applyWorkspaceAnimationPaneWidth(
        currentWidth - WORKSPACE_ANIMATION_PANE_RESIZE_STEP,
        { persist: true },
      );
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      applyWorkspaceAnimationPaneWidth(minimum, { persist: true });
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      applyWorkspaceAnimationPaneWidth(maximum, { persist: true });
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      resetWorkspaceAnimationPaneWidth();
    }
  });
  elements.workspaceTimelineResizer.addEventListener("pointerdown", startWorkspaceTimelineResize);
  elements.workspaceTimelinePanel.addEventListener("pointerdown", (event) => {
    if (!shouldStartWorkspaceTimelineResizeFromPanel(event)) {
      return;
    }

    startWorkspaceTimelineResize(event);
  });
  elements.workspaceTimelineResizer.addEventListener("dblclick", () => {
    resetWorkspaceStudioHeight();
  });
  elements.workspaceTimelineResizer.addEventListener("keydown", (event) => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      return;
    }

    const { minimum, maximum } = getWorkspaceStudioHeightLimits();
    const currentHeight = getCurrentWorkspaceStudioHeight();

    if (event.key === "ArrowUp") {
      event.preventDefault();
      applyWorkspaceStudioHeight(
        currentHeight - WORKSPACE_STUDIO_HEIGHT_RESIZE_STEP,
        { persist: true },
      );
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      applyWorkspaceStudioHeight(
        currentHeight + WORKSPACE_STUDIO_HEIGHT_RESIZE_STEP,
        { persist: true },
      );
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      applyWorkspaceStudioHeight(minimum, { persist: true });
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      applyWorkspaceStudioHeight(maximum, { persist: true });
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      resetWorkspaceStudioHeight();
    }
  });
  elements.applySavedEndpointButton.addEventListener("click", applySavedEndpoint);
  elements.deleteSavedEndpointButton.addEventListener("click", deleteSavedEndpoint);
  elements.saveEndpointButton.addEventListener("click", () => {
    upsertSavedEndpoint("manual save");
  });
  elements.endpoint.addEventListener("input", syncConnectionSummary);
  elements.endpointName.addEventListener("input", syncConnectionSummary);
  elements.savedEndpointSelect.addEventListener("change", () => {
    const selectedUrl = elements.savedEndpointSelect.value;
    if (!selectedUrl) {
      syncConnectionSummary();
      return;
    }

    const savedEndpoint = state.savedEndpoints.find((entry) => entry.url === selectedUrl);
    if (!savedEndpoint) {
      syncConnectionSummary();
      return;
    }

    elements.endpointName.value = savedEndpoint.name;
    syncConnectionSummary();
  });
  elements.connectButton.addEventListener("click", connect);
  elements.disconnectButton.addEventListener("click", disconnect);
  elements.resizeButton.addEventListener("click", resizeGrid);
  elements.drawingName.addEventListener("change", () => {
    state.drawingName = sanitizeDrawingName(elements.drawingName.value);
    elements.drawingName.value = state.drawingName;
    pushHistorySnapshot("drawing rename");
  });
  elements.newFrameButton.addEventListener("click", addProjectFrame);
  elements.duplicateFrameButton.addEventListener("click", duplicateProjectFrame);
  elements.deleteFrameButton.addEventListener("click", deleteProjectFrame);
  elements.moveFrameLeftButton.addEventListener("click", () => {
    moveProjectFrame(-1);
  });
  elements.moveFrameRightButton.addEventListener("click", () => {
    moveProjectFrame(1);
  });
  elements.frameStrip.addEventListener("click", (event) => {
    const target = event.target.closest("[data-frame-id]");
    if (!target) {
      return;
    }

    selectProjectFrame(target.dataset.frameId);
  });
  elements.frameName.addEventListener("change", renameActiveFrame);
  elements.defaultTargetSelect.addEventListener("change", setProjectDefaultTarget);
  elements.animationSelect.addEventListener("change", () => {
    selectProjectAnimation(elements.animationSelect.value);
  });
  elements.newAnimationButton.addEventListener("click", createProjectAnimation);
  elements.deleteAnimationButton.addEventListener("click", deleteActiveAnimation);
  elements.previewAnimationButton.addEventListener("click", startAnimationPreview);
  elements.stopAnimationPreviewButton.addEventListener("click", () => {
    if (state.project.previewTimer == null) {
      log("No animation preview is running.");
      return;
    }

    stopAnimationPreview({
      logStop: true,
      statusMessage: "Preview stopped.",
    });
    updateProjectEditorControls();
  });
  elements.animationName.addEventListener("change", renameActiveAnimation);
  elements.animationLoopInput.addEventListener("change", () => {
    setActiveAnimationLoop(elements.animationLoopInput.checked);
  });
  elements.addAnimationStepButton.addEventListener("click", addAnimationStepFromCurrentFrame);
  elements.animationStepList.addEventListener("change", (event) => {
    const row = event.target.closest("[data-step-index]");
    if (!row) {
      return;
    }

    const stepIndex = Number(row.dataset.stepIndex);
    if (!Number.isInteger(stepIndex)) {
      return;
    }

    if (event.target.dataset.stepField === "frame") {
      updateAnimationStep(stepIndex, "frame", event.target.value);
      return;
    }

    if (event.target.dataset.stepField === "duration") {
      updateAnimationStep(stepIndex, "duration", event.target.value);
    }
  });
  elements.animationStepList.addEventListener("click", (event) => {
    const target = event.target.closest("[data-step-action]");
    if (!target) {
      return;
    }

    if (target.dataset.stepAction === "new-animation") {
      createProjectAnimation();
      return;
    }

    if (target.dataset.stepAction === "insert-at") {
      const insertIndex = Number(target.dataset.insertIndex);
      if (Number.isInteger(insertIndex)) {
        addAnimationStepFromCurrentFrame(insertIndex);
      }
      return;
    }

    const row = target.closest("[data-step-index]");
    if (!row) {
      return;
    }

    const stepIndex = Number(row.dataset.stepIndex);
    if (!Number.isInteger(stepIndex)) {
      return;
    }

    if (target.dataset.stepAction === "select" || target.dataset.stepAction === "focus-frame") {
      selectAnimationStep(stepIndex);
      return;
    }

    if (target.dataset.stepAction === "insert-before") {
      addAnimationStepFromCurrentFrame(stepIndex);
      return;
    }

    if (target.dataset.stepAction === "insert-after") {
      addAnimationStepFromCurrentFrame(stepIndex + 1);
      return;
    }

    if (target.dataset.stepAction === "duration-preset") {
      updateAnimationStep(stepIndex, "duration", target.dataset.durationMs);
      return;
    }

    if (target.dataset.stepAction === "move-up") {
      moveAnimationStep(stepIndex, -1);
      return;
    }

    if (target.dataset.stepAction === "move-down") {
      moveAnimationStep(stepIndex, 1);
      return;
    }

    if (target.dataset.stepAction === "delete") {
      deleteAnimationStep(stepIndex);
    }
  });
  elements.brightnessRange.addEventListener("input", () => {
    setBrightness(Number(elements.brightnessRange.value), "slider change");
  });
  elements.brightnessValue.addEventListener("change", () => {
    setBrightness(Number(elements.brightnessValue.value), "number change");
  });
  elements.applyLayoutPresetButton.addEventListener("click", applyLayoutPreset);
  elements.refreshLayoutButton.addEventListener("click", () => {
    requestLayoutState("manual refresh");
  });
  elements.saveLayoutButton.addEventListener("click", saveLayoutToPi);
  elements.rotateSelect.addEventListener("change", () => {
    setLayout("rotate change");
  });
  elements.blockOrientationSelect.addEventListener("change", () => {
    setLayout("block orientation change");
  });
  elements.reverseOrderInput.addEventListener("change", () => {
    setLayout("reverse order change");
  });
  elements.panelOrderInput.addEventListener("change", () => {
    setLayout("panel order change");
  });
  elements.pixelColor.addEventListener("input", () => {
    state.pixelColor = normalizeHexColor(elements.pixelColor.value);
    applyPixelColor();
    savePixelColorPreference();
  });
  elements.paintModeButton.addEventListener("click", () => {
    state.drawValue = 1;
    updateModeButtons();
  });
  elements.eraseModeButton.addEventListener("click", () => {
    state.drawValue = 0;
    updateModeButtons();
  });
  elements.undoButton.addEventListener("click", undoHistory);
  elements.redoButton.addEventListener("click", redoHistory);
  elements.clearButton.addEventListener("click", clearGrid);
  elements.fillButton.addEventListener("click", () => {
    setAllPixels(1);
    pushHistorySnapshot("fill");
    log("Filled the grid.");
  });
  elements.newBoardGroupButton.addEventListener("click", createNewBoardGroup);
  elements.checkerButton.addEventListener("click", () => {
    applyCheckerPattern();
    pushHistorySnapshot("checker pattern");
    log("Applied checker pattern.");
  });
  elements.borderButton.addEventListener("click", () => {
    applyBorderPattern();
    pushHistorySnapshot("border pattern");
    log("Applied border pattern.");
  });
  elements.horizontalLineButton.addEventListener("click", () => {
    applyHorizontalLinePattern();
    pushHistorySnapshot("horizontal line pattern");
    log("Applied horizontal line pattern.");
  });
  elements.verticalLineButton.addEventListener("click", () => {
    applyVerticalLinePattern();
    pushHistorySnapshot("vertical line pattern");
    log("Applied vertical line pattern.");
  });
  elements.movingDotButton.addEventListener("click", () => {
    startPatternPlayback("moving dot");
  });
  elements.panelIndexTestButton.addEventListener("click", () => {
    startPatternPlayback("panel index test");
  });
  elements.stopPatternButton.addEventListener("click", () => {
    if (!state.activePattern) {
      log("No active pattern is running.");
      return;
    }

    stopPatternPlayback("manually");
  });
  elements.movingDotSpeed.addEventListener("change", () => {
    setMovingDotSpeed(Number(elements.movingDotSpeed.value));
  });
  elements.movingDotFps.addEventListener("change", () => {
    setMovingDotFps(Number(elements.movingDotFps.value));
  });
  elements.saveButton.addEventListener("click", saveDrawing);
  elements.loadButton.addEventListener("click", () => {
    elements.loadInput.click();
  });
  elements.saveToPiButton.addEventListener("click", saveDrawingToPi);
  elements.refreshPiDrawingsButton.addEventListener("click", () => {
    requestPiDrawingList("manual refresh");
  });
  elements.loadFromPiButton.addEventListener("click", loadDrawingFromPi);
  elements.saveProjectToPiButton.addEventListener("click", saveProjectToPi);
  elements.refreshPiProjectsButton.addEventListener("click", () => {
    requestPiProjectList("manual refresh");
  });
  elements.loadProjectFromPiButton.addEventListener("click", loadProjectFromPi);
  elements.activateProjectButton.addEventListener("click", activateProjectOnPi);
  elements.setBootProjectButton.addEventListener("click", setBootProjectOnPi);
  elements.clearBootProjectButton.addEventListener("click", clearBootProjectOnPi);
  elements.resumeProjectButton.addEventListener("click", resumeProjectOnPi);
  elements.deleteProjectButton.addEventListener("click", deleteProjectFromPi);
  elements.loadInput.addEventListener("change", async () => {
    const [file] = elements.loadInput.files;
    if (!file) {
      return;
    }

    try {
      await loadEditorStateFromFile(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load JSON.";
      log(message);
    } finally {
      elements.loadInput.value = "";
    }
  });
  elements.sendButton.addEventListener("click", sendCurrentFrame);
  elements.clearLogButton.addEventListener("click", () => {
    elements.logOutput.textContent = "";
  });

  window.addEventListener("pointermove", (event) => {
    if (updateStudioSidebarResize(event)) {
      return;
    }

    if (updateWorkspaceAnimationPaneResize(event)) {
      return;
    }

    if (updateWorkspaceTimelineResize(event)) {
      return;
    }

    updateBoardDrag(event);
  });
  window.addEventListener("pointerup", (event) => {
    if (finishStudioSidebarResize(event)) {
      return;
    }

    if (finishWorkspaceAnimationPaneResize(event)) {
      return;
    }

    if (finishWorkspaceTimelineResize(event)) {
      return;
    }

    if (finishBoardDrag()) {
      state.isPointerDown = false;
      state.strokeHasChanges = false;
      return;
    }

    state.isPointerDown = false;
    if (state.strokeHasChanges) {
      pushHistorySnapshot("drawing stroke");
      state.strokeHasChanges = false;
    }
  });
  window.addEventListener("pointerleave", () => {
    if (state.sidebarResize || state.workspacePaneResize || state.workspaceTimelineResize || state.boardDrag) {
      return;
    }

    state.isPointerDown = false;
  });
  window.addEventListener("pointercancel", (event) => {
    if (finishStudioSidebarResize(event)) {
      return;
    }

    if (finishWorkspaceAnimationPaneResize(event)) {
      return;
    }

    if (finishWorkspaceTimelineResize(event)) {
      return;
    }

    if (state.boardDrag) {
      state.boardDrag = null;
      renderGrid();
      return;
    }

    state.isPointerDown = false;
    if (state.strokeHasChanges) {
      pushHistorySnapshot("drawing stroke");
      state.strokeHasChanges = false;
    }
  });
  window.addEventListener("resize", () => {
    loadStudioSidebarWidthPreference();
    loadWorkspaceAnimationPaneWidthPreference();
    loadWorkspaceStudioHeightPreference();
    if (state.project.previewTimer == null) {
      renderSelectedAnimationPreview();
    }
  });
  window.addEventListener("keydown", (event) => {
    const isUndo = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z";
    const isRedo = ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y")
      || ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "z");

    if (!isUndo && !isRedo) {
      return;
    }

    const activeTagName = document.activeElement?.tagName;
    if (activeTagName === "INPUT" || activeTagName === "TEXTAREA" || activeTagName === "SELECT") {
      return;
    }

    event.preventDefault();
    if (isUndo) {
      undoHistory();
      return;
    }

    redoHistory();
  });
}

function init() {
  loadSavedEndpoints();
  loadPixelColorPreference();
  loadStudioSidebarWidthPreference();
  loadWorkspaceAnimationPaneWidthPreference();
  loadWorkspaceStudioHeightPreference();
  state.boardLayout = createBoardLayoutFromFrame(state.width, state.height, state.pixels);
  syncBoardGroups(state.boardLayout, [DEFAULT_BOARD_GROUP_ID]);
  elements.gridWidth.value = String(state.width);
  elements.gridHeight.value = String(state.height);
  elements.drawingName.value = state.drawingName;
  elements.endpointName.value = state.endpointName;
  if (state.savedEndpoints[0]) {
    elements.endpoint.value = state.savedEndpoints[0].url;
    elements.endpointName.value = state.savedEndpoints[0].name;
    state.endpointName = state.savedEndpoints[0].name;
  }
  initializeCollapsibleCards();
  syncConnectionSummary();
  syncBrightnessInputs();
  syncLayoutInputs();
  applyPixelColor();
  syncMovingDotInputs();
  syncPiDrawingOptions();
  syncPiProjectOptions();
  syncSavedEndpointOptions();
  updatePiRuntimeStatus();
  renderGrid();
  renderProjectEditor();
  updateModeButtons();
  pushHistorySnapshot("startup");
  loadAutosave();
  bindEvents();
  initializeGridWorkspaceObserver();
  scheduleGridWorkspaceScaleUpdate();
  updateHistoryButtons();
  log("Editor ready.");
  log("Set the Pi endpoint, connect, and start drawing.");
}

init();
