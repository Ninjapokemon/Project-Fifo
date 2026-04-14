from __future__ import annotations

import asyncio
import json
import signal

import websockets

from config import load_config
from display import MatrixDisplay
from protocol import ProtocolError, validate_brightness_message, validate_frame_message


async def handle_connection(websocket, display: MatrixDisplay) -> None:
    async for raw_message in websocket:
        try:
            message = json.loads(raw_message)
            if message.get("type") == "clear":
                display.clear()
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
        except (json.JSONDecodeError, ProtocolError, ValueError) as error:
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

    try:
        async with websockets.serve(
            lambda websocket: handle_connection(websocket, display),
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
