from __future__ import annotations

from typing import Any


class ProtocolError(ValueError):
    pass


def validate_frame_message(message: dict[str, Any]) -> dict[str, Any]:
    if message.get("type") != "frame":
        raise ProtocolError("Unsupported message type")

    width = message.get("width")
    height = message.get("height")
    pixels = message.get("pixels")

    if not isinstance(width, int) or width <= 0:
        raise ProtocolError("width must be a positive integer")
    if not isinstance(height, int) or height <= 0:
        raise ProtocolError("height must be a positive integer")
    if not isinstance(pixels, list):
        raise ProtocolError("pixels must be a list")
    if len(pixels) != width * height:
        raise ProtocolError("pixels length does not match width * height")

    normalized_pixels: list[int] = []
    for value in pixels:
        if value not in (0, 1):
            raise ProtocolError("pixels must contain only 0 or 1")
        normalized_pixels.append(value)

    return {
        "type": "frame",
        "version": 1,
        "width": width,
        "height": height,
        "pixels": normalized_pixels,
    }
