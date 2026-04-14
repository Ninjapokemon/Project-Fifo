# Project Fifo

Project Fifo is a repo for drawing pixels in a browser-based desktop editor and streaming those frames to a Raspberry Pi that drives chained MAX7219 LED matrices through `luma.led_matrix`.

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

The system is split into three parts:

1. `apps/desktop`
   Owns the UI: drawing tools, preview, and sending frames to the Pi.
2. `apps/pi-controller`
   Owns hardware: receiving frames, mapping pixels, and writing to MAX7219 devices with `luma`.
3. `packages/shared`
   Owns the contract: frame shape, message types, and protocol examples.

## Initial Direction

The first goal is a simple real-time pipeline:

1. Start the browser editor on the PC.
2. Draw pixels in the desktop app.
3. Send full-frame updates over WebSocket.
4. Validate and decode frames on the Pi.
5. Render those frames through `luma`.

## Next Build Steps

1. Start the desktop app from `apps/desktop`.
2. Start the Pi controller from `apps/pi-controller`.
3. Fill in `mapping.py` for your exact panel order and rotation.
4. Add a small animation/test pattern tool for hardware bring-up.

See [docs/architecture.md](/z:/Project%20Fifo/Project-Fifo/docs/architecture.md) for the data flow and [apps/pi-controller/README.md](/z:/Project%20Fifo/Project-Fifo/apps/pi-controller/README.md) for Pi-specific setup.
