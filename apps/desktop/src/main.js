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

const state = {
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  pixels: Array(DEFAULT_WIDTH * DEFAULT_HEIGHT).fill(0),
  drawingName: "fifo-drawing",
  piDrawings: [],
  brightness: DEFAULT_BRIGHTNESS,
  drawValue: 1,
  socket: null,
  sendTimer: null,
  isPointerDown: false,
  movingDotSpeed: DEFAULT_MOVING_DOT_SPEED,
  movingDotFps: DEFAULT_MOVING_DOT_FPS,
  activePattern: null,
  patternTimer: null,
  patternFrame: 0,
};

const elements = {
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
  paintModeButton: document.querySelector("#paintModeButton"),
  eraseModeButton: document.querySelector("#eraseModeButton"),
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
  elements.grid.style.gridTemplateColumns = `repeat(${state.width}, 24px)`;

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

function sendMessage(message) {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  state.socket.send(JSON.stringify(message));
  return true;
}

function scheduleFrameSend(reason, options = {}) {
  const { logSend = true } = options;
  if (state.sendTimer) {
    window.clearTimeout(state.sendTimer);
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
  scheduleFrameSend(reason, options);
}

function applyCellValue(x, y, value) {
  stopPatternPlayback("for manual drawing");
  const index = indexFor(x, y);
  if (state.pixels[index] === value) {
    return;
  }

  state.pixels[index] = value;
  const target = elements.grid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
  if (target) {
    target.classList.toggle("on", value === 1);
  }
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

  applyPixels(pixels, patternName, { logSend: false });
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

  setStatus("Connecting", "connecting");
  log(`Connecting to ${endpoint} ...`);

  const socket = new WebSocket(endpoint);
  state.socket = socket;

  socket.addEventListener("open", () => {
    setStatus("Connected", "connected");
    log(`Connected to ${endpoint}.`);
    sendMessage(buildFrameMessage());
    log("Sent initial frame after connect.");
    sendMessage(buildBrightnessMessage());
    log(`Sent brightness ${state.brightness} after connect.`);
    requestPiDrawingList("connect");
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
  elements.connectButton.addEventListener("click", connect);
  elements.disconnectButton.addEventListener("click", disconnect);
  elements.resizeButton.addEventListener("click", resizeGrid);
  elements.drawingName.addEventListener("change", () => {
    state.drawingName = sanitizeDrawingName(elements.drawingName.value);
    elements.drawingName.value = state.drawingName;
  });
  elements.brightnessRange.addEventListener("input", () => {
    setBrightness(Number(elements.brightnessRange.value), "slider change");
  });
  elements.brightnessValue.addEventListener("change", () => {
    setBrightness(Number(elements.brightnessValue.value), "number change");
  });
  elements.paintModeButton.addEventListener("click", () => {
    state.drawValue = 1;
    updateModeButtons();
  });
  elements.eraseModeButton.addEventListener("click", () => {
    state.drawValue = 0;
    updateModeButtons();
  });
  elements.clearButton.addEventListener("click", clearGrid);
  elements.fillButton.addEventListener("click", () => {
    setAllPixels(1);
    log("Filled the grid.");
  });
  elements.checkerButton.addEventListener("click", () => {
    applyCheckerPattern();
    log("Applied checker pattern.");
  });
  elements.borderButton.addEventListener("click", () => {
    applyBorderPattern();
    log("Applied border pattern.");
  });
  elements.horizontalLineButton.addEventListener("click", () => {
    applyHorizontalLinePattern();
    log("Applied horizontal line pattern.");
  });
  elements.verticalLineButton.addEventListener("click", () => {
    applyVerticalLinePattern();
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
  });
  window.addEventListener("pointerleave", () => {
    state.isPointerDown = false;
  });
}

function init() {
  elements.gridWidth.value = String(state.width);
  elements.gridHeight.value = String(state.height);
  elements.drawingName.value = state.drawingName;
  syncBrightnessInputs();
  syncMovingDotInputs();
  syncPiDrawingOptions();
  renderGrid();
  updateModeButtons();
  bindEvents();
  log("Editor ready.");
  log("Set the Pi endpoint, connect, and start drawing.");
}

init();
