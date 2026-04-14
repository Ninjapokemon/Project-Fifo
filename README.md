# Project Fifo

Project Fifo is a small setup for drawing pixels on a browser-based editor and pushing them to a Raspberry Pi that drives MAX7219 LED matrices with `luma.led_matrix`.

## Repo Layout

```text
apps/
  desktop/         Browser-based grid editor and transport client
  pi-controller/   Raspberry Pi server and luma-based display driver
packages/
  shared/          Protocol docs, example payloads, and shared constants
docs/              Architecture, wiring, and setup notes
scripts/           Development and deployment helpers
```

## Architecture

The project is split into three parts:

1. `apps/desktop`
   This is the editor on the PC. It handles drawing, preview, and sending frames to the Pi.
2. `apps/pi-controller`
   This is the Pi side. It receives frames, handles mapping, and writes to the MAX7219 chain with `luma`.
3. `packages/shared`
   This is where the shared message format and protocol notes live.

## How It Works

The basic flow is pretty simple:

1. Start the browser editor on the PC.
2. Draw pixels in the desktop app.
3. Send full-frame updates over WebSocket.
4. Validate and decode frames on the Pi.
5. Render those frames through `luma`.

## Right Now

The current version is enough to:

1. run the editor locally
2. connect to the Pi over WebSocket
3. draw live on the matrix display
4. tune panel order and rotation in config

There is still more to build, especially around brightness, saving drawings, and boot-time startup on the Pi.

See [docs/architecture.md](/z:/Project%20Fifo/Project-Fifo/docs/architecture.md) for the data flow and [apps/pi-controller/README.md](/z:/Project%20Fifo/Project-Fifo/apps/pi-controller/README.md) for Pi-specific setup.

The running TODO list is in [TODO.md](/z:/Project%20Fifo/Project-Fifo/TODO.md).
