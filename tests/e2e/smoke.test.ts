import { describe, expect, it } from 'vitest';
import {
  addEdge,
  addNode,
  createDiagram,
  exportDiagramToJson,
  importDiagramFromJson,
  validateDiagram
} from '../../src/index.js';

describe('e2e smoke: create->serialize->import->validate', () => {
  it('supports the core MVP flow', () => {
    let diagram = createDiagram();
    diagram = addNode(diagram, { id: 'n-start', label: 'Start' });
    diagram = addNode(diagram, { id: 'n-end', label: 'End' });
    diagram = addEdge(diagram, { id: 'e-main', from: 'n-start', to: 'n-end' });

    const json = exportDiagramToJson(diagram);
    const loaded = importDiagramFromJson(json);

    expect(() => validateDiagram(loaded)).not.toThrow();
    expect(loaded.nodes.map((n) => n.id)).toEqual(['n-start', 'n-end']);
  });
});
