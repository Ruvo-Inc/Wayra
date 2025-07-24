# Wayra - Smart Travel Planning Platform

Wayra is a smart, collaborative, budget-aware travel planning platform that makes trip planning easy and enjoyable for families, friends, couples, and solo travelers.

## 🚀 Current Status

**Phase 1: Project & Environment Setup** ✅ **COMPLETE**
- ✅ Frontend: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- ✅ Backend: Node.js + Express + MongoDB + Redis
- ✅ Development servers running
- ✅ Environment configuration ready

## 🏗️ Project Structure

```
wayra/
├── wayra-frontend/          # Next.js React frontend
│   ├── src/
│   ├── package.json
│   └── ...
├── wayra-backend/           # Node.js Express API
│   ├── index.js
│   ├── package.json
│   ├── .env.example
│   └── ...
├── PRD_Version7.md          # Product Requirements Document
├── architecture-overview_Version7.md
├── wayra-mvp-super-detailed-playbook_Version3.md
└── README.md
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Redis Cloud account
- Google Cloud Platform account

### Quick Start

1. **Backend Setup**:
   ```bash
   cd wayra-backend
   npm install
   cp .env.example .env  # Update with your credentials
   npm run dev           # Runs on http://localhost:8080
   ```

2. **Frontend Setup**:
   ```bash
   cd wayra-frontend
   npm install
   npm run dev           # Runs on http://localhost:3000
   ```

3. **Health Check**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080/health
   - API Status: http://localhost:8080/api/v1/status

## 📋 Next Steps

**Phase 2: App Skeleton & Continuous Deployment**
- [ ] Deploy frontend to GCP Cloud Run
- [ ] Deploy backend to GCP Cloud Run
- [ ] Set up CI/CD pipeline
- [ ] Configure domain and SSL

**Phase 3: Core Integrations**
- [ ] Firebase Authentication
- [ ] MongoDB Atlas integration
- [ ] Redis Cloud integration
- [ ] Basic trip creation UI

## 🔧 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, Redis
- **Cloud**: Google Cloud Platform
- **Auth**: Firebase Authentication
- **AI/ML**: Vertex AI + NVIDIA GPUs
- **APIs**: Amadeus, Skyscanner, Booking.com, Google Maps

## 📚 Documentation

- [Product Requirements Document](./PRD_Version7.md)
- [Architecture Overview](./architecture-overview_Version7.md)
- [Detailed MVP Playbook](./wayra-mvp-super-detailed-playbook_Version3.md)
- [Integration Map](./integration-map-and-decision-table_Version3.md)

---

*Built with ❤️ by the Wayra team*
