from __future__ import annotations

from luma.core.interface.serial import spi, noop
from luma.core.render import canvas
from luma.led_matrix.device import max7219

from mapping import build_panel_positions, logical_to_physical
from protocol import clamp_brightness_value


class MatrixDisplay:
    def __init__(self, config: dict):
        self.config = dict(config)
        self.total_matrices = config["matrices_wide"] * config["matrices_high"]
        self.serial = spi(port=0, device=0, gpio=noop())
        self.width = config["matrices_wide"] * 8
        self.height = config["matrices_high"] * 8
        self.panel_positions = build_panel_positions(
            config["matrices_wide"],
            config["matrices_high"],
            config.get("panel_order"),
        )
        self.device = None
        self.brightness = 0
        self._rebuild_device()
        self.set_brightness(config.get("brightness", 3))

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

    def get_layout(self) -> dict[str, int | bool]:
        return {
            "rotate": self.config.get("rotate", 0),
            "block_orientation": self.config.get("block_orientation", 90),
            "reverse_order": self.config.get("reverse_order", False),
        }

    def get_state(self) -> dict[str, int | bool]:
        return {
            "width": self.width,
            "height": self.height,
            "brightness": self.brightness,
            **self.get_layout(),
        }

    def set_layout(self, rotate: int, block_orientation: int, reverse_order: bool) -> dict[str, int | bool]:
        next_layout = {
            "rotate": rotate,
            "block_orientation": block_orientation,
            "reverse_order": reverse_order,
        }
        if self.get_layout() == next_layout:
            return next_layout

        self.config.update(next_layout)
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
        with canvas(self.device) as draw:
            clipped_width = min(width, self.width)
            clipped_height = min(height, self.height)

            for y in range(clipped_height):
                for x in range(clipped_width):
                    if pixels[(y * width) + x] != 1:
                        continue
                    physical_x, physical_y = logical_to_physical(
                        x,
                        y,
                        self.width,
                        self.height,
                        self.panel_positions,
                    )
                    draw.point((physical_x, physical_y), fill="white")

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
