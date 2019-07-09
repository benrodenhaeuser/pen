const ASTNode = {
  create() {
    return Object.create(ASTNode).init();
  },

  init() {
    this.children = [];

    return this;
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

  // find node whose start to end range includes given index
  findNodeByIndex(idx) {
    if (this.markup) {
      if (this.start <= idx && idx <= this.end) {
        return this;
      } else {
        return null;
      }
    } else {
      const child = this.children.find(child => child.start <= idx && idx <= child.end);

      if (child) {
        return child.findNodeByIndex(idx);
      } else {
        return null;
      }
    }
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

  // make prettified markup string
  prettyMarkup() {
    const list = this.flatten();

    for (let i = 0; i < list.length; i += 1) {
      list[i] = list[i].indent + list[i].markup;
    }

    return list.join('\n');
  },

  // print indices
  printIndices() {
    const list = this.flatten();
    const pairs = list.map(node => [node.markup, node.start, node.end]);
    console.log(pairs);
  },

  // return indent of this node
  indent() {
    let pad = '  ';
    let ind = '';

    for (let i = 0; i < this.level; i += 1) {
      ind = pad + ind;
    }

    return ind;
  },
};

export { ASTNode };
