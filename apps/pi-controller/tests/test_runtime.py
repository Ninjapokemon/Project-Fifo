from __future__ import annotations

import asyncio
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from project_store import ProjectStore  # noqa: E402
from runtime import ProjectRuntime  # noqa: E402


def build_pixels(width: int, height: int, lit_points: list[tuple[int, int]]) -> list[int]:
    pixels = [0] * (width * height)
    for x, y in lit_points:
        pixels[(y * width) + x] = 1
    return pixels


class FakeDisplay:
    def __init__(self, width: int = 16, height: int = 8):
        self.width = width
        self.height = height
        self.frames: list[list[int]] = []
        self.clear_calls = 0

    def clear(self) -> None:
        self.clear_calls += 1
        self.frames.append([0] * (self.width * self.height))

    def render_frame(self, pixels: list[int], width: int, height: int) -> None:
        if width != self.width or height != self.height:
            raise ValueError("frame dimensions do not match fake display")
        self.frames.append(list(pixels))


class RuntimeTests(unittest.IsolatedAsyncioTestCase):
    async def test_runtime_emits_secondary_output_callbacks(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            project_store = ProjectStore(Path(temp_dir))
            project_store.save(
                {
                    "name": "Blink Face",
                    "width": 16,
                    "height": 8,
                    "frames": [
                        {
                            "id": "open",
                            "name": "Open",
                            "pixels": build_pixels(16, 8, [(0, 0)]),
                        },
                        {
                            "id": "closed",
                            "name": "Closed",
                            "pixels": build_pixels(16, 8, [(1, 0)]),
                        },
                    ],
                    "animations": [
                        {
                            "id": "blink",
                            "name": "Blink",
                            "loop": False,
                            "steps": [
                                {"frameId": "open", "durationMs": 1},
                                {"frameId": "closed", "durationMs": 1},
                            ],
                        }
                    ],
                    "defaultFrameId": None,
                    "defaultAnimationId": "blink",
                }
            )

            mirrored_frames: list[list[int]] = []
            clear_calls = 0

            def on_frame_render(pixels: list[int], width: int, height: int) -> None:
                self.assertEqual(width, 16)
                self.assertEqual(height, 8)
                mirrored_frames.append(list(pixels))

            def on_clear_render() -> None:
                nonlocal clear_calls
                clear_calls += 1

            config = {"boot_project": None}
            display = FakeDisplay()
            runtime = ProjectRuntime(
                display,
                project_store,
                config,
                lambda updated_config: updated_config,
                on_frame_render=on_frame_render,
                on_clear_render=on_clear_render,
            )

            await runtime.activate_project("Blink Face")
            await asyncio.sleep(0.02)
            self.assertGreaterEqual(len(mirrored_frames), 2)
            self.assertEqual(mirrored_frames[0][0], 1)
            self.assertEqual(mirrored_frames[1][1], 1)

            await runtime.apply_live_clear()
            self.assertGreaterEqual(clear_calls, 1)

    async def test_live_frame_stream_only_emits_state_change_on_first_live_frame(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            project_store = ProjectStore(Path(temp_dir))
            state_updates: list[dict[str, object]] = []
            config = {"boot_project": None}
            display = FakeDisplay()
            runtime = ProjectRuntime(
                display,
                project_store,
                config,
                lambda updated_config: updated_config,
                on_state_change=lambda state: state_updates.append(dict(state)),
            )

            # Constructor emits one initial state.
            self.assertEqual(len(state_updates), 1)

            await runtime.apply_live_frame(build_pixels(16, 8, [(0, 0)]), 16, 8)
            self.assertEqual(len(state_updates), 2)

            await runtime.apply_live_frame(build_pixels(16, 8, [(1, 0)]), 16, 8)
            await runtime.apply_live_frame(build_pixels(16, 8, [(2, 0)]), 16, 8)
            self.assertEqual(len(state_updates), 2)

    async def test_live_disconnect_resumes_active_project(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            project_store = ProjectStore(Path(temp_dir))
            project_store.save(
                {
                    "name": "Idle Face",
                    "width": 16,
                    "height": 8,
                    "frames": [
                        {
                            "id": "idle",
                            "name": "Idle",
                            "pixels": build_pixels(16, 8, [(0, 0)]),
                        }
                    ],
                    "animations": [],
                    "defaultFrameId": "idle",
                    "defaultAnimationId": None,
                }
            )

            config = {"boot_project": None}
            display = FakeDisplay()
            runtime = ProjectRuntime(display, project_store, config, lambda updated_config: updated_config)

            await runtime.activate_project("Idle Face")
            self.assertEqual(runtime.runtime_mode, "project")
            self.assertEqual(runtime.active_project_name, "Idle-Face")
            self.assertEqual(display.frames[-1][0], 1)

            runtime.register_client()
            await runtime.apply_live_frame(build_pixels(16, 8, [(1, 0)]), 16, 8)
            self.assertEqual(runtime.runtime_mode, "live")
            self.assertEqual(display.frames[-1][1], 1)

            await runtime.unregister_client()
            self.assertEqual(runtime.runtime_mode, "project")
            self.assertEqual(runtime.active_project_name, "Idle-Face")
            self.assertEqual(display.frames[-1][0], 1)

    async def test_set_boot_project_updates_config(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            project_store = ProjectStore(Path(temp_dir))
            project_store.save(
                {
                    "name": "Blink Face",
                    "width": 16,
                    "height": 8,
                    "frames": [
                        {
                            "id": "blink",
                            "name": "Blink",
                            "pixels": build_pixels(16, 8, [(2, 0)]),
                        }
                    ],
                    "animations": [],
                    "defaultFrameId": "blink",
                    "defaultAnimationId": None,
                }
            )

            saved_configs: list[dict[str, object]] = []
            config = {"boot_project": None}
            display = FakeDisplay()
            runtime = ProjectRuntime(
                display,
                project_store,
                config,
                lambda updated_config: saved_configs.append(dict(updated_config)),
            )

            boot_name = await runtime.set_boot_project("Blink Face")
            self.assertEqual(boot_name, "Blink-Face")
            self.assertEqual(runtime.boot_project_name, "Blink-Face")
            self.assertEqual(config["boot_project"], "Blink-Face")
            self.assertEqual(saved_configs[-1]["boot_project"], "Blink-Face")

    async def test_runtime_composes_multiple_channels(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            project_store = ProjectStore(Path(temp_dir))
            project_store.save(
                {
                    "name": "Layered Face",
                    "width": 16,
                    "height": 8,
                    "frames": [
                        {
                            "id": "base-open",
                            "name": "Base Open",
                            "pixels": build_pixels(16, 8, [(0, 0)]),
                        },
                        {
                            "id": "eyes-blink",
                            "name": "Eyes Blink",
                            "pixels": build_pixels(16, 8, [(1, 0)]),
                        },
                        {
                            "id": "mouth-talk",
                            "name": "Mouth Talk",
                            "pixels": build_pixels(16, 8, [(2, 0)]),
                        },
                    ],
                    "animations": [
                        {
                            "id": "idle",
                            "name": "Idle",
                            "loop": True,
                            "channelId": "base",
                            "steps": [
                                {"frameId": "base-open", "durationMs": 120},
                            ],
                        },
                        {
                            "id": "blink",
                            "name": "Blink",
                            "loop": True,
                            "channelId": "eyes",
                            "steps": [
                                {"frameId": "eyes-blink", "durationMs": 120},
                            ],
                        },
                        {
                            "id": "talk",
                            "name": "Talk",
                            "loop": True,
                            "channelId": "mouth",
                            "steps": [
                                {"frameId": "mouth-talk", "durationMs": 120},
                            ],
                        },
                    ],
                    "channels": [
                        {
                            "id": "base",
                            "name": "Base",
                            "priority": 100,
                            "blendMode": "overwrite",
                            "mask": None,
                        },
                        {
                            "id": "eyes",
                            "name": "Eyes",
                            "priority": 200,
                            "blendMode": "overwrite",
                            "mask": None,
                        },
                        {
                            "id": "mouth",
                            "name": "Mouth",
                            "priority": 300,
                            "blendMode": "overwrite",
                            "mask": None,
                        },
                    ],
                    "channelDefaults": {
                        "base": {"startupAnimationId": "idle"},
                        "eyes": {"startupAnimationId": "blink"},
                        "mouth": {"startupAnimationId": "talk"},
                    },
                    "defaultFrameId": None,
                    "defaultAnimationId": "idle",
                }
            )

            config = {"boot_project": None}
            display = FakeDisplay()
            runtime = ProjectRuntime(display, project_store, config, lambda updated_config: updated_config)

            await runtime.activate_project("Layered Face")
            await asyncio.sleep(0.03)

            self.assertGreaterEqual(len(display.frames), 1)
            last_frame = display.frames[-1]
            self.assertEqual(last_frame[0], 1)
            self.assertEqual(last_frame[1], 1)
            self.assertEqual(last_frame[2], 1)

            runtime_state = runtime.get_runtime_state()
            runtime_channels = runtime_state.get("channels")
            self.assertIsInstance(runtime_channels, list)
            channel_ids = {channel["channel_id"] for channel in runtime_channels}
            self.assertSetEqual(channel_ids, {"base", "eyes", "mouth"})

    async def test_runtime_applies_channel_section_mappings(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            project_store = ProjectStore(Path(temp_dir))
            project_store.save(
                {
                    "name": "Sectioned Face",
                    "width": 16,
                    "height": 8,
                    "boardLayout": [
                        {
                            "id": "board-1",
                            "chainIndex": 0,
                            "groupId": "eyes",
                            "width": 8,
                            "height": 8,
                        },
                        {
                            "id": "board-2",
                            "chainIndex": 1,
                            "groupId": "mouth",
                            "width": 8,
                            "height": 8,
                        },
                    ],
                    "boardGroups": ["eyes", "mouth"],
                    "frames": [
                        {
                            "id": "eyes-on",
                            "name": "Eyes On",
                            "pixels": [1] * (16 * 8),
                        },
                        {
                            "id": "mouth-off",
                            "name": "Mouth Off",
                            "pixels": [0] * (16 * 8),
                        },
                    ],
                    "animations": [
                        {
                            "id": "eyes-idle",
                            "name": "Eyes Idle",
                            "loop": True,
                            "channelId": "eyes",
                            "steps": [
                                {"frameId": "eyes-on", "durationMs": 120},
                            ],
                        },
                        {
                            "id": "mouth-idle",
                            "name": "Mouth Idle",
                            "loop": True,
                            "channelId": "mouth",
                            "steps": [
                                {"frameId": "mouth-off", "durationMs": 120},
                            ],
                        },
                    ],
                    "channels": [
                        {
                            "id": "eyes",
                            "name": "Eyes",
                            "priority": 100,
                            "blendMode": "overwrite",
                            "mask": None,
                        },
                        {
                            "id": "mouth",
                            "name": "Mouth",
                            "priority": 200,
                            "blendMode": "overwrite",
                            "mask": None,
                        },
                    ],
                    "channelDefaults": {
                        "eyes": {"startupAnimationId": "eyes-idle"},
                        "mouth": {"startupAnimationId": "mouth-idle"},
                    },
                    "channelGroupMap": {
                        "eyes": "eyes",
                        "mouth": "mouth",
                    },
                    "defaultFrameId": None,
                    "defaultAnimationId": "eyes-idle",
                }
            )

            config = {"boot_project": None}
            display = FakeDisplay()
            runtime = ProjectRuntime(display, project_store, config, lambda updated_config: updated_config)

            await runtime.activate_project("Sectioned Face")
            await asyncio.sleep(0.02)

            self.assertGreaterEqual(len(display.frames), 1)
            last_frame = display.frames[-1]
            for y in range(8):
                for x in range(16):
                    index = (y * 16) + x
                    if x < 8:
                        self.assertEqual(last_frame[index], 1)
                    else:
                        self.assertEqual(last_frame[index], 0)


if __name__ == "__main__":
    unittest.main()
