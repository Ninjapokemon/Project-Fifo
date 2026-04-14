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
- `8` modules in one row = `64x8`
- `4 x 2` modules = `32x16`

The desktop app and Pi config must agree on width and height.

## 6. Draw and test

- Left click paints pixels.
- Right click erases pixels.
- `Clear` resets the frame.
- `Fill` turns everything on.
- `Checker` sends an alternating pattern that is useful for alignment tests.
- `Send Now` pushes the current frame immediately.

## Troubleshooting

- If the browser shows `Disconnected`, confirm the Pi server is running.
- If `Connect` fails, check the endpoint and firewall rules.
- If the pattern is mirrored or rotated on the LEDs, the next thing to adjust is `apps/pi-controller/src/mapping.py` and the Pi config options.
