# Desktop Setup

## What you are running

The desktop side is a plain browser app in `apps/desktop`. It does not need Node, React, or a frontend build step for this first version.

## 1. Make sure the Pi and your PC are on the same network

The browser app opens a WebSocket connection directly to the Pi, so both machines need to be able to reach each other over your local network.

## 2. Start a local web server in the desktop app folder

From the repo root:

```bash
cd apps/desktop
python -m http.server 4173
```

If you already have Node installed and prefer npm scripts:

```bash
cd apps/desktop
npm run dev
```

Both commands do the same thing for now.

## 3. Open the editor in your browser

Open:

```text
http://localhost:4173
```

## 4. Set the Pi endpoint

Use the Pi controller URL, for example:

```text
ws://raspberrypi.local:8765
```

or

```text
ws://192.168.1.50:8765
```

If `raspberrypi.local` does not resolve on your PC, use the Pi's IP address instead.

## 5. Match the grid size to your LED setup

Each MAX7219 module is `8x8`.

Examples:

- `4` modules in one row = `32x8`
- `3` modules in one row = `24x8`
- `8` modules in one row = `64x8`
- `4 x 2` modules = `32x16`

The desktop app and Pi config must agree on width and height.

## 6. Draw and test

- Left click paints pixels.
- Right click erases pixels.
- `Clear` resets the frame.
- `Fill` turns everything on.
- `Checker` sends an alternating pattern that is useful for alignment tests.
- `Panel Index Test` walks through each `8x8` block so you can verify panel ordering.
- `Send Now` pushes the current frame immediately.

## 7. Tune layout from the desktop app

Use the `Layout + Orientation` section to adjust:

- `Rotate` for whole-display quarter turns
- `Block Orientation` for panel-level rotation
- `Reverse Panel Order` when the chain starts from the opposite side
- `Layout Preset` as a quick starting point for common horizontal arrangements

Then use the per-board rotation and mirror controls in the workspace when a single physical `8x8` module needs its own correction.

Click `Read From Pi` after connecting to pull the current layout, then use `Save To Pi` once the LEDs look correct so the settings survive reboot.

## Troubleshooting

- If the browser shows `Disconnected`, confirm the Pi server is running.
- If `Connect` fails, check the endpoint and firewall rules.
- If the pattern is mirrored or rotated on the LEDs, the next thing to adjust is `apps/pi-controller/src/mapping.py` and the Pi config options.
- If `Panel Index Test` lights two panels at the same time, that is usually a hardware wiring mirror such as two chains fed in parallel. `Panel Order` can fix swapped positions, but it cannot separate duplicated panels that share the same signal path.
- If only one board needs its own correction while the rest look right, click that board's rotation or mirror control until it looks right and then save the layout back to the Pi.
