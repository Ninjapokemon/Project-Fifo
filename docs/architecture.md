# Architecture

## High-Level Flow

```text
Desktop UI -> WebSocket messages -> Pi controller -> mapping layer -> luma device -> MAX7219 matrices
```

The MAX7219 chain is still the primary rendered output. A small I2C OLED now runs alongside it as a secondary status and preview display.

## Long-Term Direction

Project Fifo is moving toward a protogen face runtime, not just a one-frame drawing transport.

The near-term editor workflow should still live on the desktop:

- edit drawings
- build named animations
- preview playback
- save and load project files
- optionally push temporary test frames or simple saved drawings during bring-up

The long-term runtime should live on the Pi:

- load a primary face project on boot
- play animations locally without the browser connected
- switch face states based on runtime rules
- respond to inputs such as buttons and microphone activity
- keep track of which state is live temporarily versus what is persisted for reboot

The current implementation is now starting to follow that split:

- the website can still stream temporary live frames for fast editing
- the Pi can store named projects and remember a boot project
- disconnecting the website no longer has to mean losing the Pi-owned runtime state
- OLED preview can follow the active Pi runtime target (frame or animation) using project data, with preset fallback behavior

That means the future high-level flow will look more like:

```text
Desktop editor -> project upload/control -> Pi runtime -> playback/state engine -> mapping layer -> luma device -> MAX7219 matrices
                                                |
                                                -> input handlers (buttons, microphone, future sensors)
                                                -> auxiliary status + preview display (I2C OLED)
```

## Responsibilities

### Desktop app

- Maintains the logical pixel grid.
- Sends frame updates when the user draws.
- Never cares about wiring quirks or GPIO details.
- Will eventually own animation authoring, preview playback, and project management.

### Pi controller

- Receives network messages.
- Validates payloads against the shared protocol.
- Converts logical coordinates to physical matrix positions.
- Pushes updates to the `luma` device.
- Publishes compact runtime status and preview output to auxiliary OLEDs without changing MAX7219 ownership.
- Will eventually need a local playback engine, project loader, state machine, and input manager.

### Shared package

- Defines message types.
- Defines the frame payload shape.
- Stores example payloads and implementation notes.
- Will eventually need to define shared project, animation, state, and control payloads.

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

For the next phase, simple full-frame messages are still a good transport primitive, but they are not enough by themselves for the protogen-face goal. The architecture will need room for:

- named animations made of multiple frames
- project files with one shared `width` and `height`
- runtime commands like play, stop, load project, and request state
- project lifecycle commands like upload, list, delete, and choose the boot/default project
- Pi-owned playback timing instead of browser-only streaming
- future input-triggered state changes

## Runtime Direction

Because this is intended for a protogen face, the Pi should eventually think in terms of face states rather than only raw frame streams.

Examples:

- `idle`
- `blink`
- `talk`
- `happy`
- `error`

That suggests a future runtime with these responsibilities:

- renderer: draw one frame to the hardware
- playback engine: advance animation frames over time
- project store: load and validate saved face projects
- state manager: decide which animation or state is active
- persistence manager: decide what survives reconnects, restarts, and full reboot
- input manager: turn button presses or microphone activity into events
- rule layer: map those events to state changes or one-shot animations

The current code already covers the renderer and the basic network transport. The remaining pieces should be added gradually so the current simple flow stays usable while the standalone runtime grows.

## Layered Channel Runtime Plan

The current Pi runtime chooses one active target at a time (one frame or one animation). That is good for early bring-up, but it does not support independent behaviors like blinking eyes while talking.

The next runtime shape should support simultaneous channel playback with compositing:

- `base` channel for default expression or idle loop
- `eyes` channel for blink and eye-only reactions
- `mouth` channel for talk/viseme behavior

Each channel should play independently, then produce one final composited frame per tick for MAX7219 output.

### Why This Model

- Supports concurrent behavior (`blink` + `talk`) without requiring one giant precomposed animation.
- Keeps timing local to the Pi runtime instead of browser message timing.
- Creates a clear place for event-driven logic (mic activity, buttons, sensors) to target specific face regions.

### Initial Compositing Rules (v1)

- Keep binary pixels (`0` or `1`) for now.
- Render channels in priority order.
- Use `overwrite` blending first: higher priority channel wins at a pixel.
- Treat `0` as transparent for channel overlays.
- Support optional per-channel masks so channels can stay scoped to eye/mouth regions.

### Project Model Additions

The project format should keep backward compatibility while adding channel metadata:

- channel definitions (`id`, `name`, `priority`, `blendMode`, optional `mask`)
- animation-to-channel assignment (`channelId`)
- optional runtime defaults for channel startup behavior

Older projects without channels should load as a single `base` channel automatically.

### Runtime Engine Changes

The Pi runtime should evolve from one playback task to a channel-based engine:

- per-channel playback state (`active animation/frame`, `step index`, `loop`, `timing`)
- fixed-tick render loop (for example 20-30 FPS)
- compositor stage that merges all active channels into one logical frame
- existing mapping/render stage stays unchanged after compositing

### Protocol Additions

In addition to existing project lifecycle commands, add channel control commands:

- `play_channel`
- `stop_channel`
- `set_channel_animation`
- `set_channel_frame`
- `clear_channel`

Runtime state payloads should report channel-level activity so the website and OLED can display what is running.

### Event Router Direction

Introduce an internal event router that maps runtime events to channel actions:

- `blink` -> play one-shot eye animation on `eyes`
- `speech_start` and `speech_level` -> drive `mouth`
- `speech_end` -> return mouth channel to idle

Start with manual/synthetic events first, then integrate real microphone/button handlers.

### Delivery Phases

1. Data model and validation updates with backward-compatible loading.
2. Pi channel playback engine plus compositor and fixed-tick render loop.
3. Channel control protocol and runtime state reporting.
4. Desktop authoring updates for channel assignment and layered preview.
5. Event router wiring and first microphone bridge.

### Decisions To Lock Early

- target tick rate (20/30/60 FPS)
- mask format (explicit pixel mask, board-group mapping, or both)
- one-shot conflict behavior (`interrupt`, `restart`, or `queue`)
- overlap policy when channels target the same pixels

Implementation starts with a concrete Phase A checklist in `docs/layered-runtime-phase-a.md`.

## Mapping Layer

The Pi owns the mapping layer because physical layouts vary:

- chain order may be reversed
- matrices may be rotated
- panels may be mounted in a serpentine layout

Keep those rules isolated in `apps/pi-controller/src/mapping.py`.
