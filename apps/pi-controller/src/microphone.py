from __future__ import annotations

import time
from typing import Any

try:
    from smbus2 import SMBus
except ImportError:  # pragma: no cover - depends on target Pi environment
    SMBus = None  # type: ignore[assignment]


class Ads1115MicrophoneMonitor:
    ADC_CONVERSION_REGISTER = 0x00
    ADC_CONFIG_REGISTER = 0x01

    def __init__(self, config: dict[str, Any]):
        mic_config = config.get("microphone")
        if not isinstance(mic_config, dict):
            mic_config = {}

        self.enabled = bool(mic_config.get("enabled", False))
        self.test_mode = bool(mic_config.get("test_mode", False))
        self.bus_id = int(mic_config.get("i2c_bus", 1))
        self.address = int(mic_config.get("address", 0x48))
        self.channel = int(mic_config.get("channel", 0))
        self.sample_hz = max(1.0, float(mic_config.get("sample_hz", 20.0)))
        try:
            level_scale_mv = float(mic_config.get("level_scale_mv", 600.0))
        except (TypeError, ValueError):
            level_scale_mv = 600.0
        self.level_scale_mv = max(1.0, level_scale_mv)
        try:
            noise_floor_mv = float(mic_config.get("noise_floor_mv", 0.0))
        except (TypeError, ValueError):
            noise_floor_mv = 0.0
        self.noise_floor_mv = max(0.0, noise_floor_mv)
        self.sample_interval = 1.0 / self.sample_hz
        self._last_state: dict[str, Any] = {
            "enabled": self.enabled,
            "test_mode": self.test_mode,
            "available": False,
            "message": "disabled" if not self.enabled else "not initialized",
            "raw": 0,
            "millivolts": 0,
            "dc_bias_mv": 0,
            "level_percent": 0,
            "peak_percent": 0,
        }
        self._bus: SMBus | None = None
        self._bias_mv: float | None = None
        self._level_ema_mv = 0.0
        self._peak_hold = 0.0

        if not self.enabled:
            return
        if SMBus is None:
            self._last_state["message"] = "missing smbus2"
            return
        if self.channel not in (0, 1, 2, 3):
            self._last_state["message"] = "invalid adc channel"
            self.enabled = False
            return
        try:
            self._bus = SMBus(self.bus_id)
            self._last_state["available"] = True
            self._last_state["message"] = "ok"
        except OSError as error:
            self._last_state["message"] = f"i2c open failed: {error}"

    def close(self) -> None:
        if self._bus is None:
            return
        self._bus.close()
        self._bus = None

    def _build_config_word(self) -> int:
        mux_bits = {
            0: 0x4000,  # AIN0 vs GND
            1: 0x5000,  # AIN1 vs GND
            2: 0x6000,  # AIN2 vs GND
            3: 0x7000,  # AIN3 vs GND
        }[self.channel]
        return (
            0x8000  # start single-shot conversion
            | mux_bits
            | 0x0200  # PGA +/-4.096V
            | 0x0100  # single-shot mode
            | 0x00A0  # 250 samples/sec
            | 0x0003  # disable comparator
        )

    def _read_ads1115_raw(self) -> int:
        if self._bus is None:
            raise RuntimeError("i2c bus unavailable")
        config_word = self._build_config_word()
        self._bus.write_i2c_block_data(
            self.address,
            self.ADC_CONFIG_REGISTER,
            [(config_word >> 8) & 0xFF, config_word & 0xFF],
        )
        time.sleep(0.006)
        raw_bytes = self._bus.read_i2c_block_data(self.address, self.ADC_CONVERSION_REGISTER, 2)
        raw_value = (raw_bytes[0] << 8) | raw_bytes[1]
        if raw_value >= 0x8000:
            raw_value -= 0x10000
        return raw_value

    def _raw_to_millivolts(self, raw_value: int) -> float:
        return (raw_value * 4096.0) / 32768.0

    def _build_level(self, millivolts: float) -> tuple[int, int, int]:
        if self._bias_mv is None:
            self._bias_mv = millivolts
        else:
            self._bias_mv = (self._bias_mv * 0.98) + (millivolts * 0.02)

        centered_mv = abs(millivolts - self._bias_mv)
        if self.noise_floor_mv > 0.0:
            centered_mv = max(0.0, centered_mv - self.noise_floor_mv)
        self._level_ema_mv = (self._level_ema_mv * 0.8) + (centered_mv * 0.2)
        self._peak_hold = max(self._peak_hold * 0.92, centered_mv)

        # Scale for voice-like levels from MAX9814 output.
        scale_mv = self.level_scale_mv
        level_percent = max(0, min(100, int((self._level_ema_mv / scale_mv) * 100)))
        peak_percent = max(0, min(100, int((self._peak_hold / scale_mv) * 100)))
        bias_mv = int(round(self._bias_mv))
        return level_percent, peak_percent, bias_mv

    def get_last_state(self) -> dict[str, Any]:
        return dict(self._last_state)

    def sample_state(self) -> dict[str, Any]:
        if not self.enabled:
            return self.get_last_state()
        if self._bus is None:
            return self.get_last_state()

        try:
            raw_value = self._read_ads1115_raw()
            millivolts = self._raw_to_millivolts(raw_value)
            level_percent, peak_percent, bias_mv = self._build_level(millivolts)
            self._last_state = {
                "enabled": True,
                "test_mode": self.test_mode,
                "available": True,
                "message": "ok",
                "raw": raw_value,
                "millivolts": int(round(millivolts)),
                "dc_bias_mv": bias_mv,
                "level_percent": level_percent,
                "peak_percent": peak_percent,
            }
            return dict(self._last_state)
        except (OSError, RuntimeError, ValueError) as error:
            self._last_state = {
                **self._last_state,
                "available": False,
                "message": str(error),
            }
            return dict(self._last_state)
