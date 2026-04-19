from __future__ import annotations

from luma.core.interface.serial import spi, noop
from luma.core.render import canvas
from luma.led_matrix.device import max7219

from mapping import (
    build_panel_positions,
    build_physical_frame,
    normalize_panel_mirrors,
    normalize_panel_order,
    resolve_panel_rotations,
)
from protocol import clamp_brightness_value


class MatrixDisplay:
    def __init__(self, config: dict):
        self.config = dict(config)
        self.total_matrices = config["matrices_wide"] * config["matrices_high"]
        self.serial = spi(port=0, device=0, gpio=noop())
        self.width = config["matrices_wide"] * 8
        self.height = config["matrices_high"] * 8
        self.panel_positions = None
        self.panel_rotations = None
        self.panel_mirrors = None
        self._set_panel_order(config.get("panel_order"))
        self._set_panel_rotations(
            config.get("panel_rotations"),
            config.get("panel_flips"),
        )
        self._set_panel_mirrors(config.get("panel_mirrors"))
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

    def _set_panel_rotations(
        self,
        panel_rotations: list[int] | None,
        panel_flips: list[bool] | None = None,
    ) -> list[int] | None:
        normalized_rotations = resolve_panel_rotations(
            self.config["matrices_wide"],
            self.config["matrices_high"],
            panel_rotations,
            panel_flips,
        )
        self.config["panel_rotations"] = normalized_rotations
        self.config.pop("panel_flips", None)
        self.panel_rotations = (
            list(normalized_rotations)
            if isinstance(normalized_rotations, list)
            else None
        )
        return normalized_rotations

    def _set_panel_mirrors(self, panel_mirrors: list[bool] | None) -> list[bool] | None:
        normalized_mirrors = normalize_panel_mirrors(
            panel_mirrors,
            self.config["matrices_wide"],
            self.config["matrices_high"],
        )
        self.config["panel_mirrors"] = normalized_mirrors
        self.panel_mirrors = (
            list(normalized_mirrors)
            if isinstance(normalized_mirrors, list)
            else None
        )
        return normalized_mirrors

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

    def get_layout(self) -> dict[str, int | bool | list[int] | list[bool] | None]:
        panel_order = self.config.get("panel_order")
        panel_rotations = self.config.get("panel_rotations")
        panel_mirrors = self.config.get("panel_mirrors")
        return {
            "rotate": self.config.get("rotate", 0),
            "block_orientation": self.config.get("block_orientation", 90),
            "reverse_order": self.config.get("reverse_order", False),
            "panel_order": list(panel_order) if isinstance(panel_order, list) else None,
            "panel_rotations": (
                list(panel_rotations)
                if isinstance(panel_rotations, list)
                else None
            ),
            "panel_mirrors": (
                list(panel_mirrors)
                if isinstance(panel_mirrors, list)
                else None
            ),
        }

    def get_state(self) -> dict[str, int | bool | list[int] | list[bool] | None]:
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
        panel_rotations: list[int] | None = None,
        panel_mirrors: list[bool] | None = None,
        panel_flips: list[bool] | None = None,
    ) -> dict[str, int | bool | list[int] | list[bool] | None]:
        normalized_panel_order = normalize_panel_order(
            panel_order,
            self.config["matrices_wide"],
            self.config["matrices_high"],
        )
        normalized_panel_rotations = resolve_panel_rotations(
            self.config["matrices_wide"],
            self.config["matrices_high"],
            panel_rotations,
            panel_flips,
        )
        normalized_panel_mirrors = normalize_panel_mirrors(
            panel_mirrors,
            self.config["matrices_wide"],
            self.config["matrices_high"],
        )
        next_layout = {
            "rotate": rotate,
            "block_orientation": block_orientation,
            "reverse_order": reverse_order,
            "panel_order": normalized_panel_order,
            "panel_rotations": normalized_panel_rotations,
            "panel_mirrors": normalized_panel_mirrors,
        }
        current_layout = self.get_layout()
        if current_layout == next_layout:
            return next_layout

        self.config.update(next_layout)
        self.config.pop("panel_flips", None)
        self.panel_positions = build_panel_positions(
            self.config["matrices_wide"],
            self.config["matrices_high"],
            normalized_panel_order,
        )
        self.panel_rotations = (
            list(normalized_panel_rotations)
            if isinstance(normalized_panel_rotations, list)
            else None
        )
        self.panel_mirrors = (
            list(normalized_panel_mirrors)
            if isinstance(normalized_panel_mirrors, list)
            else None
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
        if width != self.width or height != self.height:
            raise ValueError(
                f"Frame dimensions {width}x{height} do not match display {self.width}x{self.height}"
            )

        physical_pixels = build_physical_frame(
            pixels,
            width,
            height,
            self.width,
            self.height,
            self.panel_positions,
            self.panel_rotations,
            self.panel_mirrors,
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
