# OLED Status and Preview

This project drives MAX7219 matrices as the primary face output and can also drive auxiliary I2C OLED displays for status and preview.

## What is implemented

- status OLED pages for runtime/network/system summary
- optional preview OLED output
- configurable preview mode:
  - `preset` (default): uses active project frame/animation data from Pi runtime state
  - `mirror`: uses transformed live frame mirroring
- runtime-aware event fallback mapping (`preview_event_map`) when project-backed preview data is unavailable
- capped update rates (`status_fps`, `preview_fps`) and coalesced state refresh (`oled_coalesce_seconds`)

## Preview behavior contract

When `oled.preview_mode` is `preset`:

1. If runtime has an active project target:
   - active frame target -> OLED shows that frame
   - active animation target -> OLED advances using that animation's step timing (`durationMs`, `loop`) from the saved project data
2. If project-backed data cannot be resolved, OLED falls back to preset animations chosen by `preview_event_map`

This means future animations added to project files are processed the same way automatically when they become the active runtime target.

## Built-in fallback presets

Built-in fallback names:

- `idle`
- `blink`
- `talk`
- `live`

These are used only when project-backed preview selection is unavailable in `preset` mode.

## Typical config keys

Use these fields in `apps/pi-controller/config.json`:

- `oled.enabled`
- `oled.status_enabled`
- `oled.preview_enabled`
- `oled.preview_mode`
- `oled.status_address`
- `oled.preview_address`
- `oled.status_fps`
- `oled.preview_fps`
- `oled.preview_event_map`
- `oled_coalesce_seconds`

## Hardware note

Typical modules are `0.96"` `128x64` I2C OLEDs (commonly `SSD1306`) at `0x3C` or `0x3D`.

Typical Raspberry Pi pin mapping:

- `VCC` -> `3V3` (Pin 1)
- `GND` -> `GND` (Pin 6)
- `SCL` -> `GPIO3` / `SCL1` (Pin 5)
- `SDA` -> `GPIO2` / `SDA1` (Pin 3)

Enable I2C on Pi with `raspi-config` and verify with `i2cdetect -y 1`.
