# Gateway Service

Production-grade API Gateway microservice for the SovereignCivic Mobile hackathon project.

This service acts as the ingestion point, parsing multipart form-data, orchestrating audio transcription via Sarvam AI, classifying semantics via an LLM, and forwarding structured JSON data natively to the internal Graph Service.

## 1. Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher



## 2. Installation

Navigate to the project root and install the strictly required dependencies:

```bash
npm install
```

## 3. Environment Setup

Create your local environment configuration file based on the provided example:

```bash
cp .env.example .env
```

Ensure the following key variables are configured inside `.env`:
- `PORT`: Network port (default `3000`)
- `NODE_ENV`: `development` or `production`
- `SARVAM_API_KEY`: Your Sarvam AI Speech-to-Text API Key
- `SARVAM_API_URL`: (Optional) Custom Sarvam AI endpoint
- `LLM_API_KEY`: Your OpenAI/Gemini compatible API Key
- `LLM_API_URL`: (Optional) Your LLM REST endpoint
- `GRAPH_SERVICE_URL`: Base URL of the internal Graph Service

## 4. Development

To start the application in development mode with automatic hot-reloading (using `ts-node-dev`):

```bash
npm run dev
```

## 5. Build

To compile the TypeScript source code into raw, optimized JavaScript for production deployment:

```bash
npm run build
```
The compiled files will be output to the `/dist` directory.

## 6. Production Start

To start the highly optimized, compiled production server (ensure you have built it first):

```bash
npm start
```
