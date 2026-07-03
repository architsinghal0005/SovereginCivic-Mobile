// graph-service/services/analytics.service.js
import { getSession } from '../repository/neo4j.js';

export const getClusterAnalytics = async (lat, lng, radius) => {
    const session = getSession();
    try {
        const result = await session.executeRead(tx =>
            tx.run(`
                MATCH (g:Grievance)
                WHERE g.point IS NOT NULL 
                  AND point.distance(g.point, point({latitude: $lat, longitude: $lng})) < $radius
                RETURN count(g) AS frequency, 
                       avg(g.severity) AS avgSeverity,
                       (count(g) * avg(g.severity)) AS confidenceScore
            `, { lat, lng, radius })
        );
        return result.records[0]?.toObject() || {};
    } finally {
        await session.close();
    }
};

export const getHeatmapPoints = async () => {
    const session = getSession();
    try {
        const result = await session.executeRead(tx => tx.run(`
            MATCH (g:Grievance)
            WHERE g.point IS NOT NULL AND g.status = 'PENDING'
            RETURN g.point.latitude AS lat, g.point.longitude AS lng, coalesce(g.confidenceScore, 1) AS weight
        `));
        return result.records.map(r => r.toObject());
    } finally { await session.close(); }
};

// Add this logic to services/analytics.service.js
export const getConfidenceScore = async (lat, lng, radius) => {
    const session = getSession();
    try {
        const result = await session.executeRead(tx =>
            tx.run(`
                MATCH (g:Grievance)
                WHERE g.point IS NOT NULL 
                  AND point.distance(g.point, point({latitude: $lat, longitude: $lng})) < $radius
                RETURN count(g) AS count,
                       avg(g.severity) AS avgSeverity,
                       (count(g) * coalesce(avg(g.severity), 1)) AS confidenceScore
            `, { lat, lng, radius })
        );
        return result.records[0]?.toObject() || { count: 0, confidenceScore: 0 };
    } finally {
        await session.close();
    }
};

export const getGlobalMetrics = async () => {
    const session = getSession();
    try {
        const query = `
            MATCH (g:Grievance)
            WITH count(g) AS totalGrievances
            
            OPTIONAL MATCH (g2:Grievance) WHERE g2.confidenceScore >= 10
            WITH totalGrievances, count(distinct g2) AS totalClusters
            
            OPTIONAL MATCH (w:Grievance)
            WITH totalGrievances, totalClusters, w.affectedWard AS ward, count(*) AS wardCount
            ORDER BY wardCount DESC LIMIT 1
            WITH totalGrievances, totalClusters, collect({ward: ward, count: wardCount})[0] AS topWard
            
            OPTIONAL MATCH (c:Grievance)
            WITH totalGrievances, totalClusters, topWard, c.category AS cat, count(*) AS catCount
            ORDER BY catCount DESC LIMIT 1
            WITH totalGrievances, totalClusters, topWard, collect({category: cat, count: catCount})[0] AS topCat
            
            OPTIONAL MATCH (g3:Grievance)-[:ROOT_CAUSE_BY]->(a:InfrastructureAsset)
            WITH totalGrievances, totalClusters, topWard, topCat, a.id AS assetId, count(*) AS assetCount
            ORDER BY assetCount DESC LIMIT 1
            WITH totalGrievances, totalClusters, topWard, topCat, collect({assetId: assetId, count: assetCount})[0] AS topAsset
            
            RETURN totalGrievances, totalClusters, topWard, topCat, topAsset
        `;
        const result = await session.executeRead(tx => tx.run(query));
        const rec = result.records[0];
        return rec ? rec.toObject() : {};
    } finally { await session.close(); }
};

// 3. Operational Intelligence Queries
export const getOperationalInsights = async () => {
    const session = getSession();
    try {
        const queries = {
            topDangerousRoads: `
                MATCH (g:Grievance {category: 'ROAD_HAZARD'})
                RETURN g.affectedWard AS location, count(g) AS incidentCount, avg(g.severity) AS severityRating
                ORDER BY incidentCount DESC LIMIT 5`,
            recurringWaterLeaks: `
                MATCH (g:Grievance {category: 'WATER_LEAK'})-[:ROOT_CAUSE_BY]->(a:InfrastructureAsset)
                RETURN a.id AS assetId, count(g) AS frequency, g.affectedWard AS ward
                ORDER BY frequency DESC LIMIT 5`,
            failureProneAssets: `
                MATCH (g:Grievance)-[:ROOT_CAUSE_BY]->(a:InfrastructureAsset)
                RETURN a.id AS assetId, count(g) AS failureCount
                ORDER BY failureCount DESC LIMIT 5`,
            officerWorkload: `
                MATCH (o:Officer)-[:ASSIGNED_TO]->(g:Grievance {status: 'PENDING'})
                RETURN o.id AS officerId, count(g) AS activeCases, max(g.confidenceScore) AS maxPriorityScore
                ORDER BY activeCases DESC LIMIT 5`
        };

        const insights = {};
        for (const [key, cypher] of Object.entries(queries)) {
            const res = await session.executeRead(tx => tx.run(cypher));
            insights[key] = res.records.map(r => r.toObject());
        }
        return insights;
    } finally { await session.close(); }
};
