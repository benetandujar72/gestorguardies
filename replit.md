# School Guard Management System

## Overview

A comprehensive school guard duty management system built with React, TypeScript, and Node.js. The system manages teacher schedules, guard assignments, student trips, and substitute teacher coordination for a Catalan educational institution.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Components**: Radix UI with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL via Neon Database (serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with connect-pg-simple
- **Email**: SendGrid integration for notifications

## Key Components

### Database Schema
- **professors**: Teacher information and roles
- **grups**: Student groups/classes
- **aules**: Classroom information
- **guardies**: Guard duty assignments
- **sortides**: Student trips/excursions
- **horaris**: Class schedules and timetables
- **anys_academics**: Academic year management
- **substitucions**: Substitute teacher assignments

### Core Features
1. **Guard Duty Management**: Schedule and assign teacher guard duties
2. **Class Scheduling**: Manage weekly class timetables
3. **Student Trip Coordination**: Plan trips and coordinate substitute teachers
4. **Substitute Management**: Automatically assign substitute teachers when needed
5. **Analytics Dashboard**: Workload balance and metrics tracking
6. **Multi-language Support**: Catalan language interface

### API Structure
- RESTful API endpoints for all major entities
- Centralized storage layer with type-safe operations
- Automatic substitute teacher assignment algorithms
- Real-time data synchronization

## Data Flow

1. **Authentication**: Session-based login with professor credentials
2. **Academic Year Context**: All operations are scoped to the active academic year
3. **Schedule Management**: Teachers can view and modify their schedules
4. **Guard Assignment**: Automatic and manual guard duty assignment
5. **Trip Planning**: Create trips and automatically generate substitute needs
6. **Notification System**: Email notifications for schedule changes

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL database
- **Connection**: WebSocket-based connection for real-time updates

### Email Services
- **SendGrid**: Email notification service
- **Gmail API**: Alternative email service integration

### Development Tools
- **Vite**: Build tool and development server
- **Drizzle Kit**: Database migration and schema management
- **PostCSS**: CSS processing with Tailwind CSS

## Deployment Strategy

### Build Process
1. Frontend built with Vite to `dist/public`
2. Backend compiled with esbuild to `dist/index.js`
3. Database migrations handled by Drizzle Kit

### Environment Configuration
- Database connection via `DATABASE_URL`
- Email service configuration
- Session secret management

### Production Considerations
- Serverless database optimization
- Static asset serving
- Session persistence in PostgreSQL

## Changelog

- July 31, 2025: **MAJOR UPDATE** - Unified Guards System Implementation
  - **CRITICAL FIXES**: Resolved Error 500 in auto-assign endpoint and database schema inconsistencies
  - **UNIFIED SYSTEM**: Created comprehensive `/sistema-guardies-unificat` page integrating all guard-related functionality
  - **INTELLIGENT ASSIGNMENT**: Implemented both manual and AI-powered automatic guard assignment systems
  - **REAL-TIME UPDATES**: Fixed frontend view updates with proper TanStack Query cache invalidation
  - **DATABASE ALIGNMENT**: Corrected `shared/schema.ts` to match actual database structure
  - **SIMPLIFIED ARCHITECTURE**: Consolidated calendar, assignments, professors, and pending guards into single interface
  - **ENHANCED UX**: Added real-time statistics, filtering by date, and immediate feedback with toast notifications
  - **ROBUST LOGGING**: Implemented detailed assignment process logging for debugging and transparency
- January 31, 2025: Fixed critical DOM validation warnings and enhanced chatbot infrastructure
  - Fixed validateDOMNesting warning by removing nested `<a>` tags in ResponsiveSidebar component
  - Enhanced chatbot system with complete database schema and storage methods
  - Added chat sessions and messages support with OpenAI integration
  - Improved error handling for authentication-protected chatbot endpoints
- January 31, 2025: Fixed OAuth authentication for custom domain `assistatut.adeptify.es` 
  - Added custom domain support in replitAuth.ts configuration
  - Resolved "Unknown authentication strategy" error for production deployment
  - Configured OAuth strategies for both Replit and custom domains
- July 08, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.