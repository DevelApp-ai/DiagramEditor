import {
  DiagramDocument,
  DiagramEdge,
  DiagramNode,
  DiagramValidationError,
  validateDiagram
} from '../domain/diagram.js';

/**
 * draw.io (mxGraphModel) XML support.
 *
 * Supported subset: vertices (nodes) and edges with labels, mapped onto the
 * core DiagramDocument model. Geometry, styles, and other mxCell attributes
 * are not preserved. Structural cells (id "0" and "1") are ignored.
 */

const ALLOWED_CHILDREN: Readonly<Record<string, readonly string[]>> = {
  document: ['mxGraphModel'],
  mxGraphModel: ['root'],
  root: ['mxCell'],
  mxCell: ['mxGeometry'],
  mxGeometry: []
};

interface MxCell {
  readonly id: string | undefined;
  readonly value: string | undefined;
  readonly vertex: boolean;
  readonly edge: boolean;
  readonly source: string | undefined;
  readonly target: string | undefined;
}

const TOKEN =
  /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<(\/?)([A-Za-z][\w.-]*)((?:\s+[A-Za-z_][\w.-]*\s*=\s*"[^"]*")*)\s*(\/?)>/g;
const ATTRIBUTE = /([A-Za-z_][\w.-]*)\s*=\s*"([^"]*)"/g;

function decodeXmlEntities(value: string): string {
  if (/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/.test(value)) {
    throw new DiagramValidationError('Unsupported XML entity in attribute value');
  }
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => codePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => codePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function codePoint(cp: number): string {
  if (!Number.isInteger(cp) || cp < 0 || cp > 0x10ffff) {
    throw new DiagramValidationError('Invalid XML character reference');
  }
  return String.fromCodePoint(cp);
}

function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function importDiagramFromDrawioXml(input: string): DiagramDocument {
  const cells = parseCells(input);
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  for (const cell of cells) {
    if (cell.id === undefined || cell.id.length === 0) {
      throw new DiagramValidationError('mxCell is missing an id');
    }
    if (cell.vertex && cell.edge) {
      throw new DiagramValidationError(
        'mxCell cannot be both vertex and edge: ' + cell.id
      );
    }
    if (cell.vertex) {
      nodes.push({ id: cell.id, label: cell.value ?? '' });
    } else if (cell.edge) {
      if (cell.source === undefined || cell.source.length === 0) {
        throw new DiagramValidationError('Edge mxCell is missing source: ' + cell.id);
      }
      if (cell.target === undefined || cell.target.length === 0) {
        throw new DiagramValidationError('Edge mxCell is missing target: ' + cell.id);
      }
      edges.push(
        cell.value === undefined
          ? { id: cell.id, from: cell.source, to: cell.target }
          : { id: cell.id, from: cell.source, to: cell.target, label: cell.value }
      );
    }
    // Structural cells (id "0", "1", or any non-vertex/non-edge cell) are ignored.
  }

  const document: DiagramDocument = { version: 1, nodes, edges };
  validateDiagram(document);
  return document;
}

export function exportDiagramToDrawioXml(diagram: DiagramDocument): string {
  validateDiagram(diagram);
  const lines: string[] = [];
  lines.push('<mxGraphModel>');
  lines.push('  <root>');
  lines.push('    <mxCell id="0"/>');
  lines.push('    <mxCell id="1" parent="0"/>');
  for (const node of diagram.nodes) {
    lines.push(
      '    <mxCell id="' +
        escapeXmlAttribute(node.id) +
        '" value="' +
        escapeXmlAttribute(node.label) +
        '" vertex="1" parent="1">'
    );
    lines.push('      <mxGeometry as="geometry"/>');
    lines.push('    </mxCell>');
  }
  for (const edge of diagram.edges) {
    const valueAttribute =
      edge.label === undefined ? '' : ' value="' + escapeXmlAttribute(edge.label) + '"';
    lines.push(
      '    <mxCell id="' +
        escapeXmlAttribute(edge.id) +
        '"' +
        valueAttribute +
        ' edge="1" parent="1" source="' +
        escapeXmlAttribute(edge.from) +
        '" target="' +
        escapeXmlAttribute(edge.to) +
        '">'
    );
    lines.push('      <mxGeometry relative="1" as="geometry"/>');
    lines.push('    </mxCell>');
  }
  lines.push('  </root>');
  lines.push('</mxGraphModel>');
  return lines.join('\n') + '\n';
}

function parseCells(input: string): MxCell[] {
  if (input.replace(/<!--[\s\S]*?-->/g, '').includes('<!')) {
    throw new DiagramValidationError(
      'Unsupported XML construct (DOCTYPE, CDATA, or entity declaration)'
    );
  }

  const stack: string[] = ['document'];
  const cells: MxCell[] = [];
  let sawModel = false;
  let cursor = 0;

  TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN.exec(input)) !== null) {
    if (!/^\s*$/.test(input.slice(cursor, match.index))) {
      throw new DiagramValidationError('Unexpected text content in draw.io XML');
    }
    cursor = match.index + match[0].length;

    if (match[0].startsWith('<!--') || match[0].startsWith('<?')) {
      continue;
    }

    const name = match[2];
    const isClosing = match[1] === '/';
    const isSelfClosing = match[4] === '/';

    if (isClosing) {
      if (stack.length < 2 || stack[stack.length - 1] !== name) {
        throw new DiagramValidationError('Mismatched closing element: ' + name);
      }
      stack.pop();
      continue;
    }

    const parent = stack[stack.length - 1];
    if (parent === undefined || !ALLOWED_CHILDREN[parent].includes(name)) {
      throw new DiagramValidationError(
        'Unexpected element <' + name + '> inside <' + (parent ?? '?') + '>'
      );
    }
    if (name === 'mxGraphModel') {
      sawModel = true;
    }
    if (name === 'mxCell') {
      const attrs: Record<string, string> = {};
      let attrMatch: RegExpExecArray | null;
      ATTRIBUTE.lastIndex = 0;
      const attrBlock = match[3];
      while ((attrMatch = ATTRIBUTE.exec(attrBlock)) !== null) {
        attrs[attrMatch[1]] = decodeXmlEntities(attrMatch[2]);
      }
      cells.push({
        id: attrs.id,
        value: attrs.value,
        vertex: attrs.vertex === '1',
        edge: attrs.edge === '1',
        source: attrs.source,
        target: attrs.target
      });
    }
    if (!isSelfClosing) {
      stack.push(name);
    }
  }

  if (cursor < input.length && !/^\s*$/.test(input.slice(cursor))) {
    throw new DiagramValidationError('Unexpected text content in draw.io XML');
  }
  if (stack.length !== 1 || stack[0] !== 'document') {
    throw new DiagramValidationError(
      'Unclosed element in draw.io XML: ' + stack[stack.length - 1]
    );
  }
  if (!sawModel) {
    throw new DiagramValidationError('Not a draw.io diagram (missing mxGraphModel)');
  }
  return cells;
}
