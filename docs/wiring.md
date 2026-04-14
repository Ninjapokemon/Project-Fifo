# Wiring Notes

This project assumes MAX7219 LED matrices connected to a Raspberry Pi and driven through `luma.led_matrix`.

Typical SPI wiring:

- `VCC` -> `5V`
- `GND` -> `GND`
- `DIN` -> `MOSI`
- `CS` -> `CE0`
- `CLK` -> `SCLK`

## Reminder

Actual pin labels vary by breakout board. Confirm your module's labeling and power requirements before powering the chain.

## Software Expectation

The Pi controller defaults to a cascaded MAX7219 setup and expects the matrix count from `config.json`.
