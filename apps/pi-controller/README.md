# Pi Controller

This is the Raspberry Pi side of the project. It listens for frames from the desktop app and pushes them to the MAX7219 chain through `luma.led_matrix`.

Today it is mostly a networked renderer. The longer-term goal is for it to become the standalone runtime for a protogen face.

## What Lives Here

- accept frame messages from the desktop app
- accept brightness messages from the desktop app
- accept live layout/orientation messages and optionally save them to config
- store saved drawings on the Pi and send them back on request for simple iteration
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

Pi-specific setup helpers now live in `scripts/`, and the full install and update flow is documented in `docs/setup-pi.md`.

Brightness messages use the same WebSocket connection as frames and are clamped to the MAX7219 `0-15` range on the Pi before being applied.

Layout messages use the same WebSocket connection and can update `rotate`, `block_orientation`, `reverse_order`, per-panel `panel_rotations`, and per-panel `panel_mirrors` on the active `luma` device without restarting the server. A separate save action writes those values to `apps/pi-controller/config.json` so they survive reboot.

If your chain order is more unusual than a simple reverse, `apps/pi-controller/config.json` also supports an optional `panel_order` list for remapping whole `8x8` panels in row-major physical order.

If one physical `8x8` module is mounted differently from the others, `apps/pi-controller/config.json` also supports an optional `panel_rotations` list of `0`, `90`, `180`, or `270` values in row-major physical order and an optional `panel_mirrors` list of booleans for horizontal mirroring. That lets you correct one panel without changing the browser drawing.

Saved drawings are stored on the Pi under `apps/pi-controller/data/drawings` as JSON files. The desktop app can save to that directory, ask for the drawing list, and load a stored drawing back over WebSocket. Those saved drawing files preserve the browser's board workspace layout metadata and board groups alongside the frame pixels.

That drawing store is a short-term editing convenience, not the final standalone runtime content model. The longer-term Pi runtime should store validated face projects, know which project is active, and know which project should load automatically on boot.

## Future Runtime Direction

For the protogen face goal, the Pi should eventually own the runtime behavior instead of only mirroring whatever the browser sends.

That future runtime will likely need to add:

- a project loader that can read a primary file on boot
- a project store that can save, list, load, delete, and select a default boot project
- a playback engine for named multi-frame animations
- a face-state model such as `idle`, `blink`, `talk`, and `happy`
- input handling for buttons, microphone activity, and future sensors
- runtime rules that map input events to animation or state changes
- protocol endpoints for project loading, playback control, persistence decisions, and runtime state queries

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

You can now test that from the desktop app first, then click `Save To Pi` in the layout section once it looks correct.

### The panel order is neither normal nor fully reversed

If the panel index test shows something like physical order `2, 1, 3`, use `panel_order` in `config.json`:

```json
"panel_order": [1, 0, 2]
```

That example is zero-based and means the physical left position should receive logical panel `1`, the middle position should receive logical panel `0`, and the right position should receive logical panel `2`.

### The pixels show up rotated or twisted across the two modules

If the app connects and pixels show up, but they are twisted or rotated, that is usually a panel orientation problem and not a network problem.

Fix in `config.json`:

- try `block_orientation: -90` if `90` is wrong
- if the whole display is rotated, also test `rotate`

The desktop app can change those settings live, which makes it much easier to dial them in before saving them to the Pi config.

### One module is rotated differently, but the rest are correct

If only one or two physical modules are mounted differently, leave the browser drawing alone and rotate or mirror just those hardware panels.

Fix in `config.json`:

```json
"panel_rotations": [180, 0, 0]
```

That example rotates only the leftmost physical panel by `180` degrees.

If the module also needs horizontal mirroring, use:

```json
"panel_mirrors": [true, false, false]
```

### Stopping with `Ctrl+C` clears the display and exits cleanly

That is the expected behavior now. The server handles shutdown signals, clears the display, and exits without the old traceback noise.
