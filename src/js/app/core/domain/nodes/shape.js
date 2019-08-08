import { GraphicsNode } from './_.js';
import { Spline } from './_.js';
import { Matrix } from '../geometry/_.js';
import { Vector } from '../geometry/_.js';
import { MarkupNode } from './_.js';
import { Text } from './_.js';
import { OpenTag } from './_.js';
import { CloseTag } from './_.js';
import { Langle } from './_.js';
import { Rangle } from './_.js';
import { TagName } from './_.js';
import { Attributes } from './_.js';
import { Attribute } from './_.js';
import { AttrKey } from './_.js';
import { AttrValue } from './_.js';
import { Coords } from './_.js';
import { types } from './_.js';

const Shape = Object.create(GraphicsNode);
Shape.defineProps(['splitter']);

Object.assign(Shape, {
  create() {
    return GraphicsNode.create
      .bind(this)()
      .set({
        type: types.SHAPE,
        splitter: Vector.create(-1000, -1000),
      });
  },

  appendSpline() {
    const spline = Spline.create();
    this.append(spline);
    return spline;
  },

  toVDOMNode() {
    return {
      tag: 'path',
      children: [],
      props: {
        'data-key': this.key,
        'data-type': this.type,
        d: this.toPathString(),
        transform: this.transform.toString(),
        class: this.class.toString(),
      },
    };
  },

  toVDOMCurves() {
    const nodes = [];
    const splines = this.children;

    for (let spline of splines) {
      const segments = spline.children;
      const curves = spline.curves();

      for (let i = 0; i < curves.length; i += 1) {
        // this node will be the "hit target" for the curve:
        nodes.push({
          tag: 'path',
          children: [],
          props: {
            'data-type': 'curve',
            'data-key': segments[i].key,
            d: curves[i].toPathString(),
            transform: this.transform.toString(),
          },
        });

        // this node will display the curve stroke:
        nodes.push({
          tag: 'path',
          children: [],
          props: {
            'data-type': 'curve-stroke',
            d: curves[i].toPathString(),
            transform: this.transform.toString(),
          },
        });
      }
    }

    return nodes;
  },

  toSVGNode() {
    const svgNode = {
      tag: 'path',
      children: [],
      props: { d: this.toPathString() },
    };

    if (!this.transform.equals(Matrix.identity())) {
      svgNode.props.transform = this.transform.toString();
    }

    return svgNode;
  },

  toTags(level) {
    const open = OpenTag.create();
    const langle = Langle.create();
    const tagName = TagName.create('path');
    const attributes = Attributes.create();
    const linebreak = Text.create(`\n${indent(level)}`);
    const close = Text.create('/');
    const rangle = Rangle.create();

    langle.key = this.key;
    tagName.key = this.key;
    rangle.key = this.key;

    open.append(langle);
    open.append(tagName);
    open.append(attributes);
    open.append(linebreak);
    open.append(close);
    open.append(rangle);

    const d = Attribute.create();
    const linebreakPlusPad = Text.create(`\n${indent(level + 1)}`);
    const dName = AttrKey.create('d=');
    dName.key = this.lastChild.key;

    const quoteStart = Text.create('"');
    const quoteEnd = Text.create(`\n${indent(level + 1)}"`);

    quoteStart.key = this.lastChild.key;
    quoteEnd.key = this.lastChild.key;

    const dValue = AttrValue.create();

    for (let elem of this.toPathTree(level)) {
      dValue.append(elem);
    }

    d.append(linebreakPlusPad);
    d.append(dName);
    d.append(quoteStart);
    d.append(dValue);
    d.append(quoteEnd);
    attributes.append(d);

    if (!this.transform.equals(Matrix.identity())) {
      const linebreak = Text.create(`\n${indent(level + 1)}`);

      const trans = Attribute.create(`transform="${this.transform.toString()}"`);
      trans.key = this.key;

      attributes.append(linebreak);
      attributes.append(trans);
    }

    open.class = this.class;

    // const close = CloseTag.create('</path>');
    // close.markup = '</path>';
    // close.key = this.key;
    // open.class = this.class;

    return {
      open: open,
      close: null,
    };
  },

  // could perhaps replace implementation by
  // return this.toPathTree().toMarkup;
  toPathString() {
    let d = '';

    for (let spline of this.children) {
      const segment = spline.children[0];

      d += `M ${segment.anchor.vector.x} ${segment.anchor.vector.y}`;

      for (let i = 1; i < spline.children.length; i += 1) {
        const currSeg = spline.children[i];
        const prevSeg = spline.children[i - 1];

        if (prevSeg.handleOut && currSeg.handleIn) {
          d += ' C';
        } else if (currSeg.handleIn || prevSeg.handleOut) {
          d += ' Q';
        } else {
          d += ' L';
        }

        if (prevSeg.handleOut) {
          d += ` ${prevSeg.handleOut.vector.x} ${prevSeg.handleOut.vector.y}`;
        }

        if (currSeg.handleIn) {
          d += ` ${currSeg.handleIn.vector.x} ${currSeg.handleIn.vector.y}`;
        }

        d += ` ${currSeg.anchor.vector.x} ${currSeg.anchor.vector.y}`;
      }
    }

    return d;
  },

  toPathTree(level) {
    let d = [];

    for (let spline of this.children) {
      const segment = spline.children[0];

      const linebreak = Text.create(`\n${indent(level + 2)}`);
      const M = Text.create("M ");

      d.push(linebreak);
      d.push(M);

      let coords = Coords.create(`${segment.anchor.vector.x} ${segment.anchor.vector.y}`);
      coords.key = segment.anchor.key;
      d.push(coords);

      for (let i = 1; i < spline.children.length; i += 1) {
        const currSeg = spline.children[i];
        const prevSeg = spline.children[i - 1];

        const linebreak = Text.create(`\n${indent(level + 2)}`);

        if (prevSeg.handleOut && currSeg.handleIn) {
          const C = Text.create('C');
          d.push(linebreak);
          d.push(C);
        } else if (currSeg.handleIn || prevSeg.handleOut) {
          const Q = Text.create('Q');
          d.push(linebreak);
          d.push(Q);
        } else {
          const L = Text.create('L');
          d.push(linebreak);
          d.push(L);
        }

        if (prevSeg.handleOut) {
          coords = Coords.create(` ${prevSeg.handleOut.vector.x} ${prevSeg.handleOut.vector.y}`);
          coords.key = prevSeg.handleOut.key;
          d.push(coords);
        }

        if (currSeg.handleIn) {
          coords = Coords.create(` ${currSeg.handleIn.vector.x} ${currSeg.handleIn.vector.y}`);
          coords.key = currSeg.handleIn.key;
          d.push(coords);
        }

        coords = Coords.create(` ${currSeg.anchor.vector.x} ${currSeg.anchor.vector.y}`);
        coords.key = currSeg.anchor.key;
        d.push(coords);
      }
    }

    return d;

  },
});

const indent = level => {
  let pad = '';

  for (let i = 0; i < level; i += 1) {
    pad += '  ';
  }

  return pad;
};

export { Shape };
