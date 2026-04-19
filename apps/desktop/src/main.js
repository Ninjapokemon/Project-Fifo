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
const AUTOSAVE_STORAGE_KEY = "project-fifo.autosave";
const PI_ENDPOINTS_STORAGE_KEY = "project-fifo.pi-endpoints";
const PIXEL_COLOR_STORAGE_KEY = "project-fifo.pixel-color";
const DEFAULT_ENDPOINT_NAME = "Workshop Pi";
const DEFAULT_PIXEL_COLOR = "#7CF7D4";
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
  piDrawings: [],
  savedEndpoints: [],
  brightness: DEFAULT_BRIGHTNESS,
  layout: { ...DEFAULT_LAYOUT },
  connectedDisplayWidth: null,
  connectedDisplayHeight: null,
  pixelColor: DEFAULT_PIXEL_COLOR,
  boardLayout: [],
  boardGroups: [DEFAULT_BOARD_GROUP_ID],
  boardDrag: null,
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

function updateGridMeta() {
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

  const previousWidth = state.width;
  const previousHeight = state.height;
  const resizedPixels = resizePixelBuffer(
    state.pixels,
    previousWidth,
    previousHeight,
    targetWidth,
    targetHeight,
  );
  const normalizedWorkspace = normalizePersistedBoardWorkspace(
    targetWidth,
    targetHeight,
    resizedPixels,
    serializeBoardLayout(state.boardLayout),
    [...state.boardGroups],
  );
  applyBoardFrame(normalizedWorkspace.boardLayout, normalizedWorkspace.boardGroups);
  elements.gridWidth.value = String(state.width);
  elements.gridHeight.value = String(state.height);
  renderGrid();
  pushHistorySnapshot(reason);
  log(
    `Synced the editor grid to the Pi display (${state.width}x${state.height}) after ${reason}. `
    + "Preserved overlapping pixels.",
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
  state.isPointerDown = false;

  state.boardDrag = {
    boardId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    originGridX: board.visualGridX,
    originGridY: board.visualGridY,
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

  const nextGridX = Math.max(
    0,
    state.boardDrag.originGridX + Math.round((event.clientX - state.boardDrag.startClientX) / BOARD_SLOT_PITCH_X),
  );
  const nextGridY = Math.max(
    0,
    state.boardDrag.originGridY + Math.round((event.clientY - state.boardDrag.startClientY) / BOARD_SLOT_PITCH_Y),
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
  const workspace = document.createElement("div");
  const workspaceSize = calculateWorkspaceSize(boardLayout);
  const boardsByGroup = new Map();

  workspace.className = "pixel-grid-workspace";
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

  elements.grid.appendChild(workspace);
  updateGridMeta();
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
  return {
    type: "save_drawing",
    version: 1,
    name: state.drawingName,
    width: state.width,
    height: state.height,
    pixels: state.pixels,
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

function createEditorSnapshot() {
  return {
    width: state.width,
    height: state.height,
    pixels: [...state.pixels],
    drawingName: state.drawingName,
    boardLayout: cloneBoardLayout(),
    boardGroups: [...state.boardGroups],
  };
}

function restoreSnapshot(snapshot, reason, options = {}) {
  stopPatternPlayback(`for ${reason}`);
  const fittedSnapshot = fitFrameToConnectedDisplay(snapshot);
  const pixelsChanged = state.width !== fittedSnapshot.width
    || state.height !== fittedSnapshot.height
    || state.pixels.length !== fittedSnapshot.pixels.length
    || state.pixels.some((value, index) => value !== fittedSnapshot.pixels[index]);
  state.drawingName = sanitizeDrawingName(snapshot.drawingName);
  const normalizedWorkspace = normalizePersistedBoardWorkspace(
    fittedSnapshot.width,
    fittedSnapshot.height,
    fittedSnapshot.pixels,
    snapshot.boardLayout,
    snapshot.boardGroups,
  );
  applyBoardFrame(normalizedWorkspace.boardLayout, normalizedWorkspace.boardGroups);
  elements.gridWidth.value = String(state.width);
  elements.gridHeight.value = String(state.height);
  elements.drawingName.value = state.drawingName;
  renderGrid();
  saveAutosave();
  if (fittedSnapshot.resized) {
    log(
      `Adjusted the restored editor snapshot to the connected Pi display `
      + `(${state.width}x${state.height}) so live updates stay in sync.`,
    );
  }
  if (options.syncFrame !== false && pixelsChanged) {
    scheduleFrameSend(reason, options);
  }
}

function snapshotsMatch(left, right) {
  if (!left || !right) {
    return false;
  }

  if (left.width !== right.width || left.height !== right.height || left.drawingName !== right.drawingName) {
    return false;
  }

  if (left.pixels.length !== right.pixels.length) {
    return false;
  }

  if (!left.pixels.every((value, index) => value === right.pixels[index])) {
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
    width: state.width,
    height: state.height,
    pixels: state.pixels,
    drawingName: state.drawingName,
    boardLayout: serializeBoardLayout(),
    boardGroups: [...state.boardGroups],
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
    const autosave = validateLoadedDrawing(parsedAutosave);
    state.drawingName = autosave.name;
    elements.drawingName.value = autosave.name;
    restoreSnapshot({
      width: autosave.width,
      height: autosave.height,
      pixels: autosave.pixels,
      drawingName: autosave.name,
      boardLayout: autosave.boardLayout,
      boardGroups: autosave.boardGroups,
    }, "autosave restore", { immediate: true, syncFrame: false });
    pushHistorySnapshot("autosave restore");
    log(`Restored autosaved drawing "${autosave.name}".`);
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
  log(`Deleted saved endpoint "${removedEntry.name}".`);
}

function sendMessage(message) {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  state.socket.send(JSON.stringify(message));
  return true;
}

function scheduleFrameSend(reason, options = {}) {
  const { logSend = true, immediate = false } = options;
  if (state.sendTimer) {
    window.clearTimeout(state.sendTimer);
    state.sendTimer = null;
  }

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
  state.pixels = pixels;
  syncBoardPixelsFromFrame();
  syncGridDom();
  saveAutosave();
  scheduleFrameSend(reason, options);
}

function applyCellValue(x, y, value) {
  stopPatternPlayback("for manual drawing");
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
  saveAutosave();
  scheduleFrameSend("draw");
}

function resizeGrid() {
  stopPatternPlayback("for grid resize");
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

  state.width = width;
  state.height = height;
  state.pixels = Array(width * height).fill(0);
  state.boardLayout = createBoardLayoutFromFrame(width, height, state.pixels);
  syncBoardGroups(state.boardLayout, [DEFAULT_BOARD_GROUP_ID]);
  renderGrid();
  pushHistorySnapshot("grid resize");
  scheduleFrameSend("resize");
  log(`Resized grid to ${width}x${height}.`);
}

function applyDrawing(frame, reason) {
  stopPatternPlayback(`for ${reason}`);
  const fittedFrame = fitFrameToConnectedDisplay(frame);
  const normalizedWorkspace = normalizePersistedBoardWorkspace(
    fittedFrame.width,
    fittedFrame.height,
    fittedFrame.pixels,
    frame.boardLayout,
    frame.boardGroups,
  );
  applyBoardFrame(normalizedWorkspace.boardLayout, normalizedWorkspace.boardGroups);
  elements.gridWidth.value = String(state.width);
  elements.gridHeight.value = String(state.height);
  renderGrid();
  pushHistorySnapshot(reason);
  if (fittedFrame.resized) {
    log(
      `Adjusted the loaded drawing to the connected Pi display `
      + `(${state.width}x${state.height}) so live updates stay in sync.`,
    );
  }
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

  const drawing = {
    name: state.drawingName,
    ...buildFrameMessage(),
    boardLayout: serializeBoardLayout(),
    boardGroups: [...state.boardGroups],
  };
  const safeFilename = state.drawingName.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "fifo-drawing";
  triggerDownload(`${safeFilename}.json`, `${JSON.stringify(drawing, null, 2)}\n`);
  log(`Saved drawing "${state.drawingName}" to JSON.`);
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

  const sent = sendMessage(buildSaveDrawingMessage());
  if (sent) {
    log(`Sent drawing "${state.drawingName}" to the Pi for storage.`);
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

async function loadDrawingFromFile(file) {
  const content = await file.text();
  const data = JSON.parse(content);
  const drawing = validateLoadedDrawing(data);

  state.drawingName = drawing.name;
  elements.drawingName.value = drawing.name;
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
    log(
      `Pi state synced: ${message.width}x${message.height}, brightness ${state.brightness}, `
      + `${state.piDrawings.length} saved drawing${state.piDrawings.length === 1 ? "" : "s"}.`,
    );
    if (sendMessage(buildFrameMessage())) {
      log(
        syncedGrid
          ? "Sent the current frame after syncing the editor grid to the Pi display."
          : "Sent the current frame after Pi state sync.",
      );
    }
    if (message.layout_persisted === false) {
      log("Pi layout has live changes that are not saved to config yet.");
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
    if (syncedGrid && sendMessage(buildFrameMessage())) {
      log("Sent the current frame after syncing the editor grid to the Pi display.");
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

  if (message.type === "drawing_saved" && typeof message.name === "string") {
    const savedName = sanitizeDrawingName(message.name);
    if (!state.piDrawings.includes(savedName)) {
      state.piDrawings = [...state.piDrawings, savedName].sort((left, right) => left.localeCompare(right));
      syncPiDrawingOptions();
    }
    log(`Pi saved drawing "${savedName}".`);
    return;
  }

  if (message.type === "drawing") {
    try {
      const drawing = validateLoadedDrawing(message);
      state.drawingName = drawing.name;
      elements.drawingName.value = drawing.name;
      applyDrawing(drawing, "Pi load");
      log(`Loaded drawing "${drawing.name}" from the Pi.`);
      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load drawing from the Pi.";
      log(errorMessage);
      return;
    }
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
  elements.applySavedEndpointButton.addEventListener("click", applySavedEndpoint);
  elements.deleteSavedEndpointButton.addEventListener("click", deleteSavedEndpoint);
  elements.saveEndpointButton.addEventListener("click", () => {
    upsertSavedEndpoint("manual save");
  });
  elements.savedEndpointSelect.addEventListener("change", () => {
    const selectedUrl = elements.savedEndpointSelect.value;
    if (!selectedUrl) {
      return;
    }

    const savedEndpoint = state.savedEndpoints.find((entry) => entry.url === selectedUrl);
    if (!savedEndpoint) {
      return;
    }

    elements.endpointName.value = savedEndpoint.name;
  });
  elements.connectButton.addEventListener("click", connect);
  elements.disconnectButton.addEventListener("click", disconnect);
  elements.resizeButton.addEventListener("click", resizeGrid);
  elements.drawingName.addEventListener("change", () => {
    state.drawingName = sanitizeDrawingName(elements.drawingName.value);
    elements.drawingName.value = state.drawingName;
    pushHistorySnapshot("drawing rename");
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
  elements.loadInput.addEventListener("change", async () => {
    const [file] = elements.loadInput.files;
    if (!file) {
      return;
    }

    try {
      await loadDrawingFromFile(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load drawing.";
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
    updateBoardDrag(event);
  });
  window.addEventListener("pointerup", () => {
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
    if (state.boardDrag) {
      return;
    }

    state.isPointerDown = false;
  });
  window.addEventListener("pointercancel", () => {
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
  syncBrightnessInputs();
  syncLayoutInputs();
  applyPixelColor();
  syncMovingDotInputs();
  syncPiDrawingOptions();
  syncSavedEndpointOptions();
  renderGrid();
  updateModeButtons();
  pushHistorySnapshot("startup");
  loadAutosave();
  bindEvents();
  updateHistoryButtons();
  log("Editor ready.");
  log("Set the Pi endpoint, connect, and start drawing.");
}

init();
