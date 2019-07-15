const SyntaxTree = {
  create() {
    return Object.create(SyntaxTree).init();
  },

  init() {
    this.children = [];

    return this;
  },

  // decorate tree with start and end indices
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

  // find node whose start to end range includes given index
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

  // flatten tree to a list of leaf nodes
  flatten(list = []) {
    if (this.markup) {
      list.push(this);
    } else {
      for (let child of this.children) {
        child.flatten(list);
      }
    }

    return list;
  },

  toMarkup() {
    return this.flatten()
      .map(node => node.markup)
      .join('');
  },
};

export { SyntaxTree };
