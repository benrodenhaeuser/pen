import { Node } from './_.js';
import { types } from './_.js';

const MarkupNode = Object.create(Node);
MarkupNode.defineProps(['markup', 'start', 'end', 'level']);

Object.assign(MarkupNode, {
  create(opts = {}) {
    return Node.create
      .bind(this)()
      .set({ type: types.MARKUPNODE })
      .set(opts);
  },

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

  // it looks like this will return a leaf node, so maybe we should call it
  // findLeadByIndex
  findNodeByIndex(idx) {
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
        return child.findNodeByIndex(idx);
      } else {
        return null;
      }
    }
  },

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

  toMarkup() {
    return this.flattenToList()
      .map(node => node.markup)
      .join('');
  },
});

Object.defineProperty(MarkupNode, 'markupRoot', {
  get() {
    return this.findAncestor(node => node.parent.type === types.DOC);
  },
});

export { MarkupNode };
