from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


DEFAULT_DRAWINGS_DIR = Path(__file__).resolve().parent.parent / "data" / "drawings"


def sanitize_drawing_name(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9_-]+", "-", value.strip()).strip("-")
    return normalized or "fifo-drawing"


class DrawingStore:
    def __init__(self, drawings_dir: Path = DEFAULT_DRAWINGS_DIR):
        self.drawings_dir = drawings_dir
        self.drawings_dir.mkdir(parents=True, exist_ok=True)

    def drawing_path(self, name: str) -> Path:
        safe_name = sanitize_drawing_name(name)
        return self.drawings_dir / f"{safe_name}.json"

    def save(self, drawing: dict[str, Any]) -> str:
        safe_name = sanitize_drawing_name(str(drawing["name"]))
        payload = {
            "name": safe_name,
            "width": drawing["width"],
            "height": drawing["height"],
            "pixels": drawing["pixels"],
        }
        if "boardLayout" in drawing:
            payload["boardLayout"] = drawing["boardLayout"]
        if "boardGroups" in drawing:
            payload["boardGroups"] = drawing["boardGroups"]
        path = self.drawing_path(safe_name)
        with path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)
            handle.write("\n")
        return safe_name

    def load(self, name: str) -> dict[str, Any]:
        safe_name = sanitize_drawing_name(name)
        path = self.drawing_path(safe_name)
        if not path.exists():
            raise FileNotFoundError(f'Drawing "{safe_name}" was not found on the Pi')

        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def list_names(self) -> list[str]:
        return [path.stem for path in sorted(self.drawings_dir.glob("*.json"))]
