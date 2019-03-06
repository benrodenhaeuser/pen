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
    return Object.create(this).init(opts);
  },

  init(opts) {
    this.set(this.defaults());
    this.set(opts);

    return this;
  },

  defaults() {
    return {
      _id:       createID(),
      children:  [],
      parent:    null,
      transform: Matrix.identity(),
      class:     Class.create(),
      props:     {},  // for SVG stuff, rename to attr, or get rid of (?)
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

  findByID(id) {
    return this.findDescendant((node) => {
      return node._id === id;
    });
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
      console.log(this);
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

  publishDefaults() {
    return {
      _id: this._id,
      children: this.children,
      parent: this.parent && this.parent._id,
    };
  },

  rotate(angle, center) {
    this.transform = this
      .ancestorTransform().invert()
      .multiply(Matrix.rotation(angle, center))
      .multiply(this.globalTransform());
  },

  scale(factor, center) {
    this.transform = this
      .ancestorTransform().invert()
      .multiply(Matrix.scale(factor, center))
      .multiply(this.globalTransform());
  },

  translate(offset) {
    this.transform = this
      .ancestorTransform().invert()
      .multiply(Matrix.translation(offset))
      .multiply(this.globalTransform());
  },
};

// TODO: we should be more explicit about what constitutes a Root, Shape, Group
//       which is to say they should have each their own `create` method

const Root = Object.create(Node);
Root.toJSON = function() {
  return Object.assign({
    tag:     'svg',
    viewBox: this.viewBox,
    attr: {
      viewBox: this.viewBox.toString(),
    },
  }, this.publishDefaults());
};

const Shape = Object.create(Node);
Shape.toJSON = function() {
  return Object.assign({
    tag:         'path',
    box:         this.box || Rectangle.create(), // TODO
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

const Group = Object.create(Node);
Group.toJSON = function() {
  return Object.assign({
    tag:         'g',
    box:         this.box || Rectangle.create(), // TODO
    transform:   this.transform,
    globalScale: this.globalScaleFactor(),
    attr: {
      transform: this.transform.toString(),
      class:     this.class.toString(),
    },
  }, this.publishDefaults());
};

export { Root, Shape, Group };
