import { describe, expect, it } from 'vitest';
import {
  EditorSession,
  MAX_JSON_PAYLOAD_LENGTH,
  MAX_NODES,
  MAX_TEXT_LENGTH,
  ToolCallResult,
  toolDefinitions
} from '../../src/mcp/tools.js';

const session = () => new EditorSession();
const call = (s: EditorSession, name: string, args: Record<string, unknown> = {}) =>
  s.callTool(name, args);
const textOf = (result: ToolCallResult): string => result.content[0].text;
const isError = (result: ToolCallResult): boolean => result.isError === true;

describe('mcp tool contracts', () => {
  it('exposes six uniquely named tools with object schemas', () => {
    expect(toolDefinitions).toHaveLength(6);
    const names = toolDefinitions.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
    for (const tool of toolDefinitions) {
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('runs the happy path: create -> add -> connect -> validate -> export', () => {
    const s = session();
    expect(isError(call(s, 'create_diagram'))).toBe(false);
    expect(isError(call(s, 'add_node', { id: 'n1', label: 'Start' }))).toBe(false);
    expect(isError(call(s, 'add_node', { id: 'n2', label: 'End' }))).toBe(false);
    expect(
      isError(call(s, 'add_edge', { id: 'e1', from: 'n1', to: 'n2', label: 'flow' }))
    ).toBe(false);
    expect(isError(call(s, 'validate_diagram'))).toBe(false);
    const exported = JSON.parse(textOf(call(s, 'export_json')));
    expect(exported.nodes).toHaveLength(2);
    expect(exported.edges).toHaveLength(1);
    expect(exported.edges[0].label).toBe('flow');
  });

  it('rejects tool calls before a diagram exists', () => {
    const result = call(session(), 'add_node', { id: 'n1', label: 'x' });
    expect(isError(result)).toBe(true);
    expect(textOf(result)).toMatch(/create_diagram/);
  });

  it('rejects duplicate node and edge ids', () => {
    const s = session();
    call(s, 'create_diagram');
    call(s, 'add_node', { id: 'n1', label: 'A' });
    expect(textOf(call(s, 'add_node', { id: 'n1', label: 'B' }))).toMatch(/already exists/);
    call(s, 'add_node', { id: 'n2', label: 'B' });
    call(s, 'add_edge', { id: 'e1', from: 'n1', to: 'n2' });
    expect(textOf(call(s, 'add_edge', { id: 'e1', from: 'n1', to: 'n2' }))).toMatch(
      /already exists/
    );
  });

  it('rejects edges referencing missing nodes', () => {
    const s = session();
    call(s, 'create_diagram');
    call(s, 'add_node', { id: 'n1', label: 'A' });
    const result = call(s, 'add_edge', { id: 'e1', from: 'n1', to: 'missing' });
    expect(isError(result)).toBe(true);
    expect(textOf(result)).toMatch(/must reference existing nodes/);
  });

  it('round-trips a diagram across sessions via export/import', () => {
    const a = session();
    call(a, 'create_diagram');
    call(a, 'add_node', { id: 'n1', label: 'A' });
    call(a, 'add_node', { id: 'n2', label: 'B' });
    call(a, 'add_edge', { id: 'e1', from: 'n1', to: 'n2', label: 'l' });
    const exported = textOf(call(a, 'export_json'));

    const b = session();
    expect(isError(call(b, 'import_json', { json: exported }))).toBe(false);
    expect(textOf(call(b, 'export_json'))).toBe(exported);
    expect(isError(call(b, 'validate_diagram'))).toBe(false);
  });

  it('rejects malformed imports', () => {
    const s = session();
    expect(textOf(call(s, 'import_json', { json: 'not-json' }))).toMatch(/Invalid JSON/);
    const result = call(s, 'import_json', {
      json: JSON.stringify({ version: 2, nodes: [], edges: [] })
    });
    expect(isError(result)).toBe(true);
  });

  it('rejects invalid argument types and missing required arguments', () => {
    const s = session();
    call(s, 'create_diagram');
    expect(textOf(call(s, 'add_node', { id: 42, label: 'x' }))).toMatch(/must be a string/);
    expect(textOf(call(s, 'add_node', { id: 'n1' }))).toMatch(/Missing required argument: label/);
    expect(textOf(call(s, 'add_edge', { id: 'e1' }))).toMatch(/Missing required argument/);
  });

  it('enforces size limits', () => {
    const s = session();
    call(s, 'create_diagram');
    expect(
      textOf(call(s, 'add_node', { id: 'n1', label: 'x'.repeat(MAX_TEXT_LENGTH + 1) }))
    ).toMatch(/maximum length/);
    expect(
      textOf(call(s, 'import_json', { json: ' '.repeat(MAX_JSON_PAYLOAD_LENGTH + 1) }))
    ).toMatch(/maximum length/);
    const tooManyNodes = JSON.stringify({
      version: 1,
      nodes: Array.from({ length: MAX_NODES + 1 }, (_, i) => ({ id: 'n' + i, label: 'x' })),
      edges: []
    });
    expect(textOf(call(s, 'import_json', { json: tooManyNodes }))).toMatch(/node limit/);
  });

  it('accepts an optional edge label and an empty node label', () => {
    const s = session();
    call(s, 'create_diagram');
    expect(isError(call(s, 'add_node', { id: 'n1', label: '' }))).toBe(false);
    expect(isError(call(s, 'add_edge', { id: 'e1', from: 'n1', to: 'n1' }))).toBe(false);
  });

  it('reports unknown tools as tool errors', () => {
    const result = call(session(), 'definitely_not_a_tool');
    expect(isError(result)).toBe(true);
    expect(textOf(result)).toMatch(/Unknown tool/);
  });
});
