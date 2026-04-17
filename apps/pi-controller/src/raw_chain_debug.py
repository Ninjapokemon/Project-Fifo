from __future__ import annotations

import argparse
import time

from luma.core.interface.serial import noop, spi
from luma.led_matrix import const

from config import load_config
from protocol import clamp_brightness_value


MAX7219 = const.max7219
PATTERNS = {
    "full": [0xFF] * 8,
    "border": [0xFF, 0x81, 0x81, 0x81, 0x81, 0x81, 0x81, 0xFF],
    "diagonal": [0x80, 0x40, 0x20, 0x10, 0x08, 0x04, 0x02, 0x01],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Write directly to one MAX7219 slot at a time to verify daisy-chain "
            "wiring independently of framebuffer mapping."
        ),
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="Seconds to hold each slot pattern before advancing.",
    )
    parser.add_argument(
        "--loops",
        type=int,
        default=1,
        help="How many times to walk the chain.",
    )
    parser.add_argument(
        "--pattern",
        choices=tuple(PATTERNS),
        default="border",
        help="The raw 8x8 bitmap written into each targeted slot.",
    )
    return parser.parse_args()


class RawChainDebug:
    def __init__(self, cascaded: int, brightness: int) -> None:
        self.cascaded = cascaded
        self.serial = spi(port=0, device=0, gpio=noop())
        self._initialize(brightness)

    def close(self) -> None:
        cleanup = getattr(self.serial, "cleanup", None)
        if callable(cleanup):
            cleanup()

    def _broadcast(self, register: int, value: int) -> None:
        self.serial.data([register, value] * self.cascaded)

    def _initialize(self, brightness: int) -> None:
        scaled_brightness = clamp_brightness_value(brightness)
        self._broadcast(MAX7219.SCANLIMIT, 7)
        self._broadcast(MAX7219.DECODEMODE, 0)
        self._broadcast(MAX7219.DISPLAYTEST, 0)
        self._broadcast(MAX7219.INTENSITY, scaled_brightness)
        self._broadcast(MAX7219.SHUTDOWN, 1)
        self.clear_all()

    def clear_all(self) -> None:
        for row in range(8):
            self._broadcast(MAX7219.DIGIT_0 + row, 0x00)

    def write_slot_pattern(self, slot_index: int, pattern: list[int]) -> None:
        if slot_index < 0 or slot_index >= self.cascaded:
            raise ValueError(f"slot_index must be between 0 and {self.cascaded - 1}")
        if len(pattern) != 8:
            raise ValueError("pattern must contain exactly 8 row bytes")

        for row, value in enumerate(pattern):
            payload: list[int] = []
            for chain_slot in range(self.cascaded):
                if chain_slot == slot_index:
                    payload.extend((MAX7219.DIGIT_0 + row, value))
                else:
                    payload.extend((MAX7219.NOOP, 0))
            self.serial.data(payload)


def main() -> None:
    args = parse_args()
    config = load_config()
    cascaded = config["matrices_wide"] * config["matrices_high"]
    loop_count = max(1, args.loops)
    hold_seconds = max(0.05, args.delay)
    pattern = PATTERNS[args.pattern]
    debugger = RawChainDebug(cascaded, config.get("brightness", 3))

    try:
        for _ in range(loop_count):
            for slot_index in range(cascaded):
                debugger.clear_all()
                debugger.write_slot_pattern(slot_index, pattern)
                print(f"Lighting raw daisy-chain slot {slot_index + 1} of {cascaded}")
                time.sleep(hold_seconds)
    finally:
        debugger.clear_all()
        debugger.close()


if __name__ == "__main__":
    main()
