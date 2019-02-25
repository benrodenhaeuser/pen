import { Node } from './node.js';
import { Matrix, Vector } from './matrix.js';
import { Path } from './path.js'
import { ClassList } from './classList.js';


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
    const svg = Node.create();

    document.body.appendChild($svg);
    this.build($svg, svg);
    $svg.remove();

    return svg;
  },

  build($svg, svg) {
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
    // TODO: we take into account nodes of type `svg`, `g` and `path` here
    // But there may be others! (e.g., clip paths)
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

    // $node might already have a transform applied.
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

    // if we have tagged the node as a path, we need to convert the shape to a path (might be a rect):
    if (node.tag === 'path') {
      this.setDAttribute($node, node);
    }
  },

  // TODO: assuming $node is a rectangle or a path for now
  // add and process 'circle' and other basic shapes here
  setDAttribute($node, node) {
    const tag = $node.tagName;
    let   pathData;

    if (tag === 'rect') {
      const x      = Number($node.getSVGAttr('x'));
      const y      = Number($node.getSVGAttr('y'));
      const width  = Number($node.getSVGAttr('width'));
      const height = Number($node.getSVGAttr('height'));

      delete node.props.x;
      delete node.props.y;
      delete node.props.width;
      delete node.props.height;

      const CLOSE  = 1;
      const MOVE   = 2;
      const HLINE  = 4;
      const VLINE  = 8;

      pathData = [
        { type: MOVE,  relative: false, x: x, y: y },
        { type: HLINE, relative: false, x: x + width },
        { type: VLINE, relative: false, y: y + height },
        { type: HLINE, relative: false, x: x },
        { type: CLOSE }
      ];
    } else if (tag === 'path') {
      pathData = $node.getSVGAttr('d');
    }

    node.path = Path.create(pathData);
  },
};

export { sceneBuilder };
