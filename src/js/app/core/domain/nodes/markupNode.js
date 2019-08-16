import { Node } from './_.js';
import { types } from './_.js';

const MarkupNode = Object.create(Node);

Object.assign(MarkupNode, {
  create(opts = {}) {
    return Node.create
      .bind(this)()
      .set({ type: types.MARKUPNODE })
      .set(opts);
  },

  // TODO
  indexify(start = 0) {
    this.start = start;

    if (this.markup) {
      this.end = this.start + this.markup.length - 1;
      return this.end + 1;
    } else {
      for (let child of this.children) {
        start = child.indexify(start);
      }

      this.end = start - 1;

      return start;
    }
  },

  // TODO
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

  // TODO
  flattenToList(list = []) {
    if (this.markup) {
      list.push(this);
    } else {
      for (let child of this.children) {
        child.flattenToList(list);
      }
    }

    return list;
  },

  // TODO
  toMarkup() {
    return this.flattenToList()
      .map(node => node.markup)
      .join('');
  },
});

export { MarkupNode };
