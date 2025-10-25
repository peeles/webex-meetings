# Webex Vue App

A production-ready Vue 3 application integrating Cisco Webex SDK 3.9.0 with advanced multistream video support. Built with modern web technologies for real-time video conferencing.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Architecture](#architecture)
- [Testing](#testing)
- [Build & Deploy](#build--deploy)
- [Troubleshooting](#troubleshooting)

## Features

### Core Functionality
- **Authentication** - Secure token-based authentication with 12-hour validity
- **Meeting Management** - Create, join, and leave meetings with full lifecycle control
- **Multistream Video** - High-quality video layouts with up to 9 simultaneous streams
- **Audio/Video Controls** - Toggle camera, microphone, and speaker settings
- **Device Selection** - Switch between multiple cameras, microphones, and speakers
- **Participant Management** - Real-time roster with participant status tracking
- **Moderator Controls** - Mute participants, remove from meeting, and manage lobby
- **Real-time Events** - Live updates for participants, media, and meeting state changes
- **Responsive UI** - Mobile-first design with Tailwind CSS 4

### Video Layouts
- **AllEqual** - 3x3 grid layout (9 panes) for balanced viewing
- **OnePlusFive** - Active speaker + 5 thumbnails
- **Single** - Full-screen active speaker view

## Tech Stack

- **Vue 3** - Progressive JavaScript framework with Composition API
- **Vite** - Next-generation frontend build tool
- **Pinia** - Intuitive state management for Vue
- **Vue Router** - Official router with navigation guards
- **Tailwind CSS 4** - Utility-first CSS framework
- **Webex SDK 3.9.0** - Official Cisco Webex JavaScript SDK
- **Vitest** - Fast unit testing framework with jsdom
- **ESLint** - Code quality and consistency

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Webex developer access token (get from [developer.webex.com](https://developer.webex.com))
- Webex SDK 3.9.0 JavaScript file

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd webexMeetings
```

2. **Install dependencies**
```bash
npm install
```

3. **Add Webex SDK**
   - Download Webex SDK 3.9.0 (`webex.min.js`)
   - Place it in `/public/webex.min.js`

4. **Configure environment** (optional)
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Start development server**
```bash
npm run dev
```

The application will open at `http://localhost:3000`

### Quick Start Guide

1. Open the application in your browser
2. Paste your Webex access token
3. Click "Initialise Webex"
4. Enter a meeting destination (SIP address or meeting link)
5. Select "Create Meeting"
6. Allow camera/microphone permissions
7. Click "Join Meeting"

## Development

### Available Commands

```bash
# Development server (port 3000)
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
src/
├── components/          # Vue components
│   ├── base/           # Reusable base components (buttons, inputs)
│   ├── layouts/        # Layout components (HomeLayout, MeetingLayout)
│   └── video/          # Video-specific components (VideoLayout, VideoPane)
├── composables/        # Composition API business logic
│   ├── useWebex.js           # Core SDK singleton
│   ├── useWebexAuth.js       # Authentication
│   ├── useWebexMeetings.js   # Meeting lifecycle
│   ├── useWebexMedia.js      # Local media streams
│   └── useWebexMultistream.js # Video layouts
├── storage/            # Pinia stores (state management)
│   ├── auth.js              # Auth tokens and registration
│   ├── meetings.js          # Meeting objects and metadata
│   ├── media.js             # Media streams and devices
│   └── participants.js      # Participant roster
├── views/              # Route pages
│   ├── HomeScreen.vue       # Authentication and meeting creation
│   └── MeetingScreen.vue    # Active meeting interface
├── dicts/              # Constants and configuration
└── router/             # Vue Router configuration
```

## Architecture

### Singleton Pattern
The application uses a **singleton pattern** for the Webex SDK instance to prevent multiple initialisations. The `useWebex.js` composable manages a single global instance shared across all components.

### Data Flow

1. **Authentication** - `useWebexAuth()` initialises the SDK and registers with Webex
2. **Meeting Creation** - `useWebexMeetings()` creates meeting objects with event listeners
3. **Media Setup** - `useWebexMedia()` obtains local camera/microphone streams
4. **Join Meeting** - Multistream enabled with layout configuration
5. **State Updates** - Real-time events update Pinia stores
6. **UI Reactivity** - Components react to store changes automatically

### Key Design Patterns

- **Composables** - Business logic separated from UI components
- **Stores** - Reactive state management with Pinia setup syntax
- **Atomic Design** - Component hierarchy from base to feature to views
- **Event-Driven** - Webex SDK events drive state updates

## Testing

Tests are written using **Vitest** with jsdom environment.

### Test Structure
```
tests/
├── setup.js                 # Global test setup (MediaStream mocks)
├── unit/
│   ├── components/         # Component unit tests
│   ├── stores/             # Store unit tests
│   └── composables/        # Composable unit tests
└── integration/            # Integration tests
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode (reruns on file changes)
npm run test:watch

# UI mode (interactive test explorer)
npm run test:ui

# Coverage report
npm run test:coverage
```

## Build & Deploy

### Production Build

```bash
# Build optimised production bundle
npm run build

# Output directory: dist/
```

### Preview Production Build

```bash
# Preview production build locally
npm run preview
```

### Deployment Checklist

- [ ] Ensure Webex SDK is in `/public/webex.min.js`
- [ ] Configure environment variables for production
- [ ] Run tests to verify functionality
- [ ] Build production bundle
- [ ] Deploy `dist/` directory to hosting service
- [ ] Configure HTTPS (required for media device access)

## Troubleshooting

### Common Issues

**"Access token invalid or expired"**
- Webex tokens expire after 12 hours
- Generate a new token at [developer.webex.com](https://developer.webex.com)

**Camera/microphone not working**
- Ensure HTTPS is enabled (required for browser permissions)
- Check browser permissions for camera/microphone access
- Verify devices are not in use by another application

**"Cannot read property of undefined" during meeting join**
- Ensure Webex SDK is properly loaded in `/public/webex.min.js`
- Check browser console for SDK loading errors
- Verify SDK version is 3.9.0

**Video panes not displaying**
- Multistream requires Webex SDK 3.9.0+
- Check that `enableMultistream: true` is set during join
- Verify remote participants have video enabled

**Tests failing**
- Run `npm install` to ensure all dependencies are installed
- Check `tests/setup.js` for proper MediaStream mocks
- Review test output for specific error messages

### Getting Help

- Check the browser console for detailed error messages
- Ensure all setup steps were completed correctly

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]
