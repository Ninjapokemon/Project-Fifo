from __future__ import annotations

from luma.core.interface.serial import spi, noop
from luma.core.render import canvas
from luma.led_matrix.device import max7219

from mapping import build_panel_positions, build_physical_frame, normalize_panel_order
from protocol import clamp_brightness_value


class MatrixDisplay:
    def __init__(self, config: dict):
        self.config = dict(config)
        self.total_matrices = config["matrices_wide"] * config["matrices_high"]
        self.serial = spi(port=0, device=0, gpio=noop())
        self.width = config["matrices_wide"] * 8
        self.height = config["matrices_high"] * 8
        self.panel_positions = None
        self._set_panel_order(config.get("panel_order"))
        self.device = None
        self.brightness = 0
        self._rebuild_device()
        self.set_brightness(config.get("brightness", 3))

    def _set_panel_order(self, panel_order: list[int] | None) -> list[int] | None:
        normalized_order = normalize_panel_order(
            panel_order,
            self.config["matrices_wide"],
            self.config["matrices_high"],
        )
        self.config["panel_order"] = normalized_order
        self.panel_positions = build_panel_positions(
            self.config["matrices_wide"],
            self.config["matrices_high"],
            normalized_order,
        )
        return normalized_order

    def _rebuild_device(self) -> None:
        if self.device is not None:
            self.clear()
            hide = getattr(self.device, "hide", None)
            if callable(hide):
                hide()

        # Use explicit dimensions so luma models the configured matrix shape
        # instead of forcing every layout into a single 8px-tall strip.
        self.device = max7219(
            self.serial,
            width=self.width,
            height=self.height,
            rotate=self.config.get("rotate", 0),
            block_orientation=self.config.get("block_orientation", 90),
            blocks_arranged_in_reverse_order=self.config.get("reverse_order", False),
        )

    def get_layout(self) -> dict[str, int | bool | list[int] | None]:
        panel_order = self.config.get("panel_order")
        return {
            "rotate": self.config.get("rotate", 0),
            "block_orientation": self.config.get("block_orientation", 90),
            "reverse_order": self.config.get("reverse_order", False),
            "panel_order": list(panel_order) if isinstance(panel_order, list) else None,
        }

    def get_state(self) -> dict[str, int | bool | list[int] | None]:
        return {
            "width": self.width,
            "height": self.height,
            "brightness": self.brightness,
            **self.get_layout(),
        }

    def set_layout(
        self,
        rotate: int,
        block_orientation: int,
        reverse_order: bool,
        panel_order: list[int] | None = None,
    ) -> dict[str, int | bool | list[int] | None]:
        normalized_panel_order = normalize_panel_order(
            panel_order,
            self.config["matrices_wide"],
            self.config["matrices_high"],
        )
        next_layout = {
            "rotate": rotate,
            "block_orientation": block_orientation,
            "reverse_order": reverse_order,
            "panel_order": normalized_panel_order,
        }
        current_layout = self.get_layout()
        if current_layout == next_layout:
            return next_layout

        self.config.update(next_layout)
        self.panel_positions = build_panel_positions(
            self.config["matrices_wide"],
            self.config["matrices_high"],
            normalized_panel_order,
        )
        if (
            current_layout["rotate"] != rotate
            or current_layout["block_orientation"] != block_orientation
            or current_layout["reverse_order"] != reverse_order
        ):
            self._rebuild_device()
            self.set_brightness(self.brightness)
        return next_layout

    def set_brightness(self, value: int) -> int:
        self.brightness = clamp_brightness_value(value)
        # luma expects contrast in the 0-255 range while MAX7219 brightness is 0-15.
        contrast = round((self.brightness / 15) * 255) if self.brightness > 0 else 0
        self.device.contrast(contrast)
        return self.brightness

    def render_frame(self, pixels: list[int], width: int, height: int) -> None:
        physical_pixels = build_physical_frame(
            pixels,
            width,
            height,
            self.width,
            self.height,
            self.panel_positions,
        )

        with canvas(self.device) as draw:
            for y in range(self.height):
                row_offset = y * self.width
                for x in range(self.width):
                    if physical_pixels[row_offset + x] != 1:
                        continue
                    draw.point((x, y), fill="white")

    def clear(self) -> None:
        self.device.clear()

    def shutdown(self) -> None:
        # Leave the panels in a known off state before the process exits.
        if self.device is None:
            return
        self.clear()
        hide = getattr(self.device, "hide", None)
        if callable(hide):
            hide()
