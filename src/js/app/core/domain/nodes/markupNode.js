import { Node } from './_.js';

const MarkupNode = Object.create(Node);
MarkupNode.defineProps(['markup', 'start', 'end', 'level']);

Object.assign(MarkupNode, {
  create() {
    return Node.create
      .bind(this)()
      .set({ type: 'markupNode' });
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
    return this.findAncestor(node => node.parent.type === 'doc');
  },
});

export { MarkupNode };
