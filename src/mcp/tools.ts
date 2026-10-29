import {
  DiagramDocument,
  DiagramValidationError,
  addEdge,
  addNode,
  createDiagram,
  validateDiagram
} from '../domain/diagram.js';
import { exportDiagramToJson, importDiagramFromJson } from '../persistence/json.js';
import {
  exportDiagramToDrawioXml,
  importDiagramFromDrawioXml
} from '../persistence/drawio.js';

export const MAX_NODES = 10_000;
export const MAX_TEXT_LENGTH = 10_000;
export const MAX_JSON_PAYLOAD_LENGTH = 1_000_000;
export const MAX_XML_PAYLOAD_LENGTH = 1_000_000;

export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: {
    readonly type: 'object';
    readonly properties: Record<string, unknown>;
    readonly required?: readonly string[];
    readonly additionalProperties: false;
  };
}

export interface ToolCallResult {
  readonly content: ReadonlyArray<{ readonly type: 'text'; readonly text: string }>;
  readonly isError?: boolean;
}

const ok = (text: string): ToolCallResult => ({ content: [{ type: 'text', text }] });
const fail = (text: string): ToolCallResult => ({ content: [{ type: 'text', text }], isError: true });

const stringSchema = (description: string): unknown => ({ type: 'string', description });

export const toolDefinitions: readonly ToolDefinition[] = [
  {
    name: 'create_diagram',
    description: 'Create a new empty diagram, replacing the current one.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'add_node',
    description: 'Add a node to the current diagram. The id must be unique and non-empty.',
    inputSchema: {
      type: 'object',
      properties: {
        id: stringSchema('Unique node id.'),
        label: stringSchema('Node label.')
      },
      required: ['id', 'label'],
      additionalProperties: false
    }
  },
  {
    name: 'add_edge',
    description: 'Add an edge between two existing nodes of the current diagram.',
    inputSchema: {
      type: 'object',
      properties: {
        id: stringSchema('Unique edge id.'),
        from: stringSchema('Id of the source node.'),
        to: stringSchema('Id of the target node.'),
        label: stringSchema('Optional edge label.')
      },
      required: ['id', 'from', 'to'],
      additionalProperties: false
    }
  },
  {
    name: 'validate_diagram',
    description: 'Validate the current diagram (id uniqueness and edge endpoint integrity).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'export_json',
    description: 'Export the current diagram as JSON text.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'import_json',
    description: 'Import a diagram from JSON text, replacing the current diagram.',
    inputSchema: {
      type: 'object',
      properties: { json: stringSchema('Diagram document JSON (version 1).') },
      required: ['json'],
      additionalProperties: false
    }
  },
  {
    name: 'export_drawio',
    description:
      'Export the current diagram as draw.io-compatible XML (mxGraphModel).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'import_drawio',
    description:
      'Import a diagram from draw.io (mxGraphModel) XML text, replacing the current diagram.',
    inputSchema: {
      type: 'object',
      properties: { xml: stringSchema('draw.io mxGraphModel XML text.') },
      required: ['xml'],
      additionalProperties: false
    }
  }
];

interface ReadStringOptions {
  readonly required: boolean;
  readonly allowEmpty?: boolean;
  readonly maxLength?: number;
}

export class EditorSession {
  private diagram: DiagramDocument | null = null;

  callTool(name: string, args: Record<string, unknown>): ToolCallResult {
    try {
      switch (name) {
        case 'create_diagram':
          return this.createDiagram();
        case 'add_node':
          return this.addNode(args);
        case 'add_edge':
          return this.addEdge(args);
        case 'validate_diagram':
          return this.validateCurrentDiagram();
        case 'export_json':
          return this.exportJson();
        case 'import_json':
          return this.importJson(args);
        case 'export_drawio':
          return this.exportDrawio();
        case 'import_drawio':
          return this.importDrawio(args);
        default:
          return fail('Unknown tool: ' + name);
      }
    } catch (error) {
      if (error instanceof DiagramValidationError) {
        return fail(error.message);
      }
      return fail(
        'Unexpected tool error: ' +
          (error instanceof Error ? error.message : String(error))
      );
    }
  }

  private currentDiagram(): DiagramDocument {
    if (this.diagram === null) {
      throw new DiagramValidationError(
        'No current diagram. Call create_diagram first.'
      );
    }
    return this.diagram;
  }

  private createDiagram(): ToolCallResult {
    this.diagram = createDiagram();
    return ok('Created a new empty diagram (version 1).');
  }

  private readString(
    args: Record<string, unknown>,
    key: string,
    options: ReadStringOptions
  ): string | undefined {
    const value = args[key];
    if (value === undefined) {
      if (options.required) {
        throw new DiagramValidationError('Missing required argument: ' + key);
      }
      return undefined;
    }
    if (typeof value !== 'string') {
      throw new DiagramValidationError('Argument must be a string: ' + key);
    }
    if (value.length === 0 && options.allowEmpty !== true) {
      throw new DiagramValidationError('Argument must not be empty: ' + key);
    }
    const maxLength = options.maxLength ?? MAX_TEXT_LENGTH;
    if (value.length > maxLength) {
      throw new DiagramValidationError(
        'Argument exceeds maximum length of ' + maxLength + ': ' + key
      );
    }
    return value;
  }

  private addNode(args: Record<string, unknown>): ToolCallResult {
    const diagram = this.currentDiagram();
    const id = this.readString(args, 'id', { required: true }) as string;
    const label = this.readString(args, 'label', {
      required: true,
      allowEmpty: true
    }) as string;
    if (diagram.nodes.length >= MAX_NODES) {
      throw new DiagramValidationError(
        'Diagram node limit reached (' + MAX_NODES + ').'
      );
    }
    this.diagram = addNode(diagram, { id, label });
    return ok("Added node '" + id + "' (" + this.diagram.nodes.length + ' nodes total).');
  }

  private addEdge(args: Record<string, unknown>): ToolCallResult {
    const diagram = this.currentDiagram();
    const id = this.readString(args, 'id', { required: true }) as string;
    const from = this.readString(args, 'from', { required: true }) as string;
    const to = this.readString(args, 'to', { required: true }) as string;
    const label = this.readString(args, 'label', {
      required: false,
      allowEmpty: true
    });
    if (diagram.edges.length >= MAX_NODES) {
      throw new DiagramValidationError(
        'Diagram edge limit reached (' + MAX_NODES + ').'
      );
    }
    this.diagram =
      label === undefined
        ? addEdge(diagram, { id, from, to })
        : addEdge(diagram, { id, from, to, label });
    return ok("Added edge '" + id + "' (" + this.diagram.edges.length + ' edges total).');
  }

  private validateCurrentDiagram(): ToolCallResult {
    validateDiagram(this.currentDiagram());
    return ok('Diagram is valid.');
  }

  private exportJson(): ToolCallResult {
    return ok(exportDiagramToJson(this.currentDiagram()));
  }

  private importJson(args: Record<string, unknown>): ToolCallResult {
    const json = this.readString(args, 'json', {
      required: true,
      maxLength: MAX_JSON_PAYLOAD_LENGTH
    }) as string;
    const imported = importDiagramFromJson(json);
    if (imported.nodes.length > MAX_NODES) {
      throw new DiagramValidationError(
        'Imported diagram exceeds node limit (' + MAX_NODES + ').'
      );
    }
    if (imported.edges.length > MAX_NODES) {
      throw new DiagramValidationError(
        'Imported diagram exceeds edge limit (' + MAX_NODES + ').'
      );
    }
    this.diagram = imported;
    return ok(
      'Imported diagram (' +
        imported.nodes.length +
        ' nodes, ' +
        imported.edges.length +
        ' edges).'
    );
  }

  private exportDrawio(): ToolCallResult {
    return ok(exportDiagramToDrawioXml(this.currentDiagram()));
  }

  private importDrawio(args: Record<string, unknown>): ToolCallResult {
    const xml = this.readString(args, 'xml', {
      required: true,
      maxLength: MAX_XML_PAYLOAD_LENGTH
    }) as string;
    const imported = importDiagramFromDrawioXml(xml);
    if (imported.nodes.length > MAX_NODES) {
      throw new DiagramValidationError(
        'Imported diagram exceeds node limit (' + MAX_NODES + ').'
      );
    }
    if (imported.edges.length > MAX_NODES) {
      throw new DiagramValidationError(
        'Imported diagram exceeds edge limit (' + MAX_NODES + ').'
      );
    }
    this.diagram = imported;
    return ok(
      'Imported diagram (' +
        imported.nodes.length +
        ' nodes, ' +
        imported.edges.length +
        ' edges).'
    );
  }
}
