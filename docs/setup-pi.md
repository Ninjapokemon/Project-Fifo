# Raspberry Pi Setup

## What the Pi runs

The Pi runs a small Python WebSocket server from `apps/pi-controller/src/server.py`. That server receives frames from the browser app and renders them through `luma.led_matrix`.

## 1. Enable SPI on the Pi

On Raspberry Pi OS, enable SPI before starting the project:

```bash
sudo raspi-config
```

Then:

1. Go to `Interface Options`
2. Enable `SPI`
3. Reboot if prompted

## 2. Clone or copy this repo onto the Pi

Put the repo somewhere convenient. Home directory is fine:

```bash
cd ~
git clone <your-repo-url> Project-Fifo
cd Project-Fifo
```

## 3. Create a virtual environment and install dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/pi-controller/requirements.txt
```

## 4. Copy the config template

```bash
cp apps/pi-controller/config.example.json apps/pi-controller/config.json
```

## 5. Edit the Pi config

Open `apps/pi-controller/config.json` and set it to match your hardware.

The main fields to care about are:

- `host`: usually `0.0.0.0` so the desktop app can connect over the network
- `port`: default is `8765`
- `matrices_wide`: number of `8x8` modules across
- `matrices_high`: number of `8x8` modules down
- `rotate`: display rotation passed to `luma`
- `brightness`: rough brightness level from `0` to `15`
- `block_orientation`: panel orientation used by `luma`
- `reverse_order`: whether the matrix chain order is reversed
- `serpentine`: reserved for later custom mapping logic

Example for four matrices in one horizontal row:

```json
{
  "host": "0.0.0.0",
  "port": 8765,
  "matrices_wide": 4,
  "matrices_high": 1,
  "rotate": 0,
  "brightness": 3,
  "block_orientation": 90,
  "reverse_order": false,
  "serpentine": false
}
```

## 6. Run the server

```bash
python3 apps/pi-controller/src/server.py
```

If it starts correctly, you should see a message like:

```text
Listening on ws://0.0.0.0:8765
```

Stopping with `Ctrl+C` should now exit cleanly, clear the display, and avoid the old traceback noise.

## 7. Install the autostart service

A `systemd` service template lives at `apps/pi-controller/project-fifo.service`, and there is a helper installer script at `scripts/install-pi-service.sh`.

From the repo root on the Pi:

```bash
chmod +x scripts/install-pi-service.sh
sudo ./scripts/install-pi-service.sh
```

What the installer does:

1. rewrites the service file to use the current repo path
2. points `ExecStart` at the repo virtual environment Python
3. installs it to `/etc/systemd/system/project-fifo.service`
4. runs `systemctl daemon-reload`
5. enables the service at boot and starts it immediately

Useful commands afterward:

```bash
sudo systemctl status project-fifo.service
sudo systemctl restart project-fifo.service
sudo journalctl -u project-fifo.service -n 50 --no-pager
```

Done check for autostart:

- reboot the Pi
- wait for startup to finish
- run `sudo systemctl status project-fifo.service`
- confirm the server is already listening on port `8765`
- connect from the desktop app without manually launching Python

If your repo path or username differs from the defaults in the template, that is fine. The installer script rewrites those values automatically.

## 8. Find the Pi's address

To connect from your PC, you need the Pi hostname or IP address.

Try:

```bash
hostname -I
```

If your network resolves mDNS, you can often use:

```text
ws://raspberrypi.local:8765
```

Otherwise use the IP from `hostname -I`, for example:

```text
ws://192.168.1.50:8765
```

## 9. Test from the desktop app

Start the browser editor on your PC, connect to the Pi endpoint, and try:

- `Fill` to confirm every pixel turns on
- `Clear` to confirm every pixel turns off
- `Checker` to spot rotation or ordering issues quickly

## If the display is wrong

There are two main places to adjust things:

1. `apps/pi-controller/config.json`
2. `apps/pi-controller/src/mapping.py`

Start with `rotate`, `block_orientation`, and `reverse_order`. If the image is still scrambled after that, `mapping.py` is where the custom fixes belong.

## Common Issues And Fixes

### Error: `ModuleNotFoundError: No module named 'spidev'`

What it means:
The Python SPI binding is not installed in the virtual environment.

Fix:

```bash
source .venv/bin/activate
pip install -r apps/pi-controller/requirements.txt
```

If needed:

```bash
sudo apt update
sudo apt install -y python3-dev build-essential
pip install spidev
```

### Drawing starts on the wrong physical module

What it usually means:
The panel chain order is reversed compared with the logical grid.

Fix in `apps/pi-controller/config.json`:

```json
"reverse_order": true
```

### The image is rotated even though the connection works

What it usually means:
The panel orientation is wrong, but the network path itself is fine.

Fix in `apps/pi-controller/config.json`:

- try `block_orientation: -90` instead of `90`
- if the whole display is turned, also try changing `rotate`

### The desktop app connects, but the LEDs stay dark

The usual causes are:

- SPI is not enabled on the Pi
- wiring for `DIN`, `CS`, or `CLK` is wrong
- `matrices_wide` and `matrices_high` do not match the real hardware

Fix:

- enable SPI with `sudo raspi-config`
- re-check the MAX7219 wiring
- verify the desktop grid size matches the Pi config

### The service does not start on boot

What it usually means:
The service path, virtual environment path, or user does not match the real Pi setup.

Fix:

```bash
sudo systemctl status project-fifo.service
sudo journalctl -u project-fifo.service -n 100 --no-pager
```

If the paths are wrong, rerun:

```bash
sudo ./scripts/install-pi-service.sh
```
