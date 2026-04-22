from __future__ import annotations

import time
from typing import Any, Protocol


class RuntimeBridgeTarget(Protocol):
    runtime_mode: str
    active_project: dict[str, Any] | None

    async def set_channel_animation(self, channel_id: str, animation_id: str) -> None:
        ...

    async def play_channel(self, channel_id: str) -> None:
        ...


class MicrophoneRuntimeBridge:
    def __init__(self, config: dict[str, Any]):
        microphone_config = config.get("microphone")
        if not isinstance(microphone_config, dict):
            microphone_config = {}
        bridge_config = microphone_config.get("runtime_bridge")
        if not isinstance(bridge_config, dict):
            bridge_config = {}

        self.enabled = bool(bridge_config.get("enabled", False))
        self.channel_id = str(bridge_config.get("channel_id", "mouth")).strip() or "mouth"
        self.active_threshold = self._clamp_percent(bridge_config.get("active_threshold", 24), 24)
        self.idle_threshold = self._clamp_percent(bridge_config.get("idle_threshold", 12), 12)
        if self.idle_threshold > self.active_threshold:
            self.idle_threshold = self.active_threshold
        self.active_animation_id = str(bridge_config.get("active_animation_id", "talk")).strip() or "talk"
        idle_animation_value = bridge_config.get("idle_animation_id")
        self.idle_animation_id = (
            str(idle_animation_value).strip()
            if isinstance(idle_animation_value, str) and idle_animation_value.strip()
            else None
        )
        self.switch_cooldown_seconds = self._clamp_seconds(bridge_config.get("switch_cooldown_ms", 140), 140)
        self._speech_active = False
        self._last_switch_at = 0.0
        self._last_error: str | None = None

    def _clamp_percent(self, value: Any, fallback: int) -> int:
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            parsed = fallback
        return max(0, min(100, parsed))

    def _clamp_seconds(self, value: Any, fallback_ms: int) -> float:
        try:
            parsed_ms = int(value)
        except (TypeError, ValueError):
            parsed_ms = fallback_ms
        return max(0.0, parsed_ms / 1000.0)

    async def process_microphone_state(
        self,
        runtime: RuntimeBridgeTarget,
        microphone_state: dict[str, Any],
    ) -> str | None:
        if not self.enabled:
            return None
        if runtime.runtime_mode != "project" or runtime.active_project is None:
            self._speech_active = False
            return None
        if microphone_state.get("available") is not True:
            return None

        try:
            level_percent = int(microphone_state.get("level_percent", 0))
        except (TypeError, ValueError):
            level_percent = 0
        level_percent = max(0, min(100, level_percent))

        wants_speech_active = level_percent >= self.active_threshold
        if self._speech_active and level_percent >= self.idle_threshold:
            wants_speech_active = True

        if wants_speech_active == self._speech_active:
            return None

        now_seconds = time.monotonic()
        if (now_seconds - self._last_switch_at) < self.switch_cooldown_seconds:
            return None

        try:
            if wants_speech_active:
                await runtime.set_channel_animation(self.channel_id, self.active_animation_id)
                self._speech_active = True
                self._last_switch_at = now_seconds
                self._last_error = None
                return (
                    f'Microphone bridge: channel "{self.channel_id}" -> '
                    f'animation "{self.active_animation_id}" ({level_percent}%).'
                )

            if self.idle_animation_id:
                await runtime.set_channel_animation(self.channel_id, self.idle_animation_id)
                action_label = f'animation "{self.idle_animation_id}"'
            else:
                await runtime.play_channel(self.channel_id)
                action_label = "default channel target"

            self._speech_active = False
            self._last_switch_at = now_seconds
            self._last_error = None
            return (
                f'Microphone bridge: channel "{self.channel_id}" -> '
                f"{action_label} ({level_percent}%)."
            )
        except ValueError as error:
            error_text = str(error)
            if error_text == self._last_error:
                return None
            self._last_error = error_text
            return f"Microphone bridge skipped: {error_text}"
