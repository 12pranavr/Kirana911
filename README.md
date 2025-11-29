# Kirana911 - Smart Kirana Store Management System

## Overview
Kirana911 is a comprehensive digital platform designed to modernize traditional kirana (local grocery) stores in India. The system bridges the gap between small neighborhood stores and modern e-commerce by providing both store owners and customers with powerful digital tools.

## Project Structure
```
kirana-app/
├── frontend/           # React/Vite frontend application
├── backend/            # Node.js/Express backend API
└── README.md           # This file
```

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- PostgreSQL database

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and configure your environment variables

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and configure your environment variables

4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Frontend Deployment (Vercel)
- The frontend is configured for Vercel deployment
- Uses `vercel.json` for build configuration
- Ignores backend files using `.vercelignore`

### Backend Deployment (Render)
- The backend is configured for Render deployment
- Uses `render.yaml` for service configuration
- Ignores frontend files using `.renderignore`

## Environment Variables

### Backend (.env)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon key
- `PORT` - Server port (default: 3000)
- `DB_*` - Database connection parameters
- `GOOGLE_AI_API_KEY` - Google AI API key for ML features

### Frontend (.env)
- `VITE_API_URL` - Backend API URL
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_KEY` - Your Supabase anon key

## Features

### For Store Owners:
- Store management dashboard
- Point of sale system
- Inventory control
- Financial management
- Customer engagement tools

### For Customers:
- Store discovery (location/pincode based)
- Online shopping
- Multi-store cart
- Order management

## API Endpoints
- `/api/stores` - Store management
- `/api/products` - Product management
- `/api/transactions` - Sales transactions
- `/api/customers` - Customer management

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License
MIT License