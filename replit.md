# Grupo Rugido - Sales CRM

## Overview
This is a sales management CRM application migrated from Lovable to Replit. The application helps manage sales activities, proposals, and revenue tracking for Grupo Rugido.

**Tech Stack:**
- Frontend: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Backend: Express.js (minimal, primarily for serving the SPA)
- Database: Supabase (PostgreSQL with authentication)
- Routing: Wouter

## Project Structure
```
├── client/               # Frontend application
│   ├── src/
│   │   ├── components/  # UI components (shadcn/ui)
│   │   ├── contexts/    # React contexts (Auth)
│   │   ├── hooks/       # Custom hooks
│   │   ├── integrations/# Supabase client
│   │   ├── lib/         # Utilities
│   │   └── pages/       # Page components
│   ├── public/          # Static assets
│   └── index.html       # HTML entry point
├── server/              # Express server
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   └── vite.ts          # Vite middleware
├── supabase/            # Supabase configuration
│   └── migrations/      # Database migrations
└── shared/              # Shared types (if needed)
```

## Recent Changes
**November 21, 2024** - Migrated from Lovable to Replit
- Restructured project to Replit fullstack template
- Converted from react-router-dom to wouter
- Updated Vite config to bind to 0.0.0.0:5000
- Created Express server with Vite middleware
- Maintained Supabase authentication and database

## Database Schema
The application uses Supabase with the following main tables:
- `profiles` - User profiles linked to auth.users
- `user_roles` - Role-based access control (super_admin, admin, closer, bdr, financeiro, gestor)
- `leads` - Lead information
- `atividades` - Sales activities (meetings, calls, etc.)
- `propostas` - Sales proposals
- `recebiveis` - Accounts receivable

## Key Features
1. **Authentication** - Supabase Auth with email/password
2. **Dashboard** - Overview of sales metrics
3. **Daily Journal** - Activity logging and tracking
4. **Proposals** - Proposal management
5. **History** - Historical data view
6. **Receivables** - Payment tracking

## Environment Variables
Required environment variables (set in Replit Secrets):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anonymous/publishable key

## Development
The application runs on port 5000 in development mode with hot module replacement via Vite.

## User Preferences
- None documented yet

## Architecture Notes
- This is primarily a client-side application using Supabase for backend services
- The Express server mainly serves the Vite app and provides a production build endpoint
- Authentication is handled entirely by Supabase
- Row Level Security (RLS) policies enforce access control in the database
