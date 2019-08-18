import { GraphicsNode } from './_.js';
import { types } from './_.js';
import { Matrix } from '../geometry/_.js';
import { Line } from './_.js';
import { Token } from './_.js';

const Group = Object.create(GraphicsNode);

Object.assign(Group, {
  create(opts = {}) {
    return GraphicsNode.create
      .bind(this)()
      .set({ type: types.GROUP })
      .set(opts);
  },

  toVDOMNode() {
    return {
      tag: 'g',
      children: [],
      props: {
        'data-key': this.key,
        'data-type': this.type,
        transform: this.transform && this.transform.toString(),
        class: this.class.toString(),
      },
    };
  },

  toTags(level) {
    const tags = {
      open: [],
      close: [],
    };

    let openMarkup;
    if (this.transform) {
      openMarkup = `<g transform="${this.transform.toString()}">`;
    } else {
      openMarkup = `<g>`;
    }

    tags.open.push(
      Line.create({ indent: 1 }).append(
        Token.create({
          markup: openMarkup,
          key: this.key,
          class: this.class,
        })
      )
    );

    tags.close.push(
      Line.create({ indent: -1 }).append(
        Token.create({
          markup: '</g>',
          key: this.key,
          class: this.class,
        })
      )
    );

    return tags;
  },
});

export { Group };
