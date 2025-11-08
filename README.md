# Legends Notifier

A clean, modern React + Vite + Tailwind web application for managing push notifications. Built with an Apple-inspired design aesthetic.

## Features

- **Dashboard**: View all sent notifications with quick resend and view actions
- **Users**: Browse and search registered devices/users
- **New Notification**: Compose and send new push notifications

## Tech Stack

- React 18
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios
- Lucide Icons
- Framer Motion

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://your-cloud-function-url.cloudfunctions.net
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## API Endpoints

The app connects to Google Cloud Functions that expose the following endpoints:

- `GET /fetchUsersHandler` - Fetches all registered users
- `GET /fetchNotiHandler` - Fetches all saved notifications
- `POST /saveNotiHandler` - Saves a new push notification
- `POST /executeNotiHandler` - Executes/sends a push notification

## Project Structure

```
src/
 ├── components/
 │   ├── Navbar.tsx
 │   ├── NotificationModal.tsx
 │   └── Toast.tsx
 ├── pages/
 │   ├── Dashboard.tsx
 │   ├── Users.tsx
 │   └── NewNotification.tsx
 ├── lib/
 │   ├── api.ts
 │   └── utils.ts
 ├── App.tsx
 ├── main.tsx
 └── index.css
```

## Design

- Clean, minimal Apple-inspired UI
- Soft rounded corners and subtle shadows
- Blue accent color (#007AFF)
- Glassy navigation bar with blur effect
- Smooth animations and transitions
- Mobile responsive design

