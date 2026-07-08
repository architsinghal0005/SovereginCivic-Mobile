import { getSession } from '../repository/neo4j.js';
import dotenv from 'dotenv';
dotenv.config();

const initDB = async () => {
    const session = getSession();
    
    const constraints = [
        `CREATE CONSTRAINT citizen_id IF NOT EXISTS FOR (c:Citizen) REQUIRE c.id IS UNIQUE`,
        `CREATE CONSTRAINT grievance_id IF NOT EXISTS FOR (g:Grievance) REQUIRE g.id IS UNIQUE`,
        `CREATE CONSTRAINT ward_id IF NOT EXISTS FOR (w:Ward) REQUIRE w.id IS UNIQUE`,
        `CREATE POINT INDEX grievance_point IF NOT EXISTS FOR (g:Grievance) ON (g.point)`
    ];

    try {
        for (const query of constraints) {
            console.log(`Executing: ${query}`);
            await session.executeWrite(tx => tx.run(query));
        }
        console.log("✅ Neo4j Database constraints and indexes initialized successfully.");
    } catch (error) {
        console.error("❌ Failed to initialize database:", error);
    } finally {
        await session.close();
        process.exit(0);
    }
};

initDB();
