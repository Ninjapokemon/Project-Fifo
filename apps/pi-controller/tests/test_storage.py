from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from storage import DrawingStore  # noqa: E402


class StorageTests(unittest.TestCase):
    def test_save_persists_board_workspace_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            store = DrawingStore(Path(temp_dir))
            saved_name = store.save(
                {
                    "name": "Happy Face",
                    "width": 16,
                    "height": 8,
                    "pixels": [0] * 128,
                    "boardLayout": [
                        {
                            "id": "board-1",
                            "chainIndex": 0,
                            "visualGridX": 1,
                            "visualGridY": 2,
                            "viewRotation": 180,
                            "viewMirror": False,
                            "groupId": "group-3",
                            "width": 8,
                            "height": 8,
                        }
                    ],
                    "boardGroups": ["group-1", "group-3"],
                }
            )

            self.assertEqual(saved_name, "Happy-Face")
            raw_payload = json.loads((Path(temp_dir) / "Happy-Face.json").read_text(encoding="utf-8"))
            self.assertEqual(raw_payload["boardLayout"][0]["visualGridX"], 1)
            self.assertEqual(raw_payload["boardGroups"], ["group-1", "group-3"])

            loaded_payload = store.load("Happy Face")
            self.assertEqual(loaded_payload["boardLayout"][0]["groupId"], "group-3")
            self.assertEqual(loaded_payload["boardGroups"], ["group-1", "group-3"])


if __name__ == "__main__":
    unittest.main()
