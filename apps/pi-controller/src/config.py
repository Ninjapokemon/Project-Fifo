from __future__ import annotations

import json
from pathlib import Path
from typing import Any


DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent.parent / "config.json"
EXAMPLE_CONFIG_PATH = Path(__file__).resolve().parent.parent / "config.example.json"


def load_config(path: Path = DEFAULT_CONFIG_PATH) -> dict[str, Any]:
    config_path = path if path.exists() else EXAMPLE_CONFIG_PATH
    with config_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_config(config: dict[str, Any], path: Path = DEFAULT_CONFIG_PATH) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(config, handle, indent=2)
        handle.write("\n")
    return path
