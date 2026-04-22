from __future__ import annotations

from collections import deque
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


def _blank_pixels(width: int, height: int) -> list[int]:
    return [0] * (width * height)


def _fill_rect(
    pixels: list[int],
    width: int,
    height: int,
    left: int,
    top: int,
    right: int,
    bottom: int,
) -> None:
    clamped_left = max(0, left)
    clamped_top = max(0, top)
    clamped_right = min(width - 1, right)
    clamped_bottom = min(height - 1, bottom)
    if clamped_left > clamped_right or clamped_top > clamped_bottom:
        return
    for y in range(clamped_top, clamped_bottom + 1):
        row_offset = y * width
        for x in range(clamped_left, clamped_right + 1):
            pixels[row_offset + x] = 1


def _build_face_frame(width: int, height: int, eye_height: int, mouth_height: int = 0) -> list[int]:
    pixels = _blank_pixels(width, height)
    eye_width = max(2, width // 6)
    eye_half_width = max(1, eye_width // 2)
    center_y = max(1, (height // 3))
    left_center_x = max(2, width // 4)
    right_center_x = min(width - 3, (width * 3) // 4)
    eye_half_height = max(0, eye_height // 2)

    _fill_rect(
        pixels,
        width,
        height,
        left_center_x - eye_half_width,
        center_y - eye_half_height,
        left_center_x + eye_half_width,
        center_y + eye_half_height,
    )
    _fill_rect(
        pixels,
        width,
        height,
        right_center_x - eye_half_width,
        center_y - eye_half_height,
        right_center_x + eye_half_width,
        center_y + eye_half_height,
    )

    if mouth_height > 0:
        mouth_width = max(3, width // 3)
        mouth_center_x = width // 2
        mouth_top = min(height - 2, center_y + max(2, height // 4))
        mouth_bottom = min(height - 1, mouth_top + mouth_height - 1)
        _fill_rect(
            pixels,
            width,
            height,
            mouth_center_x - (mouth_width // 2),
            mouth_top,
            mouth_center_x + (mouth_width // 2),
            mouth_bottom,
        )

    return pixels


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
        self._active_project: dict[str, Any] | None = None
        self._mic_state: dict[str, Any] = {
            "enabled": False,
            "test_mode": False,
            "available": False,
            "message": "disabled",
            "raw": 0,
            "millivolts": 0,
            "dc_bias_mv": 0,
            "level_percent": 0,
            "peak_percent": 0,
        }
        self._mic_wave_mv_history: deque[int] = deque(maxlen=256)
        self._mic_level_history: deque[int] = deque(maxlen=256)
        microphone_config = config.get("microphone")
        if not isinstance(microphone_config, dict):
            microphone_config = {}
        runtime_bridge_config = microphone_config.get("runtime_bridge")
        if not isinstance(runtime_bridge_config, dict):
            runtime_bridge_config = {}
        self._mic_trigger_percent = self._clamp_percent(
            runtime_bridge_config.get("active_threshold", 24),
            24,
        )
        self._mic_release_percent = self._clamp_percent(
            runtime_bridge_config.get("idle_threshold", 12),
            12,
        )
        self._mic_invert_level = bool(runtime_bridge_config.get("invert_level", False))
        if self._mic_invert_level and self._mic_release_percent < self._mic_trigger_percent:
            self._mic_release_percent = self._mic_trigger_percent
        if not self._mic_invert_level and self._mic_release_percent > self._mic_trigger_percent:
            self._mic_release_percent = self._mic_trigger_percent
        self._mic_bridge_state: dict[str, Any] = {
            "enabled": False,
            "invert_level": self._mic_invert_level,
            "active_threshold": self._mic_trigger_percent,
            "idle_threshold": self._mic_release_percent,
            "speech_active": False,
            "wants_speech_active": False,
            "hold_active": False,
            "hold_remaining_ms": 0,
        }
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
        self._last_preview_signature: tuple[Any, ...] | None = None
        self._preview_plan_key: tuple[int, int, int, int, int] | None = None
        self._preview_plan: dict[str, Any] | None = None
        preview_mode = str(oled_config.get("preview_mode", "preset")).strip().lower()
        if preview_mode not in ("preset", "mirror"):
            preview_mode = "preset"
        self._preview_mode = preview_mode
        preview_event_map = oled_config.get("preview_event_map")
        self._preview_event_map = (
            dict(preview_event_map)
            if isinstance(preview_event_map, dict)
            else {
                "blink": "blink",
                "talk": "talk",
                "speak": "talk",
                "live": "live",
                "default": "idle",
            }
        )
        self._active_preview_event = "idle"
        self._active_preview_started_at = time.monotonic()
        self._active_preview_source_key: tuple[str, str, str] | None = None
        self._preset_animation_cache_key: tuple[int, int] | None = None
        self._preset_animation_cache: dict[str, dict[str, Any]] | None = None
        status_fps = oled_config.get("status_fps", 2)
        try:
            self._status_fps = float(status_fps)
        except (TypeError, ValueError):
            self._status_fps = 2.0
        self._status_min_interval = 0.0
        if self._status_fps > 0:
            self._status_min_interval = 1.0 / self._status_fps

        preview_fps = oled_config.get("preview_fps", 10)
        try:
            self._preview_fps = float(preview_fps)
        except (TypeError, ValueError):
            self._preview_fps = 10.0
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
        elif self.preview_enabled:
            print(f"OLED preview mode: {self._preview_mode}.")

    def _clamp_percent(self, value: Any, fallback: int) -> int:
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            parsed = fallback
        return max(0, min(100, parsed))

    @property
    def preview_mode(self) -> str:
        return self._preview_mode

    def tick_preview(self) -> None:
        if not self.preview_enabled or self.preview_device is None:
            return
        width = int(self._display_state.get("width", 16))
        height = int(self._display_state.get("height", 8))
        self.render_preview([], width, height)

    def update_state(
        self,
        runtime_state: dict[str, Any],
        display_state: dict[str, Any],
        board_layout: list[dict[str, Any]] | None = None,
        active_project: dict[str, Any] | None = None,
    ) -> None:
        if not self.enabled:
            return
        self._runtime_state = dict(runtime_state)
        self._display_state = dict(display_state)
        self._active_project = dict(active_project) if isinstance(active_project, dict) else None
        self._board_layout = list(board_layout) if isinstance(board_layout, list) else None
        if self._board_layout is None:
            self._board_layout_signature = 0
        else:
            self._board_layout_signature = zlib.crc32(
                repr(self._board_layout).encode("utf-8")
            )
        self._preview_plan_key = None
        self._preview_plan = None
        self._update_preview_event()
        if self.status_device is not None:
            self._render_status()
        if self.preview_enabled and self._preview_mode == "preset":
            width = int(self._display_state.get("width", 16))
            height = int(self._display_state.get("height", 8))
            self.render_preview([], width, height)

    def update_microphone_state(self, mic_state: dict[str, Any]) -> None:
        if not isinstance(mic_state, dict):
            return
        self._mic_state = {
            **self._mic_state,
            **mic_state,
        }
        millivolts = self._mic_state.get("millivolts")
        dc_bias_mv = self._mic_state.get("dc_bias_mv")
        level_percent = self._mic_state.get("level_percent")
        if isinstance(millivolts, (int, float)) and isinstance(dc_bias_mv, (int, float)):
            sample_mv = int(round(float(millivolts) - float(dc_bias_mv)))
            self._mic_wave_mv_history.append(sample_mv)
        if isinstance(level_percent, (int, float)):
            self._mic_level_history.append(self._clamp_percent(level_percent, 0))
        if self.status_device is not None:
            self._render_status()

    def update_microphone_bridge_state(self, bridge_state: dict[str, Any]) -> None:
        if not isinstance(bridge_state, dict):
            return
        merged_state = {
            **self._mic_bridge_state,
            **bridge_state,
        }
        invert_level = bool(merged_state.get("invert_level", self._mic_invert_level))
        trigger_percent = self._clamp_percent(
            merged_state.get("active_threshold", self._mic_trigger_percent),
            self._mic_trigger_percent,
        )
        release_percent = self._clamp_percent(
            merged_state.get("idle_threshold", self._mic_release_percent),
            self._mic_release_percent,
        )
        if invert_level and release_percent < trigger_percent:
            release_percent = trigger_percent
        if not invert_level and release_percent > trigger_percent:
            release_percent = trigger_percent
        hold_remaining_raw = merged_state.get("hold_remaining_ms", 0)
        try:
            hold_remaining_ms = max(0, int(hold_remaining_raw))
        except (TypeError, ValueError):
            hold_remaining_ms = 0

        self._mic_bridge_state = {
            "enabled": bool(merged_state.get("enabled", False)),
            "invert_level": invert_level,
            "active_threshold": trigger_percent,
            "idle_threshold": release_percent,
            "speech_active": bool(merged_state.get("speech_active", False)),
            "wants_speech_active": bool(merged_state.get("wants_speech_active", False)),
            "hold_active": bool(merged_state.get("hold_active", False)),
            "hold_remaining_ms": hold_remaining_ms,
        }

    def _render_mic_test_status(self, draw: Any) -> None:
        if self.status_device is None:
            return

        width = int(self.status_device.width)
        height = int(self.status_device.height)
        mic_available = bool(self._mic_state.get("available", False))
        level_percent = self._clamp_percent(self._mic_state.get("level_percent", 0), 0)
        peak_percent = int(self._mic_state.get("peak_percent", 0))
        millivolts = int(self._mic_state.get("millivolts", 0))
        dc_bias_mv = int(self._mic_state.get("dc_bias_mv", 0))
        delta_mv = millivolts - dc_bias_mv
        bridge_invert_level = bool(self._mic_bridge_state.get("invert_level", self._mic_invert_level))
        trigger_percent = self._clamp_percent(
            self._mic_bridge_state.get("active_threshold", self._mic_trigger_percent),
            self._mic_trigger_percent,
        )
        release_percent = self._clamp_percent(
            self._mic_bridge_state.get("idle_threshold", self._mic_release_percent),
            self._mic_release_percent,
        )
        if bridge_invert_level and release_percent < trigger_percent:
            release_percent = trigger_percent
        if not bridge_invert_level and release_percent > trigger_percent:
            release_percent = trigger_percent
        trigger_label = "<=" if bridge_invert_level else ">="
        release_label = ">" if bridge_invert_level else "<"
        armed = (
            level_percent <= trigger_percent
            if bridge_invert_level
            else level_percent >= trigger_percent
        )
        speech_active = bool(self._mic_bridge_state.get("speech_active", armed))
        hold_remaining_ms = 0
        try:
            hold_remaining_ms = max(0, int(self._mic_bridge_state.get("hold_remaining_ms", 0)))
        except (TypeError, ValueError):
            hold_remaining_ms = 0
        hold_active = bool(self._mic_bridge_state.get("hold_active", False)) and hold_remaining_ms > 0
        if speech_active and hold_active and not armed:
            activity_label = f"HOLD{hold_remaining_ms}ms"
        elif speech_active:
            activity_label = "TALK"
        else:
            activity_label = "idle"
        bridge_label = "on" if bool(self._mic_bridge_state.get("enabled", False)) else "off"

        header_lines = [
            f"Mic Test adc:{'ok' if mic_available else 'down'} br:{bridge_label}",
            f"lvl:{level_percent}% pk:{peak_percent}% {activity_label}",
            _short(f"arm {trigger_label}{trigger_percent}% rel {release_label}{release_percent}% d:{delta_mv}mv", 21),
        ]
        for index, line in enumerate(header_lines):
            draw.text((0, index * 9), line, fill="white")

        graph_left = 0
        graph_top = 28
        graph_right = max(graph_left + 2, width - 1)
        graph_bottom = max(graph_top + 2, height - 1)
        draw.rectangle((graph_left, graph_top, graph_right, graph_bottom), outline="white", fill="black")

        inner_left = graph_left + 1
        inner_right = graph_right - 1
        inner_top = graph_top + 1
        inner_bottom = graph_bottom - 1
        if inner_left >= inner_right or inner_top >= inner_bottom:
            return

        visible_width = (inner_right - inner_left) + 1
        history = list(self._mic_level_history)[-visible_width:]
        if not history:
            return

        trigger_y = inner_bottom - int((trigger_percent / 100.0) * (inner_bottom - inner_top))
        trigger_y = max(inner_top, min(inner_bottom, trigger_y))
        draw.line((inner_left, trigger_y, inner_right, trigger_y), fill="white")
        if release_percent != trigger_percent:
            release_y = inner_bottom - int((release_percent / 100.0) * (inner_bottom - inner_top))
            release_y = max(inner_top, min(inner_bottom, release_y))
            for x in range(inner_left, inner_right + 1, 2):
                draw.point((x, release_y), fill="white")

        points: list[tuple[int, int]] = []
        start_x = inner_right - (len(history) - 1)
        for index, sample_level in enumerate(history):
            x = start_x + index
            y = inner_bottom - int((sample_level / 100.0) * (inner_bottom - inner_top))
            y = max(inner_top, min(inner_bottom, y))
            points.append((x, y))
        draw.text((inner_left + 1, inner_top), f"A{trigger_percent} R{release_percent}", fill="white")

        if len(points) == 1:
            draw.point(points[0], fill="white")
            return
        draw.line(points, fill="white")

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

    def _resolve_preview_event(self) -> str:
        mapped_default = str(self._preview_event_map.get("default", "idle")).strip().lower()
        default_event = mapped_default or "idle"
        active_name = str(self._runtime_state.get("active_target_name", "")).strip().lower()
        active_id = str(self._runtime_state.get("active_target_id", "")).strip().lower()
        active_type = str(self._runtime_state.get("active_target_type", "")).strip().lower()
        runtime_mode = str(self._runtime_state.get("runtime_mode", "")).strip().lower()
        explicit_event = str(self._runtime_state.get("oled_event", "")).strip().lower()
        search_text = " ".join(
            token
            for token in (explicit_event, active_name, active_id, active_type, runtime_mode)
            if token
        )
        for trigger, event_name in self._preview_event_map.items():
            trigger_text = str(trigger).strip().lower()
            if not trigger_text or trigger_text == "default":
                continue
            if trigger_text in search_text:
                candidate = str(event_name).strip().lower()
                if candidate:
                    return candidate
        if runtime_mode == "live":
            return "live"
        return default_event

    def _resolve_preview_source_key(self) -> tuple[str, str, str]:
        runtime_mode = str(self._runtime_state.get("runtime_mode", "")).strip().lower()
        active_target_type = str(self._runtime_state.get("active_target_type", "")).strip().lower()
        active_target_id = str(self._runtime_state.get("active_target_id", "")).strip().lower()
        return (runtime_mode, active_target_type, active_target_id)

    def _update_preview_event(self) -> None:
        next_event = self._resolve_preview_event()
        source_key = self._resolve_preview_source_key()
        if next_event == self._active_preview_event and source_key == self._active_preview_source_key:
            return
        self._active_preview_event = next_event
        self._active_preview_source_key = source_key
        self._active_preview_started_at = time.monotonic()
        self._last_preview_render = 0.0
        self._last_preview_signature = None

    def _select_project_preview_frame(self) -> tuple[list[int], int, int, str, int] | None:
        if not isinstance(self._active_project, dict):
            return None

        project = self._active_project
        target_type = str(self._runtime_state.get("active_target_type", "")).strip().lower()
        target_id = str(self._runtime_state.get("active_target_id", "")).strip()
        if target_type not in ("animation", "frame"):
            return None
        if not target_id:
            return None

        width = int(project.get("width", 0))
        height = int(project.get("height", 0))
        if width <= 0 or height <= 0:
            return None

        frames = project.get("frames")
        if not isinstance(frames, list):
            return None
        frames_by_id: dict[str, dict[str, Any]] = {}
        for frame in frames:
            if not isinstance(frame, dict):
                continue
            frame_id = frame.get("id")
            if isinstance(frame_id, str) and frame_id.strip():
                frames_by_id[frame_id] = frame
        if not frames_by_id:
            return None

        if target_type == "frame":
            frame = frames_by_id.get(target_id)
            if not isinstance(frame, dict):
                return None
            pixels = frame.get("pixels")
            if not isinstance(pixels, list):
                return None
            expected_length = width * height
            if len(pixels) != expected_length:
                return None
            return (list(pixels), width, height, target_id, 0)

        animations = project.get("animations")
        if not isinstance(animations, list):
            return None
        animation: dict[str, Any] | None = None
        for candidate in animations:
            if not isinstance(candidate, dict):
                continue
            if candidate.get("id") == target_id:
                animation = candidate
                break
        if animation is None:
            return None

        steps = animation.get("steps")
        if not isinstance(steps, list) or not steps:
            return None
        loop_enabled = bool(animation.get("loop", True))

        cumulative_limits: list[int] = []
        total_duration_ms = 0
        normalized_steps: list[tuple[str, int]] = []
        for step in steps:
            if not isinstance(step, dict):
                continue
            step_frame_id = step.get("frameId")
            if not isinstance(step_frame_id, str) or step_frame_id not in frames_by_id:
                continue
            duration_ms = int(step.get("durationMs", 100))
            duration_ms = max(1, duration_ms)
            normalized_steps.append((step_frame_id, duration_ms))
            total_duration_ms += duration_ms
            cumulative_limits.append(total_duration_ms)

        if not normalized_steps or total_duration_ms <= 0:
            return None

        elapsed_ms = int((time.monotonic() - self._active_preview_started_at) * 1000)
        if loop_enabled:
            phase_ms = elapsed_ms % total_duration_ms
        else:
            phase_ms = min(elapsed_ms, total_duration_ms - 1)

        step_index = len(normalized_steps) - 1
        for index, limit in enumerate(cumulative_limits):
            if phase_ms < limit:
                step_index = index
                break

        frame_id = normalized_steps[step_index][0]
        frame = frames_by_id.get(frame_id)
        if not isinstance(frame, dict):
            return None
        pixels = frame.get("pixels")
        if not isinstance(pixels, list):
            return None
        if len(pixels) != width * height:
            return None
        return (list(pixels), width, height, target_id, step_index)

    def _build_preset_animations(self, width: int, height: int) -> dict[str, dict[str, Any]]:
        open_eyes = _build_face_frame(width, height, eye_height=max(2, height // 3))
        half_eyes = _build_face_frame(width, height, eye_height=max(1, height // 5))
        closed_eyes = _build_face_frame(width, height, eye_height=1)
        talk_small = _build_face_frame(width, height, eye_height=max(2, height // 3), mouth_height=1)
        talk_medium = _build_face_frame(width, height, eye_height=max(2, height // 3), mouth_height=2)
        talk_large = _build_face_frame(width, height, eye_height=max(2, height // 3), mouth_height=3)

        raw_animations: dict[str, tuple[list[list[int]], list[int]]] = {
            "idle": ([open_eyes], [300]),
            "live": ([open_eyes], [200]),
            "blink": ([open_eyes, half_eyes, closed_eyes, half_eyes, open_eyes], [120, 90, 80, 90, 180]),
            "talk": ([talk_small, talk_medium, talk_large, talk_medium], [90, 90, 90, 90]),
        }

        built: dict[str, dict[str, Any]] = {}
        for name, (frames, durations_ms) in raw_animations.items():
            total_ms = max(1, sum(durations_ms))
            cumulative: list[int] = []
            elapsed = 0
            for duration in durations_ms:
                elapsed += max(1, int(duration))
                cumulative.append(elapsed)
            built[name] = {
                "frames": frames,
                "durations_ms": durations_ms,
                "cumulative_ms": cumulative,
                "total_ms": total_ms,
            }
        return built

    def _get_preset_animations(self, width: int, height: int) -> dict[str, dict[str, Any]]:
        cache_key = (width, height)
        if self._preset_animation_cache is not None and self._preset_animation_cache_key == cache_key:
            return self._preset_animation_cache
        self._preset_animation_cache = self._build_preset_animations(width, height)
        self._preset_animation_cache_key = cache_key
        return self._preset_animation_cache

    def _select_preset_frame(self, width: int, height: int) -> tuple[list[int], str, int]:
        animations = self._get_preset_animations(width, height)
        event_name = self._active_preview_event
        if event_name not in animations:
            fallback = str(self._preview_event_map.get("default", "idle")).strip().lower() or "idle"
            event_name = fallback if fallback in animations else "idle"
        animation = animations[event_name]
        frames: list[list[int]] = animation["frames"]
        if len(frames) <= 1:
            return frames[0], event_name, 0

        now_ms = int((time.monotonic() - self._active_preview_started_at) * 1000)
        loop_ms = int(animation["total_ms"])
        phase_ms = now_ms % max(1, loop_ms)
        cumulative: list[int] = animation["cumulative_ms"]
        frame_index = len(frames) - 1
        for index, limit in enumerate(cumulative):
            if phase_ms < limit:
                frame_index = index
                break
        return frames[frame_index], event_name, frame_index

    def _draw_preview_bitmap(self, pixels: list[int], safe_width: int, safe_height: int) -> None:
        if self.preview_device is None:
            return
        scale = max(
            1,
            min(
                self.preview_device.width // safe_width,
                self.preview_device.height // safe_height,
            ),
        )
        draw_width = safe_width * scale
        draw_height = safe_height * scale
        origin_x = (self.preview_device.width - draw_width) // 2
        origin_y = (self.preview_device.height - draw_height) // 2

        with canvas(self.preview_device) as draw:
            draw.rectangle(
                (0, 0, self.preview_device.width - 1, self.preview_device.height - 1),
                outline="white",
                fill="black",
            )
            for y in range(safe_height):
                row_offset = y * safe_width
                for x in range(safe_width):
                    if pixels[row_offset + x] != 1:
                        continue
                    if scale == 1:
                        draw.point((origin_x + x, origin_y + y), fill="white")
                        continue
                    left = origin_x + (x * scale)
                    top = origin_y + (y * scale)
                    draw.rectangle(
                        (left, top, left + scale - 1, top + scale - 1),
                        fill="white",
                    )

    def _draw_preview_transformed(self, pixels: list[int], safe_width: int, safe_height: int) -> None:
        if self.preview_device is None:
            return
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

    def _render_status(self) -> None:
        if self.status_device is None:
            return

        now = time.monotonic()
        mic_enabled = bool(self._mic_state.get("enabled", False))
        mic_test_mode = bool(self._mic_state.get("test_mode", False))
        page_count = 1 if mic_test_mode else (3 if mic_enabled else 2)
        page_flipped = False
        if now - self._last_flip >= self._flip_seconds:
            self._page = (self._page + 1) % page_count
            self._last_flip = now
            page_flipped = True
        if (
            not mic_test_mode
            and
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

        if self._page == 0 and not mic_test_mode:
            lines = [
                "Project Fifo",
                _short(self._hostname, 21),
                _short(self._ip_address, 21),
                f"mode:{_short(mode, 15)}",
                f"prj:{project_name}",
                f"tgt:{target_name}",
                f"mx:{width}x{height} b:{brightness}",
            ]
        elif self._page == 1 and not mic_test_mode:
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
        else:
            lines = [
                "Mic Test Wave",
                f"adc:{'ok' if bool(self._mic_state.get('available', False)) else 'down'}",
                f"lvl:{self._mic_state.get('level_percent', 0)}%",
                f"pk:{self._mic_state.get('peak_percent', 0)}%",
                _short(self._mic_state.get("message", "-"), 21),
            ]

        rendered_lines = tuple(lines)
        if not mic_test_mode and rendered_lines == self._last_status_lines:
            return
        self._last_status_lines = rendered_lines

        with canvas(self.status_device) as draw:
            if mic_test_mode:
                self._render_mic_test_status(draw)
            else:
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
        self._last_preview_render = now

        safe_width = max(1, int(self._display_state.get("width", width if width > 0 else 16)))
        safe_height = max(1, int(self._display_state.get("height", height if height > 0 else 8)))

        if self._preview_mode == "preset":
            project_frame = self._select_project_preview_frame()
            if project_frame is not None:
                (
                    project_pixels,
                    project_width,
                    project_height,
                    project_target_id,
                    project_step_index,
                ) = project_frame
                frame_signature = (
                    "preset-project",
                    project_target_id,
                    project_step_index,
                    project_width,
                    project_height,
                )
                if frame_signature == self._last_preview_signature:
                    return
                self._last_preview_signature = frame_signature
                self._draw_preview_transformed(project_pixels, project_width, project_height)
                return

            frame_pixels, event_name, frame_index = self._select_preset_frame(safe_width, safe_height)
            frame_signature = ("preset", event_name, frame_index, safe_width, safe_height)
            if frame_signature == self._last_preview_signature:
                return
            self._last_preview_signature = frame_signature
            self._draw_preview_transformed(frame_pixels, safe_width, safe_height)
            return

        try:
            frame_crc = zlib.crc32(bytes(pixels))
        except ValueError:
            frame_crc = zlib.crc32(
                bytes((1 if int(pixel) != 0 else 0) for pixel in pixels)
            )

        frame_signature = (
            "mirror",
            int(width),
            int(height),
            frame_crc,
            self._board_layout_signature,
        )
        if frame_signature == self._last_preview_signature:
            return

        self._last_preview_signature = frame_signature
        self._draw_preview_transformed(pixels, safe_width, safe_height)

    def clear_preview(self) -> None:
        if not self.preview_enabled or self.preview_device is None:
            return
        self._last_preview_signature = None
        self._preview_plan_key = None
        self._preview_plan = None
        self._preset_animation_cache_key = None
        self._preset_animation_cache = None
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
        self._preset_animation_cache_key = None
        self._preset_animation_cache = None
