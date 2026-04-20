from __future__ import annotations

import socket
import time
import zlib
from typing import Any

from luma.core.interface.serial import i2c
from luma.core.render import canvas
from luma.oled.device import ssd1306

from mapping import PANEL_SIZE, transform_panel_slice


def _short(value: Any, limit: int) -> str:
    text = str(value) if value is not None else "-"
    if len(text) <= limit:
        return text
    return f"{text[: max(0, limit - 1)]}~"


def _load_avg() -> str:
    try:
        with open("/proc/loadavg", "r", encoding="utf-8") as handle:
            return handle.read().split()[0]
    except OSError:
        return "-"


def _memory_used_percent() -> str:
    total_kb = 0
    available_kb = 0
    try:
        with open("/proc/meminfo", "r", encoding="utf-8") as handle:
            for raw_line in handle:
                if raw_line.startswith("MemTotal:"):
                    total_kb = int(raw_line.split()[1])
                elif raw_line.startswith("MemAvailable:"):
                    available_kb = int(raw_line.split()[1])
    except OSError:
        return "-"

    if total_kb <= 0:
        return "-"

    used_percent = round(((total_kb - available_kb) / total_kb) * 100)
    return str(used_percent)


def _cpu_temp_c() -> str:
    try:
        with open("/sys/class/thermal/thermal_zone0/temp", "r", encoding="utf-8") as handle:
            raw = handle.read().strip()
    except OSError:
        return "-"

    if not raw.isdigit():
        return "-"
    return str(round(int(raw) / 1000))


def _lan_ip() -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return "n/a"
    finally:
        sock.close()


class DualOledStatus:
    def __init__(self, config: dict[str, Any]):
        oled_config = config.get("oled")
        if not isinstance(oled_config, dict):
            oled_config = {}

        oled_enabled = bool(oled_config.get("enabled", True))
        self.status_enabled = oled_enabled and bool(oled_config.get("status_enabled", True))
        self.preview_enabled = oled_enabled and bool(oled_config.get("preview_enabled", True))
        self.enabled = self.status_enabled or self.preview_enabled
        self.status_device = None
        self.preview_device = None
        self._runtime_state: dict[str, Any] = {}
        self._display_state: dict[str, Any] = {}
        self._hostname = socket.gethostname()
        self._ip_address = _lan_ip()
        self._page = 0
        self._last_flip = 0.0
        self._flip_seconds = 5.0
        self._last_status_render = 0.0
        self._last_status_lines: tuple[str, ...] | None = None
        self._board_layout: list[dict[str, Any]] | None = None
        self._board_layout_signature: int = 0
        self._last_preview_render = 0.0
        self._last_preview_signature: tuple[int, int, int, int] | None = None
        self._preview_plan_key: tuple[int, int, int, int, int] | None = None
        self._preview_plan: dict[str, Any] | None = None
        status_fps = oled_config.get("status_fps", 2)
        try:
            self._status_fps = float(status_fps)
        except (TypeError, ValueError):
            self._status_fps = 2.0
        self._status_min_interval = 0.0
        if self._status_fps > 0:
            self._status_min_interval = 1.0 / self._status_fps

        preview_fps = oled_config.get("preview_fps", 8)
        try:
            self._preview_fps = float(preview_fps)
        except (TypeError, ValueError):
            self._preview_fps = 8.0
        self._preview_min_interval = 0.0
        if self._preview_fps <= 0:
            self.preview_enabled = False
            self.enabled = self.status_enabled or self.preview_enabled
        elif self.preview_enabled:
            self._preview_min_interval = 1.0 / self._preview_fps

        if not self.enabled:
            print("OLED status disabled by config.")
            return

        bus_port = int(oled_config.get("port", 1))
        status_addr = int(oled_config.get("status_address", 0x3C))
        preview_addr = int(oled_config.get("preview_address", 0x3D))

        if self.status_enabled:
            try:
                self.status_device = ssd1306(i2c(port=bus_port, address=status_addr))
                print(f"Status OLED online on I2C-{bus_port} (0x{status_addr:02x}).")
            except Exception as error:  # noqa: BLE001
                print(f"Status OLED init failed: {error}")
                self.status_enabled = False
                self.status_device = None

        if self.preview_enabled:
            try:
                self.preview_device = ssd1306(i2c(port=bus_port, address=preview_addr))
                print(f"Preview OLED online on I2C-{bus_port} (0x{preview_addr:02x}).")
            except Exception as error:  # noqa: BLE001
                print(f"Preview OLED init failed: {error}")
                self.preview_enabled = False
                self.preview_device = None

        self.enabled = self.status_enabled or self.preview_enabled
        if not self.enabled:
            print("OLED enabled but neither OLED could be initialized.")

    def update_state(
        self,
        runtime_state: dict[str, Any],
        display_state: dict[str, Any],
        board_layout: list[dict[str, Any]] | None = None,
    ) -> None:
        if not self.enabled or self.status_device is None:
            return
        self._runtime_state = dict(runtime_state)
        self._display_state = dict(display_state)
        self._board_layout = list(board_layout) if isinstance(board_layout, list) else None
        if self._board_layout is None:
            self._board_layout_signature = 0
        else:
            self._board_layout_signature = zlib.crc32(
                repr(self._board_layout).encode("utf-8")
            )
        self._preview_plan_key = None
        self._preview_plan = None
        self._render_status()

    def _build_preview_plan(self, safe_width: int, safe_height: int) -> dict[str, Any]:
        if self.preview_device is None:
            return {"boards": []}

        panel_columns = max(1, safe_width // PANEL_SIZE)
        panel_rows = max(1, safe_height // PANEL_SIZE)
        panel_count = panel_columns * panel_rows

        normalized_layout: list[dict[str, int | bool]] = []
        has_custom_layout = False
        for panel_index in range(panel_count):
            fallback_x = panel_index % panel_columns
            fallback_y = panel_index // panel_columns
            board: dict[str, Any] | None = None
            if isinstance(self._board_layout, list):
                for candidate in self._board_layout:
                    if not isinstance(candidate, dict):
                        continue
                    if candidate.get("chainIndex") == panel_index:
                        board = candidate
                        break

            visual_grid_x = int(board.get("visualGridX", fallback_x)) if board is not None else fallback_x
            visual_grid_y = int(board.get("visualGridY", fallback_y)) if board is not None else fallback_y
            view_rotation = int(board.get("viewRotation", 0)) if board is not None else 0
            if view_rotation not in (0, 90, 180, 270):
                view_rotation = 0
            view_mirror = bool(board.get("viewMirror", False)) if board is not None else False

            if visual_grid_x != fallback_x or visual_grid_y != fallback_y:
                has_custom_layout = True

            normalized_layout.append(
                {
                    "panel_index": panel_index,
                    "visual_grid_x": visual_grid_x,
                    "visual_grid_y": visual_grid_y,
                    "view_rotation": view_rotation,
                    "view_mirror": view_mirror,
                }
            )

        if not has_custom_layout:
            # Keep standard row-major shape when no custom board layout was provided.
            for board in normalized_layout:
                board["visual_grid_x"] = int(board["panel_index"]) % panel_columns
                board["visual_grid_y"] = int(board["panel_index"]) // panel_columns

        min_grid_x = min(int(board["visual_grid_x"]) for board in normalized_layout)
        min_grid_y = min(int(board["visual_grid_y"]) for board in normalized_layout)
        max_grid_x = max(int(board["visual_grid_x"]) for board in normalized_layout)
        max_grid_y = max(int(board["visual_grid_y"]) for board in normalized_layout)
        layout_columns = (max_grid_x - min_grid_x) + 1
        layout_rows = (max_grid_y - min_grid_y) + 1

        board_pitch = PANEL_SIZE + 1
        layout_width_px = max(1, (layout_columns * PANEL_SIZE) + ((layout_columns - 1) * 1))
        layout_height_px = max(1, (layout_rows * PANEL_SIZE) + ((layout_rows - 1) * 1))
        scale = max(
            1,
            min(
                self.preview_device.width // layout_width_px,
                self.preview_device.height // layout_height_px,
            ),
        )
        draw_width = layout_width_px * scale
        draw_height = layout_height_px * scale
        origin_x = (self.preview_device.width - draw_width) // 2
        origin_y = (self.preview_device.height - draw_height) // 2

        boards: list[dict[str, Any]] = []
        for board in normalized_layout:
            panel_index = int(board["panel_index"])
            logical_panel_x = panel_index % panel_columns
            logical_panel_y = panel_index // panel_columns
            panel_offset_x = logical_panel_x * PANEL_SIZE
            panel_offset_y = logical_panel_y * PANEL_SIZE

            source_offsets: list[int] = []
            for local_y in range(PANEL_SIZE):
                source_y = panel_offset_y + local_y
                for local_x in range(PANEL_SIZE):
                    source_x = panel_offset_x + local_x
                    if source_x >= safe_width or source_y >= safe_height:
                        source_offsets.append(-1)
                    else:
                        source_offsets.append((source_y * safe_width) + source_x)

            visual_x = int(board["visual_grid_x"]) - min_grid_x
            visual_y = int(board["visual_grid_y"]) - min_grid_y
            board_origin_x = origin_x + (visual_x * board_pitch * scale)
            board_origin_y = origin_y + (visual_y * board_pitch * scale)

            boards.append(
                {
                    "source_offsets": tuple(source_offsets),
                    "view_rotation": int(board["view_rotation"]),
                    "view_mirror": bool(board["view_mirror"]),
                    "board_origin_x": board_origin_x,
                    "board_origin_y": board_origin_y,
                }
            )

        return {"boards": boards, "scale": scale}

    def _get_preview_plan(self, safe_width: int, safe_height: int) -> dict[str, Any]:
        if self.preview_device is None:
            return {"boards": [], "scale": 1}
        plan_key = (
            safe_width,
            safe_height,
            self.preview_device.width,
            self.preview_device.height,
            self._board_layout_signature,
        )
        if self._preview_plan is not None and self._preview_plan_key == plan_key:
            return self._preview_plan
        self._preview_plan = self._build_preview_plan(safe_width, safe_height)
        self._preview_plan_key = plan_key
        return self._preview_plan

    def _render_status(self) -> None:
        if self.status_device is None:
            return

        now = time.monotonic()
        page_flipped = False
        if now - self._last_flip >= self._flip_seconds:
            self._page = (self._page + 1) % 2
            self._last_flip = now
            page_flipped = True
        if (
            self._status_min_interval > 0
            and not page_flipped
            and now - self._last_status_render < self._status_min_interval
        ):
            return
        self._last_status_render = now

        mode = self._runtime_state.get("runtime_mode", "-")
        project_name = _short(self._runtime_state.get("active_project", "-"), 16)
        target_name = _short(self._runtime_state.get("active_target_name", "-"), 16)
        width = self._display_state.get("width", "?")
        height = self._display_state.get("height", "?")
        brightness = self._display_state.get("brightness", "?")

        if self._page == 0:
            lines = [
                "Project Fifo",
                _short(self._hostname, 21),
                _short(self._ip_address, 21),
                f"mode:{_short(mode, 15)}",
                f"prj:{project_name}",
                f"tgt:{target_name}",
                f"mx:{width}x{height} b:{brightness}",
            ]
        else:
            now_local = time.strftime("%H:%M:%S")
            lines = [
                "Pi Stats",
                f"load:{_load_avg()}",
                f"mem:{_memory_used_percent()}%",
                f"temp:{_cpu_temp_c()}c",
                f"time:{now_local}",
                _short(f"mode:{mode}", 21),
                _short(f"ip:{self._ip_address}", 21),
            ]

        rendered_lines = tuple(lines)
        if rendered_lines == self._last_status_lines:
            return
        self._last_status_lines = rendered_lines

        with canvas(self.status_device) as draw:
            for index, line in enumerate(lines):
                draw.text((0, index * 9), line, fill="white")

    def render_preview(self, pixels: list[int], width: int, height: int) -> None:
        if not self.preview_enabled or self.preview_device is None:
            return
        now = time.monotonic()
        if (
            self._preview_min_interval > 0
            and now - self._last_preview_render < self._preview_min_interval
        ):
            return

        try:
            frame_crc = zlib.crc32(bytes(pixels))
        except ValueError:
            frame_crc = zlib.crc32(
                bytes((1 if int(pixel) != 0 else 0) for pixel in pixels)
            )

        frame_signature = (
            int(width),
            int(height),
            frame_crc,
            self._board_layout_signature,
        )
        if frame_signature == self._last_preview_signature:
            return

        self._last_preview_render = now
        self._last_preview_signature = frame_signature

        safe_width = max(1, int(width))
        safe_height = max(1, int(height))
        preview_plan = self._get_preview_plan(safe_width, safe_height)
        scale = int(preview_plan["scale"])

        with canvas(self.preview_device) as draw:
            draw.rectangle(
                (0, 0, self.preview_device.width - 1, self.preview_device.height - 1),
                outline="white",
                fill="black",
            )
            for board in preview_plan["boards"]:
                panel_slice = [
                    pixels[offset] if offset >= 0 else 0
                    for offset in board["source_offsets"]
                ]

                transformed = transform_panel_slice(
                    panel_slice,
                    int(board["view_rotation"]),
                    bool(board["view_mirror"]),
                )
                board_origin_x = int(board["board_origin_x"])
                board_origin_y = int(board["board_origin_y"])

                for local_y in range(PANEL_SIZE):
                    row_offset = local_y * PANEL_SIZE
                    for local_x in range(PANEL_SIZE):
                        if transformed[row_offset + local_x] != 1:
                            continue
                        if scale == 1:
                            draw.point((board_origin_x + local_x, board_origin_y + local_y), fill="white")
                            continue
                        left = board_origin_x + (local_x * scale)
                        top = board_origin_y + (local_y * scale)
                        draw.rectangle(
                            (left, top, left + scale - 1, top + scale - 1),
                            fill="white",
                        )

    def clear_preview(self) -> None:
        if not self.preview_enabled or self.preview_device is None:
            return
        self._last_preview_signature = None
        self._preview_plan_key = None
        self._preview_plan = None
        self.preview_device.clear()

    def shutdown(self) -> None:
        if self.status_device is not None:
            self.status_device.clear()
        if self.preview_device is not None:
            self.preview_device.clear()
        self._last_status_lines = None
        self._last_preview_signature = None
        self._preview_plan_key = None
        self._preview_plan = None
