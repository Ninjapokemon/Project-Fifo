# Desktop App

This app hosts the browser-based pixel editor used on your PC.

## Responsibilities

- render the logical drawing grid
- let the user paint or erase cells
- preview the current frame
- connect to the Pi by IP or hostname
- send frame messages using the shared protocol

## Current Implementation

The first working version uses plain HTML, CSS, and JavaScript with no frontend build step. That keeps setup simple while we validate the network flow and LED mapping.

## Files

- `index.html`: main editor UI
- `src/main.js`: grid state, drawing logic, and WebSocket transport
- `src/styles.css`: layout and visual styling
- `src/types.ts`: protocol type sketch for a future typed app
- `src/config.ts`: default endpoint and future shared desktop constants

## Run Locally

If you have Python:

```bash
cd apps/desktop
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Usage

1. Set the Pi endpoint such as `ws://192.168.1.50:8765`.
2. Match the grid size to your matrix chain.
3. Click `Connect`.
4. Draw on the grid to stream frames to the Pi.

Left click paints. Right click erases. `Clear`, `Fill`, and `Checker` are included for quick testing.
