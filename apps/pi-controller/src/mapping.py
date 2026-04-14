from __future__ import annotations


def logical_to_physical(x: int, y: int, width: int, height: int) -> tuple[int, int]:
    """
    Translate logical coordinates to physical display coordinates.

    This placeholder currently performs an identity mapping. Replace it when you
    know the exact orientation and chaining order of your matrices.
    """

    if x < 0 or x >= width or y < 0 or y >= height:
        raise ValueError("coordinate out of bounds")

    return x, y
