# FocusForge 🔥

A premium, glassmorphic Pomodoro and task tracker built purely with [Neutralinojs](https://neutralino.js.org/). Designed to be minimal, beautiful, and deeply integrated with the operating system while maintaining a tiny footprint.

FocusForge was built as a sample project for the GSoC 2026 Neutralinojs application to demonstrate deep understanding of the Neutralinojs architecture and native APIs.

![App Screenshot 1 goes here](demo.png)

## ✨ Features

- **3 Timer Modes:** Focus (25m), Short Break (5m), Long Break (15m).
- **Task Management:** Add, complete, and delete current tasks.
- **Smart Notifications:** Native OS notifications pop up when sessions end.
- **System Tray Integration:** Runs silently in the background. Right-click the tray to control sessions or quit.
- **Persistent Storage:** Keeps track of your daily sessions, focus minutes, and tasks across app restarts.
- **Stats Exporter:** One-click copy of your daily stats directly to your clipboard.
- **Custom Frameless Window:** Sleek custom title bar with native draggable regions.

## 📸 Screenshots

*(Add your screenshots here)*

## 🚀 Native API Usage Showcase

FocusForge heavily utilizes the Neutralinojs native API to achieve deep OS integration. Here are the 8+ native APIs used in this project:

| API Function | Where It's Used | What It Does |
|---|---|---|
| `Neutralino.window.setDraggableRegion()` | `main.js` (init) | Registers the custom HTML titlebar as a native OS drag handle |
| `Neutralino.os.setTray()` | `setupTray()` | Creates the system tray icon and context menu |
| `Neutralino.os.showNotification()` | `completeSession()` | Triggers native OS notifications when timers finish |
| `Neutralino.storage.getData()` / `setData()` | `loadState()`, `saveState()` | Persists tasks and session stats locally (JSON storage) |
| `Neutralino.clipboard.writeText()` | `stats logic` | Copies a formatted daily summary to the user's clipboard |
| `Neutralino.window.hide()` / `minimize()` | Window UI / Tray | Hides the app without killing the process (minimizes to tray) |
| `Neutralino.window.show()` | Tray menu | Brings the window back to the foreground |
| `Neutralino.events.on()` | Global listeners | Intercepts system events like `trayMenuItemClicked` and `windowClose` |
| `Neutralino.app.exit()` | Tray (Quit) | Gracefully shuts down the background Neutralino server |

## 🛠️ Building and Running

**Requirements:** [Node.js](https://nodejs.org/) and the `@neutralinojs/neu` CLI installed globally.

```bash
# 1. Install Neutralinojs CLI
npm i -g @neutralinojs/neu

# 2. Clone this repository
git clone https://github.com/RajdeepKushwaha5/FocusForge.git
cd FocusForge

# 3. Update binaries and client
neu update

# 4. Run in development mode
neu run

# 5. Build for production (Generates Windows, macOS, Linux binaries)
neu build --release
```

## 📂 Project Structure

- `neutralino.config.json` - Reconfigured for a borderless, always-on-top window with specific API permissions.
- `resources/index.html` - The UI structure, including the custom titlebar and SVG timer ring.
- `resources/styles.css` - Premium glassmorphic styling, CSS variables, and mode-based theme switching.
- `resources/js/main.js` - Core application logic and Neutralinojs API integrations.

## 📄 License

MIT License. Feel free to use this as a reference for your own Neutralinojs apps!
