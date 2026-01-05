# Secure Access Hub

A comprehensive Multi-Factor Authentication (MFA) and Access Control System for online business platforms.

## Features

- **Multi-Factor Authentication (MFA)**
  - Time-based One-Time Password (TOTP) via authenticator apps
  - Email OTP verification via SMTP
  - Backup codes for account recovery

- **Role-Based Access Control**
  - Admin, Standard User, and Restricted User roles
  - Granular permissions and access management

- **Security Features**
  - Secure password hashing with bcrypt
  - JWT-based authentication with refresh tokens
  - Session management and timeout
  - Rate limiting for login attempts
  - Comprehensive audit logging
  - IP address tracking

- **Admin Panel**
  - User management (create, edit, deactivate)
  - Role assignment and management
  - Password reset functionality
  - Audit log viewing and filtering
  - Dashboard with real-time statistics

- **User Dashboard**
  - MFA setup and management
  - Account settings
  - Security preferences
  - Activity history

## Technologies

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Authentication**: JWT (jose library), bcryptjs
- **Database**: Supabase (PostgreSQL)
- **MFA**: otplib (TOTP), Email OTP via SMTP
- **Email**: SMTP (nodemailer)
- **Routing**: React Router v6
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- SMTP email server (Gmail, Outlook, or custom)

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd secure-access-hub
```

2. Install dependencies:
```sh
npm install
cd server && npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_JWT_SECRET=your_jwt_secret
VITE_JWT_REFRESH_SECRET=your_jwt_refresh_secret
VITE_EMAIL_SERVICE=smtp
VITE_EMAIL_API_ENDPOINT=http://localhost:3001/api/send-email
```

Create a `server/.env` file:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=SecureAuth
```

4. Set up the database:
- Run `supabase/complete-setup.sql` in your Supabase SQL Editor

5. Start the development server:
```sh
# Terminal 1: Start email server
cd server
npm start

# Terminal 2: Start frontend
cd ..
npm run dev
```

The application will be available at `http://localhost:8080`

## Deployment

### Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard:
   - All `VITE_*` variables from root `.env`
   - All `SMTP_*` variables from `server/.env`
4. Deploy!

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run create-admin` - Create an admin user interactively
