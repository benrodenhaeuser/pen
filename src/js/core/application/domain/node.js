import { Matrix    } from './matrix.js';
import { Vector    } from './vector.js';
import { Rectangle } from './rectangle.js';
import { Class     } from './class.js';
import { Curve     } from './curve.js';

const createID = () => {
  const randomString = Math.random().toString(36).substring(2);
  const timestamp    = (new Date()).getTime().toString(36);
  return randomString + timestamp;
};

const Node = {
  create(opts = {}) {
    return Object.create(this).init(opts);
  },

  init(opts) {
    this.set(this.defaults());
    this.set(opts);

    return this;
  },

  defaults() {
    return {
      _id:      createID(),
      children: [],
      parent:   null,
      payload: {
        transform: Matrix.identity(),
        class:     Class.create(),
        bounds:    null,
      },
    };
  },

  set(opts) {
    for (let key of Object.keys(opts)) {
      this[key] = opts[key];
    }
  },

  // hierarchy (predicates)

  isLeaf() {
    return this.children.length === 0;
  },

  isRoot() {
    return this.parent === null;
  },

  isSelected() {
    return this.class.includes('selected');
  },

  // hierarchy (getters)

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

  get graphicsChildren() {
    return this.children.filter(
      node => ['group', 'shape'].includes(node.type)
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

  get frontier() {
    return this.root.findDescendants((node) => {
      return node.class.includes('frontier');
    });
  },

  // payload (getters/setters)

  get transform() {
    return this.payload.transform;
  },

  set transform(value) {
    this.payload.transform = value;
  },

  get class() {
    return this.payload.class;
  },

  set class(value) {
    this.payload.class = value;
  },

  get bounds() {
    if ([
      'segment', 'anchor', 'handleIn', 'handleOut'].includes(this.type)) {
      return null;
    }

    if (this.payload.bounds !== null) {
      return this.payload.bounds;
    }

    return this.memoizeBounds();
  },

  memoizeBounds() {
    if (['segment', 'anchor', 'handleIn', 'handleOut'].includes(this.type)) {
      return;
    }

    const corners = [];
    const children = this.children;

    for (let child of children) {
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

    const bounds = Rectangle.createFromMinMax(min, max);

    this.payload.bounds = bounds;
    return bounds;
  },

  get viewBox() {
    return this.payload.viewBox;
  },

  set viewBox(value) {
    this.payload.viewBox = value;
  },

  // traversal

  // NOTE: a node is an ancestor of itself
  findAncestor(predicate) {
    if (predicate(this)) {
      return this;
    } else if (this.parent === null) {
      return null;
    } else {
      return this.parent.findAncestor(predicate);
    }
  },

  // NOTE: a node is an ancestor of itself
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

  // NOTE: a node is a descendant of itself
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

  // NOTE: a node is a descendant of itself
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

  // append

  append(node) {
    this.children.push(node);
    node.parent = this;
  },

   // hit testing

  contains(globalPoint) {
    return globalPoint
      .transform(this.globalTransform().invert())
      .isWithin(this.bounds);
  },

  // classes

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

  // transforms

  globalTransform() {
    return this.ancestorTransform().multiply(this.transform);
  },

  // NOTE: "ancestorTransform" in the sense of *proper* ancestors!
  ancestorTransform() {
    let matrix = Matrix.identity();

    // we use properAncestors, which does not include the current node:
    for (let ancestor of this.properAncestors.reverse()) {
      matrix = matrix.multiply(ancestor.transform);
    }

    return matrix;
  },

  rotate(angle, center) {
    center = center.transform(this.ancestorTransform().invert());
    this.transform = Matrix.rotation(angle, center).multiply(this.transform);
  },

  scale(factor, center) {
    center = center.transform(this.ancestorTransform().invert());
    this.transform = Matrix.scale(factor, center).multiply(this.transform);
  },

  translate(offset) {
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

  // string encoding

  toJSON() {
    return {
      _id: this._id,
      type: this.type,
      children: this.children,
      payload: this.payload,
    };
  },
};

export { Node };