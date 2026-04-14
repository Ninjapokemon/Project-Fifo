# Wiring Notes

This project assumes MAX7219 LED matrices connected to a Raspberry Pi and driven through `luma.led_matrix`.

Typical SPI wiring:

- `VCC` -> `5V` (Pin 2 or 4)
- `GND` -> `GND` (Pin 6)
- `DIN` -> `MOSI` (Pin 19)
- `CS` -> `CE0` (Pin 24)
- `CLK` -> `SCLK` (Pin 23)

## Reminder

Actual pin labels vary by breakout board. Confirm your module's labeling and power requirements before powering the chain.

## Software Expectation

The Pi controller defaults to a cascaded MAX7219 setup and expects the matrix count from `config.json`.
