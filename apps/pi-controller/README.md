# Pi Controller

This app runs on the Raspberry Pi and drives chained MAX7219 matrices through `luma.led_matrix`.

## Responsibilities

- accept frame messages from the desktop app
- validate payload shape
- map logical pixels to the physical panel arrangement
- render frames to the hardware device

## Main Files

- `src/server.py`: entry point and message loop
- `src/protocol.py`: message validation helpers
- `src/display.py`: `luma` device wrapper
- `src/mapping.py`: logical-to-physical coordinate translation
- `config.example.json`: template for local hardware settings

## Dependencies

This project uses:

- `luma.led_matrix`
- `luma.core`
- `websockets`

You can add systemd service wiring later after the basic loop is working.
