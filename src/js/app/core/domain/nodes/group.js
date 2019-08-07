import { GraphicsNode } from './_.js';
import { Matrix } from '../geometry/_.js';
import { MarkupNode } from './_.js';
import { types } from './_.js';

const Group = Object.create(GraphicsNode);

Object.assign(Group, {
  create() {
    return GraphicsNode.create
      .bind(this)()
      .set({ type: types.GROUP });
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

  toTags() {
    const open = MarkupNode.create();

    if (!this.transform.equals(Matrix.identity())) {
      open.markup = `<g transform="${this.transform.toString()}">`;
    } else {
      open.markup = '<g>';
    }

    open.key = this.key;
    open.class = this.class;

    const close = MarkupNode.create();
    close.markup = '</g>';
    close.key = this.key;

    return {
      open: open,
      close: close,
    };
  },
});

export { Group };
