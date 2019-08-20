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

  mountSpline() {
    const spline = Spline.create();
    this.mount(spline);
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
    const open = [];

    open.push(
      Line.create({ indent: this.height }).mount(
        Token.create({
          markup: '<path',
          key: this.key,
          class: this.class,
        })
      )
    );

    open.push(
      Line.create({ indent: this.height + 1 }).mount(
        Token.create({
          markup: 'd="',
        })
      )
    );

    for (let spline of this.children) {
      const commands = spline.commands();

      for (let command of commands) {
        const indent = this.height + 2;

        const line = Line.create({ indent: indent }).mount(
          Token.create({
            markup: command[0],
          })
        );

        for (let i = 1; i < command.length; i += 1) {
          line.mount(
            Token.create({
              markup: command[i][0], // TODO: ugly
              key: command[i][1],
              class: command[i][2],
            })
          );
        }

        open.push(line);
      }
    }

    open.push(
      Line.create({ indent: this.height + 1 }).mount(
        Token.create({
          markup: '"',
        })
      )
    );

    if (this.transform) {
      open.push(
        Line.create({ indent: this.height + 1 }).mount(
          Token.create({
            markup: `transform="${this.transform.toString()}"`,
          })
        )
      );
    }

    open.push(
      Line.create({ indent: this.height }).mount(
        Token.create({ markup: '/>' })
      )
    );

    return () => open;
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
    wrapper.children.push(outerUI);

    return () => wrapper;
  },
});

export { Shape };
