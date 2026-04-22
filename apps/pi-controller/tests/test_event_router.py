from __future__ import annotations

import asyncio
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
        active_project = self.active_project if isinstance(self.active_project, dict) else None
        animations = active_project.get("animations") if isinstance(active_project, dict) else None
        if isinstance(animations, list):
            matching_animation = next(
                (
                    animation
                    for animation in animations
                    if isinstance(animation, dict) and animation.get("id") == animation_id
                ),
                None,
            )
            if matching_animation is None:
                raise ValueError(f'Unknown animation "{animation_id}"')
            expected_channel_id = matching_animation.get("channelId")
            if isinstance(expected_channel_id, str) and expected_channel_id != channel_id:
                raise ValueError(
                    f'Animation "{animation_id}" does not belong to channel "{channel_id}"'
                )
        self.calls.append(("set_channel_animation", channel_id, animation_id))

    async def set_channel_frame(self, channel_id: str, frame_id: str) -> None:
        active_project = self.active_project if isinstance(self.active_project, dict) else None
        frames = active_project.get("frames") if isinstance(active_project, dict) else None
        if isinstance(frames, list):
            matching_frame = next(
                (
                    frame
                    for frame in frames
                    if isinstance(frame, dict) and frame.get("id") == frame_id
                ),
                None,
            )
            if matching_frame is None:
                raise ValueError(f'Unknown frame "{frame_id}"')
        self.calls.append(("set_channel_frame", channel_id, frame_id))

    async def play_channel(self, channel_id: str) -> None:
        self.calls.append(("play_channel", channel_id, None))

    async def clear_channel(self, channel_id: str) -> None:
        self.calls.append(("clear_channel", channel_id, None))


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
                        "release_hold_ms": 0,
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
                        "release_hold_ms": 0,
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
                        "release_hold_ms": 0,
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

    async def test_microphone_bridge_resolves_animation_name_to_project_channel(self) -> None:
        bridge = MicrophoneRuntimeBridge(
            {
                "microphone": {
                    "runtime_bridge": {
                        "enabled": True,
                        "channel_id": "mouth",
                        "active_threshold": 20,
                        "idle_threshold": 10,
                        "active_animation_id": "Smile",
                        "idle_animation_id": "Blink",
                        "switch_cooldown_ms": 0,
                        "release_hold_ms": 0,
                    }
                }
            }
        )
        runtime = FakeRuntime()
        runtime.active_project = {
            "name": "Project-Fifo",
            "animations": [
                {"id": "blink", "name": "Blink", "channelId": "base"},
                {"id": "smile", "name": "Smile", "channelId": "mouth"},
            ],
        }

        await bridge.process_microphone_state(runtime, {"available": True, "level_percent": 30})
        await bridge.process_microphone_state(runtime, {"available": True, "level_percent": 2})

        self.assertEqual(
            runtime.calls,
            [
                ("set_channel_animation", "mouth", "smile"),
                ("set_channel_animation", "base", "blink"),
            ],
        )

    async def test_microphone_bridge_uses_idle_frame_when_configured(self) -> None:
        bridge = MicrophoneRuntimeBridge(
            {
                "microphone": {
                    "runtime_bridge": {
                        "enabled": True,
                        "channel_id": "mouth",
                        "active_threshold": 20,
                        "idle_threshold": 10,
                        "active_animation_id": "smile",
                        "idle_frame_id": "Mouth Smile Soft",
                        "idle_animation_id": "blink",
                        "switch_cooldown_ms": 0,
                        "release_hold_ms": 0,
                    }
                }
            }
        )
        runtime = FakeRuntime()
        runtime.active_project = {
            "name": "Project-Fifo",
            "frames": [
                {"id": "mouth-smile-soft", "name": "Mouth Smile Soft"},
            ],
            "animations": [
                {"id": "smile", "name": "Smile", "channelId": "mouth"},
                {"id": "blink", "name": "Blink", "channelId": "base"},
            ],
        }

        await bridge.process_microphone_state(runtime, {"available": True, "level_percent": 28})
        await bridge.process_microphone_state(runtime, {"available": True, "level_percent": 2})

        self.assertEqual(
            runtime.calls,
            [
                ("set_channel_animation", "mouth", "smile"),
                ("set_channel_frame", "mouth", "mouth-smile-soft"),
            ],
        )

    async def test_microphone_bridge_applies_release_hold_before_idle_switch(self) -> None:
        bridge = MicrophoneRuntimeBridge(
            {
                "microphone": {
                    "runtime_bridge": {
                        "enabled": True,
                        "channel_id": "mouth",
                        "active_threshold": 20,
                        "idle_threshold": 10,
                        "active_animation_id": "smile",
                        "idle_frame_id": "mouth-smile-soft",
                        "switch_cooldown_ms": 0,
                        "release_hold_ms": 180,
                    }
                }
            }
        )
        runtime = FakeRuntime()
        runtime.active_project = {
            "name": "Project-Fifo",
            "frames": [
                {"id": "mouth-smile-soft", "name": "Mouth Smile Soft"},
            ],
            "animations": [
                {"id": "smile", "name": "Smile", "channelId": "mouth"},
            ],
        }

        await bridge.process_microphone_state(runtime, {"available": True, "level_percent": 30})
        immediate_drop = await bridge.process_microphone_state(
            runtime,
            {"available": True, "level_percent": 1},
        )
        hold_diagnostics = bridge.get_diagnostics()
        await asyncio.sleep(0.2)
        delayed_drop = await bridge.process_microphone_state(
            runtime,
            {"available": True, "level_percent": 1},
        )
        settled_diagnostics = bridge.get_diagnostics()

        self.assertIsNone(immediate_drop)
        self.assertTrue(hold_diagnostics["speech_active"])
        self.assertTrue(hold_diagnostics["hold_active"])
        self.assertGreater(hold_diagnostics["hold_remaining_ms"], 0)
        self.assertIsNotNone(delayed_drop)
        self.assertFalse(settled_diagnostics["speech_active"])
        self.assertFalse(settled_diagnostics["hold_active"])
        self.assertEqual(
            runtime.calls,
            [
                ("set_channel_animation", "mouth", "smile"),
                ("set_channel_frame", "mouth", "mouth-smile-soft"),
            ],
        )

    async def test_microphone_bridge_supports_inverted_level_mode(self) -> None:
        bridge = MicrophoneRuntimeBridge(
            {
                "microphone": {
                    "runtime_bridge": {
                        "enabled": True,
                        "channel_id": "mouth",
                        "invert_level": True,
                        "active_threshold": 14,
                        "idle_threshold": 24,
                        "active_animation_id": "smile",
                        "idle_frame_id": "mouth-smile-soft",
                        "switch_cooldown_ms": 0,
                        "release_hold_ms": 0,
                    }
                }
            }
        )
        runtime = FakeRuntime()
        runtime.active_project = {
            "name": "Project-Fifo",
            "frames": [
                {"id": "mouth-smile-soft", "name": "Mouth Smile Soft"},
            ],
            "animations": [
                {"id": "smile", "name": "Smile", "channelId": "mouth"},
            ],
        }

        await bridge.process_microphone_state(runtime, {"available": True, "level_percent": 10})
        await bridge.process_microphone_state(runtime, {"available": True, "level_percent": 35})

        self.assertEqual(
            runtime.calls,
            [
                ("set_channel_animation", "mouth", "smile"),
                ("set_channel_frame", "mouth", "mouth-smile-soft"),
            ],
        )

    async def test_microphone_bridge_applies_idle_frame_on_first_idle_sample(self) -> None:
        bridge = MicrophoneRuntimeBridge(
            {
                "microphone": {
                    "runtime_bridge": {
                        "enabled": True,
                        "channel_id": "mouth",
                        "invert_level": False,
                        "active_threshold": 40,
                        "idle_threshold": 20,
                        "active_animation_id": "smile",
                        "idle_frame_id": "mouth-smile-soft",
                        "switch_cooldown_ms": 0,
                        "release_hold_ms": 0,
                    }
                }
            }
        )
        runtime = FakeRuntime()
        runtime.active_project = {
            "name": "Project-Fifo",
            "frames": [
                {"id": "mouth-smile-soft", "name": "Mouth Smile Soft"},
            ],
            "animations": [
                {"id": "smile", "name": "Smile", "channelId": "mouth"},
            ],
        }

        first_idle = await bridge.process_microphone_state(
            runtime,
            {"available": True, "level_percent": 5},
        )
        second_idle = await bridge.process_microphone_state(
            runtime,
            {"available": True, "level_percent": 6},
        )

        self.assertIsNotNone(first_idle)
        self.assertIsNone(second_idle)
        self.assertEqual(
            runtime.calls,
            [
                ("set_channel_frame", "mouth", "mouth-smile-soft"),
            ],
        )

    async def test_microphone_bridge_can_clear_channels_when_idle(self) -> None:
        bridge = MicrophoneRuntimeBridge(
            {
                "microphone": {
                    "runtime_bridge": {
                        "enabled": True,
                        "channel_id": "mouth",
                        "invert_level": False,
                        "active_threshold": 40,
                        "idle_threshold": 20,
                        "active_animation_id": "smile",
                        "active_restore_channels": ["base"],
                        "idle_clear_channels": ["base", "mouth"],
                        "switch_cooldown_ms": 0,
                        "release_hold_ms": 0,
                    }
                }
            }
        )
        runtime = FakeRuntime()
        runtime.active_project = {
            "name": "Project-Fifo",
            "frames": [
                {"id": "mouth-smile-soft", "name": "Mouth Smile Soft"},
            ],
            "animations": [
                {"id": "idle-blink", "name": "Idle Blink", "channelId": "base"},
                {"id": "smile", "name": "Smile", "channelId": "mouth"},
            ],
        }

        first_idle = await bridge.process_microphone_state(
            runtime,
            {"available": True, "level_percent": 5},
        )
        talk = await bridge.process_microphone_state(
            runtime,
            {"available": True, "level_percent": 45},
        )

        self.assertIsNotNone(first_idle)
        self.assertIsNotNone(talk)
        self.assertEqual(
            runtime.calls,
            [
                ("clear_channel", "base", None),
                ("clear_channel", "mouth", None),
                ("play_channel", "base", None),
                ("set_channel_animation", "mouth", "smile"),
            ],
        )


if __name__ == "__main__":
    unittest.main()
