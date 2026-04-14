# Pi Controller

This is the Raspberry Pi side of the project. It listens for frames from the desktop app and pushes them to the MAX7219 chain through `luma.led_matrix`.

## What Lives Here

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

Once the basics are solid, this is also the place to add `systemd` startup and any Pi-specific setup helpers.

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

This usually means the MAX7219 chain order is backwards from what the app expects.

Fix in `config.json`:

```json
"reverse_order": true
```

### The pixels show up rotated or twisted across the two modules

If the app connects and pixels show up, but they are twisted or rotated, that is usually a panel orientation problem and not a network problem.

Fix in `config.json`:

- try `block_orientation: -90` if `90` is wrong
- if the whole display is rotated, also test `rotate`

### `Ctrl+C` prints a traceback when stopping the server

That is expected right now. The server waits forever with `asyncio.Future()`, so `Ctrl+C` cancels that wait and Python prints a `KeyboardInterrupt` traceback on the way out. It looks ugly, but it does not mean the server is broken.
