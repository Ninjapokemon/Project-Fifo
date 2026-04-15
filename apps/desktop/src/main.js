const DEFAULT_WIDTH = 16;
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
const PANEL_INDEX_TEST_FPS = 2;
const HISTORY_LIMIT = 48;
const AUTOSAVE_STORAGE_KEY = "project-fifo.autosave";
const PI_ENDPOINTS_STORAGE_KEY = "project-fifo.pi-endpoints";
const PIXEL_COLOR_STORAGE_KEY = "project-fifo.pixel-color";
const DEFAULT_ENDPOINT_NAME = "Workshop Pi";
const DEFAULT_PIXEL_COLOR = "#7CF7D4";
const PIXEL_CELL_SIZE = 28;
const DEFAULT_LAYOUT = {
  rotate: 0,
  blockOrientation: 90,
  reverseOrder: false,
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
  pixelColor: DEFAULT_PIXEL_COLOR,
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
  pixelColor: document.querySelector("#pixelColor"),
  pixelColorValue: document.querySelector("#pixelColorValue"),
  paintModeButton: document.querySelector("#paintModeButton"),
  eraseModeButton: document.querySelector("#eraseModeButton"),
  undoButton: document.querySelector("#undoButton"),
  redoButton: document.querySelector("#redoButton"),
  clearButton: document.querySelector("#clearButton"),
  fillButton: document.querySelector("#fillButton"),
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
  elements.gridMeta.textContent = `${state.width} x ${state.height}`;
}

function createEmptyPixels() {
  return Array(state.width * state.height).fill(0);
}

function indexFor(x, y) {
  return (y * state.width) + x;
}

function setPixelInArray(pixels, x, y, value = 1) {
  if (x < 0 || x >= state.width || y < 0 || y >= state.height) {
    return;
  }

  pixels[indexFor(x, y)] = value;
}

function createCell(x, y) {
  const cell = document.createElement("button");
  cell.type = "button";
  cell.className = "pixel-cell";
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

function renderGrid() {
  elements.grid.innerHTML = "";
  elements.grid.style.gridTemplateColumns = `repeat(${state.width}, ${PIXEL_CELL_SIZE}px)`;

  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      elements.grid.appendChild(createCell(x, y));
    }
  }

  syncGridDom();
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
  };
}

function buildSaveLayoutMessage() {
  return {
    type: "save_layout",
    version: 1,
    rotate: state.layout.rotate,
    block_orientation: state.layout.blockOrientation,
    reverse_order: state.layout.reverseOrder,
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
  };
}

function restoreSnapshot(snapshot, reason, options = {}) {
  stopPatternPlayback(`for ${reason}`);
  state.width = snapshot.width;
  state.height = snapshot.height;
  state.pixels = [...snapshot.pixels];
  state.drawingName = sanitizeDrawingName(snapshot.drawingName);
  elements.gridWidth.value = String(state.width);
  elements.gridHeight.value = String(state.height);
  elements.drawingName.value = state.drawingName;
  renderGrid();
  saveAutosave();
  scheduleFrameSend(reason, options);
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

  return left.pixels.every((value, index) => value === right.pixels[index]);
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
    const dimensionsMatch = autosave.width === state.width && autosave.height === state.height;
    if (!dimensionsMatch) {
      setAutosaveStatus(`Skipped autosave restore because it was ${autosave.width}x${autosave.height}.`);
      return;
    }

    state.drawingName = autosave.name;
    elements.drawingName.value = autosave.name;
    restoreSnapshot({
      width: autosave.width,
      height: autosave.height,
      pixels: autosave.pixels,
      drawingName: autosave.name,
    }, "autosave restore", { immediate: true });
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
  syncGridDom();
  saveAutosave();
  scheduleFrameSend(reason, options);
}

function applyCellValue(x, y, value) {
  stopPatternPlayback("for manual drawing");
  const index = indexFor(x, y);
  if (state.pixels[index] === value) {
    return;
  }

  state.pixels[index] = value;
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

  state.width = width;
  state.height = height;
  state.pixels = Array(width * height).fill(0);
  renderGrid();
  pushHistorySnapshot("grid resize");
  scheduleFrameSend("resize");
  log(`Resized grid to ${width}x${height}.`);
}

function applyDrawing(frame, reason) {
  stopPatternPlayback(`for ${reason}`);
  state.width = frame.width;
  state.height = frame.height;
  state.pixels = [...frame.pixels];
  elements.gridWidth.value = String(frame.width);
  elements.gridHeight.value = String(frame.height);
  renderGrid();
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
  const panelColumns = Math.max(1, Math.ceil(state.width / PANEL_SIZE));
  const panelRows = Math.max(1, Math.ceil(state.height / PANEL_SIZE));
  const panelCount = panelColumns * panelRows;
  const activePanel = frameIndex % panelCount;
  const panelX = activePanel % panelColumns;
  const panelY = Math.floor(activePanel / panelColumns);
  const startX = panelX * PANEL_SIZE;
  const startY = panelY * PANEL_SIZE;
  const endX = Math.min(startX + PANEL_SIZE, state.width);
  const endY = Math.min(startY + PANEL_SIZE, state.height);

  for (let x = startX; x < endX; x += 1) {
    setPixelInArray(pixels, x, startY);
    setPixelInArray(pixels, x, endY - 1);
  }

  for (let y = startY; y < endY; y += 1) {
    setPixelInArray(pixels, startX, y);
    setPixelInArray(pixels, endX - 1, y);
  }

  const localBits = Math.min(6, Math.max(0, endX - startX - 2));
  for (let bit = 0; bit < localBits; bit += 1) {
    if ((activePanel >> bit) & 1) {
      setPixelInArray(pixels, startX + 1 + bit, startY + 1);
    }
  }

  setPixelInArray(
    pixels,
    Math.min(endX - 1, startX + Math.floor((endX - startX) / 2)),
    Math.min(endY - 1, startY + Math.floor((endY - startY) / 2)),
  );

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
  elements.layoutPreset.value = findMatchingLayoutPreset();
}

function applyLayoutState(layout) {
  state.layout = {
    rotate: clampRotate(layout.rotate),
    blockOrientation: normalizeBlockOrientation(layout.blockOrientation),
    reverseOrder: Boolean(layout.reverseOrder),
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
  const nextLayout = {
    rotate: clampRotate(Number(elements.rotateSelect.value)),
    blockOrientation: normalizeBlockOrientation(elements.blockOrientationSelect.value),
    reverseOrder: elements.reverseOrderInput.checked,
  };
  const changed = state.layout.rotate !== nextLayout.rotate
    || state.layout.blockOrientation !== nextLayout.blockOrientation
    || state.layout.reverseOrder !== nextLayout.reverseOrder;

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
      + `reverse order ${state.layout.reverseOrder ? "on" : "off"}, and re-sent the current frame.`,
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

  applyLayoutState(preset);
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

  return {
    name: typeof data.name === "string" ? sanitizeDrawingName(data.name) : "fifo-drawing",
    width,
    height,
    pixels: normalizedPixels,
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
    state.brightness = clampBrightness(message.brightness);
    syncBrightnessInputs();
    applyLayoutState({
      rotate: message.rotate,
      blockOrientation: message.block_orientation,
      reverseOrder: message.reverse_order,
    });
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
    applyLayoutState({
      rotate: message.rotate,
      blockOrientation: message.block_orientation,
      reverseOrder: message.reverse_order,
    });
    log(
      message.type === "layout_saved"
        ? "Pi layout was saved to config."
        : "Pi layout is now in sync with the desktop controls.",
    );
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
    sendMessage(buildFrameMessage());
    log("Sent initial frame after connect.");
    requestPiState("connect");
  });

  socket.addEventListener("close", () => {
    setStatus("Disconnected", "idle");
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

  window.addEventListener("pointerup", () => {
    state.isPointerDown = false;
    if (state.strokeHasChanges) {
      pushHistorySnapshot("drawing stroke");
      state.strokeHasChanges = false;
    }
  });
  window.addEventListener("pointerleave", () => {
    state.isPointerDown = false;
  });
  window.addEventListener("pointercancel", () => {
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
