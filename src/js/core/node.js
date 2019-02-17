import { Matrix } from './matrix.js';
import { ClassList } from './classList.js';
import { Vector } from './vector.js';

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
      children:    [],
      parent:      null,
      tag:         null,
      box:         { x: 0, y: 0, width: 0, height: 0 },
      props:    {
        transform: Matrix.identity(),
        class:     ClassList.create(),
      },
    };
  },

  toJSON() {
    return {
      _id:         this._id,
      parent:      this.parent && this.parent._id,
      children:    this.children,
      tag:         this.tag,
      props:       this.props,
      box:         this.box,
      globalScale: this.globalScaleFactor(),
    };
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

  get root() {
    return this.findAncestor((node) => {
      return node.parent === null;
    });
  },

  get ancestors() {
    return this.findAncestors(node => true);
  },

  get descendants() {
    return this.findDescendants(node => true);
  },

  get selected() {
    return this.root.findDescendant((node) => {
      return node.classList.includes('selected');
    });
  },

  get frontier() {
    return this.root.findDescendants((node) => {
      return node.classList.includes('frontier');
    });
  },

  get classList() {
    return this.props.class;
  },

  set classList(value) {
    this.props.class = value;
  },

  get transform() {
    return this.props.transform;
  },

  set transform(value) {
    this.props.transform = value;
  },

  totalTransform() {
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
    const total  = this.totalTransform();
    const a      = total.m[0][0];
    const b      = total.m[1][0];
    const factor = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));

    return factor;
  },

  // for debugging purposes
  plot(point) {
    const node = Node.create();
    node.tag = 'circle';
    node.props = Object.assign(node.props, {
      r: 5, cx: point[0], cy: point[1], fill: 'red'
    });
    node.box = { x: point[0], y: point[1], width: 5, height: 5};
    this.root.append(node);
  },

  updateBox() {
    // store all the children's corners
    const corners = [];

    for (let child of this.children) {
      let childCorners = child.findCorners();
      for (let corner of childCorners) {
        corner = this.transformPoint(corner, this.totalTransform().invert());
        corners.push(corner);
      }
    }

    if (corners.length === 0) {
      return;
    }

    // find min and max:
    const xValue  = point => point[0];
    const yValue  = point => point[1];
    const xValues = corners.map(xValue);
    const yValues = corners.map(yValue);

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    // use min and max to update coordinates:
    this.box = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  },

  findCorners() {
    const northWest = [
      this.box.x, this.box.y
    ];

    const northEast = [
      this.box.x + this.box.width, this.box.y
    ];

    const southWest = [
      this.box.x, this.box.y + this.box.height
    ];

    const southEast = [
      this.box.x + this.box.width, this.box.y + this.box.height
    ];

    return [
      this.transformPoint(northWest, this.totalTransform()),
      this.transformPoint(northEast, this.totalTransform()),
      this.transformPoint(southWest, this.totalTransform()),
      this.transformPoint(southEast, this.totalTransform()),
    ];
  },

  transformPoint(pt, matrix) {
    const column      = Matrix.create([[pt[0]], [pt[1]], [1]]);
    const transformed = matrix.multiply(column).toArray();

    return [transformed[0][0], transformed[1][0]];
  },

  get siblings() {
    return this.parent.children.filter((node) => {
      return node !== this;
    });
  },

  unsetFrontier() {
    const frontier = this.root.findDescendants((node) => {
      return node.classList.includes('frontier');
    });

    for (let node of frontier) {
      node.classList.remove('frontier');
    }
  },

  unfocusAll() {
    const focussed = this.root.findDescendants((node) => {
      return node.classList.includes('focus');
    });

    for (let node of focussed) {
      node.classList.remove('focus');
    }
  },

  setFrontier() {
    this.unsetFrontier();

    if (this.selected) {
      this.selected.classList.add('frontier');

      let node = this.selected;

      do {
        for (let sibling of node.siblings) {
          sibling.classList.add('frontier');
        }
        node = node.parent;
      } while (node.parent !== null);
    } else {
      for (let child of this.root.children) {
        child.classList.add('frontier');
      }
    }
  },

  deselectAll() {
    if (this.selected) {
      this.selected.classList.remove('selected');
    }
    this.setFrontier();
  },

  select() {
    this.deselectAll();
    this.classList.add('selected');
    this.setFrontier();
  },

  append(node) {
    this.children.push(node);
    node.parent = this;
  },

  set(opts) {
    for (let key of Object.keys(opts)) {
      this[key] = opts[key];
    }
  },
};

export { Node };
