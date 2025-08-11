# 🎵 Terminal Radio Player

A simple, fast terminal-based radio player built with TypeScript. Stream thousands of radio stations directly in your terminal!

<img width="446" height="159" alt="Screenshot 2025-08-11 at 11 16 43 PM" src="https://github.com/user-attachments/assets/9277eb3b-9bb2-4785-a0fc-87f9ee68ff5a" />

## Features

- 🎧 **Popular Stations**: Pre-loaded with popular stations (BBC, Jazz24, Lofi Hip Hop, etc.)
- 🔍 **Search**: Find stations by name, genre, or country using Radio Browser API
- 📻 **Custom URLs**: Play any stream URL directly
- 🎮 **Simple Controls**: Easy-to-use terminal interface
- 🌍 **Worldwide**: Access thousands of stations globally

## Quick Start

### Prerequisites
You need either `mpv` or `vlc` installed for audio playback:

**macOS:**
```bash
brew install mpv
# or
brew install vlc
```

**Linux:**
```bash
sudo apt install mpv
# or
sudo apt install vlc
```

### Installation & Usage

**Option 1: Install from npm (Recommended)**
```bash
npm install -g terminal-radio
terminal-radio
```

**Option 2: Development/Local Installation**

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Run the radio player:**
   ```bash
   npm run dev
   # or for production build:
   npm run radio
   ```

3. **Use the interface:**
   - Choose from popular stations
   - Search for stations online
   - Enter custom stream URLs
   - Stop/start playback
   - Exit when done

## Controls

- **Navigation**: Use arrow keys to navigate menus
- **Select**: Press Enter to select options
- **Stop**: Choose "Stop Current Station" from menu or Ctrl+C to exit
- **Volume**: Controlled by your system volume

## Popular Stations Included

- BBC Radio 1 (Pop/Rock)
- Jazz24 (Jazz)
- Lofi Hip Hop Radio (Lofi)
- Classic FM (Classical)
- Radio Paradise (Eclectic)
- SomaFM - Groove Salad (Ambient)
- NPR News (News)

## Technical Details

- Built with TypeScript and Node.js
- Uses Radio Browser API for station discovery
- Audio playback via mpv or VLC
- Terminal UI with inquirer and chalk
- No complex audio processing - just simple streaming

## Troubleshooting

**"mpv/vlc not found" error:**
- Install mpv: `brew install mpv` (macOS) or `sudo apt install mpv` (Linux)
- Or install VLC as alternative

**Stream won't play:**
- Some stations may be geo-restricted
- Try a different station or search for alternatives
- Check your internet connection

**Search not working:**
- The Radio Browser API might be temporarily unavailable
- Use popular stations or custom URLs as alternatives

## License

MIT License - feel free to modify and distribute!
# terminal-radio
