from __future__ import annotations

import asyncio
import json
import signal

import websockets

from config import load_config, save_config
from display import MatrixDisplay
from protocol import (
    ProtocolError,
    validate_brightness_message,
    validate_drawing_name_message,
    validate_frame_message,
    validate_layout_message,
    validate_named_drawing,
    validate_simple_request_message,
)
from storage import DrawingStore


def build_layout_state_message(
    display: MatrixDisplay,
    message_type: str = "layout_state",
) -> dict[str, int | bool | str | list[int] | None]:
    return {
        "type": message_type,
        "width": display.width,
        "height": display.height,
        **display.get_layout(),
    }


def build_state_message(
    display: MatrixDisplay,
    drawing_store: DrawingStore,
    config: dict,
) -> dict[str, int | bool | str | list[str] | list[int] | None]:
    persisted_layout = {
        "rotate": config.get("rotate", 0),
        "block_orientation": config.get("block_orientation", 90),
        "reverse_order": config.get("reverse_order", False),
        "panel_order": config.get("panel_order"),
        "panel_rotations": config.get("panel_rotations"),
    }
    live_state = display.get_state()

    return {
        "type": "state",
        **live_state,
        "drawings": drawing_store.list_names(),
        "layout_persisted": live_state["rotate"] == persisted_layout["rotate"]
        and live_state["block_orientation"] == persisted_layout["block_orientation"]
        and live_state["reverse_order"] == persisted_layout["reverse_order"]
        and live_state["panel_order"] == persisted_layout["panel_order"]
        and live_state["panel_rotations"] == persisted_layout["panel_rotations"],
        "active_project": None,
        "boot_project": None,
        "connection_status": "connected",
    }


async def handle_connection(
    websocket,
    display: MatrixDisplay,
    drawing_store: DrawingStore,
    config: dict,
) -> None:
    async for raw_message in websocket:
        try:
            message = json.loads(raw_message)
            if message.get("type") == "get_state":
                validate_simple_request_message(message, "get_state")
                await websocket.send(json.dumps(build_state_message(display, drawing_store, config)))
                continue
            if message.get("type") == "get_layout":
                validate_simple_request_message(message, "get_layout")
                await websocket.send(json.dumps(build_layout_state_message(display)))
                continue
            if message.get("type") == "clear":
                display.clear()
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
                        }
                    )
                )
                continue
            if message.get("type") == "brightness":
                brightness = validate_brightness_message(message)
                applied_value = display.set_brightness(brightness["value"])
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
                    layout.get("panel_flips"),
                )
                await websocket.send(
                    json.dumps(build_layout_state_message(display))
                )
                continue
            if message.get("type") == "save_layout":
                layout = validate_layout_message(message, "save_layout")
                applied_layout = display.set_layout(
                    layout["rotate"],
                    layout["block_orientation"],
                    layout["reverse_order"],
                    layout.get("panel_order"),
                    layout.get("panel_rotations"),
                    layout.get("panel_flips"),
                )
                config.update(applied_layout)
                config.pop("panel_flips", None)
                save_config(config)
                await websocket.send(
                    json.dumps(build_layout_state_message(display, "layout_saved"))
                )
                continue

            frame = validate_frame_message(message)
            display.render_frame(frame["pixels"], frame["width"], frame["height"])
        except (json.JSONDecodeError, ProtocolError, ValueError, FileNotFoundError) as error:
            await websocket.send(
                json.dumps(
                    {
                        "type": "error",
                        "message": str(error),
                    }
                )
            )


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
    display = MatrixDisplay(config)
    config.update(display.get_layout())
    config.pop("panel_flips", None)
    drawing_store = DrawingStore()

    try:
        async with websockets.serve(
            lambda websocket: handle_connection(websocket, display, drawing_store, config),
            config["host"],
            config["port"],
        ):
            print(f"Listening on ws://{config['host']}:{config['port']}")
            await wait_for_shutdown()
    finally:
        display.shutdown()
        print("Display cleared.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Shutting down Project Fifo controller.")
