# Wiring Notes

This project assumes MAX7219 LED matrices connected to a Raspberry Pi and driven through `luma.led_matrix`.

Typical SPI wiring:

- `VCC` -> `5V` (Pin 2 or 4)
- `GND` -> `GND` (Pin 6)
- `DIN` -> `MOSI` (Pin 19)
- `CS` -> `CE0` (Pin 24)
- `CLK` -> `SCLK` (Pin 23)

## Optional I2C OLED Status Display

Typical `0.96"` `128x64` I2C OLED wiring on a Raspberry Pi:

- `VCC` -> `3V3` (Pin 1)
- `GND` -> `GND` (Pin 6)
- `SCL` -> `SCL1` / `GPIO3` (Pin 5)
- `SDA` -> `SDA1` / `GPIO2` (Pin 3)

Common I2C addresses are `0x3C` and `0x3D`.

## Reminder

Actual pin labels vary by breakout board. Confirm your module's labeling and power requirements before powering the chain.
Many generic OLED modules are `SSD1306`, but some are `SH1106`, so confirm the controller and I2C address before writing code against it.

## Software Expectation

The Pi controller defaults to a cascaded MAX7219 setup and expects the matrix count from `config.json`.
The planned OLED add-on is intended as an auxiliary text or status display, not a replacement for the MAX7219 render path. See [docs/oled-status-display.md](oled-status-display.md) for the current plan.
