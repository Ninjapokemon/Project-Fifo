# Protocol Notes

## Version 1

- Use JSON for simplicity while iterating.
- Send full frames from the desktop app.
- Keep `pixels` as a flat row-major array of `0` and `1`.
- Support `brightness` messages with a `value` clamped to the MAX7219 `0-15` range.
- Support `get_state` -> `state` sync so the desktop can learn the Pi's current brightness, dimensions, layout, and saved drawing list on connect.
- Include runtime-facing state fields such as the active project, boot project, active target, runtime mode, and whether live website control is temporarily overriding the Pi runtime.
- Support Pi drawing library messages for saving, listing, and loading stored drawings.
- Support Pi project messages for saving, listing, loading back to the editor, activating, deleting, resuming, and choosing a boot project.
- Support channel runtime control messages (`play_channel`, `stop_channel`, `set_channel_animation`, `set_channel_frame`, `clear_channel`) for active projects.
- Treat live frame streaming as temporary control layered on top of the Pi project runtime instead of the only output mode.
- See `save-project-message.example.json` for a minimal bootable project payload.
- Project payloads can include optional `channels`, optional `channelDefaults`, and optional animation `channelId` values.
- Legacy projects without channel fields should be normalized to a default `base` channel during validation/loading.

## Future Improvements

- bit-packed payloads
- delta updates
- richer animation commands beyond project activation
- device health and acknowledgement messages
- layered channel project schema (for example `base`, `eyes`, `mouth`)
- runtime state fields for active channels and per-channel targets
- backward-compatible project migration rules (legacy projects load as a single `base` channel)
