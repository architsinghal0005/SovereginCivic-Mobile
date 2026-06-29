import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
dotenv.config();

export const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD));

export const getSession = () => driver.session();

export const checkAuth = async () => {
    try {
        await driver.verifyConnectivity();
        console.log("✅ Connection successfully established with AuraDB!");
    } catch (error) {
        console.error("❌ Connection failed. Check your .env credentials.");
        console.error("Error details:", error.message);
    }
};