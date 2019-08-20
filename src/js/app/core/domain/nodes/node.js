import { ProtoNode } from './_.js';
import { types } from './_.js';
import { Class } from '../helpers/_.js';
import { createID } from '../helpers/_.js';

const Node = Object.create(ProtoNode);
// Node.defineProps(['type', 'key', 'class']);
Node.defineProps(['key', 'class']);

Object.assign(Node, {
  create(opts = {}) {
    return Object.create(this)
      .set({
        children: [],
        parent: null,
        props: {},
      })
      .set({
        type: null,
        key: createID(),
        class: Class.create(),
      })
      .set(opts);
  },

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

  mount(...nodes) {
    for (let node of nodes) {
      this.children = this.children.concat([node]);
      node.parent = this;

      if (node.isGroupOrShape()) {
        node.height = node.parent.height + 1;
      }
    }

    if (this.isSceneNode()) {
      this.invalidateCache();
    }

    return this;
  },

  replaceWith(node) {
    node.parent = this.parent;
    const index = this.parent.children.indexOf(this);
    this.parent.children.splice(index, 1, node);
  },

  unmount() {
    this.parent.unmountChild(this);
  },

  unmountChild(node) {
    const index = this.children.indexOf(node);

    if (index !== -1) {
      this.children.splice(index, 1);
      node.parent = null;

      if (this.isSceneNode()) {
        this.invalidateCache();
      }
    }
  },

  insertChild(node, index) {
    node.parent = this;
    this.children.splice(index, 0, node);
  },

  isLeaf() {
    return this.children.length === 0;
  },

  isRoot() {
    return this.parent === null;
  },

  isGraphicsNode() {
    return [types.CANVAS, types.GROUP, types.SHAPE].includes(this.type);
  },

  isGroupOrShape() {
    return [types.GROUP, types.SHAPE].includes(this.type);
  },

  isSceneNode() {
    return [
      types.CANVAS,
      types.GROUP,
      types.SHAPE,
      types.SPLINE,
      types.SEGMENT,
      types.ANCHOR,
      types.HANDLEIN,
      types.HANDLEOUT
    ].includes(this.type);
  }
});

Object.defineProperty(Node, 'root', {
  get() {
    return this.findAncestor(node => node.parent === null);
  },
});

Object.defineProperty(Node, 'leaves', {
  get() {
    return this.findDescendants(node => node.children.length === 0);
  },
});

Object.defineProperty(Node, 'ancestors', {
  get() {
    return this.findAncestors(node => true);
  },
});

Object.defineProperty(Node, 'properAncestors', {
  get() {
    return this.parent.findAncestors(node => true);
  },
});

Object.defineProperty(Node, 'descendants', {
  get() {
    return this.findDescendants(node => true);
  },
});

Object.defineProperty(Node, 'siblings', {
  get() {
    return this.parent.children.filter(node => node !== this);
  },
});

Object.defineProperty(Node, 'lastChild', {
  get() {
    return this.children[this.children.length - 1];
  },
});

Object.defineProperty(Node, 'graphicsChildren', {
  get() {
    return this.children.filter(node => node.isGraphicsNode());
  },
});

Object.defineProperty(Node, 'graphicsAncestors', {
  get() {
    return this.ancestors.filter(node => node.isGraphicsNode());
  },
});


export { Node };
