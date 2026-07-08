import express from "express";
import { checkAuth } from "./repository/neo4j.js"; 
import graphRoutes from "./routes/graph.routes.js";

const app = express();
app.use(express.json());

// Initialize Database connection
checkAuth();

// Register modular routes
app.use("/api/graph", graphRoutes);

// Global Error Handler or basic listener
app.listen(process.env.PORT || 4000, () => {
    console.log(`🚀 SovereignCivic server running on port ${process.env.PORT || 4000}`);
});