# Secure Access Hub

A comprehensive Multi-Factor Authentication (MFA) and Access Control System for online business platforms.

## Features

- **Multi-Factor Authentication (MFA)**
  - Time-based One-Time Password (TOTP) via authenticator apps
  - Email OTP verification
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
- **MFA**: otplib (TOTP), Email OTP
- **Routing**: React Router v6
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- (Optional) Resend API key for email service

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd secure-access-hub
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_JWT_SECRET=your_jwt_secret
VITE_JWT_REFRESH_SECRET=your_jwt_refresh_secret
VITE_EMAIL_SERVICE=resend
VITE_EMAIL_API_ENDPOINT=http://localhost:3001/api/send-email
```

4. Set up the database:
- Run the SQL scripts in the `supabase/` directory to set up your database schema
- Configure Row Level Security (RLS) policies as needed

5. (Optional) Set up email service:
- See `EMAIL_SERVICE_SETUP.md` for detailed instructions
- Start the email server: `cd server && npm install && npm start`

6. Start the development server:
```sh
npm run dev
```

The application will be available at `http://localhost:8080`

## Project Structure

```
secure-access-hub/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (Auth, etc.)
│   ├── lib/           # Utility functions and API clients
│   ├── pages/         # Page components
│   └── hooks/         # Custom React hooks
├── supabase/          # Database schema and migrations
├── server/            # Backend email service (optional)
└── public/            # Static assets
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run create-admin` - Create an admin user interactively

## Deployment

### Vercel (Recommended)

The project is configured for easy deployment to Vercel. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.

Quick steps:
1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

Build the project for production:
```sh
npm run build
```

The `dist/` folder will contain the production-ready files that can be deployed to any static hosting service.

**Note**: For email functionality, you'll need to deploy the email service separately or use the included Vercel serverless function at `api/send-email.js`.

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens are signed with secure secrets
- RLS policies protect database access
- Rate limiting prevents brute force attacks
- Audit logs track all security-relevant actions
- MFA adds an extra layer of security

## License

This project is proprietary software. All rights reserved.
