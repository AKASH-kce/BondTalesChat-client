# BondTales Chat Client - Deployment Guide

## Render Deployment

This Angular application is configured for deployment on Render.com with the backend URL: `https://bondtaleschat-server.onrender.com`

### Prerequisites

1. A Render.com account
2. Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

### Deployment Steps

1. **Connect Repository to Render**
   - Log in to your Render dashboard
   - Click "New +" and select "Web Service"
   - Connect your Git repository

2. **Configure Build Settings**
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

3. **Environment Variables** (if needed)
   - The application is pre-configured to use the production backend URL
   - No additional environment variables are required

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Serve production build locally
npm start
```

### Project Structure

- `src/environments/environment.ts` - Development environment configuration
- `src/environments/environment.prod.ts` - Production environment configuration
- `server.js` - Express server for serving the Angular app
- `render.yaml` - Render deployment configuration

### Backend Integration

The application is configured to connect to:
- **API Base URL**: `https://bondtaleschat-server.onrender.com/api`
- **SignalR Hub**: `https://bondtaleschat-server.onrender.com/chatHub`
- **Call Hub**: `https://bondtaleschat-server.onrender.com/hubs/call`

### Features

- Real-time chat using SignalR
- Video and audio calling
- User authentication and profile management
- Responsive design with Angular Material
- Production-ready build configuration
