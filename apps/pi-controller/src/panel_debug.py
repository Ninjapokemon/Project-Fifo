from __future__ import annotations

import argparse
import time

from config import load_config
from display import MatrixDisplay
from mapping import PANEL_SIZE


PANEL_INDEX_DIGITS = {
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
}


def set_pixel(pixels: list[int], width: int, height: int, x: int, y: int, value: int = 1) -> None:
    if x < 0 or x >= width or y < 0 or y >= height:
        return
    pixels[(y * width) + x] = value


def build_panel_test_frame(
    width: int,
    height: int,
    panel_index: int,
    show_digit: bool,
) -> list[int]:
    pixels = [0] * (width * height)
    panel_columns = max(1, width // PANEL_SIZE)
    panel_x = panel_index % panel_columns
    panel_y = panel_index // panel_columns
    start_x = panel_x * PANEL_SIZE
    start_y = panel_y * PANEL_SIZE
    end_x = min(start_x + PANEL_SIZE, width)
    end_y = min(start_y + PANEL_SIZE, height)

    for x in range(start_x, end_x):
        set_pixel(pixels, width, height, x, start_y)
        set_pixel(pixels, width, height, x, end_y - 1)

    for y in range(start_y, end_y):
        set_pixel(pixels, width, height, start_x, y)
        set_pixel(pixels, width, height, end_x - 1, y)

    if not show_digit:
        return pixels

    digit = str((panel_index + 1) % 10)
    glyph = PANEL_INDEX_DIGITS.get(digit, PANEL_INDEX_DIGITS["0"])
    glyph_height = len(glyph)
    glyph_width = len(glyph[0])
    interior_width = max(0, end_x - start_x - 2)
    interior_height = max(0, end_y - start_y - 2)
    offset_x = start_x + 1 + max(0, (interior_width - glyph_width) // 2)
    offset_y = start_y + 1 + max(0, (interior_height - glyph_height) // 2)

    for row in range(glyph_height):
        for column in range(glyph_width):
            if glyph[row][column] != "1":
                continue
            set_pixel(pixels, width, height, offset_x + column, offset_y + row)

    return pixels


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Walk each MAX7219 panel one at a time for wiring and mapping validation.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="Seconds to hold each panel before advancing.",
    )
    parser.add_argument(
        "--loops",
        type=int,
        default=1,
        help="How many times to walk the full panel list.",
    )
    parser.add_argument(
        "--mode",
        choices=("digit", "border"),
        default="digit",
        help="Show either the panel number glyph or just the panel border.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config = load_config()
    display = MatrixDisplay(config)
    panel_count = config["matrices_wide"] * config["matrices_high"]
    hold_seconds = max(0.05, args.delay)
    loop_count = max(1, args.loops)

    try:
        for _ in range(loop_count):
            for panel_index in range(panel_count):
                pixels = build_panel_test_frame(
                    display.width,
                    display.height,
                    panel_index,
                    show_digit=args.mode == "digit",
                )
                display.render_frame(pixels, display.width, display.height)
                print(f"Showing logical panel {panel_index + 1} of {panel_count}")
                time.sleep(hold_seconds)
    finally:
        display.shutdown()


if __name__ == "__main__":
    main()
