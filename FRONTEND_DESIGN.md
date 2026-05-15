# Frontend Architecture Design

## 🏛️ Feature-Based Architecture
The frontend applications (Customer, Vendor, Driver) follow a feature-based structure to ensure scalability and maintainability.

### Directory Structure
```text
src/
├── app/               # Next.js App Router (Pages & Layouts)
├── components/        # Reusable Design System components (Atomic Design)
│   ├── ui/            # Basic UI primitives (Button, Input, etc.)
│   ├── shared/        # Shared business components
├── features/          # Domain-specific modules
│   ├── orders/        # Components, hooks, services for Orders
│   ├── menu/          # Vendor menu management
│   └── auth/          # Login, Register, Profile
├── hooks/             # Global custom hooks
├── lib/               # Utility libraries (API client, WebSocket)
├── services/          # External API service layers
└── store/             # Global state management
```

## 🔌 API Abstraction Layer
- **Axios Instance**: Centrally configured with interceptors for JWT injection and error handling.
- **Service Pattern**: Each feature has a service file defining its API calls, keeping components clean.
- **React Query**: Used for server-state management, caching, and optimistic updates.

## 🔄 State Management Strategy
- **Server State**: Managed by `TanStack Query` (React Query).
- **Client State**: `Zustand` for lightweight, predictable global state (e.g., shopping cart, user preferences).
- **Form State**: `React Hook Form` with `Zod` for schema validation.

## 📡 Real-Time Updates
- **WebSocket Hooks**: Custom hooks (`useOrderTracking`, `useNotifications`) encapsulate the connection logic and event handling.
- **Fallbacks**: Automatic reconnection logic with exponential backoff.

## 🔒 Security
- **Secure Token Storage**: HTTP-only cookies for session tokens or encrypted localStorage for JWTs.
- **Middleware-Based Routing**: Next.js middleware for protecting private routes based on user roles and auth status.

## 📱 Offline Support Strategy
- **Service Workers**: PWA capabilities for caching static assets.
- **IndexedDB**: Local storage for critical data (e.g., active delivery details for drivers) to support intermittent connectivity.
