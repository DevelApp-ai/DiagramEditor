import { describe, expect, it } from 'vitest';
import {
  DiagramValidationError,
  addEdge,
  addNode,
  createDiagram,
  validateDiagram
} from '../../src/domain/diagram.js';

describe('diagram domain', () => {
  it('adds nodes and edges when references are valid', () => {
    let diagram = createDiagram();
    diagram = addNode(diagram, { id: 'n1', label: 'Start' });
    diagram = addNode(diagram, { id: 'n2', label: 'End' });
    diagram = addEdge(diagram, { id: 'e1', from: 'n1', to: 'n2' });

    expect(diagram.nodes).toHaveLength(2);
    expect(diagram.edges).toHaveLength(1);
  });

  it('rejects duplicate node IDs', () => {
    let diagram = createDiagram();
    diagram = addNode(diagram, { id: 'n1', label: 'Start' });

    expect(() =>
      addNode(diagram, { id: 'n1', label: 'Duplicate' })
    ).toThrow(DiagramValidationError);
  });

  it('rejects edges to missing nodes', () => {
    const diagram = createDiagram();

    expect(() =>
      addEdge(diagram, { id: 'e1', from: 'a', to: 'b' })
    ).toThrow(DiagramValidationError);
  });

  it('validates node and edge uniqueness', () => {
    expect(() =>
      validateDiagram({
        version: 1,
        nodes: [
          { id: 'n1', label: 'A' },
          { id: 'n1', label: 'B' }
        ],
        edges: []
      })
    ).toThrow(DiagramValidationError);
  });
});
