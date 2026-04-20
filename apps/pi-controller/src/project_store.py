from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


DEFAULT_PROJECTS_DIR = Path(__file__).resolve().parent.parent / "data" / "projects"


def sanitize_project_name(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9_-]+", "-", value.strip()).strip("-")
    return normalized or "fifo-project"


class ProjectStore:
    def __init__(self, projects_dir: Path = DEFAULT_PROJECTS_DIR):
        self.projects_dir = projects_dir
        self.projects_dir.mkdir(parents=True, exist_ok=True)

    def project_path(self, name: str) -> Path:
        safe_name = sanitize_project_name(name)
        return self.projects_dir / f"{safe_name}.json"

    def save(self, project: dict[str, Any]) -> str:
        safe_name = sanitize_project_name(str(project["name"]))
        payload = {
            "name": safe_name,
            "width": project["width"],
            "height": project["height"],
            "frames": project["frames"],
            "animations": project.get("animations", []),
            "defaultFrameId": project.get("defaultFrameId"),
            "defaultAnimationId": project.get("defaultAnimationId"),
            "channels": project.get("channels"),
            "channelDefaults": project.get("channelDefaults"),
        }
        if "boardLayout" in project:
            payload["boardLayout"] = project["boardLayout"]
        if "boardGroups" in project:
            payload["boardGroups"] = project["boardGroups"]

        path = self.project_path(safe_name)
        with path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)
            handle.write("\n")
        return safe_name

    def load(self, name: str) -> dict[str, Any]:
        safe_name = sanitize_project_name(name)
        path = self.project_path(safe_name)
        if not path.exists():
            raise FileNotFoundError(f'Project "{safe_name}" was not found on the Pi')

        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def delete(self, name: str) -> str:
        safe_name = sanitize_project_name(name)
        path = self.project_path(safe_name)
        if not path.exists():
            raise FileNotFoundError(f'Project "{safe_name}" was not found on the Pi')
        path.unlink()
        return safe_name

    def list_names(self) -> list[str]:
        return [path.stem for path in sorted(self.projects_dir.glob("*.json"))]
