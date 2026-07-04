import neo4j, { Driver } from 'neo4j-driver';
import { logger } from '../utils/logger';

class Neo4jService {
  private driver: Driver;

  constructor() {
    const uri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
    const user = process.env.NEO4J_USERNAME || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }

  public async getDashboardStats() {
    const session = this.driver.session();
    try {
      const result = await session.executeRead(tx => tx.run(`
        OPTIONAL MATCH (g:Grievance)
        WITH count(g) AS totalComplaints
        
        OPTIONAL MATCH (pending:Grievance {status: 'PENDING'})
        WITH totalComplaints, count(pending) AS pending
        
        OPTIONAL MATCH (resolved:Grievance {status: 'RESOLVED'})
        WITH totalComplaints, pending, count(resolved) AS resolved
        
        OPTIONAL MATCH (c:InfrastructureAsset)
        WITH totalComplaints, pending, resolved, count(c) AS clusterCount
        
        RETURN totalComplaints, pending, resolved, clusterCount
      `));
      
      const record = result.records[0];
      return {
        totalComplaints: record ? record.get('totalComplaints').toNumber() : 0,
        pending: record ? record.get('pending').toNumber() : 0,
        resolved: record ? record.get('resolved').toNumber() : 0,
        clusterCount: record ? record.get('clusterCount').toNumber() : 0,
        averageResponseTime: '24h' // Mocked or calculated
      };
    } catch (error: any) {
      logger.error('Error fetching dashboard stats from Neo4j', { error: error.message });
      throw error;
    } finally {
      await session.close();
    }
  }

  public async close() {
    await this.driver.close();
  }
}

export const neo4jService = new Neo4jService();
