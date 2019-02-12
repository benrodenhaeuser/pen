const createID = () => {
  const randomString = Math.random().toString(36).substring(2);
  const timestamp    = (new Date()).getTime().toString(36);
  return randomString + timestamp;
};

const Scene = {
  findAncestor(predicate) {
    if (predicate(this)) {
      return this;
    } else if (this.parent === null) {
      return null;
    } else {
      return this.parent.findAncestor(predicate);
    }
  },

  findDescendant(predicate) {
    if (predicate(this)) {
      return this;
    } else {
      for (let child of this.children) {
        let val = child.findDescendant(predicate);
        if (val) { return val; }
      }
    }

    return null;
  },

  findDescendants(predicate, results = []) {
    if (predicate(this)) {
      results.push(this);
    }

    for (let child of this.children) {
      child.findDescendants(predicate, results);
    }

    return results;
  },

  get root() {
    return this.findAncestor((node) => {
      return node.parent === null;
    });
  },

  get selected() {
    return this.root.findDescendant((node) => {
      return node.props.class.includes('selected');
    });
  },

  get frontier() {
    return this.root.findDescendants((node) => {
      return node.props.class.includes('frontier');
    });
  },

  get siblings() {
    return this.parent.children.filter((node) => {
      return node !== this;
    });
  },

  unsetFrontier() {
    const frontier = this.root.findDescendants((node) => {
      return node.props.class.includes('frontier');
    });

    for (let node of frontier) {
      node.props.class.remove('frontier');
    }
  },

  unfocus() {
    const focussed = this.root.findDescendants((node) => {
      return node.props.class.includes('focus');
    });

    for (let node of focussed) {
      node.props.class.remove('focus');
    }
  },

  setFrontier() {
    this.unsetFrontier();

    if (this.selected) {
      this.selected.props.class.add('frontier');

      let node = this.selected;

      do {
        for (let sibling of node.siblings) {
          sibling.props.class.add('frontier');
        }
        node = node.parent;
      } while (node.parent !== null);
    } else {
      for (let child of this.root.children) {
        child.props.class.add('frontier');
      }
    }
  },

  deselectAll() {
    if (this.selected) {
      this.selected.props.class.remove('selected');
    }
    this.setFrontier();
  },

  select() {
    this.deselectAll();
    this.props.class.add('selected');
    this.setFrontier();
  },

  append(node) {
    this.children.push(node);
    node.parent = this;
  },

  set(settings) {
    for (let key of Object.keys(settings)) {
      this[key] = settings[key];
    }
  },

  toJSON() {
    return {
      _id:         this._id,
      parent:      this.parent && this.parent._id || null,
      children:    this.children,
      tag:         this.tag,
      props:       this.props,
    };
  },

  defaults() {
    return {
      _id:         createID(),
      parent:      null,
      children:    [],
      tag:         null,
      props:       {},
    };
  },

  init(opts = {}) {
    this.set(this.defaults());
    this.set(opts);
    return this;
  },
};

export { Scene };
