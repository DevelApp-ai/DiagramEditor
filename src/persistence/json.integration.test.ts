import { describe, expect, it } from 'vitest';
import {
  DiagramValidationError,
  addEdge,
  addNode,
  createDiagram
} from '../domain/diagram.js';
import { exportDiagramToJson, importDiagramFromJson } from './json.js';

describe('json persistence integration', () => {
  it('round-trips a valid diagram', () => {
    let diagram = createDiagram();
    diagram = addNode(diagram, { id: 'n1', label: 'Start' });
    diagram = addNode(diagram, { id: 'n2', label: 'End' });
    diagram = addEdge(diagram, { id: 'e1', from: 'n1', to: 'n2', label: 'flow' });

    const json = exportDiagramToJson(diagram);
    const restored = importDiagramFromJson(json);

    expect(restored).toEqual(diagram);
  });

  it('rejects malformed json payloads', () => {
    expect(() => importDiagramFromJson('not-json')).toThrow(DiagramValidationError);
  });

  it('rejects valid json with invalid schema', () => {
    const payload = JSON.stringify({ version: 2, nodes: [], edges: [] });
    expect(() => importDiagramFromJson(payload)).toThrow(DiagramValidationError);
  });
});
