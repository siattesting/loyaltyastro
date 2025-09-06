# AfriLoyalty - African Loyalty Program

## Overview

AfriLoyalty is a Progressive Web Application (PWA) designed specifically for African restaurants and convenience stores to manage customer loyalty programs. The application enables merchants to issue digital vouchers and customers to earn and redeem loyalty points through QR code-based transactions. Built with modern web technologies, it provides a seamless mobile-first experience for both customers and merchants.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### September 6, 2025
- **Project Setup**: Created full-stack Astro 5.13+ application with PostgreSQL database
- **Authentication System**: Implemented JWT-based authentication for customers and merchants
- **Database Schema**: Created tables for users, transactions, vouchers, and customer balances
- **Merchant Dashboard**: Built voucher creation interface with QR code generation
- **Customer Dashboard**: Created point redemption interface with balance tracking
- **Transaction System**: Implemented filtering, sorting, and pagination for transaction history
- **QR Code Integration**: Added QR code generation for vouchers and redemption scanning
- **PWA Features**: Implemented service worker, offline support, and app installation
- **Mobile-First Design**: Responsive layouts using Pico.css framework
- **Deployment Configuration**: Created Docker and docker-compose setup

## Project Architecture

### Frontend Architecture
- **Framework**: Astro 5.13+ with SolidJS integration for reactive components
- **Design Pattern**: Islands architecture for optimal performance
- **Styling**: Pico.css framework for clean, accessible UI components
- **PWA Features**: Service worker for offline functionality, web app manifest for native-like experience
- **TypeScript**: Strict TypeScript configuration for type safety

### Backend Architecture
- **Server Runtime**: Node.js with Astro's server-side rendering
- **API Design**: Astro Actions for type-safe server functions (instead of API endpoints)
- **Authentication**: JWT-based authentication with bcryptjs for password hashing
- **Session Management**: HTTP-only cookie-based sessions with 7-day expiration

### Data Storage
- **Database**: PostgreSQL with the `postgres` library for direct SQL queries
- **Schema Design**: 
  - Users table (customers and merchants with role-based differentiation)
  - Transactions table (tracks point earnings and redemptions)
  - Vouchers table (manages digital voucher lifecycle with QR codes)
  - Customer_balances table (tracks current point balances)
- **Data Access**: Direct SQL queries for performance and simplicity

### QR Code System
- **Generation**: QRCode library for creating voucher QR codes
- **Scanning**: qr-scanner library for client-side QR code reading (camera integration)
- **Data Format**: JSON-encoded voucher information with timestamp validation
- **Security**: UUID-based voucher codes with optional expiration timestamps

### Authentication & Authorization
- **User Types**: Role-based system supporting customers and merchants
- **Password Security**: bcryptjs with 12 salt rounds for password hashing
- **Token Management**: JWT tokens with user ID, email, and role claims
- **Session Persistence**: 7-day token expiration with HTTP-only cookies

### Progressive Web App Features
- **Offline Capability**: Service worker caches key routes and assets
- **Background Sync**: Pending transactions sync when connection restored
- **Installation**: Web app manifest enables add-to-homescreen functionality
- **Performance**: Network-first strategy with cache fallback
- **Mobile Optimization**: Portrait-primary orientation with responsive design

### Core Features Implemented
- **Merchant Features**:
  - Create loyalty vouchers with points and descriptions
  - Generate QR codes for vouchers
  - View transaction history and customer analytics
  - Filter transactions by type, date range
  
- **Customer Features**:
  - Redeem vouchers via code input or QR scan
  - View loyalty point balance
  - Track transaction history with filtering
  - Offline voucher redemption with background sync

- **Transaction Management**:
  - Comprehensive filtering (type, date range, sender/receiver)
  - Sorting by points, date
  - Preset date filters (7, 30, 90 days)
  - Pagination for large datasets

## External Dependencies

### Core Framework Dependencies
- **Astro 5.13+**: Static site generator with server-side rendering capabilities
- **SolidJS**: Reactive UI library for component interactivity
- **Node.js Adapter**: Enables server-side functionality in Astro

### Database & Authentication
- **PostgreSQL**: Primary database system (connection via postgres library)
- **bcryptjs**: Password hashing and verification
- **jsonwebtoken**: JWT token generation and validation
- **uuid**: Unique identifier generation for vouchers and users

### QR Code Functionality
- **qrcode**: Server-side QR code generation
- **qr-scanner**: Client-side QR code scanning and parsing

### Development Tools
- **TypeScript**: Static type checking and enhanced developer experience
- **Astro TypeScript Config**: Strict TypeScript configuration for Astro projects

### Third-Party Services
- **Pico.css CDN**: Lightweight CSS framework delivered via jsdelivr CDN
- **Web Fonts**: System font stack with fallbacks for optimal performance

### Browser APIs
- **Service Worker API**: For offline functionality and caching
- **Camera API**: For QR code scanning functionality
- **Local Storage**: For client-side session persistence
- **Background Sync API**: For offline form submission syncing

## Development Setup

1. **Database Initialization**: Visit `/api/init` to create database tables
2. **User Registration**: Create merchant and customer accounts via `/auth/register`
3. **Dashboard Access**: Login redirects to appropriate dashboard based on user type
4. **QR Code Testing**: Merchants can create vouchers, customers can redeem them

## Deployment

- **Docker**: Multi-stage build with Node.js 20 Alpine
- **Docker Compose**: Includes PostgreSQL database with persistent volumes
- **Production Ready**: Environment variables for database and JWT configuration
- **Port Configuration**: Runs on port 5000 for Replit compatibility