import { describe, expect, it } from 'vitest';
import {
  DiagramValidationError,
  addEdge,
  addNode,
  createDiagram
} from '../domain/diagram.js';
import {
  exportDiagramToDrawioXml,
  importDiagramFromDrawioXml
} from './drawio.js';

const sampleDiagram = () => {
  let diagram = createDiagram();
  diagram = addNode(diagram, { id: 'n1', label: 'Start' });
  diagram = addNode(diagram, { id: 'n2', label: 'End & "Final" <tag>' });
  diagram = addEdge(diagram, { id: 'e1', from: 'n1', to: 'n2', label: 'flow <a>' });
  return diagram;
};

describe('draw.io xml persistence integration', () => {
  it('exports a well-formed mxGraphModel document', () => {
    const xml = exportDiagramToDrawioXml(sampleDiagram());
    expect(xml).toContain('<mxGraphModel>');
    expect(xml).toContain('<mxCell id="0"/>');
    expect(xml).toContain('<mxCell id="1" parent="0"/>');
    expect(xml).toContain('vertex="1"');
    expect(xml).toContain('edge="1"');
    expect(xml).toContain('source="n1"');
    expect(xml).toContain('target="n2"');
    expect(xml).toContain('</mxGraphModel>');
  });

  it('escapes XML entities in exported labels', () => {
    const xml = exportDiagramToDrawioXml(sampleDiagram());
    expect(xml).toContain('End &amp; &quot;Final&quot; &lt;tag&gt;');
    expect(xml).not.toContain('End & "Final"');
  });

  it('round-trips a diagram through XML', () => {
    const diagram = sampleDiagram();
    const restored = importDiagramFromDrawioXml(exportDiagramToDrawioXml(diagram));
    expect(restored).toEqual(diagram);
  });

  it('round-trips an edge without a label', () => {
    let diagram = createDiagram();
    diagram = addNode(diagram, { id: 'a', label: 'A' });
    diagram = addNode(diagram, { id: 'b', label: 'B' });
    diagram = addEdge(diagram, { id: 'e', from: 'a', to: 'b' });
    const restored = importDiagramFromDrawioXml(exportDiagramToDrawioXml(diagram));
    expect(restored).toEqual(diagram);
    expect(restored.edges[0].label).toBeUndefined();
  });

  it('round-trips an empty diagram', () => {
    const diagram = createDiagram();
    const restored = importDiagramFromDrawioXml(exportDiagramToDrawioXml(diagram));
    expect(restored).toEqual(diagram);
  });

  it('imports a real-world style drawio file', () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<mxGraphModel grid="1" gridSize="10" dx="800" dy="600">\n' +
      '  <root>\n' +
      '    <mxCell id="0"/>\n' +
      '    <mxCell id="1" parent="0"/>\n' +
      '    <mxCell id="node-1" value="&#10;Hello &amp; welcome" style="rounded=1;whiteSpace=wrap;" vertex="1" parent="1">\n' +
      '      <mxGeometry x="120" y="80" width="160" height="40" as="geometry"/>\n' +
      '    </mxCell>\n' +
      '    <mxCell id="node-2" value="World" style="ellipse" vertex="1" parent="1">\n' +
      '      <mxGeometry x="120" y="200" width="160" height="40" as="geometry"/>\n' +
      '    </mxCell>\n' +
      '    <mxCell id="edge-1" value="yes" style="edgeStyle=orthogonalEdgeStyle;" edge="1" parent="1" source="node-1" target="node-2">\n' +
      '      <mxGeometry relative="1" as="geometry"/>\n' +
      '    </mxCell>\n' +
      '  </root>\n' +
      '</mxGraphModel>\n';
    const diagram = importDiagramFromDrawioXml(xml);
    expect(diagram.nodes).toEqual([
      { id: 'node-1', label: '\nHello & welcome' },
      { id: 'node-2', label: 'World' }
    ]);
    expect(diagram.edges).toEqual([
      { id: 'edge-1', from: 'node-1', to: 'node-2', label: 'yes' }
    ]);
  });

  it('imports a diagram with only structural cells as an empty diagram', () => {
    const xml =
      '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>';
    expect(importDiagramFromDrawioXml(xml)).toEqual(createDiagram());
  });

  it('supports comments between elements', () => {
    const xml =
      '<mxGraphModel><!-- scaffold --><root><mxCell id="0"/><!-- more --></root></mxGraphModel>';
    expect(importDiagramFromDrawioXml(xml)).toEqual(createDiagram());
  });

  it('rejects DOCTYPE declarations', () => {
    const xml = '<!DOCTYPE foo><mxGraphModel><root/></mxGraphModel>';
    expect(() => importDiagramFromDrawioXml(xml)).toThrow(DiagramValidationError);
  });

  it('rejects CDATA sections', () => {
    const xml = '<mxGraphModel><root><![CDATA[x]]></root></mxGraphModel>';
    expect(() => importDiagramFromDrawioXml(xml)).toThrow(DiagramValidationError);
  });

  it('rejects unsupported entity references', () => {
    const xml =
      '<mxGraphModel><root><mxCell id="n" value="&nbsp;" vertex="1" parent="1"/></root></mxGraphModel>';
    expect(() => importDiagramFromDrawioXml(xml)).toThrow(/Unsupported XML entity/);
  });

  it('rejects invalid numeric character references', () => {
    const xml =
      '<mxGraphModel><root><mxCell id="n" value="&#xZZ;" vertex="1" parent="1"/></root></mxGraphModel>';
    expect(() => importDiagramFromDrawioXml(xml)).toThrow(DiagramValidationError);
  });

  it('rejects unexpected elements outside the allowed structure', () => {
    expect(() =>
      importDiagramFromDrawioXml('<mxGraphModel><mxCell id="n" vertex="1"/></mxGraphModel>')
    ).toThrow(/Unexpected element/);
    expect(() =>
      importDiagramFromDrawioXml('<foo><root/></foo>')
    ).toThrow(DiagramValidationError);
  });

  it('rejects mismatched or unclosed elements', () => {
    expect(() =>
      importDiagramFromDrawioXml('<mxGraphModel><root></mxGraphModel>')
    ).toThrow(/Mismatched closing element/);
    expect(() =>
      importDiagramFromDrawioXml('<mxGraphModel><root>')
    ).toThrow(/Unclosed element/);
  });

  it('rejects unexpected text content', () => {
    const xml = '<mxGraphModel>hello<root/></mxGraphModel>';
    expect(() => importDiagramFromDrawioXml(xml)).toThrow(/Unexpected text content/);
  });

  it('rejects input that is not a draw.io diagram', () => {
    expect(() => importDiagramFromDrawioXml('<root><mxCell id="0"/></root>')).toThrow(
      /missing mxGraphModel/
    );
    expect(() => importDiagramFromDrawioXml('plain text')).toThrow(DiagramValidationError);
  });

  it('rejects edge cells missing source or target', () => {
    const noSource =
      '<mxGraphModel><root><mxCell id="e" edge="1" target="n"/></root></mxGraphModel>';
    expect(() => importDiagramFromDrawioXml(noSource)).toThrow(/missing source/);
    const noTarget =
      '<mxGraphModel><root><mxCell id="e" edge="1" source="n"/></root></mxGraphModel>';
    expect(() => importDiagramFromDrawioXml(noTarget)).toThrow(/missing target/);
  });

  it('rejects edges referencing missing cells via domain validation', () => {
    const xml =
      '<mxGraphModel><root>' +
      '<mxCell id="n1" value="A" vertex="1" parent="1"/>' +
      '<mxCell id="e" value="x" edge="1" parent="1" source="n1" target="ghost"/>' +
      '</root></mxGraphModel>';
    expect(() => importDiagramFromDrawioXml(xml)).toThrow(DiagramValidationError);
  });

  it('rejects duplicate ids via domain validation', () => {
    const xml =
      '<mxGraphModel><root>' +
      '<mxCell id="n1" value="A" vertex="1" parent="1"/>' +
      '<mxCell id="n1" value="B" vertex="1" parent="1"/>' +
      '</root></mxGraphModel>';
    expect(() => importDiagramFromDrawioXml(xml)).toThrow(/Duplicate node id/);
  });

  it('rejects cells that are both vertex and edge', () => {
    const xml =
      '<mxGraphModel><root><mxCell id="n" vertex="1" edge="1" parent="1"/></root></mxGraphModel>';
    expect(() => importDiagramFromDrawioXml(xml)).toThrow(/both vertex and edge/);
  });

  it('rejects cells without an id', () => {
    const xml = '<mxGraphModel><root><mxCell vertex="1" parent="1"/></root></mxGraphModel>';
    expect(() => importDiagramFromDrawioXml(xml)).toThrow(/missing an id/);
  });
});
