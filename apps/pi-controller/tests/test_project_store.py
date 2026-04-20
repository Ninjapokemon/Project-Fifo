from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from project_store import ProjectStore  # noqa: E402


class ProjectStoreTests(unittest.TestCase):
    def test_save_load_and_delete_project(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            store = ProjectStore(Path(temp_dir))
            saved_name = store.save(
                {
                    "name": "Happy Face",
                    "width": 16,
                    "height": 8,
                    "boardLayout": [{"id": "board-1"}],
                    "boardGroups": ["eyes"],
                    "frames": [
                        {
                            "id": "frame-1",
                            "name": "Idle",
                            "pixels": [0] * 128,
                        }
                    ],
                    "animations": [],
                    "channels": [
                        {
                            "id": "base",
                            "name": "Base",
                            "priority": 100,
                            "blendMode": "overwrite",
                            "mask": None,
                        }
                    ],
                    "channelDefaults": {
                        "base": {
                            "startupAnimationId": None,
                        }
                    },
                    "defaultFrameId": "frame-1",
                    "defaultAnimationId": None,
                }
            )

            self.assertEqual(saved_name, "Happy-Face")
            self.assertEqual(store.list_names(), ["Happy-Face"])

            loaded_project = store.load("Happy Face")
            self.assertEqual(loaded_project["name"], "Happy-Face")
            self.assertEqual(loaded_project["boardGroups"], ["eyes"])
            self.assertEqual(loaded_project["frames"][0]["id"], "frame-1")
            self.assertEqual(loaded_project["channels"][0]["id"], "base")
            self.assertEqual(loaded_project["channelDefaults"]["base"]["startupAnimationId"], None)

            deleted_name = store.delete("Happy Face")
            self.assertEqual(deleted_name, "Happy-Face")
            self.assertEqual(store.list_names(), [])


if __name__ == "__main__":
    unittest.main()
