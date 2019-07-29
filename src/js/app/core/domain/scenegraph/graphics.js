import { Node } from './node.js';
import { Class } from '../helpers/helpers.js';
import { Matrix } from '../geometry/geometry.js';
import { Vector } from '../geometry/geometry.js';
import { Rectangle } from '../geometry/geometry.js';

const Graphics = Object.create(Node);

Object.assign(Graphics, {
  create() {
    return Node.create
      .bind(this)()
      .set(this.graphicsDefaults());
  },

  graphicsDefaults() {
    return {
      payload: {
        transform: Matrix.identity(),
        class: Class.create(),
        bounds: null,
      },
      splitter: Vector.create(-1000, -1000), // <= off-canvas, far away
      // ^ TODO: this is in an odd place
      // it should be in Shape (shapeDefaults())
    };
  },

  updateBounds() {
    if (!['shape', 'group'].includes(this.type)) {
      return;
    }

    const corners = [];
    for (let child of this.children) {
      for (let corner of child.bounds.corners) {
        corners.push(corner.transform(child.transform));
      }
    }

    const xValue = vector => vector.x;
    const xValues = corners.map(xValue);
    const yValue = vector => vector.y;
    const yValues = corners.map(yValue);

    const min = Vector.create(Math.min(...xValues), Math.min(...yValues));
    const max = Vector.create(Math.max(...xValues), Math.max(...yValues));

    const bounds = Rectangle.createFromMinMax(min, max);

    this.payload.bounds = bounds;
    return bounds;
  },

  updateFrontier() {
    this.removeFrontier();

    if (this.selected && this.selected.type !== 'scene') {
      this.selected.class = this.selected.class.add('frontier');

      let node = this.selected;

      do {
        for (let sibling of node.siblings) {
          sibling.class = sibling.class.add('frontier');
        }
        node = node.parent;
      } while (node.parent.type !== 'doc');
    } else {
      for (let child of this.scene.children) {
        child.class = child.class.add('frontier');
      }
    }
  },

  removeFrontier() {
    const frontier = this.scene.findDescendants(node => {
      return node.class.includes('frontier');
    });

    for (let node of frontier) {
      node.class.remove('frontier');
    }
  },

  isSelected() {
    return this.class.includes('selected');
  },

  isInFocus() {
    return this.class.includes('focus');
  },

  isAtFrontier() {
    return this.class.includes('frontier');
  },

  // new

  contains(globalPoint) {
    return globalPoint
      .transform(this.globalTransform().invert())
      .isWithin(this.bounds);
  },

  focus() {
    this.class = this.class.add('focus');
  },

  unfocusAll() {
    const focussed = this.scene.findDescendants(node => {
      return node.class.includes('focus');
    });

    for (let node of focussed) {
      node.class.remove('focus');
    }
  },

  select() {
    this.deselectAll();
    this.class = this.class.add('selected');
    this.updateFrontier();
  },

  edit() {
    this.deselectAll();
    this.updateFrontier();
    this.class = this.class.add('editing');
  },

  deselectAll() {
    if (this.selected) {
      this.selected.class.remove('selected');
    }
    this.updateFrontier();
  },

  deeditAll() {
    if (this.editing) {
      this.editing.class.remove('editing');
    }
  },

  globalTransform() {
    return this.ancestorTransform().multiply(this.transform);
  },

  // NOTE: "ancestorTransform" in the sense of *proper* ancestors!
  ancestorTransform() {
    let matrix = Matrix.identity();

    // we use properAncestors, which does not include the current node:
    for (let ancestor of this.properAncestors.reverse()) {
      if (ancestor.transform) {
        matrix = matrix.multiply(ancestor.transform);
      }
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
    this.transform = this.ancestorTransform()
      .invert()
      .multiply(Matrix.translation(offset))
      .multiply(this.globalTransform());
  },

  globalScaleFactor() {
    const total = this.globalTransform();
    const a = total.m[0][0];
    const b = total.m[1][0];

    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
  },
});

// TODO: rename (but how?)
Object.defineProperty(Graphics, 'graphicsChildren', {
  get() {
    return this.children.filter(node => ['group', 'shape'].includes(node.type));
  },
});

// TODO: rename (but how?)
Object.defineProperty(Graphics, 'graphicsAncestors', {
  get() {
    return this.ancestors.filter(node =>
      ['scene', 'group', 'shape'].includes(node.type)
    );
  },
});

Object.defineProperty(Graphics, 'scene', {
  get() {
    return this.findAncestor(
      node => node.type === 'scene'
    );
  },
});

Object.defineProperty(Graphics, 'selected', {
  get() {
    return this.scene.findDescendant(node => {
      return node.class.includes('selected');
    });
  },
});

Object.defineProperty(Graphics, 'editing', {
  get() {
    return this.scene.findDescendant(node => {
      return node.class.includes('editing');
    });
  },
});

Object.defineProperty(Graphics, 'frontier', {
  get() {
    return this.scene.findDescendants(node => {
      return node.class.includes('frontier');
    });
  },
});

Object.defineProperty(Graphics, 'transform', {
  get() {
    return this.payload.transform;
  },
  set(value) {
    this.payload.transform = value;
  },
});

Object.defineProperty(Graphics, 'bounds', {
  get() {
    if (['segment', 'anchor', 'handleIn', 'handleOut'].includes(this.type)) {
      return null;
    }

    if (this.payload.bounds) {
      return this.payload.bounds;
    }

    return this.updateBounds();
  },
  set(value) {
    this.payload.bounds = value;
  },
});

Object.defineProperty(Graphics, 'vector', {
  get() {
    return this.payload.vector;
  },
  set(value) {
    this.payload.vector = value;
  },
});

Object.defineProperty(Graphics, 'viewBox', {
  get() {
    return this.payload.viewBox;
  },
  set(value) {
    this.payload.viewBox = value;
  },
});

export { Graphics };
