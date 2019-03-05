import { Root, Shape, Group } from './node.js';
import { Matrix }             from './matrix.js';
import { Vector }             from './vector.js';
import { Rectangle }          from './rectangle.js';
import { Class }              from './class.js';
import { Path }               from './path.js'

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

const builder = {
  importSVG(markup) {
    const $svg = new DOMParser()
      .parseFromString(markup, "application/xml")
      .documentElement;

    return this.buildScene($svg);
  },

  buildScene($svg) {
    const scene = Root.create();

    // this.copyStyles($svg, scene); // TODO
    // this.copyDefs($svg, scene);   // TODO
    this.buildTree($svg, scene);
    scene.computeBBox();
    scene.setFrontier();

    return scene;
  },

  copyStyles($node, node) {
    node.styles = Array.from($node.querySelectorAll('style'));
  },

  copyDefs($node, node) {
    node.defs = Array.from($node.querySelectorAll('style'));
  },

  buildTree($node, node) {
    this.processAttributes($node, node);

    const $graphicsChildren = Array.from($node.children).filter(($child) => {
      return $child instanceof SVGGElement || child instanceof SVGGeometryElement
    });

    for (let $child of $graphicsChildren) {
      let child;

      if ($child instanceof SVGGElement) {
        child = Group.create();
      } else {
        child = Shape.create();
      }

      node.append(child);
      this.buildTree($child, child);
    }
  },

  processAttributes($node, node) {
    // const $attributes = Array.from($node.attributes);
    // TODO: do we really want this? right now it's not used!
    // for (let $attribute of $attributes) {
    //   node.props[$attribute.name] = $attribute.value;
    // }

    // viewBox
    if ($node.tagName === 'svg') {
      delete node.props.xmlns;
      const viewBox = $node.getSVGAttr('viewBox').split(' ');
      const origin = Vector.create(viewBox[0], viewBox[1]);
      const size = Vector.create(viewBox[2], viewBox[3]);
      node.viewBox = Rectangle.create(origin, size);
    }

    // transform
    if (
      $node.transform &&
      $node.transform.baseVal &&
      $node.transform.baseVal.consolidate()
    ) {
      const $matrix = $node.transform.baseVal.consolidate().matrix;
      node.transform = Matrix.createFromDOMMatrix($matrix);
    }

    // classes
    node.class = Class.create(
      Array.from($node.classList)
    );

    // path
    if (node.type === 'shape') {
      this.capturePath($node, node);
    }
  },

  capturePath($node, node) {
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

export { builder };
