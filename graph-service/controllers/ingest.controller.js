// graph-service/controllers/ingest.controller.js
import { getSession } from '../repository/neo4j.js';
import axios from 'axios';

export const ingestGrievance = async (req, res) => {
    const { citizenId, grievanceId, category, description, lat, lng, imageUrl, severity = 3, affectedWard = 'Unknown' } = req.body;
    const session = getSession();

    const cypher = `
        MERGE (c:Citizen {id: $citizenId})
        CREATE (g:Grievance {
            id: $grievanceId,
            category: $category,
            severity: toInteger($severity),
            point: point({latitude: toFloat($lat), longitude: toFloat($lng)}),
            createdAt: datetime(),
            status: 'PENDING',
            affectedWard: $affectedWard,
            imageUrl: $imageUrl,
            description: $description
        })
        CREATE (c)-[:FILED]->(g)
        
        WITH g
        // 1. Core Analytics & Proximity Clustering
        OPTIONAL MATCH (nearby:Grievance)
        WHERE nearby.category = g.category 
          AND nearby.status = 'PENDING'
          AND point.distance(g.point, nearby.point) <= 500 // 500-meter cluster radius
        
        WITH g, collect(nearby) + [g] AS cluster
        WITH g, size(cluster) AS frequency, avg(toInteger($severity)) AS avgSeverity, cluster
        
        // Compute and store intelligence parameters
        SET g.frequency = frequency,
            g.density = frequency / 0.785, // Density per sq km
            g.confidenceScore = frequency * avgSeverity,
            g.affectedPopulation = frequency * 15 // Extrapolated scale rule
            
        // 2. Root Cause Association
        WITH g, cluster, g.confidenceScore AS finalScore
        OPTIONAL MATCH (asset:InfrastructureAsset)
        WHERE point.distance(g.point, asset.location) < 100
        FOREACH (i IN CASE WHEN asset IS NOT NULL THEN [1] ELSE [] END |
            MERGE (g)-[:ROOT_CAUSE_BY]->(asset)
        )
        
        RETURN size(cluster) AS clusterSize, asset.id AS assetId, finalScore, [node IN cluster | node.id] AS grievanceIds
    `;

    try {
        const result = await session.executeWrite(tx => 
            tx.run(cypher, { 
                citizenId, grievanceId, category, description, 
                lat, lng, imageUrl, severity, affectedWard 
            })
        );
        
        const record = result.records[0];
        if (record && record.get("clusterSize") >= 5) {
            console.log("⚠️ High-priority cluster detected! Triggering webhook...");
            try {
                await axios.post(process.env.WORKFLOW_WEBHOOK_URL, {
                    clusterId: record.get("assetId") || "unlinked-cluster",
                    clusterSize: typeof record.get("clusterSize").toNumber === 'function' ? record.get("clusterSize").toNumber() : record.get("clusterSize"), 
                    confidenceScore: typeof record.get("finalScore").toNumber === 'function' ? record.get("finalScore").toNumber() : record.get("finalScore"),
                    timestamp: new Date().toISOString(),
                    category: category,
                    ward: affectedWard || 'Unknown',
                    citizenId: citizenId,
                    grievanceIds: record.get("grievanceIds")
                });
                console.log("✅ Webhook triggered successfully!");
            } catch (webhookError) {
                console.error("❌ Webhook trigger failed:", webhookError.message);
            }
        }
        res.status(201).json({ success: true, message: "Grievance ingested with Intelligence Layer mappings" });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    } finally {
        await session.close();
    }
};