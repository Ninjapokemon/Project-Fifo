from __future__ import annotations

import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from protocol import ProtocolError, validate_named_drawing  # noqa: E402


class ProtocolTests(unittest.TestCase):
    def test_validate_named_drawing_preserves_board_workspace_metadata(self) -> None:
        drawing = validate_named_drawing(
            {
                "type": "save_drawing",
                "name": "blink",
                "width": 16,
                "height": 8,
                "pixels": [0] * 128,
                "boardLayout": [
                    {
                        "id": "board-2",
                        "chainIndex": 1,
                        "visualGridX": 3,
                        "visualGridY": 0,
                        "viewRotation": 90,
                        "viewMirror": True,
                        "groupId": "group-2",
                        "width": 8,
                        "height": 8,
                    }
                ],
                "boardGroups": ["group-1", "group-2"],
            }
        )

        self.assertEqual(drawing["name"], "blink")
        self.assertEqual(
            drawing["boardLayout"],
            [
                {
                    "id": "board-2",
                    "chainIndex": 1,
                    "visualGridX": 3,
                    "visualGridY": 0,
                    "viewRotation": 90,
                    "viewMirror": True,
                    "groupId": "group-2",
                    "width": 8,
                    "height": 8,
                }
            ],
        )
        self.assertEqual(drawing["boardGroups"], ["group-1", "group-2"])

    def test_validate_named_drawing_rejects_invalid_board_group_entry(self) -> None:
        with self.assertRaises(ProtocolError):
            validate_named_drawing(
                {
                    "type": "save_drawing",
                    "name": "blink",
                    "width": 8,
                    "height": 8,
                    "pixels": [0] * 64,
                    "boardGroups": ["group-1", ""],
                }
            )


if __name__ == "__main__":
    unittest.main()
