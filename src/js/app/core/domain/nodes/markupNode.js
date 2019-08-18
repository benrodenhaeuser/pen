import { Node } from './_.js';
import { types } from './_.js';

const MarkupNode = Object.create(Node);

Object.assign(MarkupNode, {
  create(opts = {}) {
    return Node.create
      .bind(this)()
      .set(opts);
  },

  // TODO -- will have to find a different solution
  findLeafByIndex(idx) {
    if (this.markup) {
      if (this.start <= idx && idx <= this.end) {
        return this;
      } else {
        return null;
      }
    } else {
      const child = this.children.find(
        child => child.start <= idx && idx <= child.end
      );

      if (child) {
        return child.findLeafByIndex(idx);
      } else {
        return null;
      }
    }
  },

  toMarkupString() {
    switch (this.type) {
      case types.TOKEN:
        return this.markup;
      case types.LINE:
        return this.children
          .map(
            node => node.toMarkupString()
          )
          .join(' ');
      case types.MARKUPROOT:
        return this.children
          .map(
            node => node.toMarkupString()
          )
          .join('\n') + '\n'; // <= need trailing newline!
    }
  },
});

export { MarkupNode };
