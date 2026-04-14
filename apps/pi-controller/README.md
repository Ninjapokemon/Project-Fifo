# Pi Controller

This is the Raspberry Pi side of the project. It listens for frames from the desktop app and pushes them to the MAX7219 chain through `luma.led_matrix`.

Today it is mostly a networked renderer. The longer-term goal is for it to become the standalone runtime for a protogen face.

## What Lives Here

- accept frame messages from the desktop app
- accept brightness messages from the desktop app
- store saved drawings on the Pi and send them back on request
- validate payload shape
- map logical pixels to the physical panel arrangement
- render frames to the hardware device
- eventually load saved face projects from disk
- eventually play animations locally on boot without needing a browser connection
- eventually react to inputs such as GPIO buttons or microphone activity

## Main Files

- `src/server.py`: entry point and message loop
- `src/protocol.py`: message validation helpers
- `src/display.py`: `luma` device wrapper
- `src/mapping.py`: logical-to-physical coordinate translation
- `src/storage.py`: Pi-side drawing library storage
- `config.example.json`: template for local hardware settings
- `project-fifo.service`: `systemd` unit template for boot-time startup

## Dependencies

This project uses:

- `luma.led_matrix`
- `luma.core`
- `spidev`
- `websockets`

Once the basics are solid, this is also the place to add `systemd` startup and any Pi-specific setup helpers.

Brightness messages use the same WebSocket connection as frames and are clamped to the MAX7219 `0-15` range on the Pi before being applied.

Saved drawings are stored on the Pi under `apps/pi-controller/data/drawings` as JSON files. The desktop app can save to that directory, ask for the drawing list, and load a stored drawing back over WebSocket.

## Future Runtime Direction

For the protogen face goal, the Pi should eventually own the runtime behavior instead of only mirroring whatever the browser sends.

That future runtime will likely need to add:

- a project loader that can read a primary file on boot
- a playback engine for named multi-frame animations
- a face-state model such as `idle`, `blink`, `talk`, and `happy`
- input handling for buttons, microphone activity, and future sensors
- runtime rules that map input events to animation or state changes
- protocol endpoints for project loading, playback control, and runtime state queries

The current frame transport is still useful because it keeps the renderer easy to test while those larger runtime pieces are added.

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

### Stopping with `Ctrl+C` clears the display and exits cleanly

That is the expected behavior now. The server handles shutdown signals, clears the display, and exits without the old traceback noise.
