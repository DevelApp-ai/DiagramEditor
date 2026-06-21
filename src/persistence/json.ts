import {
  DiagramDocument,
  DiagramValidationError,
  validateDiagram
} from '../domain/diagram.js';

export function exportDiagramToJson(diagram: DiagramDocument): string {
  validateDiagram(diagram);
  return JSON.stringify(diagram, null, 2);
}

export function importDiagramFromJson(input: string): DiagramDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new DiagramValidationError('Invalid JSON payload');
  }

  if (!isDiagramDocument(parsed)) {
    throw new DiagramValidationError('JSON does not match DiagramDocument schema');
  }

  validateDiagram(parsed);
  return parsed;
}

function isDiagramDocument(value: unknown): value is DiagramDocument {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as {
    version?: unknown;
    nodes?: unknown;
    edges?: unknown;
  };

  if (candidate.version !== 1) {
    return false;
  }

  if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)) {
    return false;
  }

  return (
    candidate.nodes.every(
      (n) =>
        typeof n === 'object' &&
        n !== null &&
        typeof (n as { id?: unknown }).id === 'string' &&
        typeof (n as { label?: unknown }).label === 'string'
    ) &&
    candidate.edges.every(
      (e) =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as { id?: unknown }).id === 'string' &&
        typeof (e as { from?: unknown }).from === 'string' &&
        typeof (e as { to?: unknown }).to === 'string' &&
        ((e as { label?: unknown }).label === undefined ||
          typeof (e as { label?: unknown }).label === 'string')
    )
  );
}
