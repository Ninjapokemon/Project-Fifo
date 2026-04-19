# Project Fifo

Project Fifo is a small setup for drawing pixels on a browser-based editor and pushing them to a Raspberry Pi that drives MAX7219 LED matrices with `luma.led_matrix`.

The immediate version is a matrix editor and transport tool. The longer-term goal is a standalone protogen face runtime where the Pi can boot, load a primary face project, play animations on its own, and react to inputs such as buttons or microphone activity without needing the browser to stay connected.

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
   This is the editor on the PC. It currently handles drawing, preview, and sending frames to the Pi. Over time it will also become the animation editor, project manager, and upload/control surface for Pi-side runtime content.
2. `apps/pi-controller`
   This is the Pi side. It currently receives frames, handles mapping, and writes to the MAX7219 chain with `luma`. The longer-term direction is for it to become the autonomous runtime that stores projects, plays animations locally, reacts to inputs, and loads a default project on boot.
3. `packages/shared`
   This is where the shared message format and protocol notes live. As animation support grows, this package will also need to define shared project, animation, state, and runtime-control message shapes.

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
4. save single drawings locally or on the Pi for authoring and testing
5. tune panel order, rotation, and per-panel flips in config

That Pi-side drawing storage is useful right now, but it is not the final standalone deployment model. The long-term runtime will need Pi-owned project storage, boot selection, and runtime state beyond individual saved frames.

There is still more to build, especially around persistence rules, project deployment, and boot-time runtime behavior on the Pi.

## Future Direction

The project is heading toward a protogen face workflow:

1. author drawings and named animations on the desktop
2. save them as a reusable project format
3. upload or load that project on the Pi
4. let the Pi play the default face state on boot
5. let the Pi switch animations or face states based on inputs

That means the current single-frame architecture is a starting point, not the final shape. The key future changes will be:

- desktop support for named multi-frame animations and preview playback
- a shared project format that can represent drawings, animations, boot defaults, and future input mappings
- a clear split between temporary live control, saved Pi settings, and deployed Pi runtime projects
- Pi-side playback and state management so animation timing does not depend on the browser
- Pi-side input handling for things like buttons and microphone-driven reactions
- protocol support for runtime state, project loading, and animation control

See [docs/architecture.md](docs/architecture.md) for the data flow and [apps/pi-controller/README.md](apps/pi-controller/README.md) for Pi-specific setup.

The running TODO list is in [TODO.md](TODO.md).
