from __future__ import annotations

from luma.core.interface.serial import spi, noop
from luma.core.render import canvas
from luma.led_matrix.device import max7219

from mapping import logical_to_physical


class MatrixDisplay:
    def __init__(self, config: dict):
        total_matrices = config["matrices_wide"] * config["matrices_high"]
        serial = spi(port=0, device=0, gpio=noop())
        self.width = config["matrices_wide"] * 8
        self.height = config["matrices_high"] * 8
        self.device = max7219(
            serial,
            cascaded=total_matrices,
            rotate=config.get("rotate", 0),
            block_orientation=config.get("block_orientation", 90),
            reverse_order=config.get("reverse_order", False),
        )
        self.device.contrast(config.get("brightness", 3) * 16)

    def render_frame(self, pixels: list[int], width: int, height: int) -> None:
        if width != self.width or height != self.height:
            raise ValueError(
                f"Frame dimensions {width}x{height} do not match display {self.width}x{self.height}"
            )

        with canvas(self.device) as draw:
            for y in range(height):
                for x in range(width):
                    if pixels[(y * width) + x] != 1:
                        continue
                    physical_x, physical_y = logical_to_physical(x, y, width, height)
                    draw.point((physical_x, physical_y), fill="white")

    def clear(self) -> None:
        self.device.clear()
