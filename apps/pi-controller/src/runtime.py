from __future__ import annotations

import asyncio
from contextlib import suppress
from typing import Any, Callable, Protocol

from config import save_config
from project_store import ProjectStore, sanitize_project_name
from protocol import validate_project_payload


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
    ):
        self.display = display
        self.project_store = project_store
        self.config = config
        self._save_config_callback = save_config_callback
        self._on_state_change = on_state_change
        self._connected_clients = 0
        self._playback_task: asyncio.Task[None] | None = None
        self._live_frame: dict[str, Any] | None = None
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

    def _normalize_project_name(self, value: Any) -> str | None:
        if not isinstance(value, str) or not value.strip():
            return None
        return sanitize_project_name(value)

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
    ) -> tuple[str, str, str]:
        if project.get("defaultAnimationId"):
            animations_by_id = self._build_animations_by_id(project)
            animation = animations_by_id[project["defaultAnimationId"]]
            return "animation", animation["id"], animation["name"]

        if project.get("defaultFrameId"):
            frames_by_id = self._build_frames_by_id(project)
            frame = frames_by_id[project["defaultFrameId"]]
            return "frame", frame["id"], frame["name"]

        if project["animations"]:
            animation = project["animations"][0]
            return "animation", animation["id"], animation["name"]

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

    def _render_live_frame(self) -> None:
        if self._live_frame is None:
            self.display.clear()
            return

        if any(pixel == 1 for pixel in self._live_frame["pixels"]):
            self.display.render_frame(
                self._live_frame["pixels"],
                self._live_frame["width"],
                self._live_frame["height"],
            )
            return

        self.display.clear()

    async def _run_animation(
        self,
        project: dict[str, Any],
        animation: dict[str, Any],
    ) -> None:
        frames_by_id = self._build_frames_by_id(project)

        while True:
            for step in animation["steps"]:
                frame = frames_by_id[step["frameId"]]
                self.display.render_frame(frame["pixels"], project["width"], project["height"])
                await asyncio.sleep(step["durationMs"] / 1000)

            if not animation["loop"]:
                break

    async def _render_project(self, project: dict[str, Any]) -> None:
        await self._stop_playback()

        target_type, target_id, target_name = self._resolve_project_target(project)
        self.active_target_type = target_type
        self.active_target_id = target_id
        self.active_target_name = target_name
        self.runtime_mode = "project"
        self.live_override_active = False
        self._emit_state_change()

        if target_type == "frame":
            frame = self._build_frames_by_id(project)[target_id]
            self.display.render_frame(frame["pixels"], project["width"], project["height"])
            return

        animation = self._build_animations_by_id(project)[target_id]
        self._playback_task = asyncio.create_task(self._run_animation(project, animation))
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
        self.live_override_active = True
        self.runtime_mode = "live"
        self.display.render_frame(pixels, width, height)
        self._emit_state_change()

    async def apply_live_clear(self) -> None:
        await self._stop_playback()
        self._live_frame = {
            "width": self.display.width,
            "height": self.display.height,
            "pixels": [0] * (self.display.width * self.display.height),
        }
        self.live_override_active = True
        self.runtime_mode = "live"
        self.display.clear()
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
        self.display.clear()
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
            if self.live_override_active:
                self.runtime_mode = "live"
            else:
                self.runtime_mode = "idle"
                self.display.clear()
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
