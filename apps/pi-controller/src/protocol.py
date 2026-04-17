from __future__ import annotations

from typing import Any


class ProtocolError(ValueError):
    pass


ALLOWED_ROTATE_VALUES = {0, 1, 2, 3}
ALLOWED_BLOCK_ORIENTATION_VALUES = {-90, 0, 90, 180}


def clamp_brightness_value(value: int) -> int:
    return max(0, min(15, value))


def validate_layout_message(message: dict[str, Any], expected_type: str) -> dict[str, Any]:
    if message.get("type") != expected_type:
        raise ProtocolError("Unsupported message type")

    rotate = message.get("rotate")
    block_orientation = message.get("block_orientation")
    reverse_order = message.get("reverse_order")
    panel_order = message.get("panel_order")

    if rotate not in ALLOWED_ROTATE_VALUES:
        raise ProtocolError("rotate must be one of 0, 1, 2, or 3")
    if block_orientation not in ALLOWED_BLOCK_ORIENTATION_VALUES:
        raise ProtocolError("block_orientation must be one of -90, 0, 90, or 180")
    if not isinstance(reverse_order, bool):
        raise ProtocolError("reverse_order must be a boolean")
    if panel_order is not None:
        if not isinstance(panel_order, list):
            raise ProtocolError("panel_order must be a list or null")
        if any(not isinstance(value, int) for value in panel_order):
            raise ProtocolError("panel_order entries must be integers")

    return {
        "type": expected_type,
        "version": 1,
        "rotate": rotate,
        "block_orientation": block_orientation,
        "reverse_order": reverse_order,
        "panel_order": panel_order,
    }


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


def validate_simple_request_message(message: dict[str, Any], expected_type: str) -> dict[str, Any]:
    if message.get("type") != expected_type:
        raise ProtocolError("Unsupported message type")

    return {
        "type": expected_type,
        "version": 1,
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
