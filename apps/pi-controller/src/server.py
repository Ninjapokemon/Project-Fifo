from __future__ import annotations

import asyncio
import json
import signal
from typing import Any, Callable

import websockets

from config import load_config, save_config
from display import MatrixDisplay
from oled import DualOledStatus
from project_store import ProjectStore
from protocol import (
    ProtocolError,
    validate_brightness_message,
    validate_drawing_name_message,
    validate_frame_message,
    validate_layout_message,
    validate_named_drawing,
    validate_project_message,
    validate_project_name_message,
    validate_simple_request_message,
)
from runtime import ProjectRuntime
from storage import DrawingStore


def build_layout_state_message(
    display: MatrixDisplay,
    message_type: str = "layout_state",
) -> dict[str, Any]:
    return {
        "type": message_type,
        "width": display.width,
        "height": display.height,
        **display.get_layout(),
    }


def build_state_message(
    display: MatrixDisplay,
    drawing_store: DrawingStore,
    project_store: ProjectStore,
    runtime: ProjectRuntime,
    config: dict[str, Any],
) -> dict[str, Any]:
    persisted_layout = {
        "rotate": config.get("rotate", 0),
        "block_orientation": config.get("block_orientation", 90),
        "reverse_order": config.get("reverse_order", False),
        "panel_order": config.get("panel_order"),
        "panel_rotations": config.get("panel_rotations"),
        "panel_mirrors": config.get("panel_mirrors"),
    }
    live_state = display.get_state()

    return {
        "type": "state",
        **live_state,
        "drawings": drawing_store.list_names(),
        "projects": project_store.list_names(),
        "layout_persisted": live_state["rotate"] == persisted_layout["rotate"]
        and live_state["block_orientation"] == persisted_layout["block_orientation"]
        and live_state["reverse_order"] == persisted_layout["reverse_order"]
        and live_state["panel_order"] == persisted_layout["panel_order"]
        and live_state["panel_rotations"] == persisted_layout["panel_rotations"]
        and live_state["panel_mirrors"] == persisted_layout["panel_mirrors"],
        "brightness_persisted": live_state["brightness"] == config.get("brightness", 3),
        **runtime.get_runtime_state(),
        "connection_status": "connected",
    }


async def send_state_message(
    websocket,
    display: MatrixDisplay,
    drawing_store: DrawingStore,
    project_store: ProjectStore,
    runtime: ProjectRuntime,
    config: dict[str, Any],
) -> None:
    await websocket.send(
        json.dumps(
            build_state_message(
                display,
                drawing_store,
                project_store,
                runtime,
                config,
            )
        )
    )


async def handle_connection(
    websocket,
    display: MatrixDisplay,
    drawing_store: DrawingStore,
    project_store: ProjectStore,
    runtime: ProjectRuntime,
    config: dict[str, Any],
    refresh_oled: Callable[[], None] | None = None,
) -> None:
    runtime.register_client()

    try:
        async for raw_message in websocket:
            try:
                message = json.loads(raw_message)
                if message.get("type") == "get_state":
                    validate_simple_request_message(message, "get_state")
                    await send_state_message(
                        websocket,
                        display,
                        drawing_store,
                        project_store,
                        runtime,
                        config,
                    )
                    continue
                if message.get("type") == "get_layout":
                    validate_simple_request_message(message, "get_layout")
                    await websocket.send(json.dumps(build_layout_state_message(display)))
                    continue
                if message.get("type") == "clear":
                    validate_simple_request_message(message, "clear")
                    was_live_override = runtime.live_override_active
                    await runtime.apply_live_clear()
                    if not was_live_override:
                        await send_state_message(
                            websocket,
                            display,
                            drawing_store,
                            project_store,
                            runtime,
                            config,
                        )
                    continue
                if message.get("type") == "save_drawing":
                    drawing = validate_named_drawing(message)
                    saved_name = drawing_store.save(drawing)
                    await websocket.send(
                        json.dumps(
                            {
                                "type": "drawing_saved",
                                "name": saved_name,
                            }
                        )
                    )
                    continue
                if message.get("type") == "list_drawings":
                    validate_simple_request_message(message, "list_drawings")
                    await websocket.send(
                        json.dumps(
                            {
                                "type": "drawings_list",
                                "drawings": drawing_store.list_names(),
                            }
                        )
                    )
                    continue
                if message.get("type") == "load_drawing":
                    requested_drawing = validate_drawing_name_message(message, "load_drawing")
                    stored_drawing = drawing_store.load(requested_drawing["name"])
                    drawing = validate_named_drawing(
                        {
                            "type": "save_drawing",
                            "name": stored_drawing.get("name", requested_drawing["name"]),
                            "width": stored_drawing.get("width"),
                            "height": stored_drawing.get("height"),
                            "pixels": stored_drawing.get("pixels"),
                            "boardLayout": stored_drawing.get("boardLayout"),
                            "boardGroups": stored_drawing.get("boardGroups"),
                        }
                    )
                    await websocket.send(
                        json.dumps(
                            {
                                "type": "drawing",
                                "name": drawing["name"],
                                "width": drawing["width"],
                                "height": drawing["height"],
                                "pixels": drawing["pixels"],
                                "boardLayout": drawing.get("boardLayout"),
                                "boardGroups": drawing.get("boardGroups"),
                            }
                        )
                    )
                    continue
                if message.get("type") == "save_project":
                    project = validate_project_message(message)
                    saved_name = await runtime.save_project(project)
                    await websocket.send(
                        json.dumps(
                            {
                                "type": "project_saved",
                                "name": saved_name,
                            }
                        )
                    )
                    await send_state_message(
                        websocket,
                        display,
                        drawing_store,
                        project_store,
                        runtime,
                        config,
                    )
                    continue
                if message.get("type") == "list_projects":
                    validate_simple_request_message(message, "list_projects")
                    await websocket.send(
                        json.dumps(
                            {
                                "type": "projects_list",
                                "projects": project_store.list_names(),
                            }
                        )
                    )
                    continue
                if message.get("type") == "get_project":
                    requested_project = validate_project_name_message(message, "get_project")
                    project = runtime.get_project(requested_project["name"])
                    await websocket.send(
                        json.dumps(
                            {
                                "type": "project",
                                **project,
                            }
                        )
                    )
                    continue
                if message.get("type") == "activate_project":
                    requested_project = validate_project_name_message(message, "activate_project")
                    active_project = await runtime.activate_project(requested_project["name"])
                    await websocket.send(
                        json.dumps(
                            {
                                "type": "project_activated",
                                "name": active_project,
                            }
                        )
                    )
                    await send_state_message(
                        websocket,
                        display,
                        drawing_store,
                        project_store,
                        runtime,
                        config,
                    )
                    continue
                if message.get("type") == "resume_project":
                    validate_simple_request_message(message, "resume_project")
                    resumed_project = await runtime.resume_active_project()
                    await websocket.send(
                        json.dumps(
                            {
                                "type": "project_resumed",
                                "name": resumed_project,
                            }
                        )
                    )
                    await send_state_message(
                        websocket,
                        display,
                        drawing_store,
                        project_store,
                        runtime,
                        config,
                    )
                    continue
                if message.get("type") == "delete_project":
                    requested_project = validate_project_name_message(message, "delete_project")
                    deleted_name = await runtime.delete_project(requested_project["name"])
                    await websocket.send(
                        json.dumps(
                            {
                                "type": "project_deleted",
                                "name": deleted_name,
                            }
                        )
                    )
                    await send_state_message(
                        websocket,
                        display,
                        drawing_store,
                        project_store,
                        runtime,
                        config,
                    )
                    continue
                if message.get("type") == "set_boot_project":
                    requested_project = validate_project_name_message(message, "set_boot_project")
                    boot_project = await runtime.set_boot_project(requested_project["name"])
                    await websocket.send(
                        json.dumps(
                            {
                                "type": "boot_project_updated",
                                "name": boot_project,
                            }
                        )
                    )
                    await send_state_message(
                        websocket,
                        display,
                        drawing_store,
                        project_store,
                        runtime,
                        config,
                    )
                    continue
                if message.get("type") == "clear_boot_project":
                    validate_simple_request_message(message, "clear_boot_project")
                    await runtime.clear_boot_project()
                    await websocket.send(
                        json.dumps(
                            {
                                "type": "boot_project_updated",
                                "name": None,
                            }
                        )
                    )
                    await send_state_message(
                        websocket,
                        display,
                        drawing_store,
                        project_store,
                        runtime,
                        config,
                    )
                    continue
                if message.get("type") == "brightness":
                    brightness = validate_brightness_message(message)
                    applied_value = display.set_brightness(brightness["value"])
                    if refresh_oled is not None:
                        refresh_oled()
                    await websocket.send(
                        json.dumps(
                            {
                                "type": "brightness",
                                "value": applied_value,
                            }
                        )
                    )
                    continue
                if message.get("type") == "layout":
                    layout = validate_layout_message(message, "layout")
                    display.set_layout(
                        layout["rotate"],
                        layout["block_orientation"],
                        layout["reverse_order"],
                        layout.get("panel_order"),
                        layout.get("panel_rotations"),
                        layout.get("panel_mirrors"),
                        layout.get("panel_flips"),
                    )
                    await runtime.refresh_output()
                    if refresh_oled is not None:
                        refresh_oled()
                    await websocket.send(json.dumps(build_layout_state_message(display)))
                    continue
                if message.get("type") == "save_layout":
                    layout = validate_layout_message(message, "save_layout")
                    applied_layout = display.set_layout(
                        layout["rotate"],
                        layout["block_orientation"],
                        layout["reverse_order"],
                        layout.get("panel_order"),
                        layout.get("panel_rotations"),
                        layout.get("panel_mirrors"),
                        layout.get("panel_flips"),
                    )
                    config.update(applied_layout)
                    config.pop("panel_flips", None)
                    save_config(config)
                    await runtime.refresh_output()
                    if refresh_oled is not None:
                        refresh_oled()
                    await websocket.send(
                        json.dumps(build_layout_state_message(display, "layout_saved"))
                    )
                    continue

                frame = validate_frame_message(message)
                was_live_override = runtime.live_override_active
                await runtime.apply_live_frame(frame["pixels"], frame["width"], frame["height"])
                if not was_live_override:
                    await send_state_message(
                        websocket,
                        display,
                        drawing_store,
                        project_store,
                        runtime,
                        config,
                    )
            except (json.JSONDecodeError, ProtocolError, ValueError, FileNotFoundError) as error:
                await websocket.send(
                    json.dumps(
                        {
                            "type": "error",
                            "message": str(error),
                        }
                    )
                )
    finally:
        await runtime.unregister_client()


async def wait_for_shutdown() -> None:
    stop_event = asyncio.Event()
    loop = asyncio.get_running_loop()
    handled_signals: list[signal.Signals] = []

    def request_shutdown() -> None:
        stop_event.set()

    for shutdown_signal in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(shutdown_signal, request_shutdown)
            handled_signals.append(shutdown_signal)
        except NotImplementedError:
            continue

    try:
        await stop_event.wait()
    finally:
        for shutdown_signal in handled_signals:
            loop.remove_signal_handler(shutdown_signal)


async def main() -> None:
    config = load_config()
    oled_display = DualOledStatus(config)
    oled_coalesce_seconds = 0.075
    try:
        oled_coalesce_seconds = max(0.0, float(config.get("oled_coalesce_seconds", 0.075)))
    except (TypeError, ValueError):
        oled_coalesce_seconds = 0.075
    display = MatrixDisplay(config)
    if oled_display.preview_enabled:
        display.frame_callback = oled_display.render_preview
        display.clear_callback = oled_display.clear_preview
    config.update(display.get_layout())
    config.pop("panel_flips", None)
    drawing_store = DrawingStore()
    project_store = ProjectStore()
    runtime: ProjectRuntime | None = None
    loop = asyncio.get_running_loop()
    pending_oled_refresh: asyncio.TimerHandle | None = None

    def refresh_oled_immediate() -> None:
        if runtime is None:
            return
        active_project = runtime.active_project
        board_layout = (
            active_project.get("boardLayout")
            if isinstance(active_project, dict)
            else None
        )
        oled_display.update_state(
            runtime.get_runtime_state(),
            display.get_state(),
            board_layout,
        )

    def refresh_oled() -> None:
        nonlocal pending_oled_refresh
        if pending_oled_refresh is not None and not pending_oled_refresh.cancelled():
            return
        if oled_coalesce_seconds <= 0:
            refresh_oled_immediate()
            return

        def run_refresh() -> None:
            nonlocal pending_oled_refresh
            pending_oled_refresh = None
            refresh_oled_immediate()

        pending_oled_refresh = loop.call_later(oled_coalesce_seconds, run_refresh)

    runtime = ProjectRuntime(
        display,
        project_store,
        config,
        on_state_change=lambda _state: refresh_oled(),
    )

    try:
        try:
            await runtime.restore_boot_project()
            if runtime.active_project_name:
                print(f'Loaded boot project "{runtime.active_project_name}".')
        except (FileNotFoundError, ProtocolError, ValueError) as error:
            print(f"Could not restore boot project: {error}")
        refresh_oled_immediate()

        async with websockets.serve(
            lambda websocket: handle_connection(
                websocket,
                display,
                drawing_store,
                project_store,
                runtime,
                config,
                refresh_oled,
            ),
            config["host"],
            config["port"],
        ):
            print(f"Listening on ws://{config['host']}:{config['port']}")
            await wait_for_shutdown()
    finally:
        if pending_oled_refresh is not None and not pending_oled_refresh.cancelled():
            pending_oled_refresh.cancel()
        await runtime.shutdown()
        display.shutdown()
        oled_display.shutdown()
        print("Display cleared.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Shutting down Project Fifo controller.")
