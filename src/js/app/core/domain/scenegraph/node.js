import { Class } from '../helpers.js';
import { createID } from '../helpers.js';

const Node = {
  create() {
    return Object.create(this)
      .setType()
      .set(this.nodeDefaults());
  },

  // => set type as an own property of the instance created:
  setType() {
    this.type = Object.getPrototypeOf(this).type;
    return this;
  },

  nodeDefaults() {
    return {
      key: createID(),
      children: [],
      parent: null,
      payload: {
        class: Class.create(),
      },
    };
  },

  set(opts) {
    for (let key of Object.keys(opts)) {
      this[key] = opts[key];
    }

    return this;
  },

  // search

  findAncestor(predicate) {
    if (predicate(this)) {
      return this;
    } else if (this.parent === null) {
      return null;
    } else {
      return this.parent.findAncestor(predicate);
    }
  },

  findAncestors(predicate, ancestors = []) {
    if (predicate(this)) {
      ancestors.push(this);
    }

    if (this.parent === null) {
      return ancestors;
    } else {
      return this.parent.findAncestors(predicate, ancestors);
    }
  },

  findDescendant(predicate) {
    if (predicate(this)) {
      return this;
    } else {
      for (let child of this.children) {
        let val = child.findDescendant(predicate);
        if (val) {
          return val;
        }
      }
    }

    return null;
  },

  findDescendants(predicate, descendants = []) {
    if (predicate(this)) {
      descendants.push(this);
    }

    for (let child of this.children) {
      child.findDescendants(predicate, descendants);
    }

    return descendants;
  },

  findDescendantByKey(key) {
    return this.findDescendant(node => {
      return node.key === key;
    });
  },

  findDescendantByClass(className) {
    return this.findDescendant(node => {
      return node.class.includes(className);
    });
  },

  findAncestorByClass(className) {
    return this.findAncestor(node => {
      return node.class.includes(className);
    });
  },

  // hierarchy

  get root() {
    return this.findAncestor(node => node.parent === null);
  },

  get leaves() {
    return this.findDescendants(node => node.children.length === 0);
  },

  get ancestors() {
    return this.findAncestors(node => true);
  },

  get properAncestors() {
    return this.parent.findAncestors(node => true);
  },

  get descendants() {
    return this.findDescendants(node => true);
  },

  get siblings() {
    return this.parent.children.filter(node => node !== this);
  },

  get lastChild() {
    return this.children[this.children.length - 1];
  },

  // hierarchy operations

  append(node) {
    this.children = this.children.concat([node]);
    node.parent = this;
  },

  replaceWith(node) {
    node.parent = this.parent;
    const index = this.parent.children.indexOf(this);
    this.parent.children.splice(index, 1, node);
  },

  insertChild(node, index) {
    node.parent = this;
    this.children.splice(index, 0, node);
  },

  get class() {
    return this.payload.class;
  },

  set class(value) {
    this.payload.class = value;
  },

  // hierarchy tests

  isLeaf() {
    return this.children.length === 0;
  },

  isRoot() {
    return this.parent === null;
  },

  // string encoding

  toJSON() {
    const plain = {
      key: this.key,
      type: this.type,
      children: this.children,
      payload: this.payload,
    };

    return plain;
  },
};

export { Node };
