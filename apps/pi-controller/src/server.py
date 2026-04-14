from __future__ import annotations

import asyncio
import json

import websockets

from config import load_config
from display import MatrixDisplay
from protocol import ProtocolError, validate_frame_message


async def handle_connection(websocket, display: MatrixDisplay) -> None:
    async for raw_message in websocket:
        try:
            message = json.loads(raw_message)
            if message.get("type") == "clear":
                display.clear()
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


async def main() -> None:
    config = load_config()
    display = MatrixDisplay(config)

    async with websockets.serve(
        lambda websocket: handle_connection(websocket, display),
        config["host"],
        config["port"],
    ):
        print(f"Listening on ws://{config['host']}:{config['port']}")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
