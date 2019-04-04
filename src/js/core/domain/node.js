import { Matrix    } from './matrix.js';
import { Vector    } from './vector.js';
import { Rectangle } from './rectangle.js';
import { Class     } from './class.js';

import { builder   } from './builder.js';
import { wrapper   } from './wrapper.js';

const createID = () => {
  const randomString = Math.random().toString(36).substring(2);
  const timestamp    = (new Date()).getTime().toString(36);
  return randomString + timestamp;
};

const Node = {
  create(opts = {}) {
    return Object.create(this).init(opts);
  },

  // this method parses markup into scene
  createFromMarkup(markup) {
    return builder.buildFrom(markup);
  },

  init(opts) {
    this.set(this.initDefaults());
    this.set(opts);

    return this;
  },

  initDefaults() {
    return {
      _id:       createID(),
      children:  [],
      parent:    null,
      transform: Matrix.identity(),
      class:     Class.create(),
      bounds:    Rectangle.create(),
    };
  },

  publishDefaults() {
    return {
      _id: this._id,
      children: this.children,
    };
  },

  set(opts) {
    for (let key of Object.keys(opts)) {
      this[key] = opts[key];
    }
  },

  // hierarchy

  get root() {
    return this.findAncestor(
      node => node.parent === null
    );
  },

  get leaves() {
    return this.findDescendants(
      node => node.children.length === 0
    );
  },

  isLeaf() {
    return this.children.length === 0;
  },

  isRoot() {
    return this.parent === null;
  },

  get ancestors() {
    return this.findAncestors(
      node => true
    );
  },

  get properAncestors() {
    return this.parent.findAncestors(
      node => true
    );
  },

  get descendants() {
    return this.findDescendants(
      node => true
    );
  },

  get siblings() {
    return this.parent.children.filter(
      node => node !== this
    );
  },

  get selected() {
    return this.root.findDescendant((node) => {
      return node.class.includes('selected');
    });
  },

  get editing() {
    return this.root.findDescendant((node) => {
      return node.class.includes('editing');
    });
  },

  isSelected() {
    return this.class.includes('selected');
  },

  get frontier() {
    return this.root.findDescendants((node) => {
      return node.class.includes('frontier');
    });
  },

  // traversal

  // NOTE: a node is an ancestor of itself!
  findAncestor(predicate) {
    if (predicate(this)) {
      return this;
    } else if (this.parent === null) {
      return null;
    } else {
      return this.parent.findAncestor(predicate);
    }
  },

  // NOTE: a node is an ancestor of itself!
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
        if (val) { return val; }
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

  findDescendantByID(id) {
    return this.findDescendant((node) => {
      return node._id === id;
    });
  },

  findAncestorByClass(className) {
    return this.findAncestor((node) => {
      return node.class.includes(className);
    })
  },

  // node creation

  append(node) {
    this.children.push(node);
    node.parent = this;
  },

  // bounding box

  computeBounds() {
    if (this.isLeaf() && !this.isRoot()) {
      this.bounds = this.path.bounds();
    } else {
      const corners = [];

      for (let child of this.children) {
        for (let corner of child.computeBounds().corners) {
          corners.push(corner.transform(child.transform));
        }
      }

      const xValue  = vector => vector.x;
      const xValues = corners.map(xValue);
      const yValue  = vector => vector.y;
      const yValues = corners.map(yValue);

      const min = Vector.create(Math.min(...xValues), Math.min(...yValues));
      const max = Vector.create(Math.max(...xValues), Math.max(...yValues));

      this.bounds = Rectangle.createFromMinMax(min, max);
    }

    return this.bounds;
  },

  contains(globalPoint) {
    return globalPoint
      .transform(this.globalTransform().invert())
      .isWithin(this.bounds);
  },

  // TODO: repetitive with `computeBounds` to some extent
  // computeBounds computes bounds for the whole tree,
  // wheres updateBounds computes bounds for `this` only
  updateBounds() {
    if (this.isLeaf() && !this.isRoot()) {
      this.bounds = this.path.bounds();
    } else {
      const corners = [];

      for (let child of this.children) {
        for (let corner of child.bounds.corners) {
          corners.push(corner.transform(child.transform));
        }
      }

      const xValue  = vector => vector.x;
      const xValues = corners.map(xValue);
      const yValue  = vector => vector.y;
      const yValues = corners.map(yValue);

      const min = Vector.create(Math.min(...xValues), Math.min(...yValues));
      const max = Vector.create(Math.max(...xValues), Math.max(...yValues));

      this.bounds = Rectangle.createFromMinMax(min, max);
    }

    return this.bounds;
  },

  // setting and removing classes

  setFrontier() {
    this.removeFrontier();

    if (this.selected) {
      this.selected.class.add('frontier');

      let node = this.selected;

      do {
        for (let sibling of node.siblings) {
          sibling.class.add('frontier');
        }
        node = node.parent;
      } while (node.parent !== null);
    } else {
      for (let child of this.root.children) {
        child.class.add('frontier');
      }
    }
  },

  removeFrontier() {
    const frontier = this.root.findDescendants((node) => {
      return node.class.includes('frontier');
    });

    for (let node of frontier) {
      node.class.remove('frontier');
    }
  },

  focus() {
    this.class.add('focus');
  },

  unfocusAll() {
    const focussed = this.root.findDescendants((node) => {
      return node.class.includes('focus');
    });

    for (let node of focussed) {
      node.class.remove('focus');
    }
  },

  select() {
    this.deselectAll();
    this.class.add('selected');
    this.setFrontier();
  },

  edit() {
    this.deselectAll();
    this.setFrontier();
    this.class.add('editing');
  },

  deselectAll() {
    if (this.selected) {
      this.selected.class.remove('selected');
    }
    this.setFrontier();
  },

  deeditAll() {
    if (this.editing) {
      this.editing.class.remove('editing');
    }
  },

  // transform

  globalTransform() {
    return this.ancestorTransform().multiply(this.transform);
  },

  // NOTE: "ancestorTransform" in the sense of *proper* ancestors!
  ancestorTransform() {
    let matrix = Matrix.identity();

    for (let ancestor of this.properAncestors.reverse()) {
      matrix = matrix.multiply(ancestor.transform);
    }

    return matrix;
  },

  rotate(angle, center) {
    center = center.transform(this.ancestorTransform().invert());
    this.transform = Matrix.rotation(angle, center).multiply(this.transform);

    // alternatively:

    // this.transform = this
    //   .ancestorTransform().invert()
    //   .multiply(Matrix.rotation(angle, center))
    //   .multiply(this.globalTransform());
  },

  scale(factor, center) {
    center = center.transform(this.ancestorTransform().invert());
    this.transform = Matrix.scale(factor, center).multiply(this.transform);

    // alternatively:

    // this.transform = this
    //   .ancestorTransform().invert()
    //   .multiply(Matrix.scale(factor, center))
    //   .multiply(this.globalTransform());
  },

  translate(offset) {
    // TODO: for some reason, simply premultiplying this.transform
    // with the offset matrix does not yield the correct result, why is that?

    this.transform = this
      .ancestorTransform().invert()
      .multiply(Matrix.translation(offset))
      .multiply(this.globalTransform());
  },

  globalScaleFactor() {
    const total  = this.globalTransform();
    const a      = total.m[0][0];
    const b      = total.m[1][0];

    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
  },

  // returns a virtual dom tree (for rendering as a real dom tree)
  toVDOM(vParent = null) {
    const vNode = this.toVDOMNode();

    if (vParent) {
      const vWrapper = wrapper.wrap(vNode, this);
      vParent.children.push(vWrapper);
    }

    for (let child of this.children) {
      child.toVDOM(vNode);
    }

    return vNode;
  },

  // returns a plain JS object (for backend storage)
  toPlain() {
    return JSON.parse(JSON.stringify(this));
  },
};

const Root  = Object.create(Node);
const Group = Object.create(Node);
const Shape = Object.create(Node);

Root.toVDOMNode = function() {
  return {
    tag:      'svg',
    children: [],
    props: {
      'data-id':   this._id,
      'data-type': 'content',
      'viewBox':    this.viewBox.toString(),
      xmlns:       'http://www.w3.org/2000/svg',
    },
  };
};

Group.toVDOMNode = function() {
  return {
    tag:      'g',
    children: [],
    props: {
      'data-id':   this._id,
      'data-type': 'content',
      transform:   this.transform.toString(),
      class:       this.class.toString(),
    },
  };
};

Shape.toVDOMNode = function() {
  return {
    tag:      'path',
    children: [],
    props: {
      'data-id':   this._id,
      'data-type': 'content',
      d:           this.path.toString(),
      transform:   this.transform.toString(),
      class:       this.class.toString(),
    },
  };
};

Root.toJSON = function() {
  return Object.assign({
    tag:     'svg',
    viewBox: this.viewBox,
    attr: {
      viewBox: this.viewBox.toString(),
    },
  }, this.publishDefaults());
};

Group.toJSON = function() {
  return Object.assign({
    tag:         'g',
    bounds:      this.bounds || Rectangle.create(), // TODO
    transform:   this.transform,
    globalScale: this.globalScaleFactor(),
    attr: {
      transform: this.transform.toString(),
      class:     this.class.toString(),
    },
  }, this.publishDefaults());
};

Shape.toJSON = function() {
  return Object.assign({
    tag:         'path',
    bounds:      this.bounds || Rectangle.create(), // TODO
    path:        this.path,
    transform:   this.transform,
    globalScale: this.globalScaleFactor(),
    attr: {
      d:         this.path.toString(),
      transform: this.transform.toString(),
      class:     this.class.toString(),
    },
  }, this.publishDefaults());
};

export { Root, Shape, Group, Node };
