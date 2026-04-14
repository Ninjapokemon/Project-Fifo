# TODO

This is the running list of what would make the project nicer to use and easier to set up.

## At A Glance

### Done

- [x] Save and load drawings in the desktop app using browser JSON files
- [x] Save and load drawings on the Pi over WebSocket
- [x] Change brightness from the desktop app and apply it on the Pi
- [x] Make Pi shutdown cleaner for `Ctrl+C` and service stops
- [x] Start the Pi server automatically on boot with `systemd`

### Next

- [ ] Add hardware test patterns
- [ ] Add undo and redo
- [ ] Add browser autosave
- [ ] Add named Pi endpoints in the desktop app
- [ ] Add a protocol state message
- [ ] Add display orientation and panel layout controls in the desktop app
- [ ] Add a Pi install script
- [ ] Add unit tests for protocol and mapping
- [ ] Add animation and face-runtime groundwork

### Future Goal

- build toward a standalone protogen face runtime where the Pi can boot, load a primary project, play animations locally, and react to inputs like buttons or microphone activity

## Active Items

### 1. Add more hardware test patterns

Status:
- [x] add desktop buttons for `border`, `horizontal line`, `vertical line`, `moving dot`, and `panel index test`
- [x] use these patterns during mapping bring-up

Done when:
- the user can trigger each pattern from the desktop app
- the pattern is immediately visible on the matrix chain

### 2. Add undo and redo

Status:
- [ ] keep a bounded history stack in the desktop app
- [ ] push changes after meaningful edits rather than every single hover cell
- [ ] add `Undo` and `Redo` buttons

Done when:
- draw several changes
- undo them in order
- redo them in order

### 3. Add autosave in the browser

Status:
- [ ] save the current drawing to browser local storage
- [ ] restore it on page load if the dimensions match
- [ ] make it clear when autosaved content has been restored

Done when:
- draw something
- refresh the page
- confirm the drawing comes back automatically

### 4. Add named Pi endpoints in the desktop app

Status:
- [ ] save recent endpoints in browser local storage
- [ ] allow the user to pick from or reuse saved addresses

Done when:
- connect to a Pi once
- refresh the page
- confirm the endpoint is still available in the UI

### 5. Add a protocol state message

Status:
- [ ] add request and response messages for `brightness`, `width`, `height`, and `connection status`
- [ ] use that information to keep the desktop UI in sync

Done when:
- connect from the desktop app
- request state
- show the current Pi settings in the UI

### 6. Add display orientation and panel layout controls in the desktop app

Status:
- [ ] add controls in the desktop app for `rotate`, `block_orientation`, and `reverse_order`
- [ ] add a few layout presets for common arrangements
- [ ] send those settings to the Pi over the protocol
- [ ] let the Pi apply those settings without needing a restart
- [ ] add a way to save the current settings on the Pi so they survive reboot
- [ ] optionally write those saved settings back to the Pi config file later

Notes:
- this probably fits naturally with brightness control and the future Pi state message
- layout presets would make first-time setup much less annoying
- Pi-side persistence matters here so the browser does not become the only place the setup lives

Done when:
- change display settings from the browser
- see the matrix update without restarting the server
- use test patterns to confirm the settings are correct

### 7. Add a Pi install script

Status:
- [ ] create a script that creates the virtual environment, installs Python dependencies, copies the config template if needed, and optionally installs the `systemd` service
- [x] add a small Pi update script for pulling changes, refreshing dependencies, and restarting the service

Done when:
- run one command on a fresh Pi clone
- finish with a ready-to-run controller setup

### 8. Add unit tests for protocol and mapping

Status:
- [ ] test frame validation success and failure cases
- [ ] test mapping for common panel layouts
- [ ] test brightness clamping once brightness control is added

Done when:
- test suite runs locally
- expected failures are covered for bad messages and edge coordinates

### 9. Add animation and face-runtime groundwork

Status:
- [ ] add multi-frame editing in the desktop UI
- [ ] add frame timing controls and browser playback preview
- [ ] move from single drawings toward a shared project format with one `width` and `height`
- [ ] support named animations for future face states such as `idle`, `blink`, and `talk`
- [ ] keep early playback available in the desktop app for iteration speed
- [ ] design toward Pi-driven playback as the real long-term runtime

Done when:
- create at least two frames in the editor
- preview them in the browser
- keep the saved format compatible with a future Pi-side project loader

Notes:
- this is for a protogen face, so the final model should be state-oriented and not only a generic animation timeline
- the Pi should eventually load a primary project on boot and run without the browser connected
- the Pi runtime will eventually need a playback engine, project loader, input manager, and state/rule layer
- microphone or button input should be able to trigger animation or state changes later
- desktop-driven playback is a stepping stone, not the final architecture

## Completed Work

### Save and load drawings

Status:
- [x] add `Save` and `Load` actions in the desktop app
- [x] store drawings as JSON files containing `name`, `width`, `height`, and `pixels`
- [x] use browser file download/upload first for a simple implementation
- [x] add a Pi-side save/load path so drawings can live on the Pi itself
- [ ] optionally add local browser storage later for quick autosave

Notes:
- [x] use the existing frame message shape to keep the format simple
- [x] Pi-side storage would be useful for keeping a small library of drawings with the hardware
- [x] reject files whose width and height do not match the current data shape unless the app resizes automatically

### Brightness control

Status:
- [x] add a brightness slider or number input in the desktop app
- [x] add a new protocol message type for brightness
- [x] handle that message on the Pi and call the appropriate `luma` contrast method
- [x] keep the allowed range aligned with MAX7219 expectations

Notes:
- [x] clamp brightness values on the Pi for safety
- [ ] decide whether the brightness setting should persist across reconnects or reboot

### Cleaner Pi shutdown

Status:
- [x] catch `KeyboardInterrupt` around `asyncio.run(...)`
- [x] add signal-aware cleanup for the display
- [x] keep log output short and service-friendly

### Pi autostart on boot

Status:
- [x] add a `systemd` service for `apps/pi-controller/src/server.py`
- [x] make it run after the network is available
- [x] point it at the repo path and virtual environment Python
- [x] configure restart behavior so the service comes back if it crashes
- [x] document the service file and install steps in `docs/setup-pi.md`

## Rough Order

1. Hardware test patterns
2. Autosave
3. Undo and redo
4. Named Pi endpoints
5. Protocol state message
6. Display orientation and layout controls
7. Pi install script
8. Unit tests
9. Animation and face-runtime groundwork
