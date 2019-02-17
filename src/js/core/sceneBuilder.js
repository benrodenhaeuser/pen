import { Node } from './node.js';
import { Matrix, Vector } from './matrix.js';
import { ClassList } from './classList.js';

const sceneBuilder = {
  createScene(markup) {
    const $svg = new DOMParser()
      .parseFromString(markup, "application/xml")
      .documentElement;
    const svg = Node.create();

    document.body.appendChild($svg);
    this.process($svg, svg);
    $svg.remove();

    return svg;
  },

  process($svg, svg) {
    this.copyStyles($svg, svg);
    this.copyDefs($svg, svg);
    this.buildTree($svg, svg);
    svg.setFrontier();
  },

  copyStyles($node, node) {
    node.styles = Array.from($node.querySelectorAll('style'));
  },

  copyDefs($node, node) {
    node.defs = Array.from($node.querySelectorAll('style'));
  },

  buildTree($node, node) {
    this.copyTagName($node, node);
    this.processAttributes($node, node);
    this.copyBBox($node, node);

    const $graphicsChildren = Array.from($node.children).filter((child) => {
      return child instanceof SVGGElement || child instanceof SVGGeometryElement
    });

    for (let $child of $graphicsChildren) {
      const child = Node.create();
      node.append(child);
      this.buildTree($child, child);
    }
  },

  copyTagName($node, node) {
    node.tag = $node.tagName;
  },

  processAttributes($node, node) {
    const $attributes = Array.from($node.attributes);
    for (let $attribute of $attributes) {
      node.props[$attribute.name] = $attribute.value;
    }
    delete node.props.xmlns;

    // $node might already have a transform applied:
    if (
      $node.transform &&
      $node.transform.baseVal &&
      $node.transform.baseVal.consolidate()
    ) {
      const $matrix = $node.transform.baseVal.consolidate().matrix;
      node.transform = Matrix.createFromDOMMatrix($matrix);
    }

    node.classList = ClassList.create(
      Array.from($node.classList)
    );
  },

  copyBBox($node, node) {
    const box = $node.getBBox();
    node.box = {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    };
  },
};

export { sceneBuilder };
