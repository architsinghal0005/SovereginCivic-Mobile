import { getSession } from '../repository/neo4j.js';

export const getCitizenGrievances = async (req, res) => {
    const { citizenId } = req.params;
    const session = getSession();

    const cypher = `
        MATCH (c:Citizen {id: $citizenId})-[:FILED]->(g:Grievance)
        RETURN g
        ORDER BY g.createdAt DESC
    `;

    try {
        const result = await session.executeRead(tx => tx.run(cypher, { citizenId }));
        const grievances = result.records.map(record => {
            const node = record.get('g');
            // Neo4j nodes have a properties object
            return node.properties;
        });

        res.status(200).json({ success: true, grievances });
    } catch (e) {
        console.error('Error fetching citizen grievances:', e);
        res.status(500).json({ success: false, error: e.message });
    } finally {
        await session.close();
    }
};
