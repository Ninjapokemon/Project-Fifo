from __future__ import annotations

import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from protocol import ProtocolError, validate_named_drawing, validate_project_payload  # noqa: E402


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

    def test_validate_project_payload_preserves_runtime_metadata(self) -> None:
        project = validate_project_payload(
            {
                "name": "protogen-face",
                "width": 16,
                "height": 8,
                "boardLayout": [
                    {
                        "id": "board-1",
                        "chainIndex": 0,
                        "visualGridX": 0,
                        "visualGridY": 0,
                        "groupId": "eyes",
                        "width": 8,
                        "height": 8,
                    }
                ],
                "boardGroups": ["eyes"],
                "frames": [
                    {
                        "id": "idle-open",
                        "name": "Idle Open",
                        "pixels": [0] * 128,
                    },
                    {
                        "id": "idle-closed",
                        "name": "Idle Closed",
                        "pixels": [1] * 128,
                    },
                ],
                "animations": [
                    {
                        "id": "idle",
                        "name": "Idle",
                        "loop": True,
                        "channelId": "eyes",
                        "steps": [
                            {
                                "frameId": "idle-open",
                                "durationMs": 200,
                            },
                            {
                                "frameId": "idle-closed",
                                "durationMs": 80,
                            },
                        ],
                    }
                ],
                "channels": [
                    {
                        "id": "eyes",
                        "name": "Eyes",
                        "priority": 200,
                        "blendMode": "overwrite",
                        "mask": None,
                    }
                ],
                "channelDefaults": {
                    "eyes": {
                        "startupAnimationId": "idle",
                    }
                },
                "defaultAnimationId": "idle",
                "defaultFrameId": "idle-open",
            }
        )

        self.assertEqual(project["name"], "protogen-face")
        self.assertEqual(project["boardGroups"], ["eyes"])
        self.assertEqual(project["frames"][0]["id"], "idle-open")
        self.assertEqual(project["animations"][0]["steps"][1]["durationMs"], 80)
        self.assertEqual(project["animations"][0]["channelId"], "eyes")
        self.assertEqual(project["channels"][0]["id"], "eyes")
        self.assertEqual(project["channelDefaults"]["eyes"]["startupAnimationId"], "idle")
        self.assertEqual(project["defaultAnimationId"], "idle")

    def test_validate_project_payload_rejects_unknown_animation_frame(self) -> None:
        with self.assertRaises(ProtocolError):
            validate_project_payload(
                {
                    "name": "broken-face",
                    "width": 8,
                    "height": 8,
                    "frames": [
                        {
                            "id": "frame-1",
                            "pixels": [0] * 64,
                        }
                    ],
                    "animations": [
                        {
                            "id": "idle",
                            "steps": [
                                {
                                    "frameId": "missing-frame",
                                    "durationMs": 120,
                                }
                            ],
                        }
                    ],
                }
            )

    def test_validate_project_payload_adds_default_base_channel_for_legacy_projects(self) -> None:
        project = validate_project_payload(
            {
                "name": "legacy-face",
                "width": 8,
                "height": 8,
                "frames": [
                    {
                        "id": "frame-1",
                        "pixels": [0] * 64,
                    }
                ],
                "animations": [
                    {
                        "id": "idle",
                        "steps": [
                            {
                                "frameId": "frame-1",
                                "durationMs": 120,
                            }
                        ],
                    }
                ],
            }
        )

        self.assertEqual(project["channels"][0]["id"], "base")
        self.assertEqual(project["animations"][0]["channelId"], "base")
        self.assertIsNone(project["channelDefaults"])

    def test_validate_project_payload_rejects_unknown_animation_channel(self) -> None:
        with self.assertRaises(ProtocolError):
            validate_project_payload(
                {
                    "name": "broken-channel-face",
                    "width": 8,
                    "height": 8,
                    "frames": [
                        {
                            "id": "frame-1",
                            "pixels": [0] * 64,
                        }
                    ],
                    "channels": [
                        {
                            "id": "eyes",
                            "blendMode": "overwrite",
                            "mask": None,
                        }
                    ],
                    "animations": [
                        {
                            "id": "idle",
                            "channelId": "mouth",
                            "steps": [
                                {
                                    "frameId": "frame-1",
                                    "durationMs": 120,
                                }
                            ],
                        }
                    ],
                }
            )


if __name__ == "__main__":
    unittest.main()
