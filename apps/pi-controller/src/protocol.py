from __future__ import annotations

from typing import Any


class ProtocolError(ValueError):
    pass


ALLOWED_ROTATE_VALUES = {0, 1, 2, 3}
ALLOWED_BLOCK_ORIENTATION_VALUES = {-90, 0, 90, 180}
ALLOWED_PANEL_ROTATION_VALUES = {0, 90, 180, 270}
ALLOWED_VIEW_ROTATION_VALUES = {0, 90, 180, 270}


def clamp_brightness_value(value: int) -> int:
    return max(0, min(15, value))


def validate_layout_message(message: dict[str, Any], expected_type: str) -> dict[str, Any]:
    if message.get("type") != expected_type:
        raise ProtocolError("Unsupported message type")

    rotate = message.get("rotate")
    block_orientation = message.get("block_orientation")
    reverse_order = message.get("reverse_order")
    panel_order = message.get("panel_order")
    panel_rotations = message.get("panel_rotations")
    panel_mirrors = message.get("panel_mirrors")
    panel_flips = message.get("panel_flips")

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
    if panel_rotations is not None:
        if not isinstance(panel_rotations, list):
            raise ProtocolError("panel_rotations must be a list or null")
        if any(
            isinstance(value, bool)
            or not isinstance(value, int)
            or value not in ALLOWED_PANEL_ROTATION_VALUES
            for value in panel_rotations
        ):
            raise ProtocolError("panel_rotations entries must be 0, 90, 180, or 270")
    if panel_mirrors is not None:
        if not isinstance(panel_mirrors, list):
            raise ProtocolError("panel_mirrors must be a list or null")
        if any(not isinstance(value, bool) for value in panel_mirrors):
            raise ProtocolError("panel_mirrors entries must be booleans")
    if panel_flips is not None:
        if not isinstance(panel_flips, list):
            raise ProtocolError("panel_flips must be a list or null")
        if any(not isinstance(value, bool) for value in panel_flips):
            raise ProtocolError("panel_flips entries must be booleans")

    return {
        "type": expected_type,
        "version": 1,
        "rotate": rotate,
        "block_orientation": block_orientation,
        "reverse_order": reverse_order,
        "panel_order": panel_order,
        "panel_rotations": panel_rotations,
        "panel_mirrors": panel_mirrors,
        "panel_flips": panel_flips,
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

    board_layout = message.get("boardLayout")
    if board_layout is not None:
        if not isinstance(board_layout, list):
            raise ProtocolError("boardLayout must be a list or null")

        normalized_board_layout: list[dict[str, Any]] = []
        for board in board_layout:
            if not isinstance(board, dict):
                raise ProtocolError("Each boardLayout entry must be an object")

            normalized_board: dict[str, Any] = {}
            if "id" in board:
                if not isinstance(board["id"], str) or not board["id"].strip():
                    raise ProtocolError("boardLayout id must be a non-empty string when provided")
                normalized_board["id"] = board["id"].strip()

            chain_index = board.get("chainIndex")
            if chain_index is not None:
                if isinstance(chain_index, bool) or not isinstance(chain_index, int) or chain_index < 0:
                    raise ProtocolError("boardLayout chainIndex must be a non-negative integer when provided")
                normalized_board["chainIndex"] = chain_index

            visual_grid_x = board.get("visualGridX", board.get("gridX"))
            if visual_grid_x is not None:
                if isinstance(visual_grid_x, bool) or not isinstance(visual_grid_x, int) or visual_grid_x < 0:
                    raise ProtocolError("boardLayout visualGridX must be a non-negative integer when provided")
                normalized_board["visualGridX"] = visual_grid_x

            visual_grid_y = board.get("visualGridY", board.get("gridY"))
            if visual_grid_y is not None:
                if isinstance(visual_grid_y, bool) or not isinstance(visual_grid_y, int) or visual_grid_y < 0:
                    raise ProtocolError("boardLayout visualGridY must be a non-negative integer when provided")
                normalized_board["visualGridY"] = visual_grid_y

            view_rotation = board.get("viewRotation")
            if view_rotation is not None:
                if (
                    isinstance(view_rotation, bool)
                    or not isinstance(view_rotation, int)
                    or view_rotation not in ALLOWED_VIEW_ROTATION_VALUES
                ):
                    raise ProtocolError("boardLayout viewRotation must be 0, 90, 180, or 270 when provided")
                normalized_board["viewRotation"] = view_rotation

            view_mirror = board.get("viewMirror")
            if view_mirror is not None:
                if not isinstance(view_mirror, bool):
                    raise ProtocolError("boardLayout viewMirror must be a boolean when provided")
                normalized_board["viewMirror"] = view_mirror

            group_id = board.get("groupId")
            if group_id is not None:
                if not isinstance(group_id, str) or not group_id.strip():
                    raise ProtocolError("boardLayout groupId must be a non-empty string when provided")
                normalized_board["groupId"] = group_id.strip()

            width = board.get("width")
            if width is not None:
                if isinstance(width, bool) or not isinstance(width, int) or width <= 0:
                    raise ProtocolError("boardLayout width must be a positive integer when provided")
                normalized_board["width"] = width

            height = board.get("height")
            if height is not None:
                if isinstance(height, bool) or not isinstance(height, int) or height <= 0:
                    raise ProtocolError("boardLayout height must be a positive integer when provided")
                normalized_board["height"] = height

            normalized_board_layout.append(normalized_board)
        frame["boardLayout"] = normalized_board_layout

    board_groups = message.get("boardGroups")
    if board_groups is not None:
        if not isinstance(board_groups, list):
            raise ProtocolError("boardGroups must be a list or null")
        normalized_board_groups: list[str] = []
        for group_id in board_groups:
            if not isinstance(group_id, str) or not group_id.strip():
                raise ProtocolError("boardGroups entries must be non-empty strings")
            normalized_board_groups.append(group_id.strip())
        frame["boardGroups"] = normalized_board_groups

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
