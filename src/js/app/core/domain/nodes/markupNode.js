import { Node } from './_.js';
import { types } from './_.js';

const MarkupNode = Object.create(Node);

Object.assign(MarkupNode, {
  create(opts = {}) {
    return Node.create
      .bind(this)()
      .set(opts);
  },

  toMarkupString() {
    switch (this.type) {
      case types.TOKEN:
        return this.markup;
      case types.LINE:
        return '  '.repeat(this.indent) + // TODO: '  ' should be constant ('unitPad')
          this.children.map(
            node => node.toMarkupString()
          ).join(' ');
      case types.MARKUPROOT:
        return (
          this.children.map(
            node => node.toMarkupString()
          ).join('\n') + '\n' // <= here, we insert trailing newline!
        );
    }
  },
});

export { MarkupNode };
