# Wayra Integration Map & Build vs. Buy/Integrate Decision Table

---

## 1. Integration Map

| Module                     | Core Functionality                               | Integration/Service                                      | Rationale                              | Build Level   |
|----------------------------|--------------------------------------------------|----------------------------------------------------------|----------------------------------------|--------------|
| **Authentication**         | User sign-up/login, OAuth                        | Firebase Auth                                            | Secure, scalable, ready-made           | BUY/INTEGRATE|
| **User Profile**           | User data, avatars, trip history                 | MongoDB Atlas                                            | Simple CRUD, build UI, use MongoDB     | BUILD (UI), INTEGRATE (DB) |
| **Trip Management**        | Trip create/edit, invite, preferences            | MongoDB Atlas                                            | Business logic is unique, use MongoDB  | BUILD (logic/UI), INTEGRATE (DB) |
| **Itinerary Builder**      | Planning, editing, recommendations               | Vertex AI, Google Maps API, MongoDB, Redis               | Integrate AI/maps, custom UX           | BUILD (UX/orchestration), INTEGRATE (AI/maps/db) |
| **Real-Time Collaboration**| Live editing, sync, notifications                | Redis Cloud                                              | Fast, scalable, best for real-time     | INTEGRATE    |
| **Travel Search & Pricing**| Flights, hotels, activities, live prices         | Skyscanner/Amadeus/Booking.com APIs                      | Industry standard, no inventory build  | INTEGRATE    |
| **Booking & Payments**     | Book flights/hotels, charge users                | Deep-link to OTA, Stripe                                 | Use Stripe, deep-link for MVP          | INTEGRATE    |
| **Budget Tracking**        | Track spend vs. budget, alerts                   | Custom logic + Stripe, MongoDB                           | Custom logic for alerts, integrate for data/payments | BUILD (logic/UI), INTEGRATE (data/payments) |
| **Recommendations (AI/ML)**| Suggest plans, price prediction                  | Vertex AI, NVIDIA GPUs                                   | Use managed ML, pre-trained models     | INTEGRATE    |
| **Maps & Geolocation**     | Show map, route, distance                        | Google Maps Platform                                     | Best-in-class mapping                  | INTEGRATE    |
| **Notifications**          | Push/email notifications                         | Firebase Cloud Messaging, SendGrid                       | Best-in-class, scalable                | INTEGRATE    |
| **Analytics**              | Usage, engagement, conversion tracking           | Google Analytics, BigQuery                               | Powerful, ready-to-use                 | INTEGRATE    |
| **Monitoring & Logging**   | Ops, error, performance tracking                 | Google Cloud Logging, Monitoring                         | Cloud-native, robust                   | INTEGRATE    |
| **Media Storage**          | User uploads, trip photos                        | Google Cloud Storage                                     | Durable, scalable                      | INTEGRATE    |
| **Admin Dashboard**        | User/trip management for admins                  | Custom UI, MongoDB                                       | Custom logic, simple CRUD              | BUILD (UI)   |

---

## 2. Build vs. Buy/Integrate Decision Table

| Module                      | Build                                        | Buy/Integrate                                           | Decision                | Notes                                                                |
|-----------------------------|----------------------------------------------|---------------------------------------------------------|-------------------------|----------------------------------------------------------------------|
| Authentication              | Custom UI only                               | Firebase Auth                                           | BUY/INTEGRATE           | Use Firebase for all auth; custom UI over it                         |
| User Profile                | UI/business logic                            | MongoDB Atlas                                           | BUILD (UI), INTEGRATE   | Use MongoDB for storage                                              |
| Trip Management             | Business logic/UX                            | MongoDB Atlas                                           | BUILD (logic/UI), INTEGRATE | Use MongoDB for trip data; business logic is differentiator           |
| Itinerary Builder           | Orchestration, UI, conflict detection        | Vertex AI, Maps, MongoDB, Redis                         | BUILD (logic/UI), INTEGRATE | Combine AI, Google Maps, MongoDB, Redis; UX is unique                |
| Real-Time Collaboration     | None (for infra)                             | Redis Cloud                                             | INTEGRATE               | Use Redis for backend state sync                                     |
| Travel Search & Pricing     | None                                         | Skyscanner/Amadeus/Booking APIs                         | INTEGRATE               | No need to build travel inventory                                    |
| Booking & Payments          | Minimal business logic, UI                   | Stripe, deep-link to OTAs                               | INTEGRATE               | Stripe for payments, deep-link for booking in MVP                    |
| Budget Tracking             | Custom business logic                        | MongoDB Atlas, Stripe                                   | BUILD (logic), INTEGRATE | Alerts/logic are custom; use MongoDB for data, Stripe for spend      |
| Recommendations (AI/ML)     | None, except prompt tuning                   | Vertex AI, NVIDIA GPUs                                  | INTEGRATE               | Use managed ML for recs/forecasting; tune only as needed             |
| Maps & Geolocation          | None                                         | Google Maps Platform                                    | INTEGRATE               | All mapping via Google Maps                                          |
| Notifications               | Minimal business logic                       | FCM (push), SendGrid (email)                            | INTEGRATE               | Use cloud services, simple orchestration in backend                  |
| Analytics                   | None                                         | Google Analytics, BigQuery                              | INTEGRATE               | Use standard analytics services                                      |
| Monitoring & Logging        | None                                         | Google Cloud Logging, Monitoring                        | INTEGRATE               | Cloud-native                                                         |
| Media Storage               | None                                         | Google Cloud Storage                                    | INTEGRATE               | All media via GCP                                                    |
| Admin Dashboard             | UI/business logic                            | MongoDB Atlas                                           | BUILD (UI), INTEGRATE   | CRUD UI for admins                                                   |

---

## 3. Summary

- **Build:** Only the modules and logic that make Wayra unique (trip orchestration, collaborative logic, UX, itinerary intelligence, budget tracking UX).
- **Integrate:** Everything else—auth, payments, travel inventory, notifications, maps, AI/ML, analytics, infra, storage.

**This ensures you go fastest to market, reduce risk, and focus on what only Wayra can deliver.**
