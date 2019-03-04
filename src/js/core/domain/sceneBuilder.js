// build a scene graph from svg markup

import { Node } from '../domain/node.js';
import { Matrix } from '../domain/matrix.js';
import { Vector } from '../domain/vector.js';
import { Path } from '../domain/path.js'
import { ClassList } from '../domain/classList.js';


// TODO: put in a utility module somewhere?
SVGElement.prototype.getSVGAttr = function(...args) {
  return this.getAttributeNS.apply(this, [null].concat(args));
};

SVGElement.prototype.setSVGAttr = function(...args) {
  return this.setAttributeNS.apply(this, [null].concat(args));
};

SVGElement.prototype.setSVGAttrs = function(obj) {
  for (let key of Object.keys(obj)) {
    this.setSVGAttr(key, obj[key]);
  }
};

const sceneBuilder = {
  createScene(markup) {
    const $svg = new DOMParser()
      .parseFromString(markup, "application/xml")
      .documentElement;
    const scene = Node.create();

    document.body.appendChild($svg);
    this.build($svg, scene);
    $svg.remove();

    return scene;
  },

  build($svg, scene) {
    this.copyStyles($svg, scene);
    this.copyDefs($svg, scene);
    this.buildTree($svg, scene);
    scene.setFrontier();
  },

  copyStyles($node, node) {
    node.styles = Array.from($node.querySelectorAll('style'));
  },

  copyDefs($node, node) {
    node.defs = Array.from($node.querySelectorAll('style'));
  },

  buildTree($node, node) {
    // TODO: the logic here is that we $node may be the svg root, a group
    // or a shape. If it's a shape, we tag our internal node as path because
    // we want to store pathData derived from the svg.
    if ($node.tagName === 'svg' || $node.tagName === 'g') {
      this.copyTagName($node, node);
    } else {
      node.tag = 'path';
    }

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

  copyBBox($node, node) {
    const box = $node.getBBox();
    node.box = {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    };
  },

  processAttributes($node, node) {
    const $attributes = Array.from($node.attributes);
    for (let $attribute of $attributes) {
      node.props[$attribute.name] = $attribute.value;
    }
    delete node.props.xmlns;

    // TODO: hard to read?
    // idea: $node might already have a transform applied.
    // in this case, we override our default Matrix.identity():
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

    // TODO: hard to read
    // what it means is that we have tagged our internal node as 'path'
    // because we want to create a path from whatever svg shape $node is
    if (node.tag === 'path') {
      this.storePath($node, node);
    }
  },

  // store whatever shape $node is as a path
  storePath($node, node) {
    const tag = $node.tagName;
    let   pathData;

    switch (tag) {
      case 'rect':
        node.path = Path.createFromRect(
          Number($node.getSVGAttr('x')),
          Number($node.getSVGAttr('y')),
          Number($node.getSVGAttr('width')),
          Number($node.getSVGAttr('height'))
        );

        for (let prop of ['x', 'y', 'width', 'height']) {
          delete node.props[prop];
        }
        break;

      case 'path':
        node.path = Path.createFromSVGpath($node.getSVGAttr('d'));
        delete node.props.d;
        break;
    }
  },
};

export { sceneBuilder };
