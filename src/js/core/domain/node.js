import { Matrix }    from './matrix.js';
import { Vector }    from './vector.js';
import { Rectangle } from './rectangle.js';
import { Class }   from './class.js';

const createID = () => {
  const randomString = Math.random().toString(36).substring(2);
  const timestamp    = (new Date()).getTime().toString(36);
  return randomString + timestamp;
};

const Node = {
  create(opts = {}) {
    return Object.create(Node).init(opts);
  },

  init(opts) {
    this.set(this.defaults());
    this.set(opts);

    return this;
  },

  defaults() {
    return {
      _id:         createID(),
      type:        null,
      children:    [],
      parent:      null,
      box:         Rectangle.create(),
      props:       {
        transform: Matrix.identity(),
        class:     Class.create(),
      },
    };
  },

  tagName() {
    return {
      root:  'svg',
      shape: 'path',
      group: 'g'
    }[this.type];
  },

  toJSON() {
    return {
      _id:         this._id,
      children:    this.children,
      parent:      this.parent && this.parent._id,
      tag:         this.tagName(),
      box:         this.box,           // { ... }
      path:        this.props.path,    // only for SHAPE
      viewBox:     this.props.viewBox, // only for ROOT
      props:       {
        transform: this.transform, // 'matrix(...)'
        class:     this.class,     // 'class1 class2 ...'
        d:         this.props.path && this.props.path.encodeSVGPath(), // 'M x y ...'
        // only for SHAPE
      },
      globalScale: this.globalScaleFactor(),
    };
  },

  set(opts) {
    for (let key of Object.keys(opts)) {
      this[key] = opts[key];
    }
  },

  append(node) {
    this.children.push(node);
    node.parent = this;
  },

  // TODO: fewer getters?

  get root() {
    return this.findAncestor(node => node.parent === null);
  },

  get leaves() {
    return this.findDescendants(node => node.children.length === 0);
  },

  isLeaf() {
    return this.children.length === 0;
  },

  isRoot() {
    return this.parent === null;
  },

  get ancestors() {
    return this.findAncestors(node => true);
  },

  get descendants() {
    return this.findDescendants(node => true);
  },

  get siblings() {
    return this.parent.children.filter(node => node !== this);
  },

  get selected() {
    return this.root.findDescendant((node) => {
      return node.class.includes('selected');
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

  findAncestor(predicate) {
    if (predicate(this)) {
      return this;
    } else if (this.parent === null) {
      return null;
    } else {
      return this.parent.findAncestor(predicate);
    }
  },

  findAncestors(predicate, resultList = []) {
    if (this.parent === null) {
      return resultList;
    } else {
      if (predicate(this.parent)) {
        resultList.push(this.parent);
      }
      return this.parent.findAncestors(predicate, resultList);
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

  findDescendants(predicate, resultList = []) {
    if (predicate(this)) {
      resultList.push(this);
    }

    for (let child of this.children) {
      child.findDescendants(predicate, resultList);
    }

    return resultList;
  },

  get path() {
    return this.props.path;
  },

  set path(value) {
    this.props.path = value;
  },

  get class() {
    return this.props.class;
  },

  set class(value) {
    this.props.class = value;
  },

  get transform() {
    return this.props.transform;
  },

  set transform(value) {
    this.props.transform = value;
  },

  globalTransform() {
    return this.ancestorTransform().multiply(this.transform);
  },

  ancestorTransform() {
    let matrix = Matrix.identity();

    for (let ancestor of this.ancestors.reverse()) {
      matrix = matrix.multiply(ancestor.transform);
    }

    return matrix;
  },

  globalScaleFactor() {
    const total  = this.globalTransform();
    const a      = total.m[0][0];
    const b      = total.m[1][0];

    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
  },

  computeBBox() {
    if (this.isLeaf() && !this.isRoot()) {
      this.box = this.path.bBox();
    } else {
      const corners = [];

      for (let child of this.children) {
        for (let corner of child.computeBBox().corners) {
          corners.push(corner.transform(child.transform));
        }
      }

      const xValue  = vector => vector.x;
      const xValues = corners.map(xValue);
      const yValue  = vector => vector.y;
      const yValues = corners.map(yValue);

      const min = Vector.create(Math.min(...xValues), Math.min(...yValues));
      const max = Vector.create(Math.max(...xValues), Math.max(...yValues));

      this.box = Rectangle.createFromMinMax(min, max);
    }

    return this.box;
  },

  // TODO: repetitive with the previous method
  updateBBox() {
    const corners = [];

    for (let child of this.children) {
      for (let corner of child.box.corners) {
        corners.push(corner.transform(child.transform));
      }
    }

    const xValue  = vector => vector.x;
    const xValues = corners.map(xValue);
    const yValue  = vector => vector.y;
    const yValues = corners.map(yValue);

    const min = Vector.create(Math.min(...xValues), Math.min(...yValues));
    const max = Vector.create(Math.max(...xValues), Math.max(...yValues));

    this.box = Rectangle.createFromMinMax(min, max);
  },

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

  // plot point for debugging
  // plot(point) {
  //   const node = Node.create();
  //   node.tag = 'circle';
  //   node.props = Object.assign(node.props, {
  //     r: 5, cx: point[0], cy: point[1], fill: 'red'
  //   });
  //   node.box = { x: point[0], y: point[1], width: 5, height: 5};
  //   this.root.append(node);
  // },
};

export { Node };
