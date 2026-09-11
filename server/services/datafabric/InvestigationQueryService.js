const crypto = require('crypto');
const SecurityGraphNode = require('../../models/SecurityGraphNode');
const SecurityGraphEdge = require('../../models/SecurityGraphEdge');
const InvestigationGraphSnapshot = require('../../models/InvestigationGraphSnapshot');
const EntityNormalizationService = require('./EntityNormalizationService');

class InvestigationQueryService {
  /**
   * Bounded Neighborhood Expansion Query
   */
  static async queryNeighborhood({
    entityType,
    entityId,
    organizationId = null,
    maxDepth = 2,
    maxNodes = 100,
    maxEdges = 250
  }) {
    const rootNodeId = EntityNormalizationService.toNodeId(entityType, entityId);
    const orgQuery = organizationId ? { organizationId } : {};

    const rootNode = await SecurityGraphNode.findOne({ ...orgQuery, nodeId: rootNodeId }).lean();
    if (!rootNode) {
      return { rootNode: null, nodes: [], edges: [], totalNodes: 0, totalEdges: 0 };
    }

    const visitedNodes = new Map();
    const visitedEdges = new Map();

    visitedNodes.set(rootNode.nodeId, rootNode);

    let currentLayer = [rootNode.nodeId];
    let depth = 0;

    while (depth < maxDepth && currentLayer.length > 0 && visitedNodes.size < maxNodes) {
      const nextLayer = [];

      const edges = await SecurityGraphEdge.find({
        ...orgQuery,
        $or: [
          { fromNode: { $in: currentLayer } },
          { toNode: { $in: currentLayer } }
        ]
      }).limit(maxEdges - visitedEdges.size).lean();

      for (const edge of edges) {
        if (!visitedEdges.has(edge.edgeId)) {
          visitedEdges.set(edge.edgeId, edge);

          const otherNodeId = currentLayer.includes(edge.fromNode) ? edge.toNode : edge.fromNode;

          if (!visitedNodes.has(otherNodeId) && visitedNodes.size < maxNodes) {
            const targetNode = await SecurityGraphNode.findOne({ ...orgQuery, nodeId: otherNodeId }).lean();
            if (targetNode) {
              visitedNodes.set(otherNodeId, targetNode);
              nextLayer.push(otherNodeId);
            }
          }
        }
      }

      currentLayer = nextLayer;
      depth++;
    }

    return {
      rootNode,
      nodes: Array.from(visitedNodes.values()),
      edges: Array.from(visitedEdges.values()),
      totalNodes: visitedNodes.size,
      totalEdges: visitedEdges.size
    };
  }

  /**
   * Shortest Path Discovery between two nodes
   */
  static async findShortestPath(fromType, fromId, toType, toId, organizationId = null) {
    const startNodeId = EntityNormalizationService.toNodeId(fromType, fromId);
    const endNodeId = EntityNormalizationService.toNodeId(toType, toId);

    const orgQuery = organizationId ? { organizationId } : {};

    const startNode = await SecurityGraphNode.findOne({ ...orgQuery, nodeId: startNodeId }).lean();
    const endNode = await SecurityGraphNode.findOne({ ...orgQuery, nodeId: endNodeId }).lean();

    if (!startNode || !endNode) {
      return { pathFound: false, pathNodes: [], pathEdges: [], length: 0 };
    }

    if (startNodeId === endNodeId) {
      return { pathFound: true, pathNodes: [startNode], pathEdges: [], length: 0 };
    }

    // BFS Search up to max depth 4
    const queue = [[startNodeId]];
    const parentEdgeMap = new Map();
    const visited = new Set([startNodeId]);
    let pathFound = false;
    let finalPathIds = [];

    while (queue.length > 0) {
      const currentPath = queue.shift();
      const lastId = currentPath[currentPath.length - 1];

      if (lastId === endNodeId) {
        pathFound = true;
        finalPathIds = currentPath;
        break;
      }

      if (currentPath.length > 4) continue;

      const edges = await SecurityGraphEdge.find({
        ...orgQuery,
        $or: [{ fromNode: lastId }, { toNode: lastId }]
      }).limit(50).lean();

      for (const edge of edges) {
        const neighborId = edge.fromNode === lastId ? edge.toNode : edge.fromNode;
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          parentEdgeMap.set(`${lastId}->${neighborId}`, edge);
          queue.push([...currentPath, neighborId]);
        }
      }
    }

    if (!pathFound) {
      return { pathFound: false, pathNodes: [], pathEdges: [], length: 0 };
    }

    const pathNodes = await SecurityGraphNode.find({ ...orgQuery, nodeId: { $in: finalPathIds } }).lean();
    const pathEdges = [];

    for (let i = 0; i < finalPathIds.length - 1; i++) {
      const key = `${finalPathIds[i]}->${finalPathIds[i + 1]}`;
      const edge = parentEdgeMap.get(key);
      if (edge) pathEdges.push(edge);
    }

    return {
      pathFound: true,
      pathNodes,
      pathEdges,
      length: pathEdges.length
    };
  }

  /**
   * Unified Investigation Timeline Fusion from Graph Records
   */
  static async queryUnifiedTimeline(organizationId = null, filter = {}) {
    const orgQuery = organizationId ? { organizationId } : {};

    const nodes = await SecurityGraphNode.find({ ...orgQuery, ...filter })
      .sort({ firstObservedAt: -1 })
      .limit(100)
      .lean();

    const timelineEvents = nodes.map(n => ({
      eventId: `EV-${n.nodeId}`,
      timestamp: n.firstObservedAt,
      entityType: n.entityType,
      entityId: n.entityId,
      title: n.displayName,
      classification: n.classification,
      source: n.source,
      metadata: n.metadata,
      organizationId: n.organizationId
    }));

    return {
      totalEvents: timelineEvents.length,
      events: timelineEvents
    };
  }

  /**
   * Create Immutable Investigation Graph Snapshot
   */
  static async createSnapshot({
    rootEntityType,
    rootEntityId,
    queryDefinition = {},
    user,
    organizationId = null
  }) {
    const neighborhood = await this.queryNeighborhood({
      entityType: rootEntityType,
      entityId: rootEntityId,
      organizationId
    });

    const contentData = {
      root: { entityType: rootEntityType, entityId: rootEntityId },
      nodes: neighborhood.nodes.map(n => n.nodeId),
      edges: neighborhood.edges.map(e => e.edgeId)
    };

    const contentHash = crypto.createHash('sha256').update(JSON.stringify(contentData)).digest('hex');
    const snapshotId = `SNAP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const snapshot = await InvestigationGraphSnapshot.create({
      snapshotId,
      organizationId,
      rootEntity: { entityType: rootEntityType, entityId: rootEntityId },
      nodeCount: neighborhood.totalNodes,
      edgeCount: neighborhood.totalEdges,
      queryDefinition,
      nodesSnapshot: neighborhood.nodes,
      edgesSnapshot: neighborhood.edges,
      generatedAt: new Date(),
      contentHash,
      evidenceReferences: [`SNAP_REF_${snapshotId}`, `HASH_${contentHash}`],
      createdBy: {
        userId: user?.userId || user?.id || 'ANALYST',
        username: user?.username || 'analyst',
        role: user?.role || 'ANALYST'
      }
    });

    return snapshot;
  }

  /**
   * Verify Snapshot Integrity
   */
  static async verifySnapshotIntegrity(snapshotId, organizationId = null) {
    const query = { snapshotId };
    if (organizationId) query.organizationId = organizationId;

    const snapshot = await InvestigationGraphSnapshot.findOne(query).lean();
    if (!snapshot) throw new Error(`Snapshot ${snapshotId} not found`);

    const contentData = {
      root: snapshot.rootEntity,
      nodes: snapshot.nodesSnapshot.map(n => n.nodeId),
      edges: snapshot.edgesSnapshot.map(e => e.edgeId)
    };

    const rederivedHash = crypto.createHash('sha256').update(JSON.stringify(contentData)).digest('hex');
    const isValid = rederivedHash === snapshot.contentHash;

    return {
      snapshotId,
      isValid,
      expectedHash: snapshot.contentHash,
      rederivedHash,
      generatedAt: snapshot.generatedAt
    };
  }

  /**
   * Graph Integrity Diagnostic Report (Orphan nodes & invalid edges)
   */
  static async checkGraphIntegrity(organizationId = null) {
    const orgQuery = organizationId ? { organizationId } : {};

    const allNodes = await SecurityGraphNode.find(orgQuery).lean();
    const allEdges = await SecurityGraphEdge.find(orgQuery).lean();

    const nodeIds = new Set(allNodes.map(n => n.nodeId));
    let orphanNodeCount = 0;
    let invalidEdgeCount = 0;

    const edgeNodeIds = new Set();
    allEdges.forEach(e => {
      edgeNodeIds.add(e.fromNode);
      edgeNodeIds.add(e.toNode);
      if (!nodeIds.has(e.fromNode) || !nodeIds.has(e.toNode)) {
        invalidEdgeCount++;
      }
    });

    allNodes.forEach(n => {
      if (!edgeNodeIds.has(n.nodeId)) {
        orphanNodeCount++;
      }
    });

    return {
      evaluatedAt: new Date(),
      totalNodes: allNodes.length,
      totalEdges: allEdges.length,
      orphanNodeCount,
      invalidEdgeCount,
      integrityScore: allNodes.length > 0 ? Number((((allNodes.length - orphanNodeCount) / allNodes.length) * 100).toFixed(2)) : 100.0
    };
  }
}

module.exports = InvestigationQueryService;
