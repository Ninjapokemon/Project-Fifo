# Pi Controller

This app runs on the Raspberry Pi and drives chained MAX7219 matrices through `luma.led_matrix`.

## Responsibilities

- accept frame messages from the desktop app
- validate payload shape
- map logical pixels to the physical panel arrangement
- render frames to the hardware device

## Main Files

- `src/server.py`: entry point and message loop
- `src/protocol.py`: message validation helpers
- `src/display.py`: `luma` device wrapper
- `src/mapping.py`: logical-to-physical coordinate translation
- `config.example.json`: template for local hardware settings

## Dependencies

This project uses:

- `luma.led_matrix`
- `luma.core`
- `spidev`
- `websockets`

You can add systemd service wiring later after the basic loop is working.

## Common Issues

### `ModuleNotFoundError: No module named 'spidev'`

`luma` needs `spidev` to talk to the Pi's SPI bus.

Fix:

```bash
source .venv/bin/activate
pip install -r apps/pi-controller/requirements.txt
```

If `spidev` fails to build, install Pi build tools and retry:

```bash
sudo apt update
sudo apt install -y python3-dev build-essential
pip install spidev
```

### The browser connects, but drawing starts on the wrong module

This usually means the MAX7219 chain order is reversed.

Fix in `config.json`:

```json
"reverse_order": true
```

### The pixels show up rotated or twisted across the two modules

This is usually an orientation issue rather than a networking issue.

Fix in `config.json`:

- try `block_orientation: -90` if `90` is wrong
- if the whole display is rotated, also test `rotate`

### `Ctrl+C` prints a traceback when stopping the server

That is currently expected. The server waits forever with `asyncio.Future()`, so `Ctrl+C` cancels that wait and Python prints a `KeyboardInterrupt` traceback while exiting. It is noisy, but not a bug.
