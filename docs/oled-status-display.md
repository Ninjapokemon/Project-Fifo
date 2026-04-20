# OLED Status Display Plan

This project currently drives MAX7219 LED matrices as the primary face output. The small `0.96"` `128x64` I2C OLED modules are a good fit as a secondary status screen for setup and runtime information that is hard to show on the matrix face itself.

## Why it fits

An auxiliary OLED is useful for information such as:

- Pi network address for connecting the desktop app
- WebSocket port and whether the service is up
- whether the runtime is in `idle`, `live`, or `project` mode
- active project and boot project names
- active animation or frame target
- brightness and display size
- startup or error messages during bring-up

That keeps the matrix chain focused on the actual face output while the OLED handles text and diagnostics.

## Typical hardware assumptions

Most of these modules expose four pins:

- `VCC`
- `GND`
- `SCL`
- `SDA`

Typical Raspberry Pi wiring:

- `VCC` -> `3V3` (Pin 1)
- `GND` -> `GND` (Pin 6)
- `SCL` -> `GPIO3` / `SCL1` (Pin 5)
- `SDA` -> `GPIO2` / `SDA1` (Pin 3)

Common I2C addresses are `0x3C` and `0x3D`.

## Pi prep

The project does not use the OLED yet, but the Raspberry Pi side will eventually need I2C enabled.

Typical prep steps on Raspberry Pi OS:

1. run `sudo raspi-config`
2. open `Interface Options`
3. enable `I2C`
4. reboot if prompted

If you want to confirm the module is visible on the bus before coding, install `i2c-tools` and scan bus `1`:

```bash
sudo apt install -y i2c-tools
i2cdetect -y 1
```

That should usually show the module at `0x3C` or `0x3D`.

## Important module note

Many generic `128x64` `0.96"` I2C OLEDs are `SSD1306`, but some are `SH1106`. The software path should start with `SSD1306` because it is the most common target, while keeping the implementation flexible enough to swap to `SH1106` if the real module needs it.

## Suggested software direction

1. Keep the MAX7219 matrix output as the main render target.
2. Add an optional auxiliary OLED status display on the Pi side.
3. Store OLED-specific config separately from the matrix layout config.
4. Update the OLED only when runtime state changes instead of every matrix frame.
5. Start with plain text screens before worrying about icons or animation.

## Good first-pass OLED screens

Because `128x64` is small, the first version should probably rotate between a few short screens instead of trying to fit everything at once.

Suggested screen set:

1. Boot or network screen
   `Project Fifo`
   Pi IP or hostname
   `ws://<address>:8765`
2. Runtime screen
   mode
   active project
   active target
3. Hardware screen
   matrix size
   brightness
   connection state

## What the current code already exposes

The existing Pi runtime already tracks several fields that map nicely to an OLED:

- `runtime_mode`
- `live_override_active`
- `active_project`
- `boot_project`
- `active_target_type`
- `active_target_name`
- matrix `width` and `height`
- `brightness`

That means the OLED work can build on real runtime state instead of scraping logs.

## Likely implementation shape

A clean way to add this later would be:

1. leave `MatrixDisplay` focused on the MAX7219 output
2. add a separate OLED status-display helper or interface
3. have the Pi server or runtime publish state updates to that helper at key events
4. keep OLED failures non-fatal so face rendering still works if the small screen is disconnected

## Open questions for the implementation pass

- exact controller on the real module: `SSD1306` or `SH1106`
- whether the OLED should show a single static summary or cycle between pages
- how aggressively project names should scroll or truncate
- whether the OLED should show the Pi's current LAN IP, hostname, or both
- whether temporary error messages should replace the normal status screen or appear as a timed overlay
