# Architecture

## High-Level Flow

```text
Desktop UI -> WebSocket messages -> Pi controller -> mapping layer -> luma device -> MAX7219 matrices
```

## Responsibilities

### Desktop app

- Maintains the logical pixel grid.
- Sends frame updates when the user draws.
- Never cares about wiring quirks or GPIO details.

### Pi controller

- Receives network messages.
- Validates payloads against the shared protocol.
- Converts logical coordinates to physical matrix positions.
- Pushes updates to the `luma` device.

### Shared package

- Defines message types.
- Defines the frame payload shape.
- Stores example payloads and implementation notes.

## Message Strategy

Start simple with full-frame messages:

```json
{
  "type": "frame",
  "version": 1,
  "width": 32,
  "height": 8,
  "pixels": [
    1, 0, 0, 1
  ]
}
```

This is easy to debug in logs and browser dev tools. If bandwidth becomes a concern later, switch to packed bitfields or a patch/diff protocol.

## Mapping Layer

The Pi owns the mapping layer because physical layouts vary:

- chain order may be reversed
- matrices may be rotated
- panels may be mounted in a serpentine layout

Keep those rules isolated in `apps/pi-controller/src/mapping.py`.
