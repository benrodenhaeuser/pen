import { GraphicsNode } from './_.js';
import { Spline } from './_.js';
import { MarkupNode } from './_.js';
import { Tag } from './_.js';
import { Line } from './_.js';
import { Token } from './_.js';
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

  // to virtualDOMNode
  toVDOMNode() {
    return {
      tag: 'path',
      children: [],
      props: {
        'data-key': this.key,
        'data-type': this.type,
        d: this.toPathString(), // FINE
        transform: this.transform && this.transform.toString(),
        class: this.class.toString(),
      },
    };
  },

  // toCurves()? toCurveNodes()?
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
            transform: this.transform && this.transform.toString(),
          },
        });

        // this node will display the curve stroke:
        nodes.push({
          tag: 'path',
          children: [],
          props: {
            'data-type': 'curve-stroke',
            d: curves[i].toPathString(),
            transform: this.transform && this.transform.toString(),
          },
        });
      }
    }

    return nodes;
  },

  // toMarkupComponent?
  toTags(level) {
    const tags = {
      open: [],
    };

    tags.open.push(
      Line
        .create({ indent: 1 })
        .append(
          Token.create({
            markup: '<'
          }),
          Token.create({
            markup: 'path',
            key: this.key,
            class: this.class,
          }),
        )
    );

    tags.open.push(
      Line
        .create({ indent: 1 })
        .append(
          Token.create({
            markup: 'd="',
          })
        )
    );

    for (let spline of this.children) {
      const commands = spline.commands();

      for (let command of commands) {
        let indent;
        command[0] === 'M' ? indent = 1 : indent = 0;

        const line = Line
          .create({ indent: indent })
          .append(
            Token.create({
              markup: command[0],
            })
          );

        for (let i = 1; i < command.length; i += 1) {
          line.append(
            Token.create({
              markup: command[i][0],
              key: command[i][1]
            })
          )
        }

        tags.open.push(line);
      }
    }

    // TODO: append further properties (one line each)
    // for (let attribute of attributes)
    // ...

    tags.open.push(
      Line
        .create({ indent: -1 })
        .append(
          Token.create({
            markup: '"',
          })
        )
    );

    tags.open.push(
      Line
        .create({ indent: -1 })
        .append(
          Token.create({ markup: '/>'})
        )
    );

    console.log(open); // looks fine at first glance

    return tags;
  },

  // TODO: confusing naming ('d')!
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
        })
      );

      for (let i = 1; i < spline.children.length; i += 1) {
        const currSeg = spline.children[i];
        const prevSeg = spline.children[i - 1];

        if (prevSeg.handleOut && currSeg.handleIn) {
          d.append(
            Text.create({
              markup: linebreak + indent(level + 2),
            }),
            Text.create({
              markup: 'C',
              key: spline.key,
            })
          );
        } else if (currSeg.handleIn || prevSeg.handleOut) {
          d.append(
            Text.create({
              markup: linebreak + indent(level + 2),
            }),
            Text.create({
              markup: 'Q',
              key: spline.key,
            })
          );
        } else {
          d.append(
            Text.create({
              markup: linebreak + indent(level + 2),
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
    let commands = [];

    for (let spline of this.children) {
      commands.push(
        spline
          .commands()
          .map(command => command
            .map(part => Array.isArray(part) ? part[0] : part)
            .join(' ')));
    }

    const pathString = commands.map(command => command.join(' ')).join(' ');

    console.log(pathString);

    return pathString;
  },
});

export { Shape };
