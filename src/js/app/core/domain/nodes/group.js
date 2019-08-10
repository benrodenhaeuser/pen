import { GraphicsNode } from './_.js';
import { OpenTag } from './_.js';
import { CloseTag } from './_.js';
import { types } from './_.js';
import { Matrix } from '../geometry/_.js';
import { indent } from '../helpers/_.js';

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
        transform: this.transform.toString(),
        class: this.class.toString(),
      },
    };
  },

  toTags(level) {
    const open = OpenTag.create({
      key: this.key,
      class: this.class,
    });

    const pad = indent(level);

    if (!this.transform.equals(Matrix.identity())) {
      open.markup = `${pad}<g transform="${this.transform.toString()}">`;
    } else {
      open.markup = `${pad}<g>`;
    }

    const close = CloseTag.create({
      key: this.key,
      markup: `${pad}</g>`,
    });

    return {
      open: open,
      close: close,
    };
  },
});

// TODO: duplicate


export { Group };
