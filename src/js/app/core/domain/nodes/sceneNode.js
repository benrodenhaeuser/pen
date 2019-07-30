import { Node } from './_.js';
import { Class } from '../helpers/_.js';
import { Matrix } from '../geometry/_.js';
import { Vector } from '../geometry/_.js';
import { Rectangle } from '../geometry/_.js';

const SceneNode = Object.create(Node);

Object.assign(SceneNode, {
  create() {
    return Node.create
      .bind(this)()
      .set(this.sceneNodeDefaults());
  },

  sceneNodeDefaults() {
    return {
      payload: {
        transform: Matrix.identity(), // => graphics
        class: Class.create(),
        bounds: null, // => graphics and spline
      },
      splitter: Vector.create(-1000, -1000), // => shape
    };
  },

  // => graphics
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

  // => document
  updateFrontier() {
    this.removeFrontier();

    if (this.selected && this.selected.type !== 'canvas') {
      this.selected.class = this.selected.class.add('frontier');

      let node = this.selected;

      do {
        for (let sibling of node.siblings) {
          sibling.class = sibling.class.add('frontier');
        }
        node = node.parent;
      } while (node.parent.type !== 'doc');
    } else {
      for (let child of this.canvas.children) {
        child.class = child.class.add('frontier');
      }
    }
  },

  // => document
  removeFrontier() {
    const frontier = this.canvas.findDescendants(node => {
      return node.class.includes('frontier');
    });

    for (let node of frontier) {
      node.class.remove('frontier');
    }
  },

  // => graphics
  isSelected() {
    return this.class.includes('selected');
  },

  // => graphics
  isInFocus() {
    return this.class.includes('focus');
  },

  // => graphics
  isAtFrontier() {
    return this.class.includes('frontier');
  },

  // => graphics
  contains(globalPoint) {
    return globalPoint
      .transform(this.globalTransform().invert())
      .isWithin(this.bounds);
  },

  // => graphics
  focus() {
    this.class = this.class.add('focus');
  },

  // => graphics
  unfocusAll() {
    const focussed = this.canvas.findDescendants(node => {
      return node.class.includes('focus');
    });

    for (let node of focussed) {
      node.class.remove('focus');
    }
  },

  // => graphics
  select() {
    this.deselectAll();
    this.class = this.class.add('selected');
    this.updateFrontier();
  },

  // => graphics
  edit() {
    this.deselectAll();
    this.updateFrontier();
    this.class = this.class.add('editing');
  },

  // => graphics
  deselectAll() {
    if (this.selected) {
      this.selected.class.remove('selected');
    }
    this.updateFrontier();
  },

  // => graphics
  deeditAll() {
    if (this.editing) {
      this.editing.class.remove('editing');
    }
  },

  // => graphics
  globalTransform() {
    return this.ancestorTransform().multiply(this.transform);
  },

  // => graphics
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

  // => graphics
  rotate(angle, center) {
    center = center.transform(this.ancestorTransform().invert());
    this.transform = Matrix.rotation(angle, center).multiply(this.transform);
  },

  // => graphics
  scale(factor, center) {
    center = center.transform(this.ancestorTransform().invert());
    this.transform = Matrix.scale(factor, center).multiply(this.transform);
  },

  // => graphics
  translate(offset) {
    this.transform = this.ancestorTransform()
      .invert()
      .multiply(Matrix.translation(offset))
      .multiply(this.globalTransform());
  },

  // => graphics
  globalScaleFactor() {
    const total = this.globalTransform();
    const a = total.m[0][0];
    const b = total.m[1][0];

    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
  },
});

// => graphics
Object.defineProperty(SceneNode, 'graphicsChildren', {
  get() {
    return this.children.filter(node => ['canvas', 'group', 'shape'].includes(node.type));
  },
});

// => graphics
Object.defineProperty(SceneNode, 'graphicsAncestors', {
  get() {
    return this.ancestors.filter(node =>
      ['canvas', 'group', 'shape'].includes(node.type)
    );
  },
});

// => ?
Object.defineProperty(SceneNode, 'canvas', {
  get() {
    return this.findAncestor(
      node => node.type === 'canvas'
    );
  },
});

// => ?
Object.defineProperty(SceneNode, 'selected', {
  get() {
    return this.canvas.findDescendant(node => {
      return node.class.includes('selected');
    });
  },
});

// => ?
Object.defineProperty(SceneNode, 'editing', {
  get() {
    return this.canvas.findDescendant(node => {
      return node.class.includes('editing');
    });
  },
});

// => doc
Object.defineProperty(SceneNode, 'frontier', {
  get() {
    return this.canvas.findDescendants(node => {
      return node.class.includes('frontier');
    });
  },
});

// => graphics
Object.defineProperty(SceneNode, 'transform', {
  get() {
    return this.payload.transform;
  },
  set(value) {
    this.payload.transform = value;
  },
});

// => ?
Object.defineProperty(SceneNode, 'bounds', {
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

// => canvas
Object.defineProperty(SceneNode, 'viewBox', {
  get() {
    return this.payload.viewBox;
  },
  set(value) {
    this.payload.viewBox = value;
  },
});

export { SceneNode };
