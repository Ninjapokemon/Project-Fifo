from __future__ import annotations

import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from event_router import MicrophoneRuntimeBridge  # noqa: E402


class FakeRuntime:
    def __init__(self) -> None:
        self.runtime_mode = "project"
        self.active_project = {"name": "test"}
        self.calls: list[tuple[str, str, str | None]] = []

    async def set_channel_animation(self, channel_id: str, animation_id: str) -> None:
        self.calls.append(("set_channel_animation", channel_id, animation_id))

    async def play_channel(self, channel_id: str) -> None:
        self.calls.append(("play_channel", channel_id, None))


class EventRouterTests(unittest.IsolatedAsyncioTestCase):
    async def test_microphone_bridge_switches_between_active_and_idle_animation(self) -> None:
        bridge = MicrophoneRuntimeBridge(
            {
                "microphone": {
                    "runtime_bridge": {
                        "enabled": True,
                        "channel_id": "mouth",
                        "active_threshold": 20,
                        "idle_threshold": 10,
                        "active_animation_id": "talk",
                        "idle_animation_id": "idle",
                        "switch_cooldown_ms": 0,
                    }
                }
            }
        )
        runtime = FakeRuntime()

        first = await bridge.process_microphone_state(
            runtime,
            {"available": True, "level_percent": 35},
        )
        second = await bridge.process_microphone_state(
            runtime,
            {"available": True, "level_percent": 4},
        )

        self.assertIsNotNone(first)
        self.assertIsNotNone(second)
        self.assertEqual(
            runtime.calls,
            [
                ("set_channel_animation", "mouth", "talk"),
                ("set_channel_animation", "mouth", "idle"),
            ],
        )

    async def test_microphone_bridge_uses_play_channel_when_idle_animation_not_configured(self) -> None:
        bridge = MicrophoneRuntimeBridge(
            {
                "microphone": {
                    "runtime_bridge": {
                        "enabled": True,
                        "channel_id": "mouth",
                        "active_threshold": 20,
                        "idle_threshold": 10,
                        "active_animation_id": "talk",
                        "switch_cooldown_ms": 0,
                    }
                }
            }
        )
        runtime = FakeRuntime()

        await bridge.process_microphone_state(runtime, {"available": True, "level_percent": 40})
        await bridge.process_microphone_state(runtime, {"available": True, "level_percent": 2})

        self.assertEqual(
            runtime.calls,
            [
                ("set_channel_animation", "mouth", "talk"),
                ("play_channel", "mouth", None),
            ],
        )

    async def test_microphone_bridge_ignores_live_mode(self) -> None:
        bridge = MicrophoneRuntimeBridge(
            {
                "microphone": {
                    "runtime_bridge": {
                        "enabled": True,
                        "channel_id": "mouth",
                        "switch_cooldown_ms": 0,
                    }
                }
            }
        )
        runtime = FakeRuntime()
        runtime.runtime_mode = "live"

        result = await bridge.process_microphone_state(
            runtime,
            {"available": True, "level_percent": 100},
        )

        self.assertIsNone(result)
        self.assertEqual(runtime.calls, [])

    async def test_microphone_bridge_uses_project_animation_channel_mapping(self) -> None:
        bridge = MicrophoneRuntimeBridge(
            {
                "microphone": {
                    "runtime_bridge": {
                        "enabled": True,
                        "channel_id": "mouth",
                        "active_threshold": 20,
                        "idle_threshold": 10,
                        "active_animation_id": "smile",
                        "switch_cooldown_ms": 0,
                    }
                }
            }
        )
        runtime = FakeRuntime()
        runtime.active_project = {
            "name": "project-fifo",
            "animations": [
                {"id": "smile", "channelId": "base", "steps": [{"frameId": "a", "durationMs": 100}]},
            ],
        }

        await bridge.process_microphone_state(runtime, {"available": True, "level_percent": 40})
        await bridge.process_microphone_state(runtime, {"available": True, "level_percent": 2})

        self.assertEqual(
            runtime.calls,
            [
                ("set_channel_animation", "base", "smile"),
                ("play_channel", "base", None),
            ],
        )

    async def test_microphone_bridge_restores_speech_channel_when_idle_animation_is_on_another_channel(self) -> None:
        bridge = MicrophoneRuntimeBridge(
            {
                "microphone": {
                    "runtime_bridge": {
                        "enabled": True,
                        "channel_id": "mouth",
                        "active_threshold": 20,
                        "idle_threshold": 10,
                        "active_animation_id": "smile",
                        "idle_animation_id": "blink",
                        "switch_cooldown_ms": 0,
                    }
                }
            }
        )
        runtime = FakeRuntime()
        runtime.active_project = {
            "name": "project-fifo",
            "animations": [
                {"id": "smile", "channelId": "mouth", "steps": [{"frameId": "a", "durationMs": 100}]},
                {"id": "blink", "channelId": "base", "steps": [{"frameId": "b", "durationMs": 100}]},
            ],
        }

        await bridge.process_microphone_state(runtime, {"available": True, "level_percent": 40})
        await bridge.process_microphone_state(runtime, {"available": True, "level_percent": 2})

        self.assertEqual(
            runtime.calls,
            [
                ("set_channel_animation", "mouth", "smile"),
                ("play_channel", "mouth", None),
                ("set_channel_animation", "base", "blink"),
            ],
        )


if __name__ == "__main__":
    unittest.main()
