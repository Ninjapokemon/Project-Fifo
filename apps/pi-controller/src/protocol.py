from __future__ import annotations

from typing import Any


class ProtocolError(ValueError):
    pass


def clamp_brightness_value(value: int) -> int:
    return max(0, min(15, value))


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


def validate_brightness_message(message: dict[str, Any]) -> dict[str, Any]:
    if message.get("type") != "brightness":
        raise ProtocolError("Unsupported message type")

    value = message.get("value")
    if not isinstance(value, int):
        raise ProtocolError("brightness value must be an integer")

    return {
        "type": "brightness",
        "version": 1,
        "value": clamp_brightness_value(value),
    }


def validate_named_drawing(message: dict[str, Any], expected_type: str = "save_drawing") -> dict[str, Any]:
    if message.get("type") != expected_type:
        raise ProtocolError("Unsupported message type")

    name = message.get("name")
    if not isinstance(name, str) or not name.strip():
        raise ProtocolError("drawing name must be a non-empty string")

    frame = validate_frame_message(
        {
            "type": "frame",
            "version": 1,
            "width": message.get("width"),
            "height": message.get("height"),
            "pixels": message.get("pixels"),
        }
    )
    frame["name"] = name.strip()
    return frame


def validate_drawing_name_message(message: dict[str, Any], expected_type: str) -> dict[str, Any]:
    if message.get("type") != expected_type:
        raise ProtocolError("Unsupported message type")

    name = message.get("name")
    if not isinstance(name, str) or not name.strip():
        raise ProtocolError("drawing name must be a non-empty string")

    return {
        "type": expected_type,
        "version": 1,
        "name": name.strip(),
    }
