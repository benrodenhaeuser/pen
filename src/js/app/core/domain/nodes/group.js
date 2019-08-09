import { GraphicsNode } from './_.js';
import { Matrix } from '../geometry/_.js';
import { OpenTag } from './_.js';
import { CloseTag } from './_.js';
import { types } from './_.js';

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

  toSVGNode() {
    const svgNode = {
      tag: 'g',
      children: [],
      props: {},
    };

    if (!this.transform.equals(Matrix.identity())) {
      svgNode.props.transform = this.transform.toString();
    }

    return svgNode;
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
      class: this.class,
      markup: `${pad}</g>`,
    });

    return {
      open: open,
      close: close,
    };
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

export { Group };
