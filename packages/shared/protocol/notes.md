# Protocol Notes

## Version 1

- Use JSON for simplicity while iterating.
- Send full frames from the desktop app.
- Keep `pixels` as a flat row-major array of `0` and `1`.
- Support `brightness` messages with a `value` clamped to the MAX7219 `0-15` range.
- Support Pi drawing library messages for saving, listing, and loading stored drawings.

## Future Improvements

- bit-packed payloads
- delta updates
- animation commands
- device health and acknowledgement messages
