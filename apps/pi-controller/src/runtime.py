from __future__ import annotations

import asyncio
from contextlib import suppress
from typing import Any, Callable, Protocol

from config import save_config
from project_store import ProjectStore, sanitize_project_name
from protocol import validate_project_payload

PANEL_SIZE = 8
DEFAULT_BOARD_GROUP_ID = "group-1"


class RuntimeDisplay(Protocol):
    width: int
    height: int

    def clear(self) -> None:
        ...

    def render_frame(self, pixels: list[int], width: int, height: int) -> None:
        ...


class ProjectRuntime:
    def __init__(
        self,
        display: RuntimeDisplay,
        project_store: ProjectStore,
        config: dict[str, Any],
        save_config_callback: Callable[[dict[str, Any]], Any] = save_config,
        on_state_change: Callable[[dict[str, Any]], Any] | None = None,
        on_frame_render: Callable[[list[int], int, int], Any] | None = None,
        on_clear_render: Callable[[], Any] | None = None,
    ):
        self.display = display
        self.project_store = project_store
        self.config = config
        self._save_config_callback = save_config_callback
        self._on_state_change = on_state_change
        self._on_frame_render = on_frame_render
        self._on_clear_render = on_clear_render
        self._connected_clients = 0
        self._playback_task: asyncio.Task[None] | None = None
        self._playback_tick_hz = self._normalize_tick_hz(config.get("runtime_tick_hz", 100))
        self._live_frame: dict[str, Any] | None = None
        self._channel_states: list[dict[str, Any]] = []
        self._runtime_channels_state: list[dict[str, Any]] = []
        self.active_project: dict[str, Any] | None = None
        self.active_project_name: str | None = None
        self.boot_project_name = self._normalize_project_name(config.get("boot_project"))
        self.runtime_mode = "idle"
        self.live_override_active = False
        self.active_target_type: str | None = None
        self.active_target_id: str | None = None
        self.active_target_name: str | None = None
        self._emit_state_change()

    def _emit_state_change(self) -> None:
        if self._on_state_change is None:
            return
        self._on_state_change(self.get_runtime_state())

    def _render_to_outputs(self, pixels: list[int], width: int, height: int) -> None:
        self.display.render_frame(pixels, width, height)
        if self._on_frame_render is not None:
            self._on_frame_render(pixels, width, height)

    def _clear_outputs(self) -> None:
        self.display.clear()
        if self._on_clear_render is not None:
            self._on_clear_render()

    def _normalize_project_name(self, value: Any) -> str | None:
        if not isinstance(value, str) or not value.strip():
            return None
        return sanitize_project_name(value)

    def _normalize_tick_hz(self, value: Any) -> float:
        try:
            tick_hz = float(value)
        except (TypeError, ValueError):
            tick_hz = 100.0
        if tick_hz <= 0:
            return 100.0
        return tick_hz

    def _normalize_channel_priority(self, value: Any) -> int:
        if isinstance(value, bool):
            return 0
        if isinstance(value, int):
            return value
        try:
            return int(value)
        except (TypeError, ValueError):
            return 0

    def _save_config(self) -> None:
        self.config["boot_project"] = self.boot_project_name
        self._save_config_callback(self.config)

    def _validate_project_dimensions(self, project: dict[str, Any]) -> dict[str, Any]:
        if project["width"] != self.display.width or project["height"] != self.display.height:
            raise ValueError(
                f'Project "{project["name"]}" is {project["width"]}x{project["height"]}, '
                f"but the Pi display is {self.display.width}x{self.display.height}"
            )
        return project

    def _read_project(self, name: str) -> dict[str, Any]:
        project = validate_project_payload(self.project_store.load(name))
        project["name"] = sanitize_project_name(project["name"])
        return project

    def _read_runnable_project(self, name: str) -> dict[str, Any]:
        return self._validate_project_dimensions(self._read_project(name))

    def _build_frames_by_id(self, project: dict[str, Any]) -> dict[str, dict[str, Any]]:
        return {frame["id"]: frame for frame in project["frames"]}

    def _build_animations_by_id(self, project: dict[str, Any]) -> dict[str, dict[str, Any]]:
        return {animation["id"]: animation for animation in project["animations"]}

    def _resolve_project_target(
        self,
        project: dict[str, Any],
        preferred_channel_id: str | None = None,
    ) -> tuple[str, str, str]:
        if project.get("defaultAnimationId"):
            animations_by_id = self._build_animations_by_id(project)
            default_animation_id = project["defaultAnimationId"]
            animation = animations_by_id.get(default_animation_id)
            if animation is not None and (
                preferred_channel_id is None
                or animation.get("channelId") == preferred_channel_id
            ):
                return "animation", animation["id"], animation["name"]

        if preferred_channel_id in (None, "base") and project.get("defaultFrameId"):
            frames_by_id = self._build_frames_by_id(project)
            default_frame_id = project["defaultFrameId"]
            frame = frames_by_id.get(default_frame_id)
            if frame is not None:
                return "frame", frame["id"], frame["name"]

        animations = [
            animation
            for animation in project["animations"]
            if preferred_channel_id is None
            or animation.get("channelId") == preferred_channel_id
        ]
        if animations:
            animation = animations[0]
            return "animation", animation["id"], animation["name"]

        if preferred_channel_id not in (None, "base"):
            return "none", "", ""

        frame = project["frames"][0]
        return "frame", frame["id"], frame["name"]

    async def _stop_playback(self) -> None:
        if self._playback_task is None:
            return

        task = self._playback_task
        self._playback_task = None
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task
        self._channel_states = []
        self._runtime_channels_state = []

    def _render_live_frame(self) -> None:
        if self._live_frame is None:
            self._clear_outputs()
            return

        if any(pixel == 1 for pixel in self._live_frame["pixels"]):
            self._render_to_outputs(
                self._live_frame["pixels"],
                self._live_frame["width"],
                self._live_frame["height"],
            )
            return

        self._clear_outputs()

    def _get_runtime_channels_state(self) -> list[dict[str, Any]]:
        return [
            {
                "channel_id": channel_state["channel_id"],
                "channel_name": channel_state["channel_name"],
                "priority": channel_state["priority"],
                "target_type": channel_state["target_type"],
                "target_id": channel_state["target_id"],
                "target_name": channel_state["target_name"],
            }
            for channel_state in self._channel_states
        ]

    def _set_active_target_from_channels(self) -> None:
        base_channel_target = next(
            (
                channel_state
                for channel_state in self._channel_states
                if channel_state["channel_id"] == "base"
                and channel_state["target_type"] in ("frame", "animation")
            ),
            None,
        )
        if base_channel_target is not None:
            self.active_target_type = base_channel_target["target_type"]
            self.active_target_id = base_channel_target["target_id"]
            self.active_target_name = base_channel_target["target_name"]
            return

        first_target = next(
            (
                channel_state
                for channel_state in self._channel_states
                if channel_state["target_type"] in ("frame", "animation")
            ),
            None,
        )
        if first_target is None:
            self.active_target_type = None
            self.active_target_id = None
            self.active_target_name = None
            return

        self.active_target_type = first_target["target_type"]
        self.active_target_id = first_target["target_id"]
        self.active_target_name = first_target["target_name"]

    def _build_channel_states(
        self,
        project: dict[str, Any],
    ) -> list[dict[str, Any]]:
        frames_by_id = self._build_frames_by_id(project)
        animations_by_id = self._build_animations_by_id(project)
        channel_defaults = project.get("channelDefaults")
        if not isinstance(channel_defaults, dict):
            channel_defaults = {}

        channels = project.get("channels")
        if not isinstance(channels, list):
            channels = []

        loop = asyncio.get_running_loop()
        channel_states: list[dict[str, Any]] = []
        for channel in sorted(
            channels,
            key=lambda value: self._normalize_channel_priority(value.get("priority")),
        ):
            channel_id = str(channel.get("id", "")).strip()
            if not channel_id:
                continue
            channel_name = str(channel.get("name", channel_id)).strip() or channel_id
            priority = self._normalize_channel_priority(channel.get("priority"))

            target_type = "none"
            target_id = ""
            target_name = ""

            channel_default = channel_defaults.get(channel_id, {})
            startup_animation_id = (
                channel_default.get("startupAnimationId")
                if isinstance(channel_default, dict)
                else None
            )
            if isinstance(startup_animation_id, str):
                animation = animations_by_id.get(startup_animation_id.strip())
                if animation is not None and animation.get("channelId") == channel_id:
                    target_type = "animation"
                    target_id = animation["id"]
                    target_name = animation["name"]

            if target_type == "none":
                startup_frame_id = (
                    channel_default.get("startupFrameId")
                    if isinstance(channel_default, dict)
                    else None
                )
                if isinstance(startup_frame_id, str):
                    frame = frames_by_id.get(startup_frame_id.strip())
                    if frame is not None:
                        target_type = "frame"
                        target_id = frame["id"]
                        target_name = frame["name"]

            if target_type == "none":
                resolved_type, resolved_id, resolved_name = self._resolve_project_target(
                    project,
                    preferred_channel_id=channel_id,
                )
                target_type = resolved_type
                target_id = resolved_id
                target_name = resolved_name

            channel_state = {
                "channel_id": channel_id,
                "channel_name": channel_name,
                "priority": priority,
                "target_type": target_type,
                "target_id": target_id,
                "target_name": target_name,
            }
            if target_type == "animation":
                animation = animations_by_id[target_id]
                normalized_steps = [
                    {
                        "frameId": step["frameId"],
                        "durationMs": max(1, int(step["durationMs"])),
                    }
                    for step in animation["steps"]
                ]
                cumulative_limits: list[int] = []
                total_ms = 0
                for step in normalized_steps:
                    total_ms += step["durationMs"]
                    cumulative_limits.append(total_ms)
                channel_state["steps"] = normalized_steps
                channel_state["cumulative_limits"] = cumulative_limits
                channel_state["total_ms"] = max(1, total_ms)
                channel_state["loop"] = bool(animation.get("loop", True))
                channel_state["started_at"] = loop.time()
            channel_states.append(channel_state)

        return channel_states

    def _resolve_channel_pixels(
        self,
        channel_state: dict[str, Any],
        now_seconds: float,
        frames_by_id: dict[str, dict[str, Any]],
    ) -> list[int] | None:
        if channel_state["target_type"] == "frame":
            frame = frames_by_id.get(channel_state["target_id"])
            if frame is None:
                return None
            return frame["pixels"]

        if channel_state["target_type"] != "animation":
            return None

        steps = channel_state.get("steps")
        cumulative_limits = channel_state.get("cumulative_limits")
        total_ms = int(channel_state.get("total_ms", 0))
        started_at = float(channel_state.get("started_at", now_seconds))
        if not isinstance(steps, list) or not isinstance(cumulative_limits, list) or total_ms <= 0:
            return None

        elapsed_ms = int((now_seconds - started_at) * 1000)
        if channel_state.get("loop", True):
            phase_ms = elapsed_ms % total_ms
        else:
            phase_ms = min(elapsed_ms, total_ms - 1)

        step_index = len(steps) - 1
        for index, limit in enumerate(cumulative_limits):
            if phase_ms < limit:
                step_index = index
                break

        frame_id = steps[step_index]["frameId"]
        frame = frames_by_id.get(frame_id)
        if frame is None:
            return None
        return frame["pixels"]

    def _build_group_pixel_index_sets(self, project: dict[str, Any]) -> dict[str, set[int]]:
        board_layout = project.get("boardLayout")
        if not isinstance(board_layout, list):
            return {}

        width = project["width"]
        height = project["height"]
        board_columns = max(1, (width + PANEL_SIZE - 1) // PANEL_SIZE)
        group_pixel_index_sets: dict[str, set[int]] = {}
        for board_index, board in enumerate(board_layout):
            if not isinstance(board, dict):
                continue

            chain_index = board.get("chainIndex")
            if isinstance(chain_index, bool) or not isinstance(chain_index, int) or chain_index < 0:
                chain_index = board_index
            origin_x = (chain_index % board_columns) * PANEL_SIZE
            origin_y = (chain_index // board_columns) * PANEL_SIZE

            board_width = board.get("width")
            if isinstance(board_width, bool) or not isinstance(board_width, int) or board_width <= 0:
                board_width = PANEL_SIZE
            board_height = board.get("height")
            if isinstance(board_height, bool) or not isinstance(board_height, int) or board_height <= 0:
                board_height = PANEL_SIZE

            raw_group_id = board.get("groupId")
            group_id = (
                raw_group_id.strip()
                if isinstance(raw_group_id, str) and raw_group_id.strip()
                else DEFAULT_BOARD_GROUP_ID
            )
            pixel_indexes = group_pixel_index_sets.get(group_id)
            if pixel_indexes is None:
                pixel_indexes = set()
                group_pixel_index_sets[group_id] = pixel_indexes

            for local_y in range(board_height):
                for local_x in range(board_width):
                    x = origin_x + local_x
                    y = origin_y + local_y
                    if x < 0 or x >= width or y < 0 or y >= height:
                        continue
                    pixel_indexes.add((y * width) + x)

        return group_pixel_index_sets

    def _compose_project_frame(self, project: dict[str, Any]) -> list[int]:
        if not self._channel_states:
            return [0] * (project["width"] * project["height"])

        frames_by_id = self._build_frames_by_id(project)
        composed = [0] * (project["width"] * project["height"])
        channel_group_map = project.get("channelGroupMap")
        if not isinstance(channel_group_map, dict):
            channel_group_map = {}
        group_pixel_index_sets = self._build_group_pixel_index_sets(project)
        now_seconds = asyncio.get_running_loop().time()

        for channel_state in self._channel_states:
            channel_pixels = self._resolve_channel_pixels(channel_state, now_seconds, frames_by_id)
            if channel_pixels is None:
                continue
            mapped_group_id = channel_group_map.get(channel_state["channel_id"])
            mapped_indexes = (
                group_pixel_index_sets.get(mapped_group_id)
                if isinstance(mapped_group_id, str)
                else None
            )
            if mapped_indexes is not None:
                for pixel_index in mapped_indexes:
                    composed[pixel_index] = 1 if channel_pixels[pixel_index] == 1 else 0
                continue

            # Preserve legacy projects where channels are not mapped to sections.
            for pixel_index, pixel_value in enumerate(channel_pixels):
                if pixel_value == 1:
                    composed[pixel_index] = 1

        return composed

    async def _run_project_channels(self, project: dict[str, Any]) -> None:
        interval_seconds = 1.0 / self._playback_tick_hz
        while True:
            pixels = self._compose_project_frame(project)
            if any(pixel == 1 for pixel in pixels):
                self._render_to_outputs(pixels, project["width"], project["height"])
            else:
                self._clear_outputs()
            await asyncio.sleep(interval_seconds)

    async def _render_project(self, project: dict[str, Any]) -> None:
        await self._stop_playback()

        self._channel_states = self._build_channel_states(project)
        self._runtime_channels_state = self._get_runtime_channels_state()
        self._set_active_target_from_channels()
        self.runtime_mode = "project"
        self.live_override_active = False

        initial_pixels = self._compose_project_frame(project)
        if any(pixel == 1 for pixel in initial_pixels):
            self._render_to_outputs(initial_pixels, project["width"], project["height"])
        else:
            self._clear_outputs()

        self._emit_state_change()

        self._playback_task = asyncio.create_task(self._run_project_channels(project))
        await asyncio.sleep(0)

    def register_client(self) -> None:
        self._connected_clients += 1

    async def unregister_client(self) -> None:
        self._connected_clients = max(0, self._connected_clients - 1)
        if self._connected_clients == 0 and self.live_override_active and self.active_project is not None:
            await self.resume_active_project()

    async def restore_boot_project(self) -> None:
        if not self.boot_project_name:
            return
        await self.activate_project(self.boot_project_name)

    def get_runtime_state(self) -> dict[str, Any]:
        return {
            "runtime_mode": self.runtime_mode,
            "live_override_active": self.live_override_active,
            "active_project": self.active_project_name,
            "boot_project": self.boot_project_name,
            "active_target_type": self.active_target_type,
            "active_target_id": self.active_target_id,
            "active_target_name": self.active_target_name,
            "channels": self._runtime_channels_state,
            "active_project_persisted": self.active_project_name is not None
            and self.active_project_name == self.boot_project_name,
        }

    async def apply_live_frame(self, pixels: list[int], width: int, height: int) -> None:
        await self._stop_playback()
        self._live_frame = {
            "width": width,
            "height": height,
            "pixels": list(pixels),
        }
        state_changed = self.runtime_mode != "live" or not self.live_override_active
        self.live_override_active = True
        self.runtime_mode = "live"
        self._render_to_outputs(pixels, width, height)
        if state_changed:
            self._emit_state_change()

    async def apply_live_clear(self) -> None:
        await self._stop_playback()
        self._live_frame = {
            "width": self.display.width,
            "height": self.display.height,
            "pixels": [0] * (self.display.width * self.display.height),
        }
        state_changed = self.runtime_mode != "live" or not self.live_override_active
        self.live_override_active = True
        self.runtime_mode = "live"
        self._clear_outputs()
        if state_changed:
            self._emit_state_change()

    async def refresh_output(self) -> None:
        if self.live_override_active:
            await self._stop_playback()
            self.runtime_mode = "live"
            self._render_live_frame()
            self._emit_state_change()
            return

        if self.active_project is not None:
            await self._render_project(self.active_project)
            return

        await self._stop_playback()
        self.runtime_mode = "idle"
        self._clear_outputs()
        self._emit_state_change()

    async def save_project(self, project: dict[str, Any]) -> str:
        normalized_project = validate_project_payload(project)
        saved_name = sanitize_project_name(normalized_project["name"])
        saved_project = {
            **normalized_project,
            "name": saved_name,
        }

        if saved_name == self.active_project_name or saved_name == self.boot_project_name:
            self._validate_project_dimensions(saved_project)

        saved_name = self.project_store.save(saved_project)

        if saved_name == self.active_project_name:
            self.active_project = saved_project
            if not self.live_override_active:
                await self._render_project(saved_project)

        return saved_name

    def get_project(self, name: str) -> dict[str, Any]:
        return self._read_project(name)

    async def activate_project(self, name: str) -> str:
        project = self._read_runnable_project(name)
        self.active_project = project
        self.active_project_name = project["name"]
        await self._render_project(project)
        return self.active_project_name

    async def resume_active_project(self) -> str:
        if self.active_project is None or self.active_project_name is None:
            raise ValueError("No active project is loaded on the Pi")

        self.active_project = self._validate_project_dimensions(self.active_project)
        await self._render_project(self.active_project)
        return self.active_project_name

    async def delete_project(self, name: str) -> str:
        deleted_name = self.project_store.delete(name)

        if deleted_name == self.boot_project_name:
            self.boot_project_name = None
            self._save_config()
            self._emit_state_change()

        if deleted_name == self.active_project_name:
            await self._stop_playback()
            self.active_project = None
            self.active_project_name = None
            self.active_target_type = None
            self.active_target_id = None
            self.active_target_name = None
            self._channel_states = []
            self._runtime_channels_state = []
            if self.live_override_active:
                self.runtime_mode = "live"
            else:
                self.runtime_mode = "idle"
                self._clear_outputs()
            self._emit_state_change()

        return deleted_name

    async def set_boot_project(self, name: str) -> str:
        project = self._read_runnable_project(name)
        self.boot_project_name = project["name"]
        self._save_config()
        self._emit_state_change()
        return self.boot_project_name

    async def clear_boot_project(self) -> None:
        self.boot_project_name = None
        self._save_config()
        self._emit_state_change()

    async def shutdown(self) -> None:
        await self._stop_playback()
