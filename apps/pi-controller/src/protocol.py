from __future__ import annotations

from typing import Any


class ProtocolError(ValueError):
    pass


ALLOWED_ROTATE_VALUES = {0, 1, 2, 3}
ALLOWED_BLOCK_ORIENTATION_VALUES = {-90, 0, 90, 180}
ALLOWED_PANEL_ROTATION_VALUES = {0, 90, 180, 270}
ALLOWED_VIEW_ROTATION_VALUES = {0, 90, 180, 270}
ALLOWED_CHANNEL_BLEND_MODES = {"overwrite"}
DEFAULT_PROJECT_CHANNEL_ID = "base"
DEFAULT_PROJECT_CHANNEL_NAME = "Base"
DEFAULT_PROJECT_CHANNEL_PRIORITY = 100
DEFAULT_PROJECT_CHANNEL_BLEND_MODE = "overwrite"
DEFAULT_BOARD_GROUP_ID = "group-1"


def clamp_brightness_value(value: int) -> int:
    return max(0, min(15, value))


def _validate_dimensions(width: Any, height: Any) -> tuple[int, int]:
    if not isinstance(width, int) or width <= 0:
        raise ProtocolError("width must be a positive integer")
    if not isinstance(height, int) or height <= 0:
        raise ProtocolError("height must be a positive integer")
    return width, height


def _normalize_pixels(width: int, height: int, pixels: Any) -> list[int]:
    if not isinstance(pixels, list):
        raise ProtocolError("pixels must be a list")
    if len(pixels) != width * height:
        raise ProtocolError("pixels length does not match width * height")

    normalized_pixels: list[int] = []
    for value in pixels:
        if value not in (0, 1):
            raise ProtocolError("pixels must contain only 0 or 1")
        normalized_pixels.append(value)

    return normalized_pixels


def _normalize_board_layout(board_layout: Any) -> list[dict[str, Any]] | None:
    if board_layout is None:
        return None
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

    return normalized_board_layout


def _normalize_board_groups(board_groups: Any) -> list[str] | None:
    if board_groups is None:
        return None
    if not isinstance(board_groups, list):
        raise ProtocolError("boardGroups must be a list or null")

    normalized_board_groups: list[str] = []
    for group_id in board_groups:
        if not isinstance(group_id, str) or not group_id.strip():
            raise ProtocolError("boardGroups entries must be non-empty strings")
        normalized_board_groups.append(group_id.strip())

    return normalized_board_groups


def _attach_board_workspace(
    payload: dict[str, Any],
    board_layout: Any,
    board_groups: Any,
) -> dict[str, Any]:
    normalized_board_layout = _normalize_board_layout(board_layout)
    if normalized_board_layout is not None:
        payload["boardLayout"] = normalized_board_layout

    normalized_board_groups = _normalize_board_groups(board_groups)
    if normalized_board_groups is not None:
        payload["boardGroups"] = normalized_board_groups

    return payload


def _build_default_project_channel() -> dict[str, Any]:
    return {
        "id": DEFAULT_PROJECT_CHANNEL_ID,
        "name": DEFAULT_PROJECT_CHANNEL_NAME,
        "priority": DEFAULT_PROJECT_CHANNEL_PRIORITY,
        "blendMode": DEFAULT_PROJECT_CHANNEL_BLEND_MODE,
        "mask": None,
    }


def _normalize_project_channels(channels: Any) -> list[dict[str, Any]]:
    if channels is None:
        return [_build_default_project_channel()]
    if not isinstance(channels, list):
        raise ProtocolError("project channels must be a list or null")

    normalized_channels: list[dict[str, Any]] = []
    channel_ids: set[str] = set()
    for channel in channels:
        if not isinstance(channel, dict):
            raise ProtocolError("project channels must contain only objects")

        channel_id = channel.get("id")
        if not isinstance(channel_id, str) or not channel_id.strip():
            raise ProtocolError("project channel id must be a non-empty string")
        normalized_channel_id = channel_id.strip()
        if normalized_channel_id in channel_ids:
            raise ProtocolError("project channel ids must be unique")

        channel_name = channel.get("name")
        if channel_name is not None and (
            not isinstance(channel_name, str) or not channel_name.strip()
        ):
            raise ProtocolError("project channel name must be a non-empty string when provided")

        priority = channel.get("priority", DEFAULT_PROJECT_CHANNEL_PRIORITY)
        if isinstance(priority, bool) or not isinstance(priority, int):
            raise ProtocolError("project channel priority must be an integer when provided")

        blend_mode = channel.get("blendMode", DEFAULT_PROJECT_CHANNEL_BLEND_MODE)
        if not isinstance(blend_mode, str) or blend_mode not in ALLOWED_CHANNEL_BLEND_MODES:
            raise ProtocolError("project channel blendMode must be overwrite")

        mask = channel.get("mask", None)
        if mask is not None:
            raise ProtocolError("project channel mask must be null")

        normalized_channels.append(
            {
                "id": normalized_channel_id,
                "name": channel_name.strip() if isinstance(channel_name, str) else normalized_channel_id,
                "priority": priority,
                "blendMode": blend_mode,
                "mask": None,
            }
        )
        channel_ids.add(normalized_channel_id)

    if len(normalized_channels) == 0:
        return [_build_default_project_channel()]
    return normalized_channels


def _normalize_channel_defaults(
    channel_defaults: Any,
    channel_ids: set[str],
) -> dict[str, Any] | None:
    if channel_defaults is None:
        return None
    if not isinstance(channel_defaults, dict):
        raise ProtocolError("project channelDefaults must be an object or null")

    normalized_channel_defaults: dict[str, Any] = {}
    for channel_id, value in channel_defaults.items():
        if not isinstance(channel_id, str) or not channel_id.strip():
            raise ProtocolError("project channelDefaults keys must be non-empty strings")
        normalized_channel_id = channel_id.strip()
        if normalized_channel_id not in channel_ids:
            raise ProtocolError("project channelDefaults keys must reference known channels")
        if not isinstance(value, dict):
            raise ProtocolError("project channelDefaults values must be objects")
        normalized_channel_defaults[normalized_channel_id] = dict(value)

    return normalized_channel_defaults


def _collect_project_group_ids(project: dict[str, Any]) -> set[str]:
    group_ids: set[str] = set()
    board_groups = project.get("boardGroups")
    if isinstance(board_groups, list):
        for group_id in board_groups:
            if isinstance(group_id, str) and group_id.strip():
                group_ids.add(group_id.strip())

    board_layout = project.get("boardLayout")
    if isinstance(board_layout, list):
        for board in board_layout:
            if not isinstance(board, dict):
                continue
            group_id = board.get("groupId")
            if isinstance(group_id, str) and group_id.strip():
                group_ids.add(group_id.strip())

    if len(group_ids) == 0:
        group_ids.add(DEFAULT_BOARD_GROUP_ID)
    return group_ids


def _normalize_channel_group_map(
    channel_group_map: Any,
    channel_ids: set[str],
    group_ids: set[str],
) -> dict[str, str]:
    if channel_group_map is None:
        return {}
    if not isinstance(channel_group_map, dict):
        raise ProtocolError("project channelGroupMap must be an object or null")

    normalized_map: dict[str, str] = {}
    for raw_channel_id, raw_group_id in channel_group_map.items():
        channel_id = raw_channel_id.strip() if isinstance(raw_channel_id, str) else ""
        group_id = raw_group_id.strip() if isinstance(raw_group_id, str) else ""
        if not channel_id or channel_id not in channel_ids:
            raise ProtocolError("project channelGroupMap keys must reference known channels")
        if not group_id or group_id not in group_ids:
            raise ProtocolError("project channelGroupMap values must reference known board groups")
        normalized_map[channel_id] = group_id

    return normalized_map


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

    width, height = _validate_dimensions(message.get("width"), message.get("height"))
    normalized_pixels = _normalize_pixels(width, height, message.get("pixels"))

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

    width, height = _validate_dimensions(message.get("width"), message.get("height"))
    normalized_pixels = _normalize_pixels(width, height, message.get("pixels"))

    drawing = {
        "name": name.strip(),
        "width": width,
        "height": height,
        "pixels": normalized_pixels,
    }
    return _attach_board_workspace(
        drawing,
        message.get("boardLayout"),
        message.get("boardGroups"),
    )


def validate_project_payload(project: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(project, dict):
        raise ProtocolError("project payload must be an object")

    name = project.get("name")
    if not isinstance(name, str) or not name.strip():
        raise ProtocolError("project name must be a non-empty string")

    width, height = _validate_dimensions(project.get("width"), project.get("height"))

    frames = project.get("frames")
    if not isinstance(frames, list) or len(frames) == 0:
        raise ProtocolError("project frames must be a non-empty list")

    normalized_project = _attach_board_workspace(
        {
            "name": name.strip(),
            "width": width,
            "height": height,
        },
        project.get("boardLayout"),
        project.get("boardGroups"),
    )
    normalized_channels = _normalize_project_channels(project.get("channels"))
    channel_ids = {channel["id"] for channel in normalized_channels}

    normalized_frames: list[dict[str, Any]] = []
    frame_ids: set[str] = set()
    for frame in frames:
        if not isinstance(frame, dict):
            raise ProtocolError("project frames must contain only objects")

        frame_id = frame.get("id")
        if not isinstance(frame_id, str) or not frame_id.strip():
            raise ProtocolError("project frame id must be a non-empty string")
        normalized_frame_id = frame_id.strip()
        if normalized_frame_id in frame_ids:
            raise ProtocolError("project frame ids must be unique")

        frame_name = frame.get("name")
        if frame_name is not None and (not isinstance(frame_name, str) or not frame_name.strip()):
            raise ProtocolError("project frame name must be a non-empty string when provided")

        normalized_frames.append(
            {
                "id": normalized_frame_id,
                "name": frame_name.strip() if isinstance(frame_name, str) else normalized_frame_id,
                "pixels": _normalize_pixels(width, height, frame.get("pixels")),
            }
        )
        frame_ids.add(normalized_frame_id)

    animations = project.get("animations")
    if animations is None:
        animations = []
    if not isinstance(animations, list):
        raise ProtocolError("project animations must be a list or null")

    normalized_animations: list[dict[str, Any]] = []
    animation_ids: set[str] = set()
    for animation in animations:
        if not isinstance(animation, dict):
            raise ProtocolError("project animations must contain only objects")

        animation_id = animation.get("id")
        if not isinstance(animation_id, str) or not animation_id.strip():
            raise ProtocolError("project animation id must be a non-empty string")
        normalized_animation_id = animation_id.strip()
        if normalized_animation_id in animation_ids:
            raise ProtocolError("project animation ids must be unique")

        animation_name = animation.get("name")
        if animation_name is not None and (
            not isinstance(animation_name, str) or not animation_name.strip()
        ):
            raise ProtocolError("project animation name must be a non-empty string when provided")

        loop = animation.get("loop", True)
        if not isinstance(loop, bool):
            raise ProtocolError("project animation loop must be a boolean when provided")

        channel_id = animation.get("channelId")
        if channel_id is None:
            if DEFAULT_PROJECT_CHANNEL_ID not in channel_ids:
                default_channel = _build_default_project_channel()
                normalized_channels.append(default_channel)
                channel_ids.add(default_channel["id"])
            normalized_channel_id = DEFAULT_PROJECT_CHANNEL_ID
        else:
            if not isinstance(channel_id, str) or not channel_id.strip():
                raise ProtocolError("project animation channelId must be a non-empty string when provided")
            normalized_channel_id = channel_id.strip()
            if normalized_channel_id not in channel_ids:
                raise ProtocolError("project animation channelId must reference a known channel")

        steps = animation.get("steps")
        if not isinstance(steps, list) or len(steps) == 0:
            raise ProtocolError("project animation steps must be a non-empty list")

        normalized_steps: list[dict[str, Any]] = []
        for step in steps:
            if not isinstance(step, dict):
                raise ProtocolError("project animation steps must contain only objects")

            frame_id = step.get("frameId")
            if not isinstance(frame_id, str) or not frame_id.strip():
                raise ProtocolError("project animation step frameId must be a non-empty string")
            normalized_frame_id = frame_id.strip()
            if normalized_frame_id not in frame_ids:
                raise ProtocolError("project animation step frameId must reference a known frame")

            duration_ms = step.get("durationMs")
            if isinstance(duration_ms, bool) or not isinstance(duration_ms, int) or duration_ms <= 0:
                raise ProtocolError("project animation step durationMs must be a positive integer")

            normalized_steps.append(
                {
                    "frameId": normalized_frame_id,
                    "durationMs": duration_ms,
                }
            )

        normalized_animations.append(
            {
                "id": normalized_animation_id,
                "name": animation_name.strip() if isinstance(animation_name, str) else normalized_animation_id,
                "loop": loop,
                "channelId": normalized_channel_id,
                "steps": normalized_steps,
            }
        )
        animation_ids.add(normalized_animation_id)

    default_frame_id = project.get("defaultFrameId")
    if default_frame_id is not None:
        if not isinstance(default_frame_id, str) or not default_frame_id.strip():
            raise ProtocolError("defaultFrameId must be a non-empty string or null")
        default_frame_id = default_frame_id.strip()
        if default_frame_id not in frame_ids:
            raise ProtocolError("defaultFrameId must reference a known frame")

    default_animation_id = project.get("defaultAnimationId")
    if default_animation_id is not None:
        if not isinstance(default_animation_id, str) or not default_animation_id.strip():
            raise ProtocolError("defaultAnimationId must be a non-empty string or null")
        default_animation_id = default_animation_id.strip()
        if default_animation_id not in animation_ids:
            raise ProtocolError("defaultAnimationId must reference a known animation")

    normalized_channel_defaults = _normalize_channel_defaults(
        project.get("channelDefaults"),
        channel_ids,
    )
    normalized_channel_group_map = _normalize_channel_group_map(
        project.get("channelGroupMap"),
        channel_ids,
        _collect_project_group_ids(normalized_project),
    )

    normalized_project["frames"] = normalized_frames
    normalized_project["animations"] = normalized_animations
    normalized_project["defaultFrameId"] = default_frame_id
    normalized_project["defaultAnimationId"] = default_animation_id
    normalized_project["channels"] = normalized_channels
    normalized_project["channelDefaults"] = normalized_channel_defaults
    normalized_project["channelGroupMap"] = normalized_channel_group_map
    return normalized_project


def validate_project_message(message: dict[str, Any], expected_type: str = "save_project") -> dict[str, Any]:
    if message.get("type") != expected_type:
        raise ProtocolError("Unsupported message type")

    return validate_project_payload(message)


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


def validate_project_name_message(message: dict[str, Any], expected_type: str) -> dict[str, Any]:
    if message.get("type") != expected_type:
        raise ProtocolError("Unsupported message type")

    name = message.get("name")
    if not isinstance(name, str) or not name.strip():
        raise ProtocolError("project name must be a non-empty string")

    return {
        "type": expected_type,
        "version": 1,
        "name": name.strip(),
    }
