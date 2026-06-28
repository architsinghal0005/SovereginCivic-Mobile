import express from 'express';
import axios from 'axios';
import { getSession } from './db.js';

const app = express();
app.use(express.json());

const INFRASTRUCTURE_CLUSTERING_QUERY = `
    MERGE (c:Citizen {id: $citizenId})
    CREATE (g:Grievance {
        id: randomUUID(),
        category: $category,
        description: $description,
        imageUrl: $imageUrl,
        createdAt: datetime(),
        status: 'PENDING',
        point: point({latitude: $lat, longitude: $lng})
    })
    CREATE (c)-[:FILED]->(g)

    MERGE (l:Location {point: point({latitude: $lat, longitude: $lng})})
    CREATE (g)-[:AT_LOCATION]->(l)

    WITH g, l

    MATCH (nearby:Grievance)
    WHERE nearby.category = g.category
      AND nearby.status = 'PENDING'
      AND point.distance(g.point, nearby.point) <= 50

    WITH g, l, collect(nearby) AS cluster
    WHERE size(cluster) >= 5 

    MATCH (l)-[:DEPENDS_ON]->(asset:InfrastructureAsset)

    MERGE (g)-[:PART_OF_CLUSTER]->(asset)
    SET asset.status = 'STRUCTURAL_FAILURE',
        asset.flaggedAt = datetime()

    RETURN 
        asset.id AS assetId, 
        asset.name AS assetName, 
        size(cluster) AS clusterSize,
        g.category AS category,
        [x IN cluster | x.id] AS associatedGrievances;
`;

app.post('/api/graph/ingest', async (req, res) => {
    const { citizenId, category, description, location, imageUrl } = req.body;
    if (!location || !location.lat || !location.lng) {
        return res.status(400).json({ error: "Missing valid GPS coordinates" });
    }
    const session = getSession();
    try {
        const result = await session.executeWrite(tx => 
            tx.run(INFRASTRUCTURE_CLUSTERING_QUERY, {
                citizenId,
                category,
                description,
                imageUrl: imageUrl || "",
                lat: parseFloat(location.lat),
                lng: parseFloat(location.lng)
            })
        );
        if (result.records.length > 0) {
            const record = result.records[0];
            const clusterPayload = {
                assetId: record.get('assetId'),
                assetName: record.get('assetName'),
                clusterSize: record.get('clusterSize').toNumber(),
                category: record.get('category'),
                grievanceIds: record.get('associatedGrievances')
            };
            axios.post(process.env.WORKFLOW_WEBHOOK_URL, clusterPayload).catch(err => {});
            return res.status(201).json({ status: "success", clusterDetected: true, clusterData: clusterPayload });
        }
        res.status(201).json({ status: "success", clusterDetected: false });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Graph engine processing failure" });
    } finally {
        await session.close();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🏛️ SovereignCivic Core Brain running on port ${PORT}`));