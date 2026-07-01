# SovereignCivic Backend
The "Intelligence Brain" for the SovereignCivic platform, responsible for real-time grievance ingestion, spatial clustering, and automated root-cause analysis using Neo4j AuraDB.

# 🚀 Getting Started
Prerequisites
Node.js (Latest LTS recommended)

A Neo4j AuraDB instance

## Installation
Clone the repository:

Bash
```
git clone <your-repository-url>
cd sovereign-civic-backend
```
## Install dependencies:

Bash
```
npm install
```

## Environment Configuration
Create a .env file in the root directory based on the .env.example template:

Code snippet
```
NEO4J_URI=your_aura_db_uri
NEO4J_USERNAME=your_username
NEO4J_PASSWORD=your_password
WORKFLOW_WEBHOOK_URL=your_webhook_endpoint_url
PORT=3000
```
Running the Server
Bash
```
node server.js
```
# 🏗️ Architecture
API Endpoint
POST /api/graph/ingest

Accepts a JSON payload to record a grievance and automatically links it to InfrastructureAsset nodes if a cluster of 5+ grievances is detected within a 50-meter radius.

Graph Schema
Nodes: (:Citizen), (:Grievance), (:InfrastructureAsset)

Relationships:

(:Citizen)-[:FILED]->(:Grievance)

(:Grievance)-[:ROOT_CAUSE_BY]->(:InfrastructureAsset)

## Integration
Uses neo4j-driver for transactional graph operations.

Automates workflow triggers via axios webhooks upon detection of high-density "Structural Root Cause" clusters.

🧪 Testing
Use the provided payload.json to verify the ingestion pipeline via curl:

Bash
```
curl -X POST http://localhost:3000/api/graph/ingest \
 -H "Content-Type: application/json" \
 -d "@payload.json"
```
