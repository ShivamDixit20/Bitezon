# CodeClash Frontend

A minimalistic React frontend connected to the CodeClash backend authentication system.

## Features

- ✅ User Registration
- ✅ User Login
- ✅ Profile View
- ✅ JWT Token Authentication
- ✅ Protected Routes
- ✅ Modern UI with Gradient Design

## Getting Started

### Prerequisites

- Node.js installed
- Backend server running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Usage

### First Time Users
1. Click "Register here" to create a new account
2. Fill in your name, email, and password (min 6 characters)
3. Upon successful registration, you'll be logged in automatically

### Existing Users
1. Enter your email and password
2. Click "Login"
3. View your profile with user information

### Profile Features
- View your user information (name, email, user ID)
- Refresh profile data from server
- Logout functionality

## API Integration

The frontend connects to the backend API endpoints:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/profile` - Get user profile (protected)

All requests are proxied through Vite to `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Login.jsx       # Login component
│   │   ├── Register.jsx    # Registration component
│   │   └── Profile.jsx     # User profile component
│   ├── api.js              # API calls to backend
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # React entry point
│   └── styles.css          # Global styles
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
└── package.json            # Dependencies
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Technologies Used

- React 18
- Vite
- CSS3 (with gradients)
- Fetch API for HTTP requests
