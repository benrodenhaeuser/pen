import { Matrix, Vector } from './matrix.js';
import { ClassList } from './classList.js';

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
    this.set(this.defaults);
    this.set(opts);

    return this;
  },

  get defaults() {
    return {
      _id:         createID(),
      children:    [],
      parent:      null,
      tag:         null,
      box:         { x: 0, y: 0, width: 0, height: 0 },
      motion:      {},
      props:    {
        transform: Matrix.identity(),
        class:     ClassList.create(),
      },
    };
  },

  toJSON() {
    return {
      _id:         this._id,
      children:    this.children,
      parent:      this.parent && this.parent._id,
      tag:         this.tag,
      box:         this.box,
      motion:      this.motion,
      props:       this.props,
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

  get root() {
    return this.findAncestor(node => node.parent === null);
  },

  get leaves() {
    return this.findDescendants(node => node.children.length === 0);
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
      return node.classList.includes('selected');
    });
  },

  get frontier() {
    return this.root.findDescendants((node) => {
      return node.classList.includes('frontier');
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

  get corners() {
    return [
      Vector.create(this.box.x, this.box.y),
      Vector.create(this.box.x + this.box.width, this.box.y),
      Vector.create(this.box.x, this.box.y + this.box.height),
      Vector.create(this.box.x + this.box.width, this.box.y + this.box.height)
    ]
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

  updateBox() {
    const childrenCorners = [];

    for (let child of this.children) {
      for (let corner of child.corners) {
        childrenCorners.push(corner.transform(child.transform));
      }
    }

    if (childrenCorners.length === 0) {
      return;
    }

    const xValue  = vector => vector.x;
    const xValues = childrenCorners.map(xValue);
    const minX    = Math.min(...xValues);
    const maxX    = Math.max(...xValues);

    const yValue  = vector => vector.y;
    const yValues = childrenCorners.map(yValue);
    const minY    = Math.min(...yValues);
    const maxY    = Math.max(...yValues);

    this.box = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  },

  setFrontier() {
    this.removeFrontier();

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

  removeFrontier() {
    const frontier = this.root.findDescendants((node) => {
      return node.classList.includes('frontier');
    });

    for (let node of frontier) {
      node.classList.remove('frontier');
    }
  },

  focus() {
    this.classList.add('focus');
  },

  unfocusAll() {
    const focussed = this.root.findDescendants((node) => {
      return node.classList.includes('focus');
    });

    for (let node of focussed) {
      node.classList.remove('focus');
    }
  },

  select() {
    this.deselectAll();
    this.classList.add('selected');
    this.setFrontier();
  },

  deselectAll() {
    if (this.selected) {
      this.selected.classList.remove('selected');
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
