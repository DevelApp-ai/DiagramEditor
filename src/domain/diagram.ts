export interface DiagramNode {
  id: string;
  label: string;
}

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface DiagramDocument {
  version: 1;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export class DiagramValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiagramValidationError';
  }
}

export function createDiagram(): DiagramDocument {
  return { version: 1, nodes: [], edges: [] };
}

export function addNode(
  diagram: DiagramDocument,
  node: DiagramNode
): DiagramDocument {
  if (diagram.nodes.some((existing) => existing.id === node.id)) {
    throw new DiagramValidationError(`Node id already exists: ${node.id}`);
  }

  return {
    ...diagram,
    nodes: [...diagram.nodes, node]
  };
}

export function addEdge(
  diagram: DiagramDocument,
  edge: DiagramEdge
): DiagramDocument {
  if (diagram.edges.some((existing) => existing.id === edge.id)) {
    throw new DiagramValidationError(`Edge id already exists: ${edge.id}`);
  }

  const fromExists = diagram.nodes.some((node) => node.id === edge.from);
  const toExists = diagram.nodes.some((node) => node.id === edge.to);

  if (!fromExists || !toExists) {
    throw new DiagramValidationError(
      `Edge endpoints must reference existing nodes: ${edge.id}`
    );
  }

  return {
    ...diagram,
    edges: [...diagram.edges, edge]
  };
}

export function validateDiagram(diagram: DiagramDocument): void {
  const nodeIds = new Set<string>();
  for (const node of diagram.nodes) {
    if (nodeIds.has(node.id)) {
      throw new DiagramValidationError(`Duplicate node id: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  const edgeIds = new Set<string>();
  for (const edge of diagram.edges) {
    if (edgeIds.has(edge.id)) {
      throw new DiagramValidationError(`Duplicate edge id: ${edge.id}`);
    }
    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      throw new DiagramValidationError(
        `Edge endpoints must reference existing nodes: ${edge.id}`
      );
    }
  }
}
