const crypto = require('crypto');

class CampaignClusteringService {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
  }

  _getModel(name) {
    if (this.dependencies[name]) return this.dependencies[name];
    try {
      return require(`../../models/${name}`);
    } catch {
      return null;
    }
  }

  async discoverClusters(organizationId, options = {}) {
    const scope = organizationId ? { organizationId } : {};
    const maxClusters = Math.min(options.limit || 20, 50);

    const EdgeModel = this._getModel('SecurityGraphEdge');
    const NodeModel = this._getModel('SecurityGraphNode');

    if (!EdgeModel || !NodeModel) {
      return {
        clusters: [],
        totalClusters: 0,
        determination: 'INSUFFICIENT_EVIDENCE',
        rationale: 'Security Graph Data Fabric models unavailable.'
      };
    }

    let edges = [];
    try {
      edges = await EdgeModel.find(scope).limit(200).lean();
    } catch {
      edges = [];
    }

    if (edges.length === 0) {
      return {
        clusters: [],
        totalClusters: 0,
        determination: 'INSUFFICIENT_EVIDENCE',
        rationale: 'No graph edges observed in tenant Data Fabric.'
      };
    }

    // Build adjacency graph of deterministic relationships
    const adjacency = new Map();
    edges.forEach((edge) => {
      const u = edge.fromNode;
      const v = edge.toNode;
      if (!adjacency.has(u)) adjacency.set(u, []);
      if (!adjacency.has(v)) adjacency.set(v, []);
      adjacency.get(u).push({ neighbor: v, edge });
      adjacency.get(v).push({ neighbor: u, edge });
    });

    const visited = new Set();
    const clusters = [];

    for (const [nodeId, neighbors] of adjacency.entries()) {
      if (visited.has(nodeId)) continue;

      const componentNodes = [];
      const componentEdges = [];
      const queue = [nodeId];
      visited.add(nodeId);

      while (queue.length > 0) {
        const curr = queue.shift();
        componentNodes.push(curr);

        const edgeList = adjacency.get(curr) || [];
        for (const item of edgeList) {
          if (!componentEdges.some(e => e.edgeId === item.edge.edgeId)) {
            componentEdges.push(item.edge);
          }
          if (!visited.has(item.neighbor)) {
            visited.add(item.neighbor);
            queue.push(item.neighbor);
          }
        }
      }

      // Only consider components with >= 2 nodes
      if (componentNodes.length >= 2) {
        // Classify cluster determination based on size and evidence density
        let determination = 'RELATED_ACTIVITY';
        if (componentNodes.length >= 5 && componentEdges.length >= 4) {
          determination = 'CAMPAIGN_CANDIDATE';
        } else if (componentNodes.length >= 3) {
          determination = 'POTENTIAL_CLUSTER';
        }

        const componentKey = crypto.createHash('sha256').update(componentNodes.slice().sort().join(',')).digest('hex').substring(0, 10).toUpperCase();
        const clusterId = `CLUSTER-${componentKey}`;
        clusters.push({
          clusterId,
          organizationId,
          title: `Activity Cluster ${clusters.length + 1} (${componentNodes.length} entities)`,
          determination,
          nodeCount: componentNodes.length,
          edgeCount: componentEdges.length,
          nodes: componentNodes,
          sharedRelationships: componentEdges.map(e => ({
            relationshipType: e.relationshipType,
            provenanceType: e.provenanceType,
            confidence: e.confidence
          })),
          attackerAttribution: 'UNKNOWN',
          attributionDisclaimer: 'Strict Attribution Guard: Attacker attribution is strictly UNKNOWN without verified external intelligence backing.'
        });

        if (clusters.length >= maxClusters) break;
      }
    }

    return {
      totalClusters: clusters.length,
      determination: clusters.length > 0 ? 'DERIVED' : 'INSUFFICIENT_EVIDENCE',
      clusters
    };
  }

  async getClusterDetails(organizationId, clusterId) {
    const discovery = await this.discoverClusters(organizationId);
    const match = discovery.clusters.find(c => c.clusterId === clusterId);
    if (!match) {
      return {
        clusterId,
        determination: 'INSUFFICIENT_EVIDENCE',
        error: 'Cluster not found in active graph topology.'
      };
    }
    return match;
  }

  async explainCluster(organizationId, clusterId) {
    const cluster = await this.getClusterDetails(organizationId, clusterId);
    if (cluster.error) return cluster;

    return {
      clusterId: cluster.clusterId,
      determination: cluster.determination,
      observedFacts: {
        nodeCount: cluster.nodeCount,
        edgeCount: cluster.edgeCount,
        nodes: cluster.nodes
      },
      derivedFactors: [
        `Cluster formed via ${cluster.edgeCount} deterministic edges in the Phase 78 Security Data Fabric.`,
        `Relationship density indicates ${cluster.determination}.`
      ],
      unresolvedUncertainty: [
        'Root cause attribution remains unverified.',
        'Temporal sequence may not represent causal progression.'
      ],
      attributionStatus: 'UNKNOWN',
      limitations: 'Attribution and campaign motives cannot be confirmed without authoritative external Threat Intel feeds.'
    };
  }
}

module.exports = CampaignClusteringService;
