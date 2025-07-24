# Wayra MVP Build Playbook (Super Detailed, Step-by-Step, For Novices)

This playbook guides you through building and launching the Wayra MVP.  
**For each phase, you'll find:**  
- _What are we doing?_  
- _Why does it matter?_  
- _How do you do it (step-by-step)?_

---

## PHASE 1: Project & Environment Setup

### **Step 1.1: Create a GitHub Repository & Project Board**
**What:**  
Create a place to store and manage your code and tasks.

**Why:**  
Version control and teamwork. Tracking features and progress.

**How:**  
1. Go to [github.com](https://github.com/) and log in.
2. Click **New Repository**, name it `wayra-mvp`, add a README, select Node `.gitignore`.
3. After repo is created, click the "Projects" tab > "New Project" > choose Kanban template.
4. Create columns: "To Do", "In Progress", "Done". Add cards for each big task (see this playbook’s sections).

---

### **Step 1.2: Set Up Google Cloud Platform (GCP) Project**
**What:**  
Create a cloud project to host your app.

**Why:**  
You'll deploy your app to the cloud so others can use it. GCP gives you tools, hosting, and integrations.

**How:**  
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project drop-down > "NEW PROJECT". Name it `wayra-mvp`.
3. In the left menu, go to "APIs & Services" > "Enabled APIs & services" > "+ ENABLE APIS AND SERVICES".
4. Search for and enable:
   - Cloud Run
   - Cloud Build
   - Cloud Storage
   - Secret Manager
   - Vertex AI
   - Monitoring, Logging, IAM & Admin
5. Go to "Billing" and make sure billing is enabled (required for most services).
6. Go to "IAM & Admin" > "IAM" > "Add" to invite teammates (use their email).

---

### **Step 1.3: Prepare Local Development Environment**
**What:**  
Install the tools you need to write, run, and deploy code.

**Why:**  
You need these to code, run the app, and connect to your databases.

**How:**  
- Install [Node.js LTS](https://nodejs.org/en/download/) (JavaScript runtime).
- Install [Git](https://git-scm.com/downloads) (version control).
- Install [MongoDB Compass](https://www.mongodb.com/try/download/compass) (GUI for MongoDB).
- Install [Visual Studio Code](https://code.visualstudio.com/) (or other code editor).
- Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (for deploying from terminal).
- Sign up for a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (cloud database).
- Sign up for a [Redis Cloud](https://redis.com/try-free/) account (real-time features).

---

## PHASE 2: App Skeleton & Continuous Deployment

### **Step 2.1: Scaffold the Frontend (Next.js/React)**
**What:**  
Create the base for your website.

**Why:**  
You need a place for users to interact (sign up, create trips, etc).

**How:**  
1. In your terminal:
    ```bash
    npx create-next-app@latest wayra-frontend --typescript
    cd wayra-frontend
    ```
2. Run the dev server:
    ```bash
    npm run dev
    ```
   Open [http://localhost:3000](http://localhost:3000) to verify it works.
3. Connect to GitHub:
    ```bash
    git init
    git remote add origin <your-github-repo-url>
    git add .
    git commit -m "initial frontend"
    git push -u origin main
    ```

---

### **Step 2.2: Deploy Frontend to GCP**
**What:**  
Host your frontend on the cloud.

**Why:**  
So you and others can see your live app as you build.

**How:**  
1. Follow [GCP’s Next.js Cloud Run guide](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nextjs).
2. Authenticate with GCP CLI and deploy:
    ```bash
    gcloud auth login
    gcloud config set project <YOUR_PROJECT_ID>
    gcloud builds submit --tag gcr.io/<YOUR_PROJECT_ID>/wayra-frontend
    gcloud run deploy wayra-frontend --image gcr.io/<YOUR_PROJECT_ID>/wayra-frontend --platform managed
    ```
3. Note the public URL you get.

---

### **Step 2.3: Scaffold the Backend (Node.js/Express)**
**What:**  
Create the backend API server.

**Why:**  
Your backend will process requests, talk to the database, and handle logic.

**How:**  
1. In a new folder:
    ```bash
    mkdir wayra-backend
    cd wayra-backend
    npm init -y
    npm install express cors dotenv
    touch index.js
    ```
2. Add this to `index.js`:
    ```js
    const express = require('express');
    const app = express();
    app.get('/health', (req, res) => res.send('OK'));
    app.listen(8080, () => console.log('Wayra backend running'));
    ```
3. Run locally:
    ```bash
    node index.js
    ```
4. Set up git, push to GitHub (as above).

---

### **Step 2.4: Deploy Backend to GCP Cloud Run**
**What:**  
Host your backend in the cloud.

**Why:**  
So your frontend and users can talk to your backend.

**How:**  
1. Add a `Dockerfile`:
    ```Dockerfile
    FROM node:18
    WORKDIR /app
    COPY . .
    RUN npm install
    CMD ["node", "index.js"]
    ```
2. Build and deploy:
    ```bash
    gcloud builds submit --tag gcr.io/<PROJECT_ID>/wayra-backend
    gcloud run deploy wayra-backend --image gcr.io/<PROJECT_ID>/wayra-backend --platform managed --allow-unauthenticated
    ```
3. Note the public backend API URL.

---

### **Step 2.5: Set Up Continuous Integration/Deployment (CI/CD)**
**What:**  
Make sure every code change is automatically deployed.

**Why:**  
Saves time and ensures you always have a live, up-to-date app.

**How:**  
- On GitHub, go to "Actions" and set up the Node.js workflow (or use [Cloud Build triggers](https://cloud.google.com/build/docs/automating-builds/create-manage-triggers)).
- Every push to `main` should trigger a build and deploy using the steps above.

---

## PHASE 3: Core Integrations

### **Step 3.1: Authentication with Firebase**
**What:**  
Add user sign-up/sign-in (Google, email).

**Why:**  
Secure access and personalization.

**How:**  
1. Go to [Firebase Console](https://console.firebase.google.com/), add a project.
2. Enable Email/Password and Google login under "Authentication > Sign-in method".
3. In frontend:
    ```bash
    npm install firebase
    ```
4. In your code, initialize Firebase, build basic signup/login pages using [Firebase Auth docs](https://firebase.google.com/docs/auth/web/start).
5. Pass the user’s JWT token with API requests to the backend.
6. In backend, validate the token on each request (see [verifyIdToken](https://firebase.google.com/docs/auth/admin/verify-id-tokens)).

---

### **Step 3.2: MongoDB Atlas Setup**
**What:**  
Add a cloud database.

**Why:**  
Store users, trips, itineraries, etc.

**How:**  
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free cluster.
3. Create a database user (save username and password).
4. Add your IP to the whitelist (0.0.0.0/0 for all, restrict in production).
5. In backend:
    ```bash
    npm install mongoose
    ```
    ```js
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGO_URI); // Store your connection string in .env
    ```
6. Define schemas for User, Trip, Itinerary in separate files (see [Mongoose docs](https://mongoosejs.com/docs/models.html)).
7. Test creating and fetching data with basic endpoints.

---

### **Step 3.3: Trip Creation & Dashboard**
**What:**  
Let users create trips, view their trips, and invite others.

**Why:**  
This is the core of your travel planning app.

**How:**  
- Backend: Add endpoints for `/trips` (create, list, update, delete).
- Frontend: Create forms and dashboard to display trips.
- Store trip info in MongoDB, including invited users’ emails.
- (Optional) For now, store invites and let user "accept" when they sign up.

---

### **Step 3.4: Real-Time Collaboration (Redis)**
**What:**  
Show real-time edits and presence for collaboration.

**Why:**  
Users see each other's changes live, making planning fun and interactive.

**How:**  
1. Get a Redis Cloud subscription.
2. In backend:
    ```bash
    npm install redis socket.io
    ```
3. Use [Socket.io](https://socket.io/get-started/chat/) to broadcast changes.
4. Store session/user presence in Redis so all servers share state.
5. Frontend: Connect via Socket.io to receive updates and show “X is editing”.

---

## PHASE 4: MVP Features & Advanced Integrations

### **Step 4.1: Preferences & Budget**
**What:**  
Let users specify travel styles and budget.

**Why:**  
Personalizes recommendations and keeps planning realistic.

**How:**  
- Add fields to trip creation form and Trip schema (e.g. budget, travel type, interests).
- Display budget progress as users add flights/hotels/activities.

---

### **Step 4.2: Smart Itinerary Builder (AI/ML)**
**What:**  
Suggest daily plans using AI.

**Why:**  
Makes planning easier and "magical".

**How:**  
1. In GCP, enable Vertex AI.
2. Use a sample notebook or API ([Vertex AI Quickstart](https://cloud.google.com/vertex-ai/docs/quickstarts)).
3. Deploy a simple model (start with rules/dummy data, upgrade later).
4. Backend: Add `/itinerary/recommend` endpoint to call Vertex AI and return suggestions.
5. Frontend: Show recommended itinerary, let users edit/drag-drop.

---

### **Step 4.3: External Travel API Integration**
**What:**  
Fetch flights, hotels, activities and show prices.

**Why:**  
Lets users plan and book real trips.

**How:**  
1. Get API keys for Skyscanner, Amadeus, or Booking.com.
2. Backend: Add endpoints to fetch data from travel APIs.
3. Frontend: Display search results, offer "Book Now" links that open the provider in a new tab.

---

### **Step 4.4: Map Integration**
**What:**  
Show trip locations and routes on a map.

**Why:**  
Visualizes the plan, makes it fun and clear.

**How:**  
- Get a Google Maps API key and enable it in GCP.
- In frontend:
    ```bash
    npm install @react-google-maps/api
    ```
- Display itinerary locations on an interactive map.

---

### **Step 4.5: Notifications**
**What:**  
Alert users about invites, changes, and budget issues.

**Why:**  
Keeps users engaged and informed.

**How:**  
- Set up [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) for push, [SendGrid](https://sendgrid.com/) for email.
- Backend: Trigger notifications on trip updates, invites, over-budget alerts.

---

### **Step 4.6: Budget Tracking**
**What:**  
Update and visualize trip spend vs. budget in real time.

**Why:**  
Keeps users on track and builds trust.

**How:**  
- Backend: Calculate budget usage as items are added/removed.
- Frontend: Show budget progress bar and warnings if over budget.

---

## PHASE 5: Polish, Test & Launch

### **Step 5.1: Analytics & Monitoring**
**What:**  
Track usage, errors, and performance.

**Why:**  
Know how users use your app and catch issues early.

**How:**  
- Add [Google Analytics](https://analytics.google.com/) to frontend.
- Enable GCP Logging & Monitoring for backend.

---

### **Step 5.2: UI/UX Polish**
**What:**  
Make the app delightful and easy to use.

**Why:**  
Happy users come back and tell friends.

**How:**  
- Use Figma for final design tweaks.  
- Add animations, avatars, fun feedback (e.g. confetti on trip creation).

---

### **Step 5.3: Testing**
**What:**  
Fix bugs and ensure quality.

**Why:**  
A buggy app loses users.

**How:**  
- Manually test all flows.
- Add basic automated tests (Jest for backend, Playwright/Cypress for frontend).

---

### **Step 5.4: Security & Data**
**What:**  
Protect user data and your app.

**Why:**  
Security builds trust and avoids leaks.

**How:**  
- Store API keys in Secret Manager, not in code.
- Use HTTPS everywhere.
- Validate all input in backend.

---

### **Step 5.5: Go Live**
**What:**  
Make your app public!

**Why:**  
Get real users, feedback, and start your journey.

**How:**  
- Use GCP to set up a production environment.
- Update DNS for your domain (e.g. wayra.club).
- Do a final check: create a test trip from signup to booking.

---

### **Step 5.6: Announce and Onboard**
**What:**  
Invite your first users and gather feedback.

**Why:**  
Early user feedback is gold.

**How:**  
- Email/testers, share on social media, ask for feedback.
- Add a simple feedback form or link.

---

## **Quick Reference Table**

| Step | What | Why | How |
|------|------|-----|-----|
| Setup | GitHub, GCP, local tools | Start project, version control | See Phase 1 |
| Skeleton | Next.js, Express, CI/CD | Foundational code & deploy | See Phase 2 |
| Auth | Firebase Auth | Secure user access | See 3.1 |
| Database | MongoDB Atlas | Store app data | See 3.2 |
| Core Features | Trips, collab, AI, APIs | Unique value | See Phase 4 |
| Polish | Analytics, UX, security | Quality & trust | See Phase 5 |
| Launch | Go live! | Get users | See 5.5 |

---

**Tips:**
- **If stuck:** Google the error, check official docs, or ask for help on StackOverflow.
- **Build in small steps:** Test each piece as you go.
- **Deploy often:** Catch issues early and keep progress visible.
- **Document:** Update your README as you go.

**You can do this! Take it step by step, and ask for help when you need it.**

*Need sample code, more walkthroughs, or a Figma starter kit? Just ask!*