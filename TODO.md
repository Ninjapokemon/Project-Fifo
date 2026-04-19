# TODO

This is the running list of what would make the project nicer to use and easier to set up.

## At A Glance

### Done

- [x] Save and load drawings in the desktop app using browser JSON files
- [x] Save and load drawings on the Pi over WebSocket
- [x] Change brightness from the desktop app and apply it on the Pi
- [x] Add hardware test patterns
- [x] Add undo and redo
- [x] Add browser autosave
- [x] Add named Pi endpoints in the desktop app
- [x] Refresh the desktop editor layout and visual styling
- [x] Add display orientation and panel layout controls in the desktop app
- [x] Make Pi shutdown cleaner for `Ctrl+C` and service stops
- [x] Start the Pi server automatically on boot with `systemd`
- [x] Extend the protocol state message with runtime-facing fields and clearer persisted-versus-live state
- [x] Add Pi project storage and boot project management

### Next

- [ ] Add a Pi install script
- [ ] Expand unit tests for protocol, mapping, and storage coverage
- [ ] Add animation and face-runtime groundwork
- [ ] Review and reconcile the LED layout branches
- [ ] Decide whether brightness and similar runtime values belong in project data, global Pi config, or both

### Future Goal

- build toward a standalone protogen face runtime where the Pi can boot, load a primary project, play animations locally, and react to inputs like buttons or microphone activity

## Branch Notes

- `main` currently contains LED layout and editor changes that are not reflected on `development`
- `LED-Layout-Tests` currently points at the same tip as `main`
- `origin/led-layout` still exists separately and has not yet been reconciled with the current branch flow
- the accepted LED board arrangement path should be reviewed and simplified before more layout work stacks up

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
- [x] keep a bounded history stack in the desktop app
- [x] push changes after meaningful edits rather than every single hover cell
- [x] add `Undo` and `Redo` buttons

Done when:
- draw several changes
- undo them in order
- redo them in order

### 3. Add autosave in the browser

Status:
- [x] save the current drawing to browser local storage
- [x] restore it on page load if the dimensions match
- [x] make it clear when autosaved content has been restored

Done when:
- draw something
- refresh the page
- confirm the drawing comes back automatically

### 4. Add named Pi endpoints in the desktop app

Status:
- [x] save recent endpoints in browser local storage
- [x] allow the user to pick from or reuse saved addresses

Done when:
- connect to a Pi once
- refresh the page
- confirm the endpoint is still available in the UI

### 5. Add a protocol state message

Status:
- [x] add request and response messages for `brightness`, `width`, `height`, layout data, saved drawing list, and basic `connection_status`
- [x] use that information to keep brightness, layout controls, and Pi drawing lists in sync in the desktop UI
- [x] keep desktop `width` and `height` synced to the connected Pi display while connected
- [x] include fuller runtime-facing fields such as active project, active animation or state, and a clearer persisted-versus-live model
- [x] decide how the Pi reports live temporary state versus reboot-persisted state once projects and runtime playback exist

Done when:
- connect from the desktop app
- request state
- show the current Pi settings and runtime-facing state in the UI

Notes:
- this should grow into runtime state, not stay limited to transport connection details
- once the Pi can run on its own, the desktop app will need to know whether it is controlling a temporary live session or a persisted runtime setup

### 6. Add display orientation and panel layout controls in the desktop app

Status:
- [x] add controls in the desktop app for `rotate`, `block_orientation`, and `reverse_order`
- [x] add a few layout presets for common arrangements
- [x] send those settings to the Pi over the protocol
- [x] let the Pi apply those settings without needing a restart
- [x] add a way to save the current settings on the Pi so they survive reboot
- [x] write those saved settings back to the Pi config file

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

### 8. Add Pi project storage and boot project management

Status:
- [x] define a Pi-side project storage format that is separate from the temporary single-drawing library
- [x] add protocol messages to upload, list, load, delete, and validate projects on the Pi
- [x] add a way to set the default boot project on the Pi
- [x] add a way to ask which project is currently active and which one will load on boot
- [ ] decide whether brightness and other runtime settings belong in project data, global Pi config, or both

Done when:
- upload a face project to the Pi
- select it as the boot project
- reboot the Pi
- confirm the project loads without the browser connected

### 9. Add unit tests for protocol and mapping

Status:
- [ ] test frame validation success and failure cases
- [x] test mapping for common panel layouts
- [x] test drawing storage and board workspace metadata round-tripping
- [x] test project storage and live-runtime handoff basics
- [ ] test brightness clamping once brightness control is added

Done when:
- [x] test suite runs locally
- expected failures are covered for bad messages and edge coordinates

### 10. Add animation and face-runtime groundwork

Status:
- [ ] add multi-frame editing in the desktop UI
- [ ] add frame timing controls and browser playback preview
- [ ] move from single drawings toward a shared project format with one `width` and `height`
- [ ] support named animations for future face states such as `idle`, `blink`, and `talk`
- [ ] keep early playback available in the desktop app for iteration speed
- [ ] design toward Pi-driven playback as the real long-term runtime
- [x] separate temporary live streaming from Pi-owned playback of saved projects

Done when:
- create at least two frames in the editor
- preview them in the browser
- keep the saved format compatible with a future Pi-side project loader

Notes:
- this is for a protogen face, so the final model should be state-oriented and not only a generic animation timeline
- the Pi should eventually load a primary project on boot and run without the browser connected
- the Pi runtime will eventually need a playback engine, project loader, input manager, and state/rule layer
- the current Pi drawing library is useful for bring-up, but it should not become the final deployed runtime format
- microphone or button input should be able to trigger animation or state changes later
- desktop-driven playback is a stepping stone, not the final architecture

### 11. Review and reconcile LED layout branches

Status:
- [ ] compare `LED-Layout-Tests` and `origin/led-layout` against `development`
- [ ] decide whether the draggable `8x8` board arrangement belongs in the main editor, a separate setup mode, or should be dropped
- [ ] merge or cherry-pick the accepted LED layout work into `development`
- [ ] merge the cleaned-up result from `development` to `main` once it is stable

Done when:
- the accepted work lives on `development`
- `main` only receives the LED layout changes after they have been validated

## Completed Work

### Desktop editor refresh

Status:
- [x] reorganize the desktop UI so the grid appears higher on the page
- [x] move endpoint management into the top header card
- [x] switch the editor to a dark theme with a wider full-screen layout
- [x] group secondary tools into nested control sections
- [x] add a preview pixel color picker with saved browser preference
- [x] improve grid readability with clearer spacing and a visible canvas border

Notes:
- [x] preview color changes only affect the browser editor and legend
- [x] frame data sent to the Pi remains binary `0` or `1`

### Save and load drawings

Status:
- [x] add `Save` and `Load` actions in the desktop app
- [x] store drawings as JSON files containing `name`, `width`, `height`, and `pixels`
- [x] use browser file download/upload first for a simple implementation
- [x] add a Pi-side save/load path so drawings can live on the Pi itself

Notes:
- [x] use the existing frame message shape to keep the format simple
- [x] Pi-side storage would be useful for keeping a small library of drawings with the hardware
- [x] treat this as a simple drawing library for iteration, not the final standalone project deployment path
- [x] reject files whose width and height do not match the current data shape unless the app resizes automatically

### Brightness control

Status:
- [x] add a brightness slider or number input in the desktop app
- [x] add a new protocol message type for brightness
- [x] handle that message on the Pi and call the appropriate `luma` contrast method
- [x] keep the allowed range aligned with MAX7219 expectations

Notes:
- [x] clamp brightness values on the Pi for safety
- [ ] decide whether the brightness setting should persist across reconnects, reboot, project load, or all three

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
7. Pi project storage and boot project management
8. Pi install script
9. Unit tests
10. Animation and face-runtime groundwork
11. Review and reconcile LED layout branches
