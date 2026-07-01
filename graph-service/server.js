import express from "express";
import { checkAuth, getSession,driver } from "./db.js";
import axios from "axios";

const app = express();
app.use(express.json());

checkAuth();

app.post("/api/graph/ingest", async (req, res) => {
    const { citizenId, grievanceId, category, description, lat, lng, imageUrl } = req.body;
    const session = getSession();

    const cypher = `
        MERGE (c:Citizen {id: $citizenId})
        CREATE (g:Grievance {
            id: $grievanceId,
            category: $category,
            description: $description,
            point: point({latitude: toFloat($lat), longitude: toFloat($lng)}),
            imageUrl: $imageUrl,
            createdAt: datetime(),
            status: 'PENDING'
        })
        CREATE (c)-[:FILED]->(g)
        
        WITH g
        OPTIONAL MATCH (nearby:Grievance)
        WHERE nearby.category = g.category 
          AND nearby.status = 'PENDING'
          AND point.distance(g.point, nearby.point) <= 50
        WITH g, collect(nearby) + [g] AS cluster
        WHERE size(cluster) >= 5
        
        MATCH (asset:InfrastructureAsset)
        WHERE point.distance(g.point, asset.location) < 100
        MERGE (g)-[:ROOT_CAUSE_BY]->(asset)
        RETURN size(cluster) AS clusterSize, asset.id AS assetId
    `;

    try {
        const result = await session.executeWrite(tx => 
            tx.run(cypher, { citizenId, grievanceId, category, description, lat, lng, imageUrl })
        );
        
        const record = result.records[0];
        if (record && record.get("clusterSize") >= 5) {
            console.log("⚠️ High-priority cluster detected! Triggering webhook...");
            try {
                await axios.post(process.env.WORKFLOW_WEBHOOK_URL, {
                    clusterId: record.get("assetId"),
                    clusterSize: record.get("clusterSize").toNumber(), 
                    timestamp: new Date().toISOString()
                });
                console.log("✅ Webhook triggered successfully!");
            } catch (webhookError) {
                console.error("❌ Webhook trigger failed:", webhookError.message);
            }
        }
        res.status(201).json({ message: "Grievance ingested successfully" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    } finally {
        await session.close();
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 SovereignCivic server running on port ${process.env.PORT || 3000}`);
});

process.on('SIGINT', async () => {
    await driver.close();
    console.log("Database driver closed.");
    process.exit(0);
});