from __future__ import annotations

import socket
import time
from typing import Any

from luma.core.interface.serial import i2c
from luma.core.render import canvas
from luma.oled.device import ssd1306


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

        self.enabled = bool(oled_config.get("enabled", True))
        self.status_device = None
        self.preview_device = None
        self._runtime_state: dict[str, Any] = {}
        self._display_state: dict[str, Any] = {}
        self._hostname = socket.gethostname()
        self._ip_address = _lan_ip()
        self._page = 0
        self._last_flip = 0.0
        self._flip_seconds = 5.0

        if not self.enabled:
            print("OLED status disabled by config.")
            return

        bus_port = int(oled_config.get("port", 1))
        status_addr = int(oled_config.get("status_address", 0x3C))
        preview_addr = int(oled_config.get("preview_address", 0x3D))

        try:
            self.status_device = ssd1306(i2c(port=bus_port, address=status_addr))
            self.preview_device = ssd1306(i2c(port=bus_port, address=preview_addr))
            print(
                f"OLED online on I2C-{bus_port} "
                f"(status=0x{status_addr:02x}, preview=0x{preview_addr:02x})."
            )
        except Exception as error:  # noqa: BLE001
            print(f"OLED init failed: {error}")
            self.enabled = False
            self.status_device = None
            self.preview_device = None

    def update_state(self, runtime_state: dict[str, Any], display_state: dict[str, Any]) -> None:
        if not self.enabled or self.status_device is None:
            return
        self._runtime_state = dict(runtime_state)
        self._display_state = dict(display_state)
        self._render_status()

    def _render_status(self) -> None:
        if self.status_device is None:
            return

        now = time.monotonic()
        if now - self._last_flip >= self._flip_seconds:
            self._page = (self._page + 1) % 2
            self._last_flip = now

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

        with canvas(self.status_device) as draw:
            for index, line in enumerate(lines):
                draw.text((0, index * 9), line, fill="white")

    def render_preview(self, pixels: list[int], width: int, height: int) -> None:
        if not self.enabled or self.preview_device is None:
            return

        safe_width = max(1, int(width))
        safe_height = max(1, int(height))
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
                    else:
                        left = origin_x + (x * scale)
                        top = origin_y + (y * scale)
                        draw.rectangle(
                            (left, top, left + scale - 1, top + scale - 1),
                            fill="white",
                        )

    def clear_preview(self) -> None:
        if not self.enabled or self.preview_device is None:
            return
        self.preview_device.clear()

    def shutdown(self) -> None:
        if self.status_device is not None:
            self.status_device.clear()
        if self.preview_device is not None:
            self.preview_device.clear()
