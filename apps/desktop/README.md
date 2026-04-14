# Desktop App

This app hosts the browser-based pixel editor used on your PC.

For now it is the main editing interface. Long term, it is intended to become the authoring tool for a protogen face project that the Pi can later run on its own.

## Responsibilities

- render the logical drawing grid
- let the user paint or erase cells
- preview the current frame
- connect to the Pi by IP or hostname
- save and load drawings as JSON files
- change MAX7219 brightness from the browser
- send frame messages using the shared protocol
- save drawings to the connected Pi and load them back later
- eventually edit named animations and preview them before sending or uploading to the Pi
- eventually manage project files that can be deployed to the Pi runtime

## Current Implementation

The first working version uses plain HTML, CSS, and JavaScript with no frontend build step. That keeps setup simple while I validate the network flow and LED mapping.

The current desktop app is intentionally simple and frame-oriented. It is expected to grow toward:

- multi-frame animation editing
- named animations for face states such as `idle`, `blink`, and `talk`
- browser playback preview for fast iteration
- project save/load that can later match the Pi runtime format
- runtime control actions once the Pi can load and play projects on its own

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
5. Use `Brightness` to update LED intensity without editing Pi config.
6. Use `Save` and `Load` to move drawings in and out as JSON files.
7. Use `Save To Pi`, `Refresh Pi List`, and `Load From Pi` to keep drawings on the connected Pi.

Left click paints. Right click erases. `Clear`, `Fill`, and `Checker` are included for quick testing.

## Future Direction

The browser editor is not meant to stay only a live pixel pusher. The longer-term goal is:

1. create and edit face expressions and animations on the desktop
2. preview them locally in the browser
3. save them in a project format that supports multiple named animations
4. send or upload that project to the Pi
5. use the desktop app as an optional control panel once the Pi is running standalone

That future project format will likely need to represent at least:

- display dimensions
- named animations
- frame durations
- a default startup animation or face state
- future input-driven behavior rules
