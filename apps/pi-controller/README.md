# Pi Controller

This is the Raspberry Pi side of the project. It listens for frames from the desktop app, stores Pi-owned projects, and pushes pixels to the MAX7219 chain through `luma.led_matrix`.

Today it can already run a saved default project on boot while still allowing the website to take temporary live control. The longer-term goal is for it to grow into the richer standalone runtime for a protogen face.

## What Lives Here

- accept frame messages from the desktop app
- accept brightness messages from the desktop app
- accept live layout/orientation messages and optionally save them to config
- store saved drawings on the Pi and send them back on request for simple iteration
- store saved projects on the Pi and let the website activate, resume, delete, and pick a boot project
- validate payload shape
- map logical pixels to the physical panel arrangement
- render frames to the hardware device
- load a saved boot project from disk on startup
- play saved default frames or animations locally without needing a browser connection
- drive auxiliary OLED status and preview output with runtime-aware mode selection
- sample MAX9814 microphone input through ADS1115 and show live diagnostics on OLED
- eventually react to inputs such as GPIO buttons or microphone activity

## Main Files

- `src/server.py`: entry point and message loop
- `src/protocol.py`: message validation helpers
- `src/display.py`: `luma` device wrapper
- `src/mapping.py`: logical-to-physical coordinate translation
- `src/storage.py`: Pi-side drawing library storage
- `src/project_store.py`: Pi-side project storage
- `src/runtime.py`: project runtime and live-override handoff
- `src/oled.py`: OLED status/preview helper with `preset` and `mirror` preview modes
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

Saved projects are stored on the Pi under `apps/pi-controller/data/projects` as JSON files. A project can contain one or more named frames, optional named animations, and a default frame or animation target. The desktop app can save the current drawing as a Pi project, activate it, and choose which project should load automatically on boot.

Live website frames are now treated as a temporary override on top of that project runtime. If the website disconnects and a Pi project was active, the Pi can resume the project instead of staying stuck in the temporary live frame state.

When a saved project includes channel metadata (`channels`, optional `channelDefaults`, and animation `channelId`), the runtime can now compose multiple channels per tick (for example `base` + `eyes` + `mouth`) into one output frame. The compositor tick rate can be tuned with `runtime_tick_hz` in `apps/pi-controller/config.json`.

## OLED Preview Pipeline

The Pi OLED helper now supports two preview modes:

- `preset` (default): OLED preview is driven from the active Pi project target in runtime state. If the active target is an animation, OLED advances through that animation's step timing using the project file data. If the active target is a frame, OLED shows that frame. If project data is unavailable, it falls back to built-in preset animations mapped by event.
- `mirror`: OLED preview uses the transformed live frame callback path.

This means future project animations are automatically eligible for OLED preview without code changes, as long as they become the active runtime target.

Relevant config keys in `apps/pi-controller/config.json`:

- `oled.preview_mode`
- `oled.preview_event_map`
- `oled.preview_fps`
- `oled.status_fps`
- `oled_coalesce_seconds`

## Microphone Test Mode (MAX9814 + ADS1115)

Raspberry Pi GPIO cannot read analog directly, so `MAX9814` requires an ADC. This branch includes a simple ADS1115 mic sampler that can feed OLED diagnostics.

Config keys:

- `microphone.enabled`
- `microphone.test_mode`
- `microphone.i2c_bus`
- `microphone.address`
- `microphone.channel`
- `microphone.sample_hz`
- `microphone.runtime_bridge.enabled`
- `microphone.runtime_bridge.channel_id`
- `microphone.runtime_bridge.active_threshold`
- `microphone.runtime_bridge.idle_threshold`
- `microphone.runtime_bridge.active_animation_id`
- `microphone.runtime_bridge.idle_frame_id`
- `microphone.runtime_bridge.idle_animation_id`
- `microphone.runtime_bridge.switch_cooldown_ms`
- `microphone.runtime_bridge.release_hold_ms`

When `microphone.test_mode` is `true`, the OLED status page stays on a microphone diagnostics view (`raw`, `mV`, bias, level, peak) for bring-up testing.

When `microphone.runtime_bridge.enabled` is `true`, the Pi can map microphone activity into channel runtime actions. By default it targets the `mouth` channel, switches to animation `smile` when level rises above `active_threshold`, and returns to `idle_frame_id` (or `idle_animation_id`, or default channel playback if unset) after level falls below `idle_threshold`.

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
- layered channel playback and compositing so `eyes` and `mouth` can animate independently (for example blink while talking)

The current frame transport is still useful because it gives the website a fast live-edit path without replacing the Pi-owned runtime model.

The detailed layered runtime plan (channels, compositor, protocol, and phased rollout) is documented in `docs/architecture.md` under `Layered Channel Runtime Plan`.

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
