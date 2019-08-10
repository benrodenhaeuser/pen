import { GraphicsNode } from './_.js';
import { Spline } from './_.js';
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
import { Matrix } from '../geometry/_.js';
import { Vector } from '../geometry/_.js';
import { indent } from '../helpers/_.js';

const linebreak = '\n';
const slash = '/';
const quote = '"';
const blank = ' ';

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

  toTags(level) {
    const open = OpenTag.create();
    const attributes = Attributes.create();

    open.append(
      Text.create({ markup: indent(level) }),
      Langle.create({ key: this.key }),
      TagName.create({
        markup: 'path',
        key: this.key,
        class: this.class,
      }),

      attributes,

      Text.create({ markup: linebreak + indent(level) }),
      Text.create({ markup: slash }),
      Rangle.create({ key: this.key })
    );

    const d = Attribute.create();
    const dValue = AttrValue.create();

    attributes.append(d);

    d.append(
      Text.create({ markup: linebreak + indent(level + 1) }),
      AttrKey.create({
        markup: 'd=',
        key: this.lastChild.key,
      }),
      Text.create({
        markup: quote,
        key: this.lastChild.key,
      }),

      this.toPathTree(dValue, level),

      Text.create({
        markup: linebreak + indent(level + 1) + quote,
        key: this.lastChild.key,
      })
    );

    // for (let elem of this.toPathTree(level)) {
    //   dValue.append(elem);
    // }

    if (!this.transform.equals(Matrix.identity())) {
      attributes.append(
        Text.create({ markup: linebreak + indent(level + 1) }),
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

  toPathTree(d, level) {
    for (let spline of this.children) {
      const segment = spline.children[0];

      d.append(
        Text.create({
          markup: linebreak + indent(level + 2),
        }),
        Text.create({
          markup: 'M ',
          key: spline.key,
        }),
        Coords.create({
          markup: `${segment.anchor.vector.x} ${segment.anchor.vector.y}`,
          key: segment.anchor.key,
          class: segment.anchor.class,
        }),
        Text.create({
          markup: blank,
        }),
      );

      for (let i = 1; i < spline.children.length; i += 1) {
        const currSeg = spline.children[i];
        const prevSeg = spline.children[i - 1];

        if (prevSeg.handleOut && currSeg.handleIn) {
          d.append(
            Text.create({
              markup: linebreak + indent(level + 2)
            }),
            Text.create({
              markup: 'C',
              key: spline.key,
            })
          );
        } else if (currSeg.handleIn || prevSeg.handleOut) {
          d.append(
            Text.create({
              markup: linebreak + indent(level + 2)
            }),
            Text.create({
              markup: 'Q',
              key: spline.key,
            })
          );
        } else {
          d.append(
            Text.create({
              markup: linebreak + indent(level + 2)
            }),
            Text.create({
              markup: 'L',
              key: spline.key,
            })
          );
        }

        if (prevSeg.handleOut) {
          d.append(
            Text.create({
              markup: blank,
            }),
            Coords.create({
              markup: `${prevSeg.handleOut.vector.x} ${prevSeg.handleOut.vector.y}`,
              key: prevSeg.handleOut.key,
              class: prevSeg.handleOut.class,
            })
          );
        }

        if (currSeg.handleIn) {
          d.append(
            Text.create({
              markup: blank,
            }),
            Coords.create({
              markup: `${currSeg.handleIn.vector.x} ${currSeg.handleIn.vector.y}`,
              key: currSeg.handleIn.key,
              class: currSeg.handleIn.class,
            })
          );
        }

        d.append(
          Text.create({
            markup: blank,
          }),
          Coords.create({
            markup: `${currSeg.anchor.vector.x} ${currSeg.anchor.vector.y}`,
            key: currSeg.anchor.key,
            class: currSeg.anchor.class,
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

export { Shape };
