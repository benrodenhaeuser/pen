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
  create(opts = {}) {
    return GraphicsNode.create
      .bind(this)()
      .set({
        type: types.SHAPE,
        splitter: Vector.create(-1000, -1000),
      })
      .set(opts);
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
    const open = OpenTag.create({
      class: this.class,
    });
    const attributes = Attributes.create();

    open.append(
      Text.create({ markup: indent(level) }),
      Langle.create({ key: this.key }),
      TagName.create({
        markup: 'path',
        key: this.key,
      }),

      attributes,

      Text.create({ markup: `\n${indent(level)}` }),
      Text.create({ markup: '/' }),
      Rangle.create({ key: this.key })
    );

    const d = Attribute.create();
    const dValue = AttrValue.create();

    attributes.append(d);

    d.append(
      Text.create({ markup: `\n${indent(level + 1)}` }),
      AttrKey.create({
        markup: 'd=',
        key: this.lastChild.key,
      }),
      Text.create({
        markup: '"',
        key: this.lastChild.key,
      }),

      dValue,

      Text.create({
        markup: `\n${indent(level + 1)}"`,
        key: this.lastChild.key,
      })
    );

    for (let elem of this.toPathTree(level)) {
      dValue.append(elem);
    }

    if (!this.transform.equals(Matrix.identity())) {
      attributes.append(
        Text.create({ markup: `\n${indent(level + 1)}` }),
        Attribute.create({
          markup: `transform="${this.transform.toString()}"`,
          key: this.key,
        })
      );
    }

    return {
      open: open,
      close: null,
    };
  },

  toPathTree(level) {
    let d = [];

    for (let spline of this.children) {
      const segment = spline.children[0];

      d.push(
        Text.create({
          markup: `\n${indent(level + 2)}`,
        })
      );

      d.push(
        Text.create({
          markup: 'M ',
          key: spline.key,
        })
      );

      d.push(
        Coords.create({
          markup: `${segment.anchor.vector.x} ${segment.anchor.vector.y} `,
          key: segment.anchor.key,
        })
      );

      for (let i = 1; i < spline.children.length; i += 1) {
        const currSeg = spline.children[i];
        const prevSeg = spline.children[i - 1];

        const linebreak = Text.create({ markup: `\n${indent(level + 2)}` });

        if (prevSeg.handleOut && currSeg.handleIn) {
          d.push(linebreak);
          d.push(
            Text.create({
              markup: 'C',
              key: spline.key,
            })
          );
        } else if (currSeg.handleIn || prevSeg.handleOut) {
          d.push(linebreak);
          d.push(
            Text.create({
              markup: 'Q',
              key: spline.key,
            })
          );
        } else {
          d.push(linebreak);
          d.push(
            Text.create({
              markup: 'L',
              key: spline.key,
            })
          );
        }

        if (prevSeg.handleOut) {
          d.push(
            Coords.create({
              markup: ` ${prevSeg.handleOut.vector.x} ${prevSeg.handleOut.vector.y}`,
              key: prevSeg.handleOut.key,
            })
          );
        }

        if (currSeg.handleIn) {
          d.push(
            Coords.create({
              markup: ` ${currSeg.handleIn.vector.x} ${currSeg.handleIn.vector.y}`,
              key: currSeg.handleIn.key,
            })
          );
        }

        d.push(
          Coords.create({
            markup: ` ${currSeg.anchor.vector.x} ${currSeg.anchor.vector.y}`,
            key: currSeg.anchor.key,
          })
        );
      }
    }

    return d;
  },

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
});

// TODO: duplicate
const indent = level => {
  let pad = '';

  for (let i = 0; i < level; i += 1) {
    pad += '  ';
  }

  return pad;
};

export { Shape };
