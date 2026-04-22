from __future__ import annotations

import time
from typing import Any, Protocol


class RuntimeBridgeTarget(Protocol):
    runtime_mode: str
    active_project: dict[str, Any] | None

    async def set_channel_animation(self, channel_id: str, animation_id: str) -> None:
        ...

    async def set_channel_frame(self, channel_id: str, frame_id: str) -> None:
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
        self.invert_level = bool(bridge_config.get("invert_level", False))
        self.active_threshold = self._clamp_percent(bridge_config.get("active_threshold", 24), 24)
        self.idle_threshold = self._clamp_percent(bridge_config.get("idle_threshold", 12), 12)
        if self.invert_level:
            if self.idle_threshold < self.active_threshold:
                self.idle_threshold = self.active_threshold
        else:
            if self.idle_threshold > self.active_threshold:
                self.idle_threshold = self.active_threshold
        self.active_animation_id = str(bridge_config.get("active_animation_id", "talk")).strip() or "talk"
        idle_frame_value = bridge_config.get("idle_frame_id")
        self.idle_frame_id = (
            str(idle_frame_value).strip()
            if isinstance(idle_frame_value, str) and idle_frame_value.strip()
            else None
        )
        idle_animation_value = bridge_config.get("idle_animation_id")
        self.idle_animation_id = (
            str(idle_animation_value).strip()
            if isinstance(idle_animation_value, str) and idle_animation_value.strip()
            else None
        )
        self.switch_cooldown_seconds = self._clamp_seconds(bridge_config.get("switch_cooldown_ms", 140), 140)
        self.release_hold_seconds = self._clamp_seconds(bridge_config.get("release_hold_ms", 260), 260)
        self._speech_active = False
        self._last_switch_at = 0.0
        self._last_above_idle_at = 0.0
        self._last_error: str | None = None

    def _resolve_animation_target(
        self,
        runtime: RuntimeBridgeTarget,
        animation_ref: str,
    ) -> tuple[str, str] | None:
        project = runtime.active_project
        if not isinstance(project, dict):
            return None
        animations = project.get("animations")
        if not isinstance(animations, list):
            return None

        def normalize(value: Any) -> str | None:
            if not isinstance(value, str):
                return None
            cleaned = value.strip()
            return cleaned if cleaned else None

        for animation in animations:
            if not isinstance(animation, dict):
                continue
            animation_id = normalize(animation.get("id"))
            channel_id = normalize(animation.get("channelId"))
            if animation_id == animation_ref:
                return (channel_id or self.channel_id, animation_id)

        needle = animation_ref.casefold()
        for animation in animations:
            if not isinstance(animation, dict):
                continue
            animation_name = normalize(animation.get("name"))
            animation_id = normalize(animation.get("id"))
            if animation_name and animation_id and animation_name.casefold() == needle:
                channel_id = normalize(animation.get("channelId"))
                return (channel_id or self.channel_id, animation_id)

        return None

    async def _set_animation(
        self,
        runtime: RuntimeBridgeTarget,
        animation_ref: str,
    ) -> tuple[str, str]:
        try:
            await runtime.set_channel_animation(self.channel_id, animation_ref)
            return self.channel_id, animation_ref
        except ValueError as direct_error:
            resolved = self._resolve_animation_target(runtime, animation_ref)
            if resolved is None:
                raise direct_error
            resolved_channel_id, resolved_animation_id = resolved
            await runtime.set_channel_animation(resolved_channel_id, resolved_animation_id)
            return resolved_channel_id, resolved_animation_id

    def _resolve_frame_id(
        self,
        runtime: RuntimeBridgeTarget,
        frame_ref: str,
    ) -> str | None:
        project = runtime.active_project
        if not isinstance(project, dict):
            return None
        frames = project.get("frames")
        if not isinstance(frames, list):
            return None

        needle = frame_ref.casefold()
        for frame in frames:
            if not isinstance(frame, dict):
                continue
            frame_id = frame.get("id")
            if isinstance(frame_id, str) and frame_id.strip() == frame_ref:
                return frame_id.strip()
            frame_name = frame.get("name")
            if (
                isinstance(frame_name, str)
                and frame_name.strip()
                and frame_name.strip().casefold() == needle
                and isinstance(frame_id, str)
                and frame_id.strip()
            ):
                return frame_id.strip()

        return None

    async def _set_frame(
        self,
        runtime: RuntimeBridgeTarget,
        frame_ref: str,
    ) -> tuple[str, str]:
        try:
            await runtime.set_channel_frame(self.channel_id, frame_ref)
            return self.channel_id, frame_ref
        except ValueError as direct_error:
            resolved_frame_id = self._resolve_frame_id(runtime, frame_ref)
            if resolved_frame_id is None:
                raise direct_error
            await runtime.set_channel_frame(self.channel_id, resolved_frame_id)
            return self.channel_id, resolved_frame_id

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
            self._last_above_idle_at = 0.0
            return None
        if microphone_state.get("available") is not True:
            return None

        try:
            level_percent = int(microphone_state.get("level_percent", 0))
        except (TypeError, ValueError):
            level_percent = 0
        level_percent = max(0, min(100, level_percent))
        now_seconds = time.monotonic()
        if (
            (not self.invert_level and level_percent >= self.idle_threshold)
            or (self.invert_level and level_percent <= self.idle_threshold)
        ):
            self._last_above_idle_at = now_seconds

        if self.invert_level:
            wants_speech_active = level_percent <= self.active_threshold
            if self._speech_active and level_percent <= self.idle_threshold:
                wants_speech_active = True
        else:
            wants_speech_active = level_percent >= self.active_threshold
            if self._speech_active and level_percent >= self.idle_threshold:
                wants_speech_active = True

        if (
            self._speech_active
            and not wants_speech_active
            and (now_seconds - self._last_above_idle_at) < self.release_hold_seconds
        ):
            return None

        if wants_speech_active == self._speech_active:
            return None

        if (now_seconds - self._last_switch_at) < self.switch_cooldown_seconds:
            return None

        try:
            if wants_speech_active:
                active_channel_id, active_animation_id = await self._set_animation(
                    runtime,
                    self.active_animation_id,
                )
                self._speech_active = True
                self._last_switch_at = now_seconds
                self._last_above_idle_at = now_seconds
                self._last_error = None
                return (
                    f'Microphone bridge: channel "{active_channel_id}" -> '
                    f'animation "{active_animation_id}" ({level_percent}%).'
                )

            if self.idle_frame_id:
                idle_channel_id, idle_frame_id = await self._set_frame(
                    runtime,
                    self.idle_frame_id,
                )
                action_channel_id = idle_channel_id
                action_label = f'frame "{idle_frame_id}"'
            elif self.idle_animation_id:
                idle_channel_id, idle_animation_id = await self._set_animation(
                    runtime,
                    self.idle_animation_id,
                )
                action_channel_id = idle_channel_id
                action_label = f'animation "{idle_animation_id}"'
            else:
                await runtime.play_channel(self.channel_id)
                action_channel_id = self.channel_id
                action_label = "default channel target"

            self._speech_active = False
            self._last_switch_at = now_seconds
            self._last_error = None
            return (
                f'Microphone bridge: channel "{action_channel_id}" -> '
                f"{action_label} ({level_percent}%)."
            )
        except ValueError as error:
            error_text = str(error)
            if error_text == self._last_error:
                return None
            self._last_error = error_text
            return f"Microphone bridge skipped: {error_text}"
