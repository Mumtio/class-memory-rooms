# Class Memory Rooms - Frontend

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/mumtios-projects/v0-class-memory-rooms-frontend)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/oU28NvLS9N8)

## Overview

This is the frontend application for Class Memory Rooms - a collaborative educational web application that transforms how students learn together. Built with Next.js 15+ and React 19.

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS with custom design system
- **Components**: Radix UI primitives with shadcn/ui
- **State Management**: Zustand with localStorage persistence
- **TypeScript**: Full type safety
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm (comes with Node.js)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your environment variables (see Configuration section below)
# Edit .env with your actual API keys and settings

# Validate configuration
npm run validate-config

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Configuration

Class Memory Rooms requires several environment variables to function properly. Copy `.env.example` to `.env` and configure the following:

### Required Environment Variables

```bash
# Foru.ms API Configuration
FORUMMS_API_URL=https://foru.ms/api/v1
FORUMMS_API_KEY=your_forumms_api_key_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here_minimum_32_characters
NEXTAUTH_URL=http://localhost:3000

# OpenAI API Configuration (for AI note generation)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.7

# AI Generation Settings
AI_MIN_CONTRIBUTIONS=5
AI_STUDENT_COOLDOWN_HOURS=2
AI_TEACHER_COOLDOWN_HOURS=1

# Development
NODE_ENV=development
```

### Configuration Validation

Use the built-in validation tool to check your configuration:

```bash
# Validate all configuration and test API connectivity
npm run validate-config
```

This will:
- ✅ Validate all required environment variables
- 🌐 Test Foru.ms API connectivity
- 🤖 Test OpenAI API connectivity
- 📋 Report any configuration issues

### Getting API Keys

1. **Foru.ms API Key**: Contact the Foru.ms team or check their documentation
2. **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
3. **NextAuth Secret**: Generate a random 32+ character string

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # shadcn/ui base components
│   └── illustrations/     # Custom SVG illustrations
├── lib/                   # State management & utilities
├── hooks/                 # Custom React hooks
├── public/                # Static assets
└── styles/                # Global styles
```

## Key Features

- **Multi-school workspace support** with role-based permissions
- **Real-time collaboration** on lecture contributions
- **AI-powered note synthesis** from student contributions
- **Paper-like design aesthetic** for educational trust
- **Responsive design** with mobile support
- **Accessibility compliant** (WCAG AA)

## Development

This repository stays in sync with [v0.app](https://v0.app) deployments. 

Continue building your app on: **[https://v0.app/chat/oU28NvLS9N8](https://v0.app/chat/oU28NvLS9N8)**

## Deployment

Your project is live at: **[https://vercel.com/mumtios-projects/v0-class-memory-rooms-frontend](https://vercel.com/mumtios-projects/v0-class-memory-rooms-frontend)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository