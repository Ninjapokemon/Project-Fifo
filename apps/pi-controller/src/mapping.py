from __future__ import annotations


PANEL_SIZE = 8
ALLOWED_PANEL_ROTATION_VALUES = {0, 90, 180, 270}


def normalize_panel_order(
    panel_order: list[int] | None,
    panel_columns: int,
    panel_rows: int,
) -> list[int] | None:
    panel_count = panel_columns * panel_rows
    if panel_order is None:
        return None
    if not isinstance(panel_order, list):
        raise ValueError("panel_order must be a list of panel indexes or null")
    if len(panel_order) != panel_count:
        raise ValueError(f"panel_order must contain exactly {panel_count} entries")

    normalized: list[int] = []
    seen_indexes: set[int] = set()
    for raw_index in panel_order:
        if not isinstance(raw_index, int):
            raise ValueError("panel_order entries must be integers")
        if raw_index < 0 or raw_index >= panel_count:
            raise ValueError(f"panel_order entries must be between 0 and {panel_count - 1}")
        if raw_index in seen_indexes:
            raise ValueError("panel_order entries must be unique")
        normalized.append(raw_index)
        seen_indexes.add(raw_index)

    return normalized


def normalize_panel_flips(
    panel_flips: list[bool] | None,
    panel_columns: int,
    panel_rows: int,
) -> list[bool] | None:
    panel_count = panel_columns * panel_rows
    if panel_flips is None:
        return None
    if not isinstance(panel_flips, list):
        raise ValueError("panel_flips must be a list of booleans or null")
    if len(panel_flips) != panel_count:
        raise ValueError(f"panel_flips must contain exactly {panel_count} entries")

    normalized: list[bool] = []
    for raw_value in panel_flips:
        if not isinstance(raw_value, bool):
            raise ValueError("panel_flips entries must be booleans")
        normalized.append(raw_value)

    return normalized if any(normalized) else None


def normalize_panel_rotations(
    panel_rotations: list[int] | None,
    panel_columns: int,
    panel_rows: int,
) -> list[int] | None:
    panel_count = panel_columns * panel_rows
    if panel_rotations is None:
        return None
    if not isinstance(panel_rotations, list):
        raise ValueError("panel_rotations must be a list of integers or null")
    if len(panel_rotations) != panel_count:
        raise ValueError(f"panel_rotations must contain exactly {panel_count} entries")

    normalized: list[int] = []
    for raw_value in panel_rotations:
        if isinstance(raw_value, bool) or not isinstance(raw_value, int):
            raise ValueError("panel_rotations entries must be integers")
        if raw_value not in ALLOWED_PANEL_ROTATION_VALUES:
            raise ValueError("panel_rotations entries must be 0, 90, 180, or 270")
        normalized.append(raw_value)

    return normalized if any(value != 0 for value in normalized) else None


def resolve_panel_rotations(
    panel_columns: int,
    panel_rows: int,
    panel_rotations: list[int] | None = None,
    panel_flips: list[bool] | None = None,
) -> list[int] | None:
    normalized_rotations = normalize_panel_rotations(
        panel_rotations,
        panel_columns,
        panel_rows,
    )
    if normalized_rotations is not None or panel_rotations is not None:
        return normalized_rotations

    normalized_flips = normalize_panel_flips(
        panel_flips,
        panel_columns,
        panel_rows,
    )
    if normalized_flips is None:
        return None

    return [180 if value else 0 for value in normalized_flips]


def build_panel_positions(
    panel_columns: int,
    panel_rows: int,
    panel_order: list[int] | None = None,
) -> list[int] | None:
    normalized_order = normalize_panel_order(panel_order, panel_columns, panel_rows)
    if normalized_order is None:
        return None

    panel_positions = [0] * len(normalized_order)
    for physical_panel_index, logical_panel_index in enumerate(normalized_order):
        panel_positions[logical_panel_index] = physical_panel_index

    return panel_positions


def logical_to_physical(
    x: int,
    y: int,
    width: int,
    height: int,
    panel_positions: list[int] | None = None,
) -> tuple[int, int]:
    """
    Translate logical coordinates to physical display coordinates.

    When ``panel_positions`` is supplied, it remaps whole 8x8 panels before the
    luma device applies its own per-panel orientation handling.
    """

    if x < 0 or x >= width or y < 0 or y >= height:
        raise ValueError("coordinate out of bounds")
    if panel_positions is None:
        return x, y

    panel_columns = max(1, width // PANEL_SIZE)
    logical_panel_x = x // PANEL_SIZE
    logical_panel_y = y // PANEL_SIZE
    logical_panel_index = (logical_panel_y * panel_columns) + logical_panel_x
    physical_panel_index = panel_positions[logical_panel_index]
    local_x = x % PANEL_SIZE
    local_y = y % PANEL_SIZE

    physical_panel_x = physical_panel_index % panel_columns
    physical_panel_y = physical_panel_index // panel_columns
    physical_x = (physical_panel_x * PANEL_SIZE) + local_x
    physical_y = (physical_panel_y * PANEL_SIZE) + local_y
    return physical_x, physical_y


def split_frame_into_panel_slices(
    pixels: list[int],
    frame_width: int,
    frame_height: int,
    panel_columns: int,
    panel_rows: int,
) -> list[list[int]]:
    """
    Split a row-major framebuffer into zero-padded 8x8 panel slices.

    The slice count is driven by the target panel grid so frames smaller than
    the physical display stay anchored at the top-left and leave the remaining
    panels blank instead of spilling pixels into neighbouring panels.
    """

    panel_count = panel_columns * panel_rows
    panel_slices = [[0] * (PANEL_SIZE * PANEL_SIZE) for _ in range(panel_count)]

    for logical_panel_index in range(panel_count):
        panel_x = logical_panel_index % panel_columns
        panel_y = logical_panel_index // panel_columns
        start_x = panel_x * PANEL_SIZE
        start_y = panel_y * PANEL_SIZE
        panel_slice = panel_slices[logical_panel_index]

        for local_y in range(PANEL_SIZE):
            source_y = start_y + local_y
            if source_y >= frame_height:
                continue

            source_row_offset = source_y * frame_width
            panel_row_offset = local_y * PANEL_SIZE
            for local_x in range(PANEL_SIZE):
                source_x = start_x + local_x
                if source_x >= frame_width:
                    continue
                panel_slice[panel_row_offset + local_x] = pixels[source_row_offset + source_x]

    return panel_slices


def compose_physical_frame(
    panel_slices: list[list[int]],
    panel_columns: int,
    panel_rows: int,
    panel_positions: list[int] | None = None,
    panel_rotations: list[int] | None = None,
) -> list[int]:
    """
    Assemble 8x8 logical panel slices into a physical row-major framebuffer.
    """

    panel_count = panel_columns * panel_rows
    if len(panel_slices) != panel_count:
        raise ValueError(f"panel_slices must contain exactly {panel_count} entries")
    if panel_positions is not None and len(panel_positions) != panel_count:
        raise ValueError(f"panel_positions must contain exactly {panel_count} entries")
    if panel_rotations is not None and len(panel_rotations) != panel_count:
        raise ValueError(f"panel_rotations must contain exactly {panel_count} entries")

    frame_width = panel_columns * PANEL_SIZE
    frame_height = panel_rows * PANEL_SIZE
    physical_pixels = [0] * (frame_width * frame_height)

    for logical_panel_index, panel_slice in enumerate(panel_slices):
        if len(panel_slice) != PANEL_SIZE * PANEL_SIZE:
            raise ValueError("each panel slice must contain exactly 64 pixels")

        physical_panel_index = (
            panel_positions[logical_panel_index]
            if panel_positions is not None
            else logical_panel_index
        )
        rotation = panel_rotations[physical_panel_index] if panel_rotations is not None else 0
        rendered_panel_slice = rotate_panel_slice(panel_slice, rotation)
        physical_panel_x = (physical_panel_index % panel_columns) * PANEL_SIZE
        physical_panel_y = (physical_panel_index // panel_columns) * PANEL_SIZE

        for local_y in range(PANEL_SIZE):
            source_offset = local_y * PANEL_SIZE
            target_offset = ((physical_panel_y + local_y) * frame_width) + physical_panel_x
            physical_pixels[target_offset:target_offset + PANEL_SIZE] = rendered_panel_slice[
                source_offset:source_offset + PANEL_SIZE
            ]

    return physical_pixels


def rotate_panel_slice(panel_slice: list[int], rotation: int) -> list[int]:
    if rotation == 0:
        return panel_slice
    if rotation not in ALLOWED_PANEL_ROTATION_VALUES:
        raise ValueError("rotation must be 0, 90, 180, or 270")

    rotated_slice = [0] * (PANEL_SIZE * PANEL_SIZE)
    for source_y in range(PANEL_SIZE):
        for source_x in range(PANEL_SIZE):
            if rotation == 90:
                target_x = (PANEL_SIZE - 1) - source_y
                target_y = source_x
            elif rotation == 180:
                target_x = (PANEL_SIZE - 1) - source_x
                target_y = (PANEL_SIZE - 1) - source_y
            else:
                target_x = source_y
                target_y = (PANEL_SIZE - 1) - source_x

            rotated_slice[(target_y * PANEL_SIZE) + target_x] = panel_slice[
                (source_y * PANEL_SIZE) + source_x
            ]

    return rotated_slice


def build_physical_frame(
    pixels: list[int],
    frame_width: int,
    frame_height: int,
    display_width: int,
    display_height: int,
    panel_positions: list[int] | None = None,
    panel_rotations: list[int] | None = None,
) -> list[int]:
    """
    Convert a logical frame into the exact physical framebuffer sent to luma.
    """

    panel_columns = max(1, display_width // PANEL_SIZE)
    panel_rows = max(1, display_height // PANEL_SIZE)
    panel_slices = split_frame_into_panel_slices(
        pixels,
        frame_width,
        frame_height,
        panel_columns,
        panel_rows,
    )
    return compose_physical_frame(
        panel_slices,
        panel_columns,
        panel_rows,
        panel_positions,
        panel_rotations,
    )
