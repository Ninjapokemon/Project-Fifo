# Layered Runtime Phase A Checklist

This document turns the layered channel plan into a concrete Phase A implementation target.

Phase A scope is intentionally limited:

- define and validate backward-compatible channel metadata in project payloads
- add migration behavior for legacy projects without channels
- keep runtime behavior unchanged (single active target is still acceptable in this phase)
- add shared docs/examples so Phase B (runtime compositor) can start cleanly

## Goals

- Preserve existing project files and workflows.
- Add explicit schema for future `base`/`eyes`/`mouth` channel runtime.
- Avoid introducing partial runtime behavior before compositor code exists.

## Out Of Scope (Phase A)

- no channel playback engine yet
- no compositor loop yet
- no new websocket control messages yet
- no desktop channel UI yet

## Target Data Model

Add these optional fields at project top-level:

- `channels`: array of channel definitions
- `channelDefaults`: object keyed by channel id for startup behavior (optional in Phase A; validated only)

Add this optional field per animation:

- `channelId`: channel target id for that animation

### Channel Definition Shape

```json
{
  "id": "eyes",
  "name": "Eyes",
  "priority": 200,
  "blendMode": "overwrite",
  "mask": null
}
```

Rules:

- `id`: non-empty string, unique within `channels`
- `name`: optional display label, defaults to `id`
- `priority`: integer, defaults to `100` if omitted
- `blendMode`: only `"overwrite"` for now
- `mask`: `null` for now (reserved for Phase B+)

### Animation Channel Target

```json
{
  "id": "blink-fast",
  "name": "Blink Fast",
  "loop": false,
  "channelId": "eyes",
  "steps": [
    { "frameId": "eye-open", "durationMs": 90 },
    { "frameId": "eye-closed", "durationMs": 80 },
    { "frameId": "eye-open", "durationMs": 90 }
  ]
}
```

Rules:

- if `channelId` is present, it must reference a known channel
- if `channelId` is missing, migration should assign `"base"` during normalization

## Migration Rules

Legacy project (no channels):

- inject default channel:
  - `id`: `"base"`
  - `name`: `"Base"`
  - `priority`: `100`
  - `blendMode`: `"overwrite"`
  - `mask`: `null`
- assign `channelId: "base"` to every animation lacking `channelId`
- leave `frames`, `defaultFrameId`, `defaultAnimationId` behavior unchanged

Project with channels but missing base:

- accept as valid if references are consistent
- do not auto-insert `base` unless needed for compatibility fallback

## File-Level Implementation Checklist

## 1) Pi Protocol Validation

File: `apps/pi-controller/src/protocol.py`

- Add constants:
  - `ALLOWED_CHANNEL_BLEND_MODES = {"overwrite"}`
- Add helper validators:
  - `_normalize_project_channels(channels: Any) -> list[dict[str, Any]]`
  - `_normalize_channel_defaults(channel_defaults: Any, channel_ids: set[str]) -> dict[str, Any] | None`
- Extend `validate_project_payload(...)`:
  - parse and normalize `channels`
  - parse and normalize `channelDefaults` if present
  - parse `animation.channelId` and validate reference
  - apply legacy migration defaults (`base` + animation `channelId`)
- Ensure returned normalized payload always includes:
  - `channels`
  - `channelDefaults` (either object or `null`)
  - normalized animation `channelId` values

Definition of done:

- old project files still validate
- new channel-aware project files validate
- invalid `channelId` references fail with clear error text

## 2) Desktop Type Sketch

File: `apps/desktop/src/types.ts`

- Add types:
  - `ProjectChannel`
  - `ProjectChannelDefaults` (can be broad for now)
- Extend `ProjectAnimation` with optional `channelId: string | null`
- Extend `SavedProject` with:
  - `channels?: ProjectChannel[]`
  - `channelDefaults?: Record<string, unknown> | null`

Definition of done:

- type sketch reflects Phase A schema without breaking existing references

## 3) Desktop Load/Save Normalization

File: `apps/desktop/src/main.js`

Touchpoints to update:

- project import normalization path (currently around `normalizeProjectPayload(...)`)
- project export snapshot path (currently around `buildProjectFromState(...)`)

Required behavior:

- while loading:
  - if `channels` missing, inject default `base`
  - if animation missing `channelId`, assign `"base"`
  - preserve known channel metadata fields
- while saving:
  - always write normalized `channels`
  - always write normalized animation `channelId`
  - write `channelDefaults` as `null` if unused

Definition of done:

- loading old JSON then saving writes upgraded shape
- current editor behavior remains unchanged

## 4) Shared Protocol Examples

Files:

- `packages/shared/protocol/save-project-message.example.json`
- `packages/shared/protocol/notes.md`

Tasks:

- update example JSON to include `channels` and animation `channelId`
- include one legacy-compatibility note with expected migration behavior

Definition of done:

- examples match validator behavior exactly

## 5) Runtime Storage Compatibility

Files:

- `apps/pi-controller/src/project_store.py`
- `apps/pi-controller/src/runtime.py` (read path only in Phase A)

Tasks:

- confirm stored project payload writes/reads preserve new fields
- no behavior change required in playback yet

Definition of done:

- saving/loading projects round-trips channel fields unchanged

## Suggested Error Messages

Use explicit protocol errors for easier debugging:

- `project channels must be a list or null`
- `project channel id must be a non-empty string`
- `project channel ids must be unique`
- `project channel blendMode must be overwrite`
- `project animation channelId must reference a known channel`

## Acceptance Tests (Phase A)

1. Load old project JSON with no channels.
2. Save it from desktop.
3. Confirm saved JSON includes `channels` and `animation.channelId`.
4. Upload to Pi via `save_project`.
5. Request project back via `get_project`.
6. Confirm fields are preserved and normalized.
7. Activate project and confirm playback still works as before.

## Deliverables Checklist

- [ ] protocol validation updated (`protocol.py`)
- [ ] desktop type sketch updated (`types.ts`)
- [ ] desktop project normalize/save upgraded (`main.js`)
- [ ] shared protocol example updated
- [ ] migration behavior documented and verified
- [ ] no regressions in existing project activation flow
