import { SceneNode } from './_.js';
import { types } from './_.js';
import { attributeList } from './_.js';
import { Vector } from '../geometry/_.js';
import { Rectangle } from '../geometry/_.js';
import { Matrix } from '../geometry/_.js';
import { Class } from '../helpers/_.js';
import { MarkupRoot } from './_.js';

const GraphicsNode = SceneNode.create();
GraphicsNode.defineProps(['transform', 'height']);

Object.assign(GraphicsNode, {
  create() {
    return SceneNode.create
      .bind(this)()
      .set({
        cache: {},
        class: Class.create(),
      });
  },

  focus() {
    this.class = this.class.add('focus');
  },

  select() {
    this.canvas.removeSelection();
    this.class = this.class.add('selected');
    this.canvas.updateFrontier();
  },

  placePen() {
    this.canvas.removeSelection();
    this.class = this.class.add('pen');
    this.canvas.updateFrontier();

    return this;
  },

  rotate(angle, center) {
    center = center.transform(this.properAncestorTransform().invert());
    this.transform = Matrix.rotation(angle, center).multiply(
      this.transform || Matrix.identity()
    );
  },

  scale(factor, center) {
    center = center.transform(this.properAncestorTransform().invert());
    this.transform = Matrix.scale(factor, center).multiply(
      this.transform || Matrix.identity()
    );
  },

  translate(offset) {
    this.transform = this.properAncestorTransform()
      .invert()
      .multiply(Matrix.translation(offset))
      .multiply(this.globalTransform());
  },

  globalTransform() {
    return this.properAncestorTransform().multiply(
      this.transform || Matrix.identity()
    );
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
    const m = this.globalTransform().m;
    return Math.sqrt(Math.pow(m[0], 2) + Math.pow(m[1], 2));
  },

  contains(globalPoint) {
    return globalPoint
      .transform(this.globalTransform().invert()) // TODO: confusing?
      .isWithin(this.bounds);
  },

  computeBounds() {
    const corners = [];

    for (let child of this.children) {
      for (let corner of child.bounds.corners) {
        if (child.type === types.SPLINE) {
          corners.push(corner);
        } else {
          corners.push(corner.transform(child.transform || Matrix.identity()));
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

    this.bounds = bounds;
    return bounds;
  },

  invalidateCache() {
    for (let ancestor of this.graphicsAncestors) {
      ancestor.cache = {};
    }
  },

  renderElement() {
    return (this.component)();
  },
});

Object.defineProperty(GraphicsNode, 'bounds', {
  get() {
    return this.props.bounds || this.computeBounds();
  },

  set(value) {
    this.props.bounds = value;
  },
});

Object.defineProperty(GraphicsNode, 'attributes', {
  get() {
    const attrs = {};

    for (let [key, value] of Object.entries(this.props)) {
      if (attributeList.includes(key) && value) {
        attrs[key] = value;
      }
    }

    return attrs;
  },
});

// tag cache
Object.defineProperty(GraphicsNode, 'tags', {
  get() {
    if (!this.cache.tags) {
      this.cache.tags = this.toTags();
    }

    return this.cache.tags;
  },

  set(value) {
    this.cache.tags = value;
  },
});

// component cache
Object.defineProperty(GraphicsNode, 'component', {
  get() {
    if (!this.cache.component) {
      this.cache.component = this.toComponent();
    }

    return this.cache.component;
  },

  set(value) {
    this.cache.component = value;
  },
});

Object.defineProperty(GraphicsNode, 'graphicsChildren', {
  get() {
    return this.children.filter(node => node.isGraphicsNode());
  },
});

Object.defineProperty(GraphicsNode, 'graphicsAncestors', {
  get() {
    return this.ancestors.filter(node => node.isGraphicsNode());
  },
});

export { GraphicsNode };
