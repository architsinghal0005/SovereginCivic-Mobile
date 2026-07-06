import { getSession } from '../repository/neo4j.js';

export const updateGrievancesStatus = async (req, res) => {
    const { grievanceIds, status } = req.body;
    
    if (!grievanceIds || !Array.isArray(grievanceIds) || grievanceIds.length === 0) {
        return res.status(400).json({ success: false, error: 'grievanceIds array is required' });
    }
    
    if (!status) {
        return res.status(400).json({ success: false, error: 'status is required' });
    }

    const session = getSession();

    const cypher = `
        UNWIND $grievanceIds AS gId
        MATCH (g:Grievance {id: gId})
        SET g.status = $status
        RETURN g.id AS id, g.status AS status
    `;

    try {
        const result = await session.executeWrite(tx => tx.run(cypher, { grievanceIds, status }));
        const updated = result.records.map(r => ({ id: r.get('id'), status: r.get('status') }));

        res.status(200).json({ success: true, updated });
    } catch (e) {
        console.error('Error updating grievances status:', e);
        res.status(500).json({ success: false, error: e.message });
    } finally {
        await session.close();
    }
};
