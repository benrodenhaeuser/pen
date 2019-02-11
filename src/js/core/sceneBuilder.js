import { Scene } from './scene.js';
import { Matrix } from './matrix.js';
import { ClassList } from './classList.js';

const sceneBuilder = {
  processAttributes($node, node) {
    const $attributes = Array.from($node.attributes);
    for (let $attribute of $attributes) {
      node.props[$attribute.name] = $attribute.value;
    }
    delete node.props.xmlns;

    // store `transform` as a Matrix object:
    if ($node.transform && $node.transform.baseVal && $node.transform.baseVal.consolidate()) {
      const $matrix = $node.transform.baseVal.consolidate().matrix;
      node.props.transform = Object.create(Matrix).fromDOMMatrix($matrix);
    } else {
      node.props.transform = Matrix.identity();
    }

    // store `class` as a ClassList object:
    node.props.class = Object.create(ClassList).init(
      Array.from($node.classList)
    );
  },

  copyTagName($node, node) {
    node.tag = $node.tagName;
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

    const $graphics = Array.from($node.children).filter((child) => {
      return child instanceof SVGGElement || child instanceof SVGGeometryElement
    });

    for (let $child of $graphics) {
      const child = Object.create(Scene).init();
      node.append(child);
      this.buildTree($child, child);
    }
  },

  createScene(markup) {
    const $svg = new DOMParser()
      .parseFromString(markup, "application/xml")
      .documentElement;
    const svg = Object.create(Scene).init();

    this.copyStyles($svg, svg);
    this.copyDefs($svg, svg);
    this.buildTree($svg, svg);
    svg.setFrontier();

    return svg;
  },
};

export { sceneBuilder };
