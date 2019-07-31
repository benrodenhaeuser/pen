import { SceneNode } from './_.js';
import { Vector } from '../geometry/_.js';
import { Rectangle } from '../geometry/_.js';
import { Matrix } from '../geometry/_.js';
import { Class } from '../helpers/_.js';

const GraphicsNode = SceneNode.create();

Object.assign(GraphicsNode, {
  create() {
    return SceneNode
      .create.bind(this)()
      .set(this.graphicsNodeDefaults());
  },

  graphicsNodeDefaults() {
    return {
      payload: {
        transform: Matrix.identity(),
        class: Class.create(),
      },
    };
  },

  focus() {
    this.class = this.class.add('focus');
  },

  select() {
    this.canvas.removeSelection();
    this.class = this.class.add('selected');
    this.canvas.updateFrontier();
  },

  edit() {
    this.canvas.removeSelection();
    this.class = this.class.add('editing');
    this.canvas.updateFrontier();
  },

  rotate(angle, center) {
    center = center.transform(this.properAncestorTransform().invert());
    this.transform = Matrix.rotation(angle, center).multiply(this.transform);
  },

  scale(factor, center) {
    center = center.transform(this.properAncestorTransform().invert());
    this.transform = Matrix.scale(factor, center).multiply(this.transform);
  },

  translate(offset) {
    this.transform = this.properAncestorTransform()
      .invert()
      .multiply(Matrix.translation(offset))
      .multiply(this.globalTransform());
  },

  globalTransform() {
    return this.properAncestorTransform().multiply(this.transform);
  },

  properAncestorTransform() {
    let matrix = Matrix.identity();

    // we use properAncestors, which does not include the current node:
    for (let ancestor of this.properAncestors.reverse()) {
      if (ancestor.transform) {
        matrix = matrix.multiply(ancestor.transform);
      }
    }

    return matrix;
  },

  globalScaleFactor() {
    const total = this.globalTransform();
    const a = total.m[0][0];
    const b = total.m[1][0];

    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
  },

  contains(globalPoint) {
    return globalPoint
      .transform(this.globalTransform().invert()) // TODO: confusing?
      .isWithin(this.bounds);
  },

  updateBounds() {
    const corners = [];

    for (let child of this.children) {
      for (let corner of child.bounds.corners) {
        if (child.type === 'spline') {
          corners.push(corner);
        } else {
          corners.push(corner.transform(child.transform));
        }
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
});

Object.defineProperty(GraphicsNode, 'bounds', {
  get() {
    if (this.payload.bounds) {
      return this.payload.bounds;
    }

    return this.updateBounds();
  },

  set(value) {
    this.payload.bounds = value;
  },
});

Object.defineProperty(GraphicsNode, 'transform', {
  get() {
    return this.payload.transform;
  },
  set(value) {
    this.payload.transform = value;
  },
});

Object.defineProperty(GraphicsNode, 'graphicsChildren', {
  get() {
    return this.children.filter(node =>
      ['canvas', 'group', 'shape'].includes(node.type)
    );
  },
});

Object.defineProperty(GraphicsNode, 'graphicsAncestors', {
  get() {
    return this.ancestors.filter(node =>
      ['canvas', 'group', 'shape'].includes(node.type)
    );
  },
});

export { GraphicsNode };
