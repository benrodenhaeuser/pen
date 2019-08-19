import { GraphicsNode } from './_.js';
import { Spline } from './_.js';
import { MarkupNode } from './_.js';
import { Line } from './_.js';
import { Token } from './_.js';
import { types } from './_.js';
import { Matrix } from '../geometry/_.js';
import { Vector } from '../geometry/_.js';
import { stuff } from '../components/_.js'; 

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

  toPathString() {
    let commands = [];

    for (let spline of this.children) {
      commands.push(
        spline
          .commands()
          .map(command =>
            command
              .map(part => (Array.isArray(part) ? part[0] : part))
              .join(' ')
          )
      );
    }

    const pathString = commands.map(command => command.join(' ')).join(' ');

    return pathString;
  },

  toTags(level) {
    const tags = {
      open: [],
      close: [],
    };

    tags.open.push(
      Line.create({ indent: this.height }).append(
        Token.create({
          markup: '<path',
          key: this.key,
          class: this.class,
        })
      )
    );

    tags.open.push(
      Line.create({ indent: this.height + 1 }).append(
        Token.create({
          markup: 'd="',
        })
      )
    );

    for (let spline of this.children) {
      const commands = spline.commands();

      for (let command of commands) {
        const indent = this.height + 2;

        const line = Line.create({ indent: indent }).append(
          Token.create({
            markup: command[0],
          })
        );

        for (let i = 1; i < command.length; i += 1) {
          line.append(
            Token.create({
              markup: command[i][0], // TODO: ugly
              key: command[i][1],
              class: command[i][2]
            })
          );
        }

        tags.open.push(line);
      }
    }

    tags.open.push(
      Line.create({ indent: this.height + 1 }).append(
        Token.create({
          markup: '"',
        })
      )
    );

    if (this.transform) {
      tags.open.push(
        Line.create({ indent: this.height + 1 }).append(
          Token.create({
            markup: `transform="${this.transform.toString()}"`
          })
        )
      );
    }

    tags.open.push(
      Line.create({ indent: this.height }).append(Token.create({ markup: '/>' }))
    );

    return tags;
  },

  toComponent() {
    const wrapper = stuff.wrapper(this);
    const shape = stuff.shape(this);
    const curves = stuff.curves(this);
    const segments = stuff.segments(this);
    const outerUI = stuff.outerUI(this);

    wrapper.children.push(shape);
    wrapper.children.push(curves);
    wrapper.children.push(segments);
    wrapper.children.push(outerUI)

    return () => {
      return wrapper;
    };
  },

  // to virtualDOMNode ==> goes to "stuff" DONE
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

  // toCurves()? toCurveNodes()? ==> goes to "stuff" DONE
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
});

export { Shape };
