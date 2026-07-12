<div align="center">
  <h1>🏛️ SovereignCivic</h1>
  <p><strong>A Next-Generation Smart City Governance & Orchestration Platform</strong></p>

  ![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)
  ![React Native](https://img.shields.io/badge/React_Native-20232A?logo=react&logoColor=61DAFB)
  ![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
  ![Neo4j](https://img.shields.io/badge/Neo4j-018bff?logo=neo4j&logoColor=white)
</div>

<br />

## 🌟 Project Overview & Vision
**SovereignCivic** is designed to bridge the gap between citizens and municipal authorities. By empowering citizens to effortlessly report infrastructure issues using intuitive voice notes and multimedia, the platform removes friction from civic engagement. 

Behind the scenes, SovereignCivic leverages a powerful **Intelligence Brain**—combining AI-driven natural language processing and Neo4j Graph Databases—to automatically analyze, cluster, and orchestrate urban repairs. It transforms isolated citizen complaints into actionable, systemic resolutions.

---

## 📑 Table of Contents
- [System Architecture & Workflow](#-system-architecture--workflow)
- [Repository Structure](#-repository-structure)
- [Local Environment Setup](#-local-environment-setup)
  - [1. Backend Services](#1-backend-services-simulation--core)
  - [2. Mobile Application (Expo)](#2-mobile-application-expo)
- [End-to-End Workflow Simulation](#-end-to-end-workflow-simulation)

---

## 🏗️ System Architecture & Workflow
Our platform is divided into a robust, 4-tier microservice architecture that handles the entire lifecycle of a civic issue from reporting to resolution.

1. **📱 User Interaction (Mobile App)**
   - Built with **Expo** and **React Native**, the mobile application provides a seamless interface for citizens to report issues. It captures rich data including audio voice notes, images, and precise GPS coordinates.
2. **🧠 Processing & AI Structuring (Gateway Service)**
   - A highly optimized Node.js/Express infrastructure serving as the entry point. It handles multipart form data, routes audio to **Sarvam AI** for accurate speech-to-text transcription, and utilizes LLMs (OpenAI/Gemini) to semantically classify and structure the raw text into clean JSON payloads.
3. **📊 Intelligence & Clustering (Graph Service)**
   - The core Intelligence Brain. It ingests the structured JSON into a **Neo4j AuraDB** graph database, running real-time spatial analytics. When the system detects `5+` reports within a `50m` radius, it automatically flags a systemic failure, generating high-density clusters and firing automated webhooks to the orchestration engine.
4. **🛠️ Task Management & State (Caseworker Engine)**
   - The operational backend that listens to graph webhooks. It registers actionable administrative tickets and manages their lifecycle states (Open → Assigned → In Progress → Resolved) utilizing **BullMQ** for SLA timers and a robust internal state machine.

---

## 📂 Repository Structure
The project is structured as a modern monorepo, cleanly separating each domain concern:

```text
SovereignCivic-Mobile/
├── caseworker-engine/       # Orchestration, BullMQ queues, and state machine logic
├── e2e-simulation/          # Automated end-to-end hackathon demo script
├── gateway-service/         # Express API Gateway, Sarvam AI & LLM integrations
├── graph-service/           # Neo4j spatial clustering and intelligence analytics
└── mobile/                  # React Native / Expo mobile application
```

---

## 🛠️ Local Environment Setup

Follow these steps to run the complete SovereignCivic suite locally for development or presentation.

### 1. Backend Services (Simulation & Core)
> [!IMPORTANT]
> The `e2e-simulation` script looks for a localized `.env` file inside its own subdirectory (`e2e-simulation/.env`).

Create the required `.env` configurations inside the `e2e-simulation` directory with the following variables:
```env
# Gateway & Caseworker URLs (Can point to localhost or live Render endpoints)
GATEWAY_URL=https://sovereigncivic-gateway-api.onrender.com
CASEWORKER_URL=https://sovereigncivic-caseworker.onrender.com

# Neo4j Database Credentials
NEO4J_URI=bolt://your-aura-db-uri:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_secure_password
```

### 2. Mobile Application (Expo)
To launch the React Native mobile application using Expo Go, you need to configure the mobile environment variables and start the server.

Navigate to the `mobile` directory, create a `.env` file, and provide the backend API URL:
```bash
cd mobile
cp .env.example .env
```

**`mobile/.env` Configuration:**
```env
# Required: The base URL of the backend API
# Must start with EXPO_PUBLIC_ so that Expo makes it available to the client application
EXPO_PUBLIC_BACKEND_URL=https://sovereigncivic-gateway-api.onrender.com
```

**Start the App:**
Install dependencies and launch the Expo development server:
```bash
npm install
npx expo start
```
*You can now scan the QR code using the **Expo Go** app on your physical device, or press `a` / `i` to launch on a local Android/iOS emulator.*

---

## 🚀 End-to-End Workflow Simulation
To verify the entire system architecture instantly, we have built a flagship End-to-End (E2E) Simulation Script. This script provides a beautiful, interactive CLI story of a civic complaint being resolved.

> [!NOTE]
> **Running the Simulation**
> You can execute the live demo directly from the root directory with a single command:
> ```bash
> npm install -D tsx
> npm run simulate:e2e
> ```

**What the simulation tests:**
- **Cloud Warm-up**: Pre-flight ping checks to wake up cloud microservices.
- **Dynamic Multi-Grievance Ingestion**: Rapidly injects multiple localized complaints with dynamic micro-degree GPS offsets and timestamped IDs to ensure pristine, isolated test runs.
- **Neo4j Spatial Query Validation**: Connects live to the AuraDB instance to verify that the spatial clustering threshold was breached and the cluster frequency updated correctly.
- **Automated Caseworker Engine State Resolution**: Verifies webhook propagation and smoothly transitions the ticket through its lifecycle (`IN_PROGRESS` → `RESOLVED`).

---
<div align="center">
  <i>Built for the future of Smart Cities.</i>
</div>
