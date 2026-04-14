# TODO

This is the running list of what would make the project nicer to use and easier to set up. It is not meant to be perfectly polished. It is mostly here so I do not lose the next good idea.

## Next Up

### 1. Start the Pi server automatically on boot

What I want:
When the Pi turns on, the server should already be running. No opening a shell just to start Python.

Probably do it like this:

- add a `systemd` service for `apps/pi-controller/src/server.py`
- make it run after the network is available
- point it at the repo path and virtual environment Python
- configure restart behavior so the service comes back if it crashes

Done when:

- reboot the Pi
- wait for startup to finish
- confirm the server is already listening on port `8765`
- connect from the desktop app without manually launching Python

Notes:

- document the service file and install steps in `docs/setup-pi.md`
- make shutdown output cleaner so service logs are less noisy

### 2. Allow the user to save drawings

What I want:
Be able to save a drawing from the desktop app and load it back later without any hassle.

Probably do it like this:

- add `Save` and `Load` actions in the desktop app
- store drawings as JSON files containing:
  - name
  - width
  - height
  - pixels
- use browser file download/upload first for a simple implementation
- optionally add local browser storage later for quick autosave

Done when:

- create a drawing
- save it to disk
- reload the page
- load the saved file
- confirm the grid restores correctly and can be sent to the Pi

Notes:

- use the existing frame message shape to keep the format simple
- reject files whose width and height do not match the current data shape unless the app resizes automatically

### 3. Allow changing brightness from the desktop app

What I want:
Change LED brightness from the editor instead of opening the Pi config every time.

Probably do it like this:

- add a brightness slider or number input in the desktop app
- add a new protocol message type such as:

```json
{
  "type": "brightness",
  "version": 1,
  "value": 3
}
```

- handle that message on the Pi and call the appropriate `luma` contrast method
- keep the allowed range aligned with MAX7219 expectations

Done when:

- move the brightness control in the desktop app
- verify the Pi updates LED intensity without restarting the server

Notes:

- clamp brightness values on the Pi for safety
- decide whether the brightness setting should persist across reconnects or reboot

### 4. Add cleaner Pi shutdown behavior

What I want:
Stopping the server with `Ctrl+C` should feel normal instead of looking like it crashed.

Probably do it like this:

- catch `KeyboardInterrupt` around `asyncio.run(...)`
- optionally add signal-aware cleanup for the display
- keep log output short and service-friendly

Done when:

- stop the server with `Ctrl+C`
- confirm it exits without the traceback currently shown

### 5. Add more hardware test patterns

What I want:
Stop hand-drawing the same test lines over and over whenever panel order is wrong.

Probably do it like this:

- add desktop buttons for:
  - border
  - horizontal line
  - vertical line
  - moving dot
  - panel index test
- use these patterns during mapping bring-up

Done when:

- the user can trigger each pattern from the desktop app
- the pattern is immediately visible on the matrix chain

### 6. Add undo and redo

What I want:
Make the editor usable for actual drawing, not just quick tests.

Probably do it like this:

- keep a bounded history stack in the desktop app
- push changes after meaningful edits rather than every single hover cell
- add `Undo` and `Redo` buttons

Done when:

- draw several changes
- undo them in order
- redo them in order

### 7. Add autosave in the browser

What I want:
Refreshing the browser should not wipe whatever was on the grid.

Probably do it like this:

- save the current drawing to browser local storage
- restore it on page load if the dimensions match
- make it clear when autosaved content has been restored

Done when:

- draw something
- refresh the page
- confirm the drawing comes back automatically

### 8. Add named Pi endpoints in the desktop app

What I want:
Stop retyping the Pi address every time the page reloads.

Probably do it like this:

- save recent endpoints in browser local storage
- allow the user to pick from or reuse saved addresses

Done when:

- connect to a Pi once
- refresh the page
- confirm the endpoint is still available in the UI

### 9. Add a protocol state message

What I want:
Let the desktop app ask the Pi what it is currently doing instead of guessing.

Probably do it like this:

- add request and response messages for:
  - brightness
  - width
  - height
  - connection status
- use that information to keep the desktop UI in sync

Done when:

- connect from the desktop app
- request state
- show the current Pi settings in the UI

### 10. Add a Pi install script

What I want:
Make fresh Pi setup feel more like one command and less like a checklist.

Probably do it like this:

- create a script that:
  - creates the virtual environment
  - installs Python dependencies
  - copies the config template if needed
  - optionally installs the `systemd` service

Done when:

- run one command on a fresh Pi clone
- finish with a ready-to-run controller setup

### 11. Add unit tests for protocol and mapping

What I want:
Catch the dumb breakages before they make it all the way to the hardware.

Probably do it like this:

- test frame validation success and failure cases
- test mapping for common panel layouts
- test brightness clamping once brightness control is added

Done when:

- test suite runs locally
- expected failures are covered for bad messages and edge coordinates

### 12. Add multi-frame animation support

What I want:
Support animations instead of only single still frames.

Probably do it like this:

- support multiple frames in the desktop UI
- add frame timing controls
- choose whether playback happens:
  - on the desktop by streaming frames
  - or on the Pi by uploading an animation payload

Done when:

- create at least two frames
- play them back in sequence on the matrices

## Rough Order

1. Brightness control
2. Save and load drawings
3. Cleaner Pi shutdown
4. Hardware test patterns
5. Auto-start on Pi boot
6. Autosave
7. Undo and redo
8. Named Pi endpoints
9. Pi install script
10. Protocol state message
11. Unit tests
12. Animation support

Why this order:

- brightness is the smallest feature and extends the protocol cleanly
- save/load adds more UI work but stays local to the desktop app
- cleaner shutdown makes service work nicer and easier to trust
- test patterns reduce friction during every future hardware change
- boot-time auto-start is best done after the server behavior is stable
