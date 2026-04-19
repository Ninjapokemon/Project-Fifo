from __future__ import annotations

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


if __name__ == "__main__":
    unittest.main()
