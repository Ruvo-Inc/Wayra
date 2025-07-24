# Wayra API Endpoints & Data Flow Documentation

## Backend API Endpoints

### Base URL
- **Production**: `https://wayra-backend-424430120938.us-central1.run.app`
- **Local Development**: `http://localhost:8080`

---

## Core API Endpoints

### Health & Status Endpoints

#### GET /health
**Purpose**: Backend health check with service status
**Authentication**: None required
**Response**:
```json
{
  "status": "healthy|degraded|error",
  "message": "Wayra backend health check",
  "services": {
    "mongodb": {
      "status": "connected|disconnected|connecting",
      "connected": boolean,
      "collections": { "users": number, "trips": number },
      "name": "MongoDB Atlas"
    },
    "redis": {
      "status": "connected|disconnected|error",
      "connected": boolean,
      "latency": "Xms",
      "memory": "X.XMB",
      "name": "Redis Cloud"
    },
    "socketio": {
      "status": "active",
      "connected": number,
      "name": "Socket.io Real-time"
    }
  },
  "timestamp": "ISO string"
}
```

#### GET /api/v1/status
**Purpose**: Simple API status check
**Authentication**: None required
**Response**:
```json
{
  "service": "Wayra API",
  "version": "1.0.0",
  "status": "active"
}
```

---

## Trip Management Endpoints

### GET /api/trips
**Purpose**: Get paginated list of user's trips
**Authentication**: Required (x-user-id, x-firebase-uid headers)
**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `status` (string, optional: planning|confirmed|active|completed|cancelled)
- `sortBy` (string, default: createdAt, options: createdAt|startDate|title)

**Response**:
```json
{
  "success": true,
  "trips": [
    {
      "_id": "ObjectId",
      "title": "string",
      "description": "string",
      "startDate": "ISO date",
      "endDate": "ISO date",
      "status": "planning|confirmed|active|completed|cancelled",
      "budget": {
        "total": number,
        "currency": "USD",
        "categories": { ... },
        "spent": { ... }
      },
      "destinations": [...],
      "owner": "ObjectId",
      "collaborators": [...],
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ],
  "pagination": {
    "currentPage": number,
    "totalPages": number,
    "totalTrips": number,
    "hasNext": boolean,
    "hasPrev": boolean
  },
  "cached": boolean
}
```

### POST /api/trips
**Purpose**: Create a new trip
**Authentication**: Required
**Request Body**:
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "startDate": "ISO date (required)",
  "endDate": "ISO date (required)",
  "destinations": [
    {
      "name": "string",
      "country": "string",
      "coordinates": { "latitude": number, "longitude": number },
      "arrivalDate": "ISO date",
      "departureDate": "ISO date"
    }
  ],
  "budget": {
    "total": number (required),
    "currency": "string (default: USD)",
    "categories": {
      "accommodation": number,
      "transportation": number,
      "food": number,
      "activities": number,
      "shopping": number,
      "other": number
    }
  }
}
```

### GET /api/trips/:id
**Purpose**: Get specific trip details
**Authentication**: Required
**Response**: Single trip object with populated collaborators

### PUT /api/trips/:id
**Purpose**: Update trip details
**Authentication**: Required (owner or editor role)
**Request Body**: Partial trip object with fields to update

### DELETE /api/trips/:id
**Purpose**: Delete a trip
**Authentication**: Required (owner only)

### POST /api/trips/:id/collaborators
**Purpose**: Add collaborator to trip
**Authentication**: Required (owner only)
**Request Body**:
```json
{
  "email": "string (required)",
  "role": "editor|viewer (default: viewer)"
}
```

### GET /api/trips/:id/activity
**Purpose**: Get trip activity log
**Authentication**: Required
**Query Parameters**:
- `limit` (number, default: 20)

### GET /api/trips/:id/presence
**Purpose**: Get current users viewing the trip
**Authentication**: Required

---

## Travel Search Endpoints

### GET /api/travel/status
**Purpose**: Get travel API configuration status
**Authentication**: None required
**Response**:
```json
{
  "success": true,
  "data": {
    "amadeus": {
      "configured": boolean,
      "hasToken": boolean,
      "tokenExpiry": number
    },
    "skyscanner": {
      "configured": boolean
    },
    "booking": {
      "configured": boolean
    }
  }
}
```

### POST /api/travel/flights/search
**Purpose**: Search flights across all available APIs
**Authentication**: None required
**Request Body**:
```json
{
  "origin": "string (IATA code)",
  "destination": "string (IATA code)",
  "departureDate": "YYYY-MM-DD",
  "returnDate": "YYYY-MM-DD (optional)",
  "adults": number (default: 1),
  "max": number (default: 10)
}
```

### POST /api/travel/hotels/search
**Purpose**: Search hotels across all available APIs
**Authentication**: None required
**Request Body**:
```json
{
  "cityCode": "string",
  "checkInDate": "YYYY-MM-DD",
  "checkOutDate": "YYYY-MM-DD",
  "adults": number (default: 1),
  "max": number (default: 10)
}
```

---

## User Management Endpoints

### GET /api/users/profile
**Purpose**: Get user profile
**Authentication**: Required

### PUT /api/users/profile
**Purpose**: Update user profile
**Authentication**: Required

### GET /api/users/stats
**Purpose**: Get user statistics
**Authentication**: Required

---

## Real-time Collaboration Endpoints

### WebSocket Connection
**URL**: `/socket.io/`
**Purpose**: Real-time collaboration features

**Events**:
- `join_trip` - Join trip collaboration room
- `leave_trip` - Leave trip collaboration room
- `trip_update` - Broadcast trip changes
- `user_presence` - User presence updates
- `activity_log` - Activity logging

---

## Data Flow Architecture

### Authentication Flow
1. **Frontend**: User signs in with Firebase Auth
2. **Frontend**: Receives Firebase JWT token
3. **Frontend**: Sends requests with x-user-id and x-firebase-uid headers
4. **Backend**: Validates headers (TODO: implement Firebase token verification)
5. **Backend**: Processes request with user context

### Trip Management Flow
1. **Frontend**: User creates/updates trip
2. **Backend**: Validates data and permissions
3. **Backend**: Updates MongoDB database
4. **Backend**: Invalidates Redis cache
5. **Backend**: Logs activity to Redis
6. **Backend**: Publishes real-time update via Socket.io
7. **Frontend**: Receives real-time updates

### Travel Search Flow
1. **Frontend**: User submits search parameters
2. **Backend**: Validates search parameters
3. **Backend**: Calls external travel APIs (Amadeus, Skyscanner, Booking.com)
4. **Backend**: Aggregates and formats results
5. **Backend**: Returns unified response to frontend
6. **Frontend**: Displays search results

### Caching Strategy
- **Trip Data**: 30-minute TTL in Redis
- **User Trips List**: 15-minute TTL in Redis
- **User Sessions**: 24-hour TTL in Redis
- **User Presence**: 5-minute TTL in Redis
- **Activity Logs**: 24-hour retention, 50-item limit

### Error Handling Flow
1. **Backend**: Catches errors with try-catch blocks
2. **Backend**: Logs errors with detailed context
3. **Backend**: Returns structured error response
4. **Frontend**: Displays user-friendly error messages
5. **Frontend**: Logs errors for debugging

---

## Missing API Endpoints (Required for Price Monitoring)

### Price Monitoring Endpoints (To Be Implemented)
- `POST /api/price-monitoring/subscribe` - Subscribe to price alerts
- `GET /api/price-monitoring/subscriptions` - Get user's price subscriptions
- `DELETE /api/price-monitoring/subscriptions/:id` - Unsubscribe from price alerts
- `GET /api/price-monitoring/history/:type/:id` - Get price history
- `POST /api/booking/automated` - Automated booking when price targets hit
- `GET /api/booking/status/:id` - Check automated booking status

### Budget Intelligence Endpoints (To Be Implemented)
- `POST /api/budget/alerts` - Set budget alerts
- `GET /api/budget/recommendations` - Get budget optimization recommendations
- `POST /api/budget/targets` - Set price targets for flights/hotels

---

