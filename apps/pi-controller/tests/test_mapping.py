from __future__ import annotations

import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from mapping import (  # noqa: E402
    PANEL_SIZE,
    build_panel_positions,
    build_physical_frame,
    resolve_panel_rotations,
    split_frame_into_panel_slices,
)


def build_pixels(width: int, height: int, lit_points: list[tuple[int, int]]) -> list[int]:
    pixels = [0] * (width * height)
    for x, y in lit_points:
        pixels[(y * width) + x] = 1
    return pixels


class MappingTests(unittest.TestCase):
    def test_split_frame_keeps_four_horizontal_panels_distinct(self) -> None:
        pixels = build_pixels(
            32,
            8,
            [
                (0, 0),
                (8 + 1, 1),
                (16 + 2, 2),
                (24 + 3, 3),
            ],
        )

        panel_slices = split_frame_into_panel_slices(pixels, 32, 8, 4, 1)

        for panel_index, (local_x, local_y) in enumerate(((0, 0), (1, 1), (2, 2), (3, 3))):
            with self.subTest(panel_index=panel_index):
                self.assertEqual(sum(panel_slices[panel_index]), 1)
                self.assertEqual(panel_slices[panel_index][(local_y * PANEL_SIZE) + local_x], 1)

    def test_build_physical_frame_reorders_entire_panels_without_overlap(self) -> None:
        pixels = build_pixels(
            32,
            8,
            [
                (0, 0),
                (8 + 1, 1),
                (16 + 2, 2),
                (24 + 3, 3),
            ],
        )
        panel_positions = build_panel_positions(4, 1, [2, 0, 3, 1])

        physical_pixels = build_physical_frame(pixels, 32, 8, 32, 8, panel_positions)
        physical_slices = split_frame_into_panel_slices(physical_pixels, 32, 8, 4, 1)

        self.assertEqual(sum(physical_slices[0]), 1)
        self.assertEqual(physical_slices[0][(2 * PANEL_SIZE) + 2], 1)

        self.assertEqual(sum(physical_slices[1]), 1)
        self.assertEqual(physical_slices[1][0], 1)

        self.assertEqual(sum(physical_slices[2]), 1)
        self.assertEqual(physical_slices[2][(3 * PANEL_SIZE) + 3], 1)

        self.assertEqual(sum(physical_slices[3]), 1)
        self.assertEqual(physical_slices[3][(1 * PANEL_SIZE) + 1], 1)

    def test_build_physical_frame_does_not_spill_last_row_into_next_panel(self) -> None:
        pixels = build_pixels(
            32,
            8,
            [
                (16 + 7, 7),
                (24 + 0, 0),
            ],
        )

        physical_pixels = build_physical_frame(pixels, 32, 8, 32, 8)
        physical_slices = split_frame_into_panel_slices(physical_pixels, 32, 8, 4, 1)

        self.assertEqual(sum(physical_slices[2]), 1)
        self.assertEqual(physical_slices[2][(7 * PANEL_SIZE) + 7], 1)

        self.assertEqual(sum(physical_slices[3]), 1)
        self.assertEqual(physical_slices[3][0], 1)

    def test_build_physical_frame_leaves_missing_panels_blank_for_smaller_frames(self) -> None:
        pixels = build_pixels(
            16,
            8,
            [
                (0, 0),
                (8 + 7, 7),
            ],
        )

        physical_pixels = build_physical_frame(pixels, 16, 8, 32, 8)
        physical_slices = split_frame_into_panel_slices(physical_pixels, 32, 8, 4, 1)

        self.assertEqual(sum(physical_slices[0]), 1)
        self.assertEqual(physical_slices[0][0], 1)

        self.assertEqual(sum(physical_slices[1]), 1)
        self.assertEqual(physical_slices[1][(7 * PANEL_SIZE) + 7], 1)

        self.assertEqual(sum(physical_slices[2]), 0)
        self.assertEqual(sum(physical_slices[3]), 0)

    def test_resolve_panel_rotations_converts_legacy_flips(self) -> None:
        self.assertEqual(resolve_panel_rotations(2, 1, None, [True, False]), [180, 0])

    def test_build_physical_frame_rotates_selected_physical_panel_90_degrees(self) -> None:
        pixels = build_pixels(
            16,
            8,
            [
                (1, 2),
                (8 + 2, 3),
            ],
        )

        physical_pixels = build_physical_frame(
            pixels,
            16,
            8,
            16,
            8,
            panel_rotations=[90, 0],
        )
        physical_slices = split_frame_into_panel_slices(physical_pixels, 16, 8, 2, 1)

        self.assertEqual(sum(physical_slices[0]), 1)
        self.assertEqual(physical_slices[0][(1 * PANEL_SIZE) + 5], 1)

        self.assertEqual(sum(physical_slices[1]), 1)
        self.assertEqual(physical_slices[1][(3 * PANEL_SIZE) + 2], 1)

    def test_build_physical_frame_mirrors_selected_physical_panel_horizontally(self) -> None:
        pixels = build_pixels(
            16,
            8,
            [
                (1, 2),
                (8 + 2, 3),
            ],
        )

        physical_pixels = build_physical_frame(
            pixels,
            16,
            8,
            16,
            8,
            panel_mirrors=[True, False],
        )
        physical_slices = split_frame_into_panel_slices(physical_pixels, 16, 8, 2, 1)

        self.assertEqual(sum(physical_slices[0]), 1)
        self.assertEqual(physical_slices[0][(2 * PANEL_SIZE) + 6], 1)

        self.assertEqual(sum(physical_slices[1]), 1)
        self.assertEqual(physical_slices[1][(3 * PANEL_SIZE) + 2], 1)

    def test_build_physical_frame_keeps_rotations_attached_to_physical_positions_after_reorder(self) -> None:
        pixels = build_pixels(
            16,
            8,
            [
                (1, 2),
                (8 + 2, 3),
            ],
        )
        panel_positions = build_panel_positions(2, 1, [1, 0])

        physical_pixels = build_physical_frame(
            pixels,
            16,
            8,
            16,
            8,
            panel_positions,
            [90, 0],
        )
        physical_slices = split_frame_into_panel_slices(physical_pixels, 16, 8, 2, 1)

        self.assertEqual(sum(physical_slices[0]), 1)
        self.assertEqual(physical_slices[0][(2 * PANEL_SIZE) + 4], 1)

        self.assertEqual(sum(physical_slices[1]), 1)
        self.assertEqual(physical_slices[1][(2 * PANEL_SIZE) + 1], 1)

    def test_build_physical_frame_keeps_mirrors_attached_to_physical_positions_after_reorder(self) -> None:
        pixels = build_pixels(
            16,
            8,
            [
                (1, 2),
                (8 + 2, 3),
            ],
        )
        panel_positions = build_panel_positions(2, 1, [1, 0])

        physical_pixels = build_physical_frame(
            pixels,
            16,
            8,
            16,
            8,
            panel_positions,
            None,
            [True, False],
        )
        physical_slices = split_frame_into_panel_slices(physical_pixels, 16, 8, 2, 1)

        self.assertEqual(sum(physical_slices[0]), 1)
        self.assertEqual(physical_slices[0][(3 * PANEL_SIZE) + 5], 1)

        self.assertEqual(sum(physical_slices[1]), 1)
        self.assertEqual(physical_slices[1][(2 * PANEL_SIZE) + 1], 1)


if __name__ == "__main__":
    unittest.main()
