# Protocol Notes

## Version 1

- Use JSON for simplicity while iterating.
- Send full frames from the desktop app.
- Keep `pixels` as a flat row-major array of `0` and `1`.

## Future Improvements

- bit-packed payloads
- delta updates
- brightness and animation commands
- device health and acknowledgement messages
