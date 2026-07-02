import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import neo4j from "neo4j-driver";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

export const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

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
