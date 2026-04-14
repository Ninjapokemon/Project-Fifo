from __future__ import annotations

import asyncio
import json
import signal

import websockets

from config import load_config
from display import MatrixDisplay
from protocol import (
    ProtocolError,
    validate_brightness_message,
    validate_drawing_name_message,
    validate_frame_message,
    validate_named_drawing,
)
from storage import DrawingStore


async def handle_connection(websocket, display: MatrixDisplay, drawing_store: DrawingStore) -> None:
    async for raw_message in websocket:
        try:
            message = json.loads(raw_message)
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
    drawing_store = DrawingStore()

    try:
        async with websockets.serve(
            lambda websocket: handle_connection(websocket, display, drawing_store),
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
