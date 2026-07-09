import express from "express";
import cors from "cors";
import { checkAuth } from "./repository/neo4j.js"; 
import graphRoutes from "./routes/graph.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database connection
checkAuth();

console.log("SERVER STARTED");
console.log("Mounting graph routes...");
app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Server is working"
  });
});
console.log("=================================");
console.log("GRAPH SERVICE BUILD v1.0.7");
console.log("=================================");
console.log(import.meta.url);

app.get("/", (req, res) => {
    res.send("GRAPH ROOT WORKS");
});

app.get("/test", (req, res) => {
    console.log("TEST ROUTE HIT");
    res.json({
        success: true,
        message: "Server is working"
    });
});

// Register modular routes
app.use("/api/graph", graphRoutes);

// Global Error Handler or basic listener
app.listen(process.env.PORT || 4000, () => {
    console.log(`🚀 SovereignCivic server running on port ${process.env.PORT || 4000}`);
});