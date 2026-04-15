from __future__ import annotations


PANEL_SIZE = 8


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
