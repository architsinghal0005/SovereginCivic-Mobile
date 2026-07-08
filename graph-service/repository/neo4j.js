// graph-service/repository/neo4j.js
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the driver
let driver;
try {
  driver = neo4j.driver(
    process.env.NEO4J_URI || '',
    neo4j.auth.basic(process.env.NEO4J_USERNAME || '', process.env.NEO4J_PASSWORD || '')
  );
} catch (e) {
  console.error("❌ Failed to initialize Neo4j driver on startup. Check NEO4J_URI.", e.message);
}
export { driver };

// Session helper
export const getSession = () => {
  if (!driver) throw new Error("Neo4j driver is not initialized. Check your environment variables.");
  return driver.session();
};

// Auth check
export const checkAuth = async () => {
  try {
    if (!driver) throw new Error("Neo4j driver is not initialized.");
    await driver.verifyConnectivity();
    console.log("✅ Connection successfully established with AuraDB!");
  } catch (error) {
    console.error("❌ Connection failed. Check your .env credentials.");
    console.error("Error details:", error.message);
  }
};