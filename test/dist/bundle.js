'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const Class = {
  create(classNames = []) {
    return Object.create(Class).init(classNames);
  },

  init(classNames) {
    if (classNames instanceof Array) {
      this.list = [...classNames];
    } else {
      throw new Error('Create Class instances from array!');
    }

    return this;
  },

  // return value: string
  toString() {
    return this.list.join(' ');
  },

  toJSON() {
    return this.list;
  },

  // return value: boolean
  includes(className) {
    return this.list.indexOf(className) >= 0;
  },

  // return value: new Class instance
  // does not mutate this/this.list
  // will add className only if not already present
  add(className) {
    if (this.includes(className)) {
      return Class.create(this.list);
    } else {
      return Class.create([...this.list, className]);
    }
  },

  // return value: new Class instance
  // does not mutate this/this.list
  // will remove multiple instances of className, if present
  remove(className) {
    return Class.create(this.list.filter(elem => elem !== className));
  },
};

const createID = () => {
  const randomString = Math.random()
    .toString(36)
    .substring(2);
  const timestamp = new Date().getTime().toString(36);
  return randomString + timestamp;
};

const h = (tag, props = {}, ...children) => {
  return {
    tag: tag,
    props: props,
    children: children || [],
  };
};

const LENGTHS_IN_PX = {
  cornerSideLength: 8,
  dotDiameter: 18,
  controlDiameter: 5.5,
};

const scale = (node, length) => {
  const canvasScaleFactor = node.doc.canvasWidth / node.canvas.viewBox.size.x;
  const scaledLength = length / node.globalScaleFactor() / canvasScaleFactor;
  return scaledLength;
};

const transform = node => {
  return node.transform && node.transform.toString() || 'matrix(1, 0, 0, 1, 0, 0)';
};

const comps$$1 = {
  canvas(node) {
    return {
      tag: 'svg',
      children: [],
      props: {
        'data-key': node.key,
        'data-type': node.type,
        viewBox: node.viewBox.toString(),
        xmlns: node.xmlns,
        class: node.class.toString(),
      },
    };
  },

  group(node) {
    return {
      tag: 'g',
      children: [],
      props: {
        'data-key': node.key,
        'data-type': node.type,
        transform: transform(node),
        class: node.class.toString(),
      },
    };
  },

  wrapper(node) {
    return h('g', {
      'data-type': `${node.type}-wrapper`,
      'data-key': node.key,
    });
  },

  outerUI(node) {
    const vOuterUI = h('g', {
      'data-type': 'outerUI',
      'data-key': node.key,
    });

    const vFrame = this.frame(node);
    const vDots = this.dots(node); // for rotation UI
    const vCorners = this.corners(node); // for scaling UI

    vOuterUI.children.push(vFrame);

    for (let vDot of vDots) {
      vOuterUI.children.push(vDot);
    }

    for (let vCorner of vCorners) {
      vOuterUI.children.push(vCorner);
    }

    return vOuterUI;
  },

  corners(node) {
    const vTopLCorner = h('rect', { 'data-type': 'nw-corner' });
    const vBotLCorner = h('rect', { 'data-type': 'sw-corner' });
    const vTopRCorner = h('rect', { 'data-type': 'ne-corner' });
    const vBotRCorner = h('rect', { 'data-type': 'se-corner' });
    const vCorners = [vTopLCorner, vBotLCorner, vTopRCorner, vBotRCorner];
    const length = scale(node, LENGTHS_IN_PX.cornerSideLength);

    for (let vCorner of vCorners) {
      Object.assign(vCorner.props, {
        'data-key': node.key,
        transform: transform(node),
        width: length,
        height: length,
      });
    }

    Object.assign(vTopLCorner.props, {
      x: node.bounds.x - length / 2,
      y: node.bounds.y - length / 2,
    });

    Object.assign(vBotLCorner.props, {
      x: node.bounds.x - length / 2,
      y: node.bounds.y + node.bounds.height - length / 2,
    });

    Object.assign(vTopRCorner.props, {
      x: node.bounds.x + node.bounds.width - length / 2,
      y: node.bounds.y - length / 2,
    });

    Object.assign(vBotRCorner.props, {
      x: node.bounds.x + node.bounds.width - length / 2,
      y: node.bounds.y + node.bounds.height - length / 2,
    });

    return vCorners;
  },

  dots(node) {
    const vTopLDot = h('circle');
    const vBotLDot = h('circle');
    const vTopRDot = h('circle');
    const vBotRDot = h('circle');
    const vDots = [vTopLDot, vBotLDot, vTopRDot, vBotRDot];
    const diameter = scale(node, LENGTHS_IN_PX.dotDiameter);
    const radius = diameter / 2;

    for (let vDot of vDots) {
      Object.assign(vDot.props, {
        'data-type': 'dot',
        'data-key': node.key,
        transform: transform(node),
        r: radius,
      });
    }

    Object.assign(vTopLDot.props, {
      cx: node.bounds.x - radius / 2,
      cy: node.bounds.y - radius / 2,
    });

    Object.assign(vBotLDot.props, {
      cx: node.bounds.x - radius / 2,
      cy: node.bounds.y + node.bounds.height + radius / 2,
    });

    Object.assign(vTopRDot.props, {
      cx: node.bounds.x + node.bounds.width + radius / 2,
      cy: node.bounds.y - radius / 2,
    });

    Object.assign(vBotRDot.props, {
      cx: node.bounds.x + node.bounds.width + radius / 2,
      cy: node.bounds.y + node.bounds.height + radius / 2,
    });

    return vDots;
  },

  frame(node) {
    return h('rect', {
      'data-type': 'frame',
      x: node.bounds.x,
      y: node.bounds.y,
      width: node.bounds.width,
      height: node.bounds.height,
      transform: transform(node),
      'data-key': node.key,
    });
  },

  curves(node) {
    const diameter = scale(node, LENGTHS_IN_PX.controlDiameter);
    const radius = diameter / 2;

    const vParts = this.curveParts(node);
    const splitter = h('circle', {
      'data-type': 'splitter',
      r: radius,
      cx: node.splitter.x,
      cy: node.splitter.y,
      transform: transform(node),
    });

    return h(
      'g',
      {
        'data-type': 'shape',
        'data-key': node.key,
        class: node.class.toString(),
      },
      this.shapeFill(node),
      ...vParts,
      splitter
    );
  },

  // will display the shape fill
  shapeFill(node) {
    const theShape = {
      tag: 'path',
      children: [],
      props: {
        'data-type': node.type,
        'data-key': node.key,
        d: node.toPathString(),
        transform: transform(node),
        fill: node.fill,
      },
    };

    return theShape;
  },

  curveParts(node) {
    const nodes = [];
    const splines = node.children;

    for (let spline of splines) {
      const segments = spline.children;
      const curves = spline.curves();

      for (let i = 0; i < curves.length; i += 1) {
        // the "hit target" for the curve:
        nodes.push({
          tag: 'path',
          children: [],
          props: {
            'data-type': 'curve',
            'data-key': segments[i].key,
            d: curves[i].toPathString(),
            transform: transform(node),
          },
        });

        // will display the curve stroke:
        nodes.push({
          tag: 'path',
          children: [],
          props: {
            'data-type': 'curve-stroke',
            d: curves[i].toPathString(),
            transform: transform(node),
            stroke: node.stroke,
          },
        });
      }
    }

    return nodes;
  },

  segments(node) {
    const spline = node.children[0];

    const vSegments = h('g', {
      'data-type': 'segments',
      'data-key': node.key,
    });

    for (let segment of spline.children) {
      vSegments.children.push(this.segmentUI(node, segment));
    }

    return vSegments;
  },

  segmentUI(node, segment) {
    const vSegmentUI = h('g', {
      'data-type': 'segment',
      class: segment.class.toString(),
      'data-key': node.key,
    });

    const diameter = scale(node, LENGTHS_IN_PX.controlDiameter);

    for (let handle of ['handleIn', 'handleOut']) {
      if (segment[handle]) {
        vSegmentUI.children.push(
          this.connection(node, segment.anchor, segment[handle])
        );
      }
    }

    for (let controlNode of segment.children) {
      vSegmentUI.children.push(this.control(node, controlNode, diameter));
    }

    return vSegmentUI;
  },

  connection(node, anchor, handle) {
    return h('line', {
      'data-type': 'connection',
      x1: anchor.vector.x,
      y1: anchor.vector.y,
      x2: handle.vector.x,
      y2: handle.vector.y,
      transform: transform(node),
    });
  },

  control(pathNode, controlNode, diameter) {
    return h('circle', {
      'data-type': controlNode.type,
      'data-key': controlNode.key,
      transform: transform(pathNode),
      r: diameter / 2,
      cx: controlNode.vector.x,
      cy: controlNode.vector.y,
      class: controlNode.class.toString(),
    });
  },

  // tools

  tools(toolsNode) {
    const buttons = h('ul', { id: 'buttons' });

    for (let toolNode of toolsNode.children) {
      buttons.children.push(this.button(toolNode));
    }

    return buttons;
  },

  button(toolNode) {
    return h(
      'li',
      {
        class: toolNode.class.toString(),
      },
      h(
        'a',
        {},
        h('object', {
          type: 'image/svg+xml',
          data: toolNode.iconPath,
        }),
        h('p', {}, toolNode.name),
        h('div', {
          id: toolNode.toolType,
          'data-type': toolNode.toolType,
          class: 'buttonTarget',
        })
      )
    );
  },

  menu(docs) {
    const items = h('ul', {
      class: docs.class.toString(),
    });

    for (let identifier of docs.children) {
      items.children.push(
        h(
          'li',
          {
            'data-key': identifier._id,
            'data-type': 'doc-identifier',
            class: identifier.class.toString(),
          },
          identifier._id
        )
      );
    }

    const header = h('h1', {}, 'Documents');

    return h('div', {}, header, items);
  },
};

/**
 * Common utilities
 * @module glMatrix
 */
let ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;

const degree = Math.PI / 180;

if (!Math.hypot) Math.hypot = function() {
  var y = 0, i = arguments.length;
  while (i--) y += arguments[i] * arguments[i];
  return Math.sqrt(y);
};

/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
function create() {
  let out = new ARRAY_TYPE(2);
  if(ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }
  return out;
}

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2d} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat2d(out, a, m) {
  var x = a[0],
    y = a[1];
  out[0] = m[0] * x + m[2] * y + m[4];
  out[1] = m[1] * x + m[3] * y + m[5];
  return out;
}

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
const forEach = (function() {
  let vec = create();

  return function(a, stride, offset, count, fn, arg) {
    let i, l;
    if(!stride) {
      stride = 2;
    }

    if(!offset) {
      offset = 0;
    }

    if(count) {
      l = Math.min((count * stride) + offset, a.length);
    } else {
      l = a.length;
    }

    for(i = offset; i < l; i += stride) {
      vec[0] = a[i]; vec[1] = a[i+1];
      fn(vec, vec, arg);
      a[i] = vec[0]; a[i+1] = vec[1];
    }

    return a;
  };
})();

const Vector$$1 = {
  create(x = 0, y = 0) {
    return Object.create(Vector$$1).init(x, y);
  },

  createFromObject(obj) {
    return Object.create(Vector$$1).init(obj.x, obj.y);
  },

  init(x, y) {
    this.x = x;
    this.y = y;
    return this;
  },

  coords() {
    return { x: this.x, y: this.y };
  },

  // return value: new Vector instance
  transform(matrix) {
    const out = create();
    transformMat2d(out, this.toArray(), matrix.m);
    return Vector$$1.create(...out);
  },

  transformToLocal(shape) {
    return this.transform(shape.globalTransform().invert());
  },

  // return value: new Vector instance
  rotate(angle$$1, vector) {
    return this.transform(Matrix$$1.rotation(angle$$1, vector));
  },

  // return value: new Vector instance
  add(other) {
    return Vector$$1.create(this.x + other.x, this.y + other.y);
  },

  // return value: new Vector instance
  minus(other) {
    return Vector$$1.create(this.x - other.x, this.y - other.y);
  },

  // return value: new Vector instance
  abs() {
    return Vector$$1.create(Math.abs(this.x), Math.abs(this.y));
  },

  // return value: boolean
  isWithin(rectangle) {
    return (
      this.x >= rectangle.x &&
      this.x <= rectangle.x + rectangle.width &&
      this.y >= rectangle.y &&
      this.y <= rectangle.y + rectangle.height
    );
  },

  // return value: number
  angle(...args) {
    if (args.length === 0) {
      return Math.atan2(this.y, this.x);
    } else {
      const [from, to] = args;
      return to.minus(this).angle() - from.minus(this).angle();
    }
  },

  length() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  },

  toArray() {
    return [this.x, this.y];
  },

  toString() {
    // TODO: rounding (extract precision to constant)
    // see http://www.jacklmoore.com/notes/rounding-in-javascript/
    const x = Number(Math.round(this.x + 'e3') + 'e-3');
    const y = Number(Math.round(this.y + 'e3') + 'e-3');

    return `${x} ${y}`;
  },
};

/**
 * 2x3 Matrix
 * @module mat2d
 *
 * @description
 * A mat2d contains six elements defined as:
 * <pre>
 * [a, b, c,
 *  d, tx, ty]
 * </pre>
 * This is a short form for the 3x3 matrix:
 * <pre>
 * [a, b, 0,
 *  c, d, 0,
 *  tx, ty, 1]
 * </pre>
 * The last column is ignored so the array is shorter and operations are faster.
 */

/**
 * Creates a new identity mat2d
 *
 * @returns {mat2d} a new 2x3 matrix
 */
function create$1() {
  let out = new ARRAY_TYPE(6);
  if(ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[4] = 0;
    out[5] = 0;
  }
  out[0] = 1;
  out[3] = 1;
  return out;
}

/**
 * Inverts a mat2d
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
function invert(out, a) {
  let aa = a[0], ab = a[1], ac = a[2], ad = a[3];
  let atx = a[4], aty = a[5];

  let det = aa * ad - ab * ac;
  if(!det){
    return null;
  }
  det = 1.0 / det;

  out[0] = ad * det;
  out[1] = -ab * det;
  out[2] = -ac * det;
  out[3] = aa * det;
  out[4] = (ac * aty - ad * atx) * det;
  out[5] = (ab * atx - aa * aty) * det;
  return out;
}

/**
 * Multiplies two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
function multiply$1(out, a, b) {
  let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
  let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
  out[0] = a0 * b0 + a2 * b1;
  out[1] = a1 * b0 + a3 * b1;
  out[2] = a0 * b2 + a2 * b3;
  out[3] = a1 * b2 + a3 * b3;
  out[4] = a0 * b4 + a2 * b5 + a4;
  out[5] = a1 * b4 + a3 * b5 + a5;
  return out;
}

const Matrix$$1 = {
  create(m) {
    return Object.create(Matrix$$1).init(m);
  },

  init(m) {
    this.m = m;
    return this;
  },

  createFromDOMMatrix($matrix) {
    const m = [
      $matrix.a,
      $matrix.b,
      $matrix.c,
      $matrix.d,
      $matrix.e,
      $matrix.f,
    ];

    return Matrix$$1.create(m);
  },

  equals(other) {
    for (let i = 0; i <= 5; i += 1) {
      if (this.m[i] !== other.m[i]) {
        return false;
      }
    }

    return true;
  },

  toJSON() {
    return this.toArray();
  },

  toString() {
    // TODO: rounding, extract precision to constant
    const m = Array.from(this.m).map(value =>
      Number(Math.round(value + 'e3') + 'e-3')
    );

    return `matrix(${m.join(', ')})`;
  },

  toArray() {
    return Array.from(this.m);
  },

  multiply(other) {
    const m = create$1();
    multiply$1(m, this.m, other.m);
    return Matrix$$1.create(m);
  },

  invert() {
    const m = create$1();
    invert(m, this.m);
    return Matrix$$1.create(m);
  },

  identity() {
    const m = [1, 0, 0, 1, 0, 0];
    return Matrix$$1.create(m);
  },

  rotation(angle, origin) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const m = [
      cos,
      sin,
      -sin,
      cos,
      -origin.x * cos + origin.y * sin + origin.x,
      -origin.x * sin - origin.y * cos + origin.y,
    ];

    return Matrix$$1.create(m);
  },

  translation(vector) {
    const m = [1, 0, 0, 1, vector.x, vector.y];

    return Matrix$$1.create(m);
  },

  scale(factor, origin = Vector$$1.create(0, 0)) {
    const m = [
      factor,
      0,
      0,
      factor,
      origin.x - factor * origin.x,
      origin.y - factor * origin.y,
    ];

    return Matrix$$1.create(m);
  },
};

const Rectangle$$1 = {
  // => two vectors (origin and size)
  create(origin = Vector$$1.create(), size = Vector$$1.create()) {
    return Object.create(Rectangle$$1).init(origin, size);
  },

  init(origin, size) {
    this.origin = origin;
    this.size = size;

    return this;
  },

  // => 4 integers
  createFromDimensions(x, y, width, height) {
    const origin = Vector$$1.create(x, y);
    const size = Vector$$1.create(width, height);

    return Rectangle$$1.create(origin, size);
  },

  // => { x: ..., y: ..., width: ..., height: ...}
  createFromObject(object) {
    const origin = Vector$$1.create(object.x, object.y);
    const size = Vector$$1.create(object.width, object.height);

    return Rectangle$$1.create(origin, size);
  },

  // => two vectors (from and to, or equivalently, min and max)
  createFromMinMax(min, max) {
    const origin = Vector$$1.create(min.x, min.y);
    const size = Vector$$1.create(max.x - min.x, max.y - min.y);

    return Rectangle$$1.create(origin, size);
  },

  get min() {
    return this.origin;
  },

  get max() {
    return Vector$$1.create(
      this.origin.x + this.size.x,
      this.origin.y + this.size.y
    );
  },

  get x() {
    return this.origin.x;
  },

  get y() {
    return this.origin.y;
  },

  get width() {
    return this.size.x;
  },

  set width(value) {
    this.size.x = value;
  },

  set height(value) {
    this.size.y = value;
  },

  get height() {
    return this.size.y;
  },

  get corners() {
    return [
      this.min, // nw
      Vector$$1.create(this.origin.x + this.size.x, this.origin.y), // ne
      Vector$$1.create(this.origin.x, this.origin.y + this.size.y), // sw
      this.max, // se
    ];
  },

  get center() {
    return Vector$$1.create(this.x + this.width / 2, this.y + this.height / 2);
  },

  // smallest rectangle enclosing `this` and `other`
  getBoundingRect(other) {
    let min = Vector$$1.create();
    let max = Vector$$1.create();

    min.x = Math.min(this.min.x, other.min.x);
    min.y = Math.min(this.min.y, other.min.y);
    max.x = Math.max(this.max.x, other.max.x);
    max.y = Math.max(this.max.y, other.max.y);

    return Rectangle$$1.createFromMinMax(min, max);
  },

  transform(matrix) {
    return Rectangle$$1.create(
      this.origin.transform(matrix),
      this.size.transform(matrix)
    );
  },

  toString() {
    return [this.origin.x, this.origin.y, this.size.x, this.size.y].join(' ');
  },

  toJSON() {
    return {
      x: this.origin.x,
      y: this.origin.y,
      width: this.size.x,
      height: this.size.y,
    };
  },
};

/**
  A javascript Bezier curve library by Pomax.
  Based on http://pomax.github.io/bezierinfo
  This code is MIT licensed.
**/

// math-inlining.
var abs = Math.abs,
  cos = Math.cos,
  sin = Math.sin,
  acos = Math.acos,
  atan2 = Math.atan2,
  sqrt = Math.sqrt,
  pow = Math.pow,
  // cube root function yielding real roots
  crt = function(v) {
    return v < 0 ? -pow(-v, 1 / 3) : pow(v, 1 / 3);
  },
  // trig constants
  pi = Math.PI,
  tau = 2 * pi,
  quart = pi / 2,
  // float precision significant decimal
  epsilon = 0.000001,
  // extremas used in bbox calculation and similar algorithms
  nMax = Number.MAX_SAFE_INTEGER || 9007199254740991,
  nMin = Number.MIN_SAFE_INTEGER || -9007199254740991,
  // a zero coordinate, which is surprisingly useful
  ZERO = { x: 0, y: 0, z: 0 };

// Bezier utility functions
var utils = {
  // Legendre-Gauss abscissae with n=24 (x_i values, defined at i=n as the roots of the nth order Legendre polynomial Pn(x))
  Tvalues: [
    -0.0640568928626056260850430826247450385909,
    0.0640568928626056260850430826247450385909,
    -0.1911188674736163091586398207570696318404,
    0.1911188674736163091586398207570696318404,
    -0.3150426796961633743867932913198102407864,
    0.3150426796961633743867932913198102407864,
    -0.4337935076260451384870842319133497124524,
    0.4337935076260451384870842319133497124524,
    -0.5454214713888395356583756172183723700107,
    0.5454214713888395356583756172183723700107,
    -0.6480936519369755692524957869107476266696,
    0.6480936519369755692524957869107476266696,
    -0.7401241915785543642438281030999784255232,
    0.7401241915785543642438281030999784255232,
    -0.8200019859739029219539498726697452080761,
    0.8200019859739029219539498726697452080761,
    -0.8864155270044010342131543419821967550873,
    0.8864155270044010342131543419821967550873,
    -0.9382745520027327585236490017087214496548,
    0.9382745520027327585236490017087214496548,
    -0.9747285559713094981983919930081690617411,
    0.9747285559713094981983919930081690617411,
    -0.9951872199970213601799974097007368118745,
    0.9951872199970213601799974097007368118745
  ],

  // Legendre-Gauss weights with n=24 (w_i values, defined by a function linked to in the Bezier primer article)
  Cvalues: [
    0.1279381953467521569740561652246953718517,
    0.1279381953467521569740561652246953718517,
    0.1258374563468282961213753825111836887264,
    0.1258374563468282961213753825111836887264,
    0.121670472927803391204463153476262425607,
    0.121670472927803391204463153476262425607,
    0.1155056680537256013533444839067835598622,
    0.1155056680537256013533444839067835598622,
    0.1074442701159656347825773424466062227946,
    0.1074442701159656347825773424466062227946,
    0.0976186521041138882698806644642471544279,
    0.0976186521041138882698806644642471544279,
    0.086190161531953275917185202983742667185,
    0.086190161531953275917185202983742667185,
    0.0733464814110803057340336152531165181193,
    0.0733464814110803057340336152531165181193,
    0.0592985849154367807463677585001085845412,
    0.0592985849154367807463677585001085845412,
    0.0442774388174198061686027482113382288593,
    0.0442774388174198061686027482113382288593,
    0.0285313886289336631813078159518782864491,
    0.0285313886289336631813078159518782864491,
    0.0123412297999871995468056670700372915759,
    0.0123412297999871995468056670700372915759
  ],

  arcfn: function(t, derivativeFn) {
    var d = derivativeFn(t);
    var l = d.x * d.x + d.y * d.y;
    if (typeof d.z !== "undefined") {
      l += d.z * d.z;
    }
    return sqrt(l);
  },

  compute: function(t, points, _3d) {
    // shortcuts
    if (t === 0) {
      return points[0];
    }

    var order = points.length-1;

    if (t === 1) {
      return points[order];
    }

    var p = points;
    var mt = 1 - t;

    // constant?
    if (order === 0) {
      return points[0];
    }

    // linear?
    if (order === 1) {
      ret = {
        x: mt * p[0].x + t * p[1].x,
        y: mt * p[0].y + t * p[1].y
      };
      if (_3d) {
        ret.z = mt * p[0].z + t * p[1].z;
      }
      return ret;
    }

    // quadratic/cubic curve?
    if (order < 4) {
      var mt2 = mt * mt,
        t2 = t * t,
        a,
        b,
        c,
        d = 0;
      if (order === 2) {
        p = [p[0], p[1], p[2], ZERO];
        a = mt2;
        b = mt * t * 2;
        c = t2;
      } else if (order === 3) {
        a = mt2 * mt;
        b = mt2 * t * 3;
        c = mt * t2 * 3;
        d = t * t2;
      }
      var ret = {
        x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x,
        y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y
      };
      if (_3d) {
        ret.z = a * p[0].z + b * p[1].z + c * p[2].z + d * p[3].z;
      }
      return ret;
    }

    // higher order curves: use de Casteljau's computation
    var dCpts = JSON.parse(JSON.stringify(points));
    while (dCpts.length > 1) {
      for (var i = 0; i < dCpts.length - 1; i++) {
        dCpts[i] = {
          x: dCpts[i].x + (dCpts[i + 1].x - dCpts[i].x) * t,
          y: dCpts[i].y + (dCpts[i + 1].y - dCpts[i].y) * t
        };
        if (typeof dCpts[i].z !== "undefined") {
          dCpts[i] = dCpts[i].z + (dCpts[i + 1].z - dCpts[i].z) * t;
        }
      }
      dCpts.splice(dCpts.length - 1, 1);
    }
    return dCpts[0];
  },

  derive: function (points, _3d) {
    var dpoints = [];
    for (var p = points, d = p.length, c = d - 1; d > 1; d--, c--) {
      var list = [];
      for (var j = 0, dpt; j < c; j++) {
        dpt = {
          x: c * (p[j + 1].x - p[j].x),
          y: c * (p[j + 1].y - p[j].y)
        };
        if (_3d) {
          dpt.z = c * (p[j + 1].z - p[j].z);
        }
        list.push(dpt);
      }
      dpoints.push(list);
      p = list;
    }
    return dpoints;
  },

  between: function(v, m, M) {
    return (
      (m <= v && v <= M) ||
      utils.approximately(v, m) ||
      utils.approximately(v, M)
    );
  },

  approximately: function(a, b, precision) {
    return abs(a - b) <= (precision || epsilon);
  },

  length: function(derivativeFn) {
    var z = 0.5,
      sum = 0,
      len = utils.Tvalues.length,
      i,
      t;
    for (i = 0; i < len; i++) {
      t = z * utils.Tvalues[i] + z;
      sum += utils.Cvalues[i] * utils.arcfn(t, derivativeFn);
    }
    return z * sum;
  },

  map: function(v, ds, de, ts, te) {
    var d1 = de - ds,
      d2 = te - ts,
      v2 = v - ds,
      r = v2 / d1;
    return ts + d2 * r;
  },

  lerp: function(r, v1, v2) {
    var ret = {
      x: v1.x + r * (v2.x - v1.x),
      y: v1.y + r * (v2.y - v1.y)
    };
    if (!!v1.z && !!v2.z) {
      ret.z = v1.z + r * (v2.z - v1.z);
    }
    return ret;
  },

  pointToString: function(p) {
    var s = p.x + "/" + p.y;
    if (typeof p.z !== "undefined") {
      s += "/" + p.z;
    }
    return s;
  },

  pointsToString: function(points) {
    return "[" + points.map(utils.pointToString).join(", ") + "]";
  },

  copy: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  angle: function(o, v1, v2) {
    var dx1 = v1.x - o.x,
      dy1 = v1.y - o.y,
      dx2 = v2.x - o.x,
      dy2 = v2.y - o.y,
      cross = dx1 * dy2 - dy1 * dx2,
      dot = dx1 * dx2 + dy1 * dy2;
    return atan2(cross, dot);
  },

  // round as string, to avoid rounding errors
  round: function(v, d) {
    var s = "" + v;
    var pos = s.indexOf(".");
    return parseFloat(s.substring(0, pos + 1 + d));
  },

  dist: function(p1, p2) {
    var dx = p1.x - p2.x,
      dy = p1.y - p2.y;
    return sqrt(dx * dx + dy * dy);
  },

  closest: function(LUT, point) {
    var mdist = pow(2, 63),
      mpos,
      d;
    LUT.forEach(function(p, idx) {
      d = utils.dist(point, p);
      if (d < mdist) {
        mdist = d;
        mpos = idx;
      }
    });
    return { mdist: mdist, mpos: mpos };
  },

  abcratio: function(t, n) {
    // see ratio(t) note on http://pomax.github.io/bezierinfo/#abc
    if (n !== 2 && n !== 3) {
      return false;
    }
    if (typeof t === "undefined") {
      t = 0.5;
    } else if (t === 0 || t === 1) {
      return t;
    }
    var bottom = pow(t, n) + pow(1 - t, n),
      top = bottom - 1;
    return abs(top / bottom);
  },

  projectionratio: function(t, n) {
    // see u(t) note on http://pomax.github.io/bezierinfo/#abc
    if (n !== 2 && n !== 3) {
      return false;
    }
    if (typeof t === "undefined") {
      t = 0.5;
    } else if (t === 0 || t === 1) {
      return t;
    }
    var top = pow(1 - t, n),
      bottom = pow(t, n) + top;
    return top / bottom;
  },

  lli8: function(x1, y1, x2, y2, x3, y3, x4, y4) {
    var nx =
        (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4),
      ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4),
      d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (d == 0) {
      return false;
    }
    return { x: nx / d, y: ny / d };
  },

  lli4: function(p1, p2, p3, p4) {
    var x1 = p1.x,
      y1 = p1.y,
      x2 = p2.x,
      y2 = p2.y,
      x3 = p3.x,
      y3 = p3.y,
      x4 = p4.x,
      y4 = p4.y;
    return utils.lli8(x1, y1, x2, y2, x3, y3, x4, y4);
  },

  lli: function(v1, v2) {
    return utils.lli4(v1, v1.c, v2, v2.c);
  },

  makeline: function(p1, p2) {
    var x1 = p1.x,
      y1 = p1.y,
      x2 = p2.x,
      y2 = p2.y,
      dx = (x2 - x1) / 3,
      dy = (y2 - y1) / 3;
    return new Bezier(
      x1,
      y1,
      x1 + dx,
      y1 + dy,
      x1 + 2 * dx,
      y1 + 2 * dy,
      x2,
      y2
    );
  },

  findbbox: function(sections) {
    var mx = nMax,
      my = nMax,
      MX = nMin,
      MY = nMin;
    sections.forEach(function(s) {
      var bbox = s.bbox();
      if (mx > bbox.x.min) mx = bbox.x.min;
      if (my > bbox.y.min) my = bbox.y.min;
      if (MX < bbox.x.max) MX = bbox.x.max;
      if (MY < bbox.y.max) MY = bbox.y.max;
    });
    return {
      x: { min: mx, mid: (mx + MX) / 2, max: MX, size: MX - mx },
      y: { min: my, mid: (my + MY) / 2, max: MY, size: MY - my }
    };
  },

  shapeintersections: function(
    s1,
    bbox1,
    s2,
    bbox2,
    curveIntersectionThreshold
  ) {
    if (!utils.bboxoverlap(bbox1, bbox2)) return [];
    var intersections = [];
    var a1 = [s1.startcap, s1.forward, s1.back, s1.endcap];
    var a2 = [s2.startcap, s2.forward, s2.back, s2.endcap];
    a1.forEach(function(l1) {
      if (l1.virtual) return;
      a2.forEach(function(l2) {
        if (l2.virtual) return;
        var iss = l1.intersects(l2, curveIntersectionThreshold);
        if (iss.length > 0) {
          iss.c1 = l1;
          iss.c2 = l2;
          iss.s1 = s1;
          iss.s2 = s2;
          intersections.push(iss);
        }
      });
    });
    return intersections;
  },

  makeshape: function(forward, back, curveIntersectionThreshold) {
    var bpl = back.points.length;
    var fpl = forward.points.length;
    var start = utils.makeline(back.points[bpl - 1], forward.points[0]);
    var end = utils.makeline(forward.points[fpl - 1], back.points[0]);
    var shape = {
      startcap: start,
      forward: forward,
      back: back,
      endcap: end,
      bbox: utils.findbbox([start, forward, back, end])
    };
    var self = utils;
    shape.intersections = function(s2) {
      return self.shapeintersections(
        shape,
        shape.bbox,
        s2,
        s2.bbox,
        curveIntersectionThreshold
      );
    };
    return shape;
  },

  getminmax: function(curve, d, list) {
    if (!list) return { min: 0, max: 0 };
    var min = nMax,
      max = nMin,
      t,
      c;
    if (list.indexOf(0) === -1) {
      list = [0].concat(list);
    }
    if (list.indexOf(1) === -1) {
      list.push(1);
    }
    for (var i = 0, len = list.length; i < len; i++) {
      t = list[i];
      c = curve.get(t);
      if (c[d] < min) {
        min = c[d];
      }
      if (c[d] > max) {
        max = c[d];
      }
    }
    return { min: min, mid: (min + max) / 2, max: max, size: max - min };
  },

  align: function(points, line) {
    var tx = line.p1.x,
      ty = line.p1.y,
      a = -atan2(line.p2.y - ty, line.p2.x - tx),
      d = function(v) {
        return {
          x: (v.x - tx) * cos(a) - (v.y - ty) * sin(a),
          y: (v.x - tx) * sin(a) + (v.y - ty) * cos(a)
        };
      };
    return points.map(d);
  },

  roots: function(points, line) {
    line = line || { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } };
    var order = points.length - 1;
    var p = utils.align(points, line);
    var reduce = function(t) {
      return 0 <= t && t <= 1;
    };

    if (order === 2) {
      var a = p[0].y,
        b = p[1].y,
        c = p[2].y,
        d = a - 2 * b + c;
      if (d !== 0) {
        var m1 = -sqrt(b * b - a * c),
          m2 = -a + b,
          v1 = -(m1 + m2) / d,
          v2 = -(-m1 + m2) / d;
        return [v1, v2].filter(reduce);
      } else if (b !== c && d === 0) {
        return [(2*b - c)/(2*b - 2*c)].filter(reduce);
      }
      return [];
    }

    // see http://www.trans4mind.com/personal_development/mathematics/polynomials/cubicAlgebra.htm
    var pa = p[0].y,
      pb = p[1].y,
      pc = p[2].y,
      pd = p[3].y,
      d = -pa + 3 * pb - 3 * pc + pd,
      a = 3 * pa - 6 * pb + 3 * pc,
      b = -3 * pa + 3 * pb,
      c = pa;

    if (utils.approximately(d, 0)) {
      // this is not a cubic curve.
      if (utils.approximately(a, 0)) {
        // in fact, this is not a quadratic curve either.
        if (utils.approximately(b, 0)) {
          // in fact in fact, there are no solutions.
          return [];
        }
        // linear solution:
        return [-c / b].filter(reduce);
      }
      // quadratic solution:
      var q = sqrt(b * b - 4 * a * c),
        a2 = 2 * a;
      return [(q - b) / a2, (-b - q) / a2].filter(reduce);
    }

    // at this point, we know we need a cubic solution:

    a /= d;
    b /= d;
    c /= d;

    var p = (3 * b - a * a) / 3,
      p3 = p / 3,
      q = (2 * a * a * a - 9 * a * b + 27 * c) / 27,
      q2 = q / 2,
      discriminant = q2 * q2 + p3 * p3 * p3,
      u1,
      v1,
      x1,
      x2,
      x3;
    if (discriminant < 0) {
      var mp3 = -p / 3,
        mp33 = mp3 * mp3 * mp3,
        r = sqrt(mp33),
        t = -q / (2 * r),
        cosphi = t < -1 ? -1 : t > 1 ? 1 : t,
        phi = acos(cosphi),
        crtr = crt(r),
        t1 = 2 * crtr;
      x1 = t1 * cos(phi / 3) - a / 3;
      x2 = t1 * cos((phi + tau) / 3) - a / 3;
      x3 = t1 * cos((phi + 2 * tau) / 3) - a / 3;
      return [x1, x2, x3].filter(reduce);
    } else if (discriminant === 0) {
      u1 = q2 < 0 ? crt(-q2) : -crt(q2);
      x1 = 2 * u1 - a / 3;
      x2 = -u1 - a / 3;
      return [x1, x2].filter(reduce);
    } else {
      var sd = sqrt(discriminant);
      u1 = crt(-q2 + sd);
      v1 = crt(q2 + sd);
      return [u1 - v1 - a / 3].filter(reduce);
    }
  },

  droots: function(p) {
    // quadratic roots are easy
    if (p.length === 3) {
      var a = p[0],
        b = p[1],
        c = p[2],
        d = a - 2 * b + c;
      if (d !== 0) {
        var m1 = -sqrt(b * b - a * c),
          m2 = -a + b,
          v1 = -(m1 + m2) / d,
          v2 = -(-m1 + m2) / d;
        return [v1, v2];
      } else if (b !== c && d === 0) {
        return [(2 * b - c) / (2 * (b - c))];
      }
      return [];
    }

    // linear roots are even easier
    if (p.length === 2) {
      var a = p[0],
        b = p[1];
      if (a !== b) {
        return [a / (a - b)];
      }
      return [];
    }
  },

  curvature: function(t, points, _3d) {
    var dpoints = utils.derive(points);
    var d1 = dpoints[0];
    var d2 = dpoints[1];

    //
    // We're using the following formula for curvature:
    //
    //              x'y" - y'x"
    //   k(t) = ------------------
    //           (x'² + y'²)^(2/3)
    //
    // from https://en.wikipedia.org/wiki/Radius_of_curvature#Definition
    //
    // With it corresponding 3D counterpart:
    //
    //          sqrt( (y'z" - y"z')² + (z'x" - z"x')² + (x'y" - x"y')²)
    //   k(t) = -------------------------------------------------------
    //                     (x'² + y'² + z'²)^(2/3)
    //
    var d = utils.compute(t, d1);
    var dd = utils.compute(t, d2);
    var num, dnm;
    if (_3d) {
      num = sqrt(
        pow(d.y*dd.z - dd.y*d.z, 2) +
        pow(d.z*dd.x - dd.z*d.x, 2) +
        pow(d.x*dd.y - dd.x*d.y, 2)
      );
      dnm = pow(d.x*d.x + d.y*d.y + d.z*d.z, 2/3);
    } else {
      num = d.x*dd.y - d.y*dd.x;
      dnm = pow(d.x*d.x + d.y*d.y, 2/3);
    }

    if (num === 0 || dnm === 0) {
      return { k:0, r:0 };
    }

    return { k: num/dnm, r: dnm/num };
  },

  inflections: function(points) {
    if (points.length < 4) return [];

    // FIXME: TODO: add in inflection abstraction for quartic+ curves?

    var p = utils.align(points, { p1: points[0], p2: points.slice(-1)[0] }),
      a = p[2].x * p[1].y,
      b = p[3].x * p[1].y,
      c = p[1].x * p[2].y,
      d = p[3].x * p[2].y,
      v1 = 18 * (-3 * a + 2 * b + 3 * c - d),
      v2 = 18 * (3 * a - b - 3 * c),
      v3 = 18 * (c - a);

    if (utils.approximately(v1, 0)) {
      if (!utils.approximately(v2, 0)) {
        var t = -v3 / v2;
        if (0 <= t && t <= 1) return [t];
      }
      return [];
    }

    var trm = v2 * v2 - 4 * v1 * v3,
      sq = Math.sqrt(trm),
      d = 2 * v1;

    if (utils.approximately(d, 0)) return [];

    return [(sq - v2) / d, -(v2 + sq) / d].filter(function(r) {
      return 0 <= r && r <= 1;
    });
  },

  bboxoverlap: function(b1, b2) {
    var dims = ["x", "y"],
      len = dims.length,
      i,
      dim,
      l,
      t,
      d;
    for (i = 0; i < len; i++) {
      dim = dims[i];
      l = b1[dim].mid;
      t = b2[dim].mid;
      d = (b1[dim].size + b2[dim].size) / 2;
      if (abs(l - t) >= d) return false;
    }
    return true;
  },

  expandbox: function(bbox, _bbox) {
    if (_bbox.x.min < bbox.x.min) {
      bbox.x.min = _bbox.x.min;
    }
    if (_bbox.y.min < bbox.y.min) {
      bbox.y.min = _bbox.y.min;
    }
    if (_bbox.z && _bbox.z.min < bbox.z.min) {
      bbox.z.min = _bbox.z.min;
    }
    if (_bbox.x.max > bbox.x.max) {
      bbox.x.max = _bbox.x.max;
    }
    if (_bbox.y.max > bbox.y.max) {
      bbox.y.max = _bbox.y.max;
    }
    if (_bbox.z && _bbox.z.max > bbox.z.max) {
      bbox.z.max = _bbox.z.max;
    }
    bbox.x.mid = (bbox.x.min + bbox.x.max) / 2;
    bbox.y.mid = (bbox.y.min + bbox.y.max) / 2;
    if (bbox.z) {
      bbox.z.mid = (bbox.z.min + bbox.z.max) / 2;
    }
    bbox.x.size = bbox.x.max - bbox.x.min;
    bbox.y.size = bbox.y.max - bbox.y.min;
    if (bbox.z) {
      bbox.z.size = bbox.z.max - bbox.z.min;
    }
  },

  pairiteration: function(c1, c2, curveIntersectionThreshold) {
    var c1b = c1.bbox(),
      c2b = c2.bbox(),
      r = 100000,
      threshold = curveIntersectionThreshold || 0.5;
    if (
      c1b.x.size + c1b.y.size < threshold &&
      c2b.x.size + c2b.y.size < threshold
    ) {
      return [
        ((r * (c1._t1 + c1._t2) / 2) | 0) / r +
          "/" +
          ((r * (c2._t1 + c2._t2) / 2) | 0) / r
      ];
    }
    var cc1 = c1.split(0.5),
      cc2 = c2.split(0.5),
      pairs = [
        { left: cc1.left, right: cc2.left },
        { left: cc1.left, right: cc2.right },
        { left: cc1.right, right: cc2.right },
        { left: cc1.right, right: cc2.left }
      ];
    pairs = pairs.filter(function(pair) {
      return utils.bboxoverlap(pair.left.bbox(), pair.right.bbox());
    });
    var results = [];
    if (pairs.length === 0) return results;
    pairs.forEach(function(pair) {
      results = results.concat(
        utils.pairiteration(pair.left, pair.right, threshold)
      );
    });
    results = results.filter(function(v, i) {
      return results.indexOf(v) === i;
    });
    return results;
  },

  getccenter: function(p1, p2, p3) {
    var dx1 = p2.x - p1.x,
      dy1 = p2.y - p1.y,
      dx2 = p3.x - p2.x,
      dy2 = p3.y - p2.y;
    var dx1p = dx1 * cos(quart) - dy1 * sin(quart),
      dy1p = dx1 * sin(quart) + dy1 * cos(quart),
      dx2p = dx2 * cos(quart) - dy2 * sin(quart),
      dy2p = dx2 * sin(quart) + dy2 * cos(quart);
    // chord midpoints
    var mx1 = (p1.x + p2.x) / 2,
      my1 = (p1.y + p2.y) / 2,
      mx2 = (p2.x + p3.x) / 2,
      my2 = (p2.y + p3.y) / 2;
    // midpoint offsets
    var mx1n = mx1 + dx1p,
      my1n = my1 + dy1p,
      mx2n = mx2 + dx2p,
      my2n = my2 + dy2p;
    // intersection of these lines:
    var arc = utils.lli8(mx1, my1, mx1n, my1n, mx2, my2, mx2n, my2n),
      r = utils.dist(arc, p1),
      // arc start/end values, over mid point:
      s = atan2(p1.y - arc.y, p1.x - arc.x),
      m = atan2(p2.y - arc.y, p2.x - arc.x),
      e = atan2(p3.y - arc.y, p3.x - arc.x),
      _;
    // determine arc direction (cw/ccw correction)
    if (s < e) {
      // if s<m<e, arc(s, e)
      // if m<s<e, arc(e, s + tau)
      // if s<e<m, arc(e, s + tau)
      if (s > m || m > e) {
        s += tau;
      }
      if (s > e) {
        _ = e;
        e = s;
        s = _;
      }
    } else {
      // if e<m<s, arc(e, s)
      // if m<e<s, arc(s, e + tau)
      // if e<s<m, arc(s, e + tau)
      if (e < m && m < s) {
        _ = e;
        e = s;
        s = _;
      } else {
        e += tau;
      }
    }
    // assign and done.
    arc.s = s;
    arc.e = e;
    arc.r = r;
    return arc;
  },

  numberSort: function(a, b) {
    return a - b;
  }
};

/**
  A javascript Bezier curve library by Pomax.
  Based on http://pomax.github.io/bezierinfo
  This code is MIT licensed.
**/

var PolyBezier = function(curves) {
  this.curves = [];
  this._3d = false;
  if (!!curves) {
    this.curves = curves;
    this._3d = this.curves[0]._3d;
  }
};

PolyBezier.prototype = {
  valueOf: function() {
    return this.toString();
  },
  toString: function() {
    return (
      "[" +
      this.curves
        .map(function(curve) {
          return utils.pointsToString(curve.points);
        })
        .join(", ") +
      "]"
    );
  },
  addCurve: function(curve) {
    this.curves.push(curve);
    this._3d = this._3d || curve._3d;
  },
  length: function() {
    return this.curves
      .map(function(v) {
        return v.length();
      })
      .reduce(function(a, b) {
        return a + b;
      });
  },
  curve: function(idx) {
    return this.curves[idx];
  },
  bbox: function() {
    var c = this.curves;
    var bbox = c[0].bbox();
    for (var i = 1; i < c.length; i++) {
      utils.expandbox(bbox, c[i].bbox());
    }
    return bbox;
  },
  offset: function(d) {
    var offset = [];
    this.curves.forEach(function(v) {
      offset = offset.concat(v.offset(d));
    });
    return new PolyBezier(offset);
  }
};

/**
  A javascript Bezier curve library by Pomax.
  Based on http://pomax.github.io/bezierinfo
  This code is MIT licensed.
**/

// math-inlining.
var abs$1 = Math.abs,
  min$1 = Math.min,
  max$1 = Math.max,
  cos$1 = Math.cos,
  sin$1 = Math.sin,
  acos$1 = Math.acos,
  sqrt$1 = Math.sqrt,
  pi$1 = Math.PI,
  // a zero coordinate, which is surprisingly useful
  ZERO$1 = { x: 0, y: 0, z: 0 };

/**
 * Bezier curve constructor. The constructor argument can be one of three things:
 *
 * 1. array/4 of {x:..., y:..., z:...}, z optional
 * 2. numerical array/8 ordered x1,y1,x2,y2,x3,y3,x4,y4
 * 3. numerical array/12 ordered x1,y1,z1,x2,y2,z2,x3,y3,z3,x4,y4,z4
 *
 */
var Bezier = function(coords) {
  var args = coords && coords.forEach ? coords : [].slice.call(arguments);
  var coordlen = false;
  if (typeof args[0] === "object") {
    coordlen = args.length;
    var newargs = [];
    args.forEach(function(point) {
      ["x", "y", "z"].forEach(function(d) {
        if (typeof point[d] !== "undefined") {
          newargs.push(point[d]);
        }
      });
    });
    args = newargs;
  }
  var higher = false;
  var len = args.length;
  if (coordlen) {
    if (coordlen > 4) {
      if (arguments.length !== 1) {
        throw new Error(
          "Only new Bezier(point[]) is accepted for 4th and higher order curves"
        );
      }
      higher = true;
    }
  } else {
    if (len !== 6 && len !== 8 && len !== 9 && len !== 12) {
      if (arguments.length !== 1) {
        throw new Error(
          "Only new Bezier(point[]) is accepted for 4th and higher order curves"
        );
      }
    }
  }
  var _3d =
    (!higher && (len === 9 || len === 12)) ||
    (coords && coords[0] && typeof coords[0].z !== "undefined");
  this._3d = _3d;
  var points = [];
  for (var idx = 0, step = _3d ? 3 : 2; idx < len; idx += step) {
    var point = {
      x: args[idx],
      y: args[idx + 1]
    };
    if (_3d) {
      point.z = args[idx + 2];
    }
    points.push(point);
  }
  this.order = points.length - 1;
  this.points = points;
  var dims = ["x", "y"];
  if (_3d) dims.push("z");
  this.dims = dims;
  this.dimlen = dims.length;

  (function(curve) {
    var order = curve.order;
    var points = curve.points;
    var a = utils.align(points, { p1: points[0], p2: points[order] });
    for (var i = 0; i < a.length; i++) {
      if (abs$1(a[i].y) > 0.0001) {
        curve._linear = false;
        return;
      }
    }
    curve._linear = true;
  })(this);

  this._t1 = 0;
  this._t2 = 1;
  this.update();
};

Bezier.quadraticFromPoints = function(p1, p2, p3, t) {
  if (typeof t === "undefined") {
    t = 0.5;
  }
  // shortcuts, although they're really dumb
  if (t === 0) {
    return new Bezier(p2, p2, p3);
  }
  if (t === 1) {
    return new Bezier(p1, p2, p2);
  }
  // real fitting.
  var abc = getABC(2, p1, p2, p3, t);
  return new Bezier(p1, abc.A, p3);
};

Bezier.cubicFromPoints = function(S, B, E, t, d1) {
  if (typeof t === "undefined") {
    t = 0.5;
  }
  var abc = getABC(3, S, B, E, t);
  if (typeof d1 === "undefined") {
    d1 = utils.dist(B, abc.C);
  }
  var d2 = d1 * (1 - t) / t;

  var selen = utils.dist(S, E),
    lx = (E.x - S.x) / selen,
    ly = (E.y - S.y) / selen,
    bx1 = d1 * lx,
    by1 = d1 * ly,
    bx2 = d2 * lx,
    by2 = d2 * ly;
  // derivation of new hull coordinates
  var e1 = { x: B.x - bx1, y: B.y - by1 },
    e2 = { x: B.x + bx2, y: B.y + by2 },
    A = abc.A,
    v1 = { x: A.x + (e1.x - A.x) / (1 - t), y: A.y + (e1.y - A.y) / (1 - t) },
    v2 = { x: A.x + (e2.x - A.x) / t, y: A.y + (e2.y - A.y) / t },
    nc1 = { x: S.x + (v1.x - S.x) / t, y: S.y + (v1.y - S.y) / t },
    nc2 = {
      x: E.x + (v2.x - E.x) / (1 - t),
      y: E.y + (v2.y - E.y) / (1 - t)
    };
  // ...done
  return new Bezier(S, nc1, nc2, E);
};

var getUtils = function() {
  return utils;
};

Bezier.getUtils = getUtils;

Bezier.PolyBezier = PolyBezier;

Bezier.prototype = {
  getUtils: getUtils,
  valueOf: function() {
    return this.toString();
  },
  toString: function() {
    return utils.pointsToString(this.points);
  },
  toSVG: function(relative) {
    if (this._3d) return false;
    var p = this.points,
      x = p[0].x,
      y = p[0].y,
      s = ["M", x, y, this.order === 2 ? "Q" : "C"];
    for (var i = 1, last = p.length; i < last; i++) {
      s.push(p[i].x);
      s.push(p[i].y);
    }
    return s.join(" ");
  },
  update: function() {
    // invalidate any precomputed LUT
    this._lut = [];
    this.dpoints = utils.derive(this.points, this._3d);
    this.computedirection();
  },
  computedirection: function() {
    var points = this.points;
    var angle = utils.angle(points[0], points[this.order], points[1]);
    this.clockwise = angle > 0;
  },
  length: function() {
    return utils.length(this.derivative.bind(this));
  },
  _lut: [],
  getLUT: function(steps) {
    steps = steps || 100;
    if (this._lut.length === steps) {
      return this._lut;
    }
    this._lut = [];
    // We want a range from 0 to 1 inclusive, so
    // we decrement and then use <= rather than <:
    steps--;
    for (var t = 0; t <= steps; t++) {
      this._lut.push(this.compute(t / steps));
    }
    return this._lut;
  },
  on: function(point, error) {
    error = error || 5;
    var lut = this.getLUT(),
      hits = [],
      c,
      t = 0;
    for (var i = 0; i < lut.length; i++) {
      c = lut[i];
      if (utils.dist(c, point) < error) {
        hits.push(c);
        t += i / lut.length;
      }
    }
    if (!hits.length) return false;
    return (t /= hits.length);
  },
  project: function(point) {
    // step 1: coarse check
    var LUT = this.getLUT(),
      l = LUT.length - 1,
      closest = utils.closest(LUT, point),
      mdist = closest.mdist,
      mpos = closest.mpos;
    if (mpos === 0 || mpos === l) {
      var t = mpos / l,
        pt = this.compute(t);
      pt.t = t;
      pt.d = mdist;
      return pt;
    }

    // step 2: fine check
    var ft,
      t,
      p,
      d,
      t1 = (mpos - 1) / l,
      t2 = (mpos + 1) / l,
      step = 0.1 / l;
    mdist += 1;
    for (t = t1, ft = t; t < t2 + step; t += step) {
      p = this.compute(t);
      d = utils.dist(point, p);
      if (d < mdist) {
        mdist = d;
        ft = t;
      }
    }
    p = this.compute(ft);
    p.t = ft;
    p.d = mdist;
    return p;
  },
  get: function(t) {
    return this.compute(t);
  },
  point: function(idx) {
    return this.points[idx];
  },
  compute: function(t) {
    return utils.compute(t, this.points, this._3d);
  },
  raise: function() {
    var p = this.points,
      np = [p[0]],
      i,
      k = p.length,
      pi,
      pim;
    for (var i = 1; i < k; i++) {
      pi = p[i];
      pim = p[i - 1];
      np[i] = {
        x: (k - i) / k * pi.x + i / k * pim.x,
        y: (k - i) / k * pi.y + i / k * pim.y
      };
    }
    np[k] = p[k - 1];
    return new Bezier(np);
  },
  derivative: function(t) {
    var mt = 1 - t,
      a,
      b,
      c = 0,
      p = this.dpoints[0];
    if (this.order === 2) {
      p = [p[0], p[1], ZERO$1];
      a = mt;
      b = t;
    }
    if (this.order === 3) {
      a = mt * mt;
      b = mt * t * 2;
      c = t * t;
    }
    var ret = {
      x: a * p[0].x + b * p[1].x + c * p[2].x,
      y: a * p[0].y + b * p[1].y + c * p[2].y
    };
    if (this._3d) {
      ret.z = a * p[0].z + b * p[1].z + c * p[2].z;
    }
    return ret;
  },
  curvature: function(t) {
    return utils.curvature(t, this.points, this._3d);
  },
  inflections: function() {
    return utils.inflections(this.points);
  },
  normal: function(t) {
    return this._3d ? this.__normal3(t) : this.__normal2(t);
  },
  __normal2: function(t) {
    var d = this.derivative(t);
    var q = sqrt$1(d.x * d.x + d.y * d.y);
    return { x: -d.y / q, y: d.x / q };
  },
  __normal3: function(t) {
    // see http://stackoverflow.com/questions/25453159
    var r1 = this.derivative(t),
      r2 = this.derivative(t + 0.01),
      q1 = sqrt$1(r1.x * r1.x + r1.y * r1.y + r1.z * r1.z),
      q2 = sqrt$1(r2.x * r2.x + r2.y * r2.y + r2.z * r2.z);
    r1.x /= q1;
    r1.y /= q1;
    r1.z /= q1;
    r2.x /= q2;
    r2.y /= q2;
    r2.z /= q2;
    // cross product
    var c = {
      x: r2.y * r1.z - r2.z * r1.y,
      y: r2.z * r1.x - r2.x * r1.z,
      z: r2.x * r1.y - r2.y * r1.x
    };
    var m = sqrt$1(c.x * c.x + c.y * c.y + c.z * c.z);
    c.x /= m;
    c.y /= m;
    c.z /= m;
    // rotation matrix
    var R = [
      c.x * c.x,
      c.x * c.y - c.z,
      c.x * c.z + c.y,
      c.x * c.y + c.z,
      c.y * c.y,
      c.y * c.z - c.x,
      c.x * c.z - c.y,
      c.y * c.z + c.x,
      c.z * c.z
    ];
    // normal vector:
    var n = {
      x: R[0] * r1.x + R[1] * r1.y + R[2] * r1.z,
      y: R[3] * r1.x + R[4] * r1.y + R[5] * r1.z,
      z: R[6] * r1.x + R[7] * r1.y + R[8] * r1.z
    };
    return n;
  },
  hull: function(t) {
    var p = this.points,
      _p = [],
      pt,
      q = [],
      idx = 0,
      i = 0,
      l = 0;
    q[idx++] = p[0];
    q[idx++] = p[1];
    q[idx++] = p[2];
    if (this.order === 3) {
      q[idx++] = p[3];
    }
    // we lerp between all points at each iteration, until we have 1 point left.
    while (p.length > 1) {
      _p = [];
      for (i = 0, l = p.length - 1; i < l; i++) {
        pt = utils.lerp(t, p[i], p[i + 1]);
        q[idx++] = pt;
        _p.push(pt);
      }
      p = _p;
    }
    return q;
  },
  split: function(t1, t2) {
    // shortcuts
    if (t1 === 0 && !!t2) {
      return this.split(t2).left;
    }
    if (t2 === 1) {
      return this.split(t1).right;
    }

    // no shortcut: use "de Casteljau" iteration.
    var q = this.hull(t1);
    var result = {
      left:
        this.order === 2
          ? new Bezier([q[0], q[3], q[5]])
          : new Bezier([q[0], q[4], q[7], q[9]]),
      right:
        this.order === 2
          ? new Bezier([q[5], q[4], q[2]])
          : new Bezier([q[9], q[8], q[6], q[3]]),
      span: q
    };

    // make sure we bind _t1/_t2 information!
    result.left._t1 = utils.map(0, 0, 1, this._t1, this._t2);
    result.left._t2 = utils.map(t1, 0, 1, this._t1, this._t2);
    result.right._t1 = utils.map(t1, 0, 1, this._t1, this._t2);
    result.right._t2 = utils.map(1, 0, 1, this._t1, this._t2);

    // if we have no t2, we're done
    if (!t2) {
      return result;
    }

    // if we have a t2, split again:
    t2 = utils.map(t2, t1, 1, 0, 1);
    var subsplit = result.right.split(t2);
    return subsplit.left;
  },
  extrema: function() {
    var dims = this.dims,
      result = {},
      roots = [],
      p,
      mfn;
    dims.forEach(
      function(dim) {
        mfn = function(v) {
          return v[dim];
        };
        p = this.dpoints[0].map(mfn);
        result[dim] = utils.droots(p);
        if (this.order === 3) {
          p = this.dpoints[1].map(mfn);
          result[dim] = result[dim].concat(utils.droots(p));
        }
        result[dim] = result[dim].filter(function(t) {
          return t >= 0 && t <= 1;
        });
        roots = roots.concat(result[dim].sort(utils.numberSort));
      }.bind(this)
    );
    roots = roots.sort(utils.numberSort).filter(function(v, idx) {
      return roots.indexOf(v) === idx;
    });
    result.values = roots;
    return result;
  },
  bbox: function() {
    var extrema = this.extrema(),
      result = {};
    this.dims.forEach(
      function(d) {
        result[d] = utils.getminmax(this, d, extrema[d]);
      }.bind(this)
    );
    return result;
  },
  overlaps: function(curve) {
    var lbbox = this.bbox(),
      tbbox = curve.bbox();
    return utils.bboxoverlap(lbbox, tbbox);
  },
  offset: function(t, d) {
    if (typeof d !== "undefined") {
      var c = this.get(t);
      var n = this.normal(t);
      var ret = {
        c: c,
        n: n,
        x: c.x + n.x * d,
        y: c.y + n.y * d
      };
      if (this._3d) {
        ret.z = c.z + n.z * d;
      }
      return ret;
    }
    if (this._linear) {
      var nv = this.normal(0);
      var coords = this.points.map(function(p) {
        var ret = {
          x: p.x + t * nv.x,
          y: p.y + t * nv.y
        };
        if (p.z && n.z) {
          ret.z = p.z + t * nv.z;
        }
        return ret;
      });
      return [new Bezier(coords)];
    }
    var reduced = this.reduce();
    return reduced.map(function(s) {
      return s.scale(t);
    });
  },
  simple: function() {
    if (this.order === 3) {
      var a1 = utils.angle(this.points[0], this.points[3], this.points[1]);
      var a2 = utils.angle(this.points[0], this.points[3], this.points[2]);
      if ((a1 > 0 && a2 < 0) || (a1 < 0 && a2 > 0)) return false;
    }
    var n1 = this.normal(0);
    var n2 = this.normal(1);
    var s = n1.x * n2.x + n1.y * n2.y;
    if (this._3d) {
      s += n1.z * n2.z;
    }
    var angle = abs$1(acos$1(s));
    return angle < pi$1 / 3;
  },
  reduce: function() {
    var i,
      t1 = 0,
      t2 = 0,
      step = 0.01,
      segment,
      pass1 = [],
      pass2 = [];
    // first pass: split on extrema
    var extrema = this.extrema().values;
    if (extrema.indexOf(0) === -1) {
      extrema = [0].concat(extrema);
    }
    if (extrema.indexOf(1) === -1) {
      extrema.push(1);
    }

    for (t1 = extrema[0], i = 1; i < extrema.length; i++) {
      t2 = extrema[i];
      segment = this.split(t1, t2);
      segment._t1 = t1;
      segment._t2 = t2;
      pass1.push(segment);
      t1 = t2;
    }

    // second pass: further reduce these segments to simple segments
    pass1.forEach(function(p1) {
      t1 = 0;
      t2 = 0;
      while (t2 <= 1) {
        for (t2 = t1 + step; t2 <= 1 + step; t2 += step) {
          segment = p1.split(t1, t2);
          if (!segment.simple()) {
            t2 -= step;
            if (abs$1(t1 - t2) < step) {
              // we can never form a reduction
              return [];
            }
            segment = p1.split(t1, t2);
            segment._t1 = utils.map(t1, 0, 1, p1._t1, p1._t2);
            segment._t2 = utils.map(t2, 0, 1, p1._t1, p1._t2);
            pass2.push(segment);
            t1 = t2;
            break;
          }
        }
      }
      if (t1 < 1) {
        segment = p1.split(t1, 1);
        segment._t1 = utils.map(t1, 0, 1, p1._t1, p1._t2);
        segment._t2 = p1._t2;
        pass2.push(segment);
      }
    });
    return pass2;
  },
  scale: function(d) {
    var order = this.order;
    var distanceFn = false;
    if (typeof d === "function") {
      distanceFn = d;
    }
    if (distanceFn && order === 2) {
      return this.raise().scale(distanceFn);
    }

    // TODO: add special handling for degenerate (=linear) curves.
    var clockwise = this.clockwise;
    var r1 = distanceFn ? distanceFn(0) : d;
    var r2 = distanceFn ? distanceFn(1) : d;
    var v = [this.offset(0, 10), this.offset(1, 10)];
    var o = utils.lli4(v[0], v[0].c, v[1], v[1].c);
    if (!o) {
      throw new Error("cannot scale this curve. Try reducing it first.");
    }
    // move all points by distance 'd' wrt the origin 'o'
    var points = this.points,
      np = [];

    // move end points by fixed distance along normal.
    [0, 1].forEach(
      function(t) {
        var p = (np[t * order] = utils.copy(points[t * order]));
        p.x += (t ? r2 : r1) * v[t].n.x;
        p.y += (t ? r2 : r1) * v[t].n.y;
      }.bind(this)
    );

    if (!distanceFn) {
      // move control points to lie on the intersection of the offset
      // derivative vector, and the origin-through-control vector
      [0, 1].forEach(
        function(t) {
          if (this.order === 2 && !!t) return;
          var p = np[t * order];
          var d = this.derivative(t);
          var p2 = { x: p.x + d.x, y: p.y + d.y };
          np[t + 1] = utils.lli4(p, p2, o, points[t + 1]);
        }.bind(this)
      );
      return new Bezier(np);
    }

    // move control points by "however much necessary to
    // ensure the correct tangent to endpoint".
    [0, 1].forEach(
      function(t) {
        if (this.order === 2 && !!t) return;
        var p = points[t + 1];
        var ov = {
          x: p.x - o.x,
          y: p.y - o.y
        };
        var rc = distanceFn ? distanceFn((t + 1) / order) : d;
        if (distanceFn && !clockwise) rc = -rc;
        var m = sqrt$1(ov.x * ov.x + ov.y * ov.y);
        ov.x /= m;
        ov.y /= m;
        np[t + 1] = {
          x: p.x + rc * ov.x,
          y: p.y + rc * ov.y
        };
      }.bind(this)
    );
    return new Bezier(np);
  },
  outline: function(d1, d2, d3, d4) {
    d2 = typeof d2 === "undefined" ? d1 : d2;
    var reduced = this.reduce(),
      len = reduced.length,
      fcurves = [],
      bcurves = [],
      p,
      alen = 0,
      tlen = this.length();

    var graduated = typeof d3 !== "undefined" && typeof d4 !== "undefined";

    function linearDistanceFunction(s, e, tlen, alen, slen) {
      return function(v) {
        var f1 = alen / tlen,
          f2 = (alen + slen) / tlen,
          d = e - s;
        return utils.map(v, 0, 1, s + f1 * d, s + f2 * d);
      };
    }

    // form curve oulines
    reduced.forEach(function(segment) {
      slen = segment.length();
      if (graduated) {
        fcurves.push(
          segment.scale(linearDistanceFunction(d1, d3, tlen, alen, slen))
        );
        bcurves.push(
          segment.scale(linearDistanceFunction(-d2, -d4, tlen, alen, slen))
        );
      } else {
        fcurves.push(segment.scale(d1));
        bcurves.push(segment.scale(-d2));
      }
      alen += slen;
    });

    // reverse the "return" outline
    bcurves = bcurves
      .map(function(s) {
        p = s.points;
        if (p[3]) {
          s.points = [p[3], p[2], p[1], p[0]];
        } else {
          s.points = [p[2], p[1], p[0]];
        }
        return s;
      })
      .reverse();

    // form the endcaps as lines
    var fs = fcurves[0].points[0],
      fe = fcurves[len - 1].points[fcurves[len - 1].points.length - 1],
      bs = bcurves[len - 1].points[bcurves[len - 1].points.length - 1],
      be = bcurves[0].points[0],
      ls = utils.makeline(bs, fs),
      le = utils.makeline(fe, be),
      segments = [ls]
        .concat(fcurves)
        .concat([le])
        .concat(bcurves),
      slen = segments.length;

    return new PolyBezier(segments);
  },
  outlineshapes: function(d1, d2, curveIntersectionThreshold) {
    d2 = d2 || d1;
    var outline = this.outline(d1, d2).curves;
    var shapes = [];
    for (var i = 1, len = outline.length; i < len / 2; i++) {
      var shape = utils.makeshape(
        outline[i],
        outline[len - i],
        curveIntersectionThreshold
      );
      shape.startcap.virtual = i > 1;
      shape.endcap.virtual = i < len / 2 - 1;
      shapes.push(shape);
    }
    return shapes;
  },
  intersects: function(curve, curveIntersectionThreshold) {
    if (!curve) return this.selfintersects(curveIntersectionThreshold);
    if (curve.p1 && curve.p2) {
      return this.lineIntersects(curve);
    }
    if (curve instanceof Bezier) {
      curve = curve.reduce();
    }
    return this.curveintersects(
      this.reduce(),
      curve,
      curveIntersectionThreshold
    );
  },
  lineIntersects: function(line) {
    var mx = min$1(line.p1.x, line.p2.x),
      my = min$1(line.p1.y, line.p2.y),
      MX = max$1(line.p1.x, line.p2.x),
      MY = max$1(line.p1.y, line.p2.y),
      self = this;
    return utils.roots(this.points, line).filter(function(t) {
      var p = self.get(t);
      return utils.between(p.x, mx, MX) && utils.between(p.y, my, MY);
    });
  },
  selfintersects: function(curveIntersectionThreshold) {
    var reduced = this.reduce();
    // "simple" curves cannot intersect with their direct
    // neighbour, so for each segment X we check whether
    // it intersects [0:x-2][x+2:last].
    var i,
      len = reduced.length - 2,
      results = [],
      result,
      left,
      right;
    for (i = 0; i < len; i++) {
      left = reduced.slice(i, i + 1);
      right = reduced.slice(i + 2);
      result = this.curveintersects(left, right, curveIntersectionThreshold);
      results = results.concat(result);
    }
    return results;
  },
  curveintersects: function(c1, c2, curveIntersectionThreshold) {
    var pairs = [];
    // step 1: pair off any overlapping segments
    c1.forEach(function(l) {
      c2.forEach(function(r) {
        if (l.overlaps(r)) {
          pairs.push({ left: l, right: r });
        }
      });
    });
    // step 2: for each pairing, run through the convergence algorithm.
    var intersections = [];
    pairs.forEach(function(pair) {
      var result = utils.pairiteration(
        pair.left,
        pair.right,
        curveIntersectionThreshold
      );
      if (result.length > 0) {
        intersections = intersections.concat(result);
      }
    });
    return intersections;
  },
  arcs: function(errorThreshold) {
    errorThreshold = errorThreshold || 0.5;
    var circles = [];
    return this._iterate(errorThreshold, circles);
  },
  _error: function(pc, np1, s, e) {
    var q = (e - s) / 4,
      c1 = this.get(s + q),
      c2 = this.get(e - q),
      ref = utils.dist(pc, np1),
      d1 = utils.dist(pc, c1),
      d2 = utils.dist(pc, c2);
    return abs$1(d1 - ref) + abs$1(d2 - ref);
  },
  _iterate: function(errorThreshold, circles) {
    var t_s = 0,
      t_e = 1,
      safety;
    // we do a binary search to find the "good `t` closest to no-longer-good"
    do {
      safety = 0;

      // step 1: start with the maximum possible arc
      t_e = 1;

      // points:
      var np1 = this.get(t_s),
        np2,
        np3,
        arc,
        prev_arc;

      // booleans:
      var curr_good = false,
        prev_good = false,
        done;

      // numbers:
      var t_m = t_e,
        prev_e = 1;

      // step 2: find the best possible arc
      do {
        prev_good = curr_good;
        prev_arc = arc;
        t_m = (t_s + t_e) / 2;

        np2 = this.get(t_m);
        np3 = this.get(t_e);

        arc = utils.getccenter(np1, np2, np3);

        //also save the t values
        arc.interval = {
          start: t_s,
          end: t_e
        };

        var error = this._error(arc, np1, t_s, t_e);
        curr_good = error <= errorThreshold;

        done = prev_good && !curr_good;
        if (!done) prev_e = t_e;

        // this arc is fine: we can move 'e' up to see if we can find a wider arc
        if (curr_good) {
          // if e is already at max, then we're done for this arc.
          if (t_e >= 1) {
            // make sure we cap at t=1
            arc.interval.end = prev_e = 1;
            prev_arc = arc;
            // if we capped the arc segment to t=1 we also need to make sure that
            // the arc's end angle is correct with respect to the bezier end point.
            if (t_e > 1) {
              var d = {
                x: arc.x + arc.r * cos$1(arc.e),
                y: arc.y + arc.r * sin$1(arc.e)
              };
              arc.e += utils.angle({ x: arc.x, y: arc.y }, d, this.get(1));
            }
            break;
          }
          // if not, move it up by half the iteration distance
          t_e = t_e + (t_e - t_s) / 2;
        } else {
          // this is a bad arc: we need to move 'e' down to find a good arc
          t_e = t_m;
        }
      } while (!done && safety++ < 100);

      if (safety >= 100) {
        break;
      }

      prev_arc = prev_arc ? prev_arc : arc;
      circles.push(prev_arc);
      t_s = prev_e;
    } while (t_e < 1);
    return circles;
  }
};

const Curve$$1 = {
  // the params are Vector instances
  create(anchor1, anchor2, handle1, handle2) {
    return Object.create(Curve$$1).init(anchor1, anchor2, handle1, handle2);
  },

  // TODO: this assumes cubic coordinates
  // coords is an array of points of the form { x: .., y: ...}
  createFromCoordinates(coords) {
    return Curve$$1.create(
      Vector$$1.create(coords[0]),
      Vector$$1.create(coords[1]),
      Vector$$1.create(coords[2]),
      Vector$$1.create(coords[3])
    );
  },

  // the params are Segment instances
  createFromSegments(segment1, segment2) {
    return Curve$$1.create(
      segment1.anchor && segment1.anchor.vector,
      segment2.anchor && segment2.anchor.vector,
      segment1.handleOut && segment1.handleOut.vector,
      segment2.handleIn && segment2.handleIn.vector
    );
  },

  // the params are Vector instances
  init(anchor1, anchor2, handle1, handle2) {
    this.anchor1 = anchor1;
    this.anchor2 = anchor2;
    this.handle1 = handle1;
    this.handle2 = handle2;

    return this;
  },

  // NOTE: the order of points is crucial. It is required
  // by the Bezier constructor of the Pomax Bezier library!
  // It is also the order in which points occur in a path string.
  points() {
    const pts = [this.anchor1, this.handle1, this.handle2, this.anchor2].filter(
      point => {
        return point !== undefined && point !== null;
      }
    );

    return pts;
  },

  coords() {
    const cds = this.points().map(point => point.coords());
    return cds;
  },

  toPathString() {
    const a1 = this.anchor1 && this.anchor1.toString();
    const a2 = this.anchor2 && this.anchor2.toString();
    const h1 = this.handle1 && this.handle1.toString();
    const h2 = this.handle2 && this.handle2.toString();

    if (this.isDegenerate()) {
      return `M ${a1}`;
    } else if (this.isLine()) {
      return `M ${a1} L ${a2}`;
    } else if (this.isQuadratic()) {
      return `M ${a1} Q ${h1 || h2} ${a2}`;
    } else if (this.isCubic()) {
      return `M ${a1} C ${h1} ${h2} ${a2}`;
    }
  },

  isInvalid() {
    return this.hasNoAnchor();
  },

  isDegenerate() {
    return this.hasOneAnchor();
  },

  isLine() {
    return this.hasTwoAnchors() && this.hasNoHandle();
  },

  isQuadratic() {
    return this.hasTwoAnchors() && this.hasOneHandle();
  },

  isCubic() {
    return this.hasTwoAnchors() && this.hasTwoHandles();
  },

  hasAnchor() {
    return this.anchor1 || this.anchor2;
  },

  hasHandle() {
    return this.handle1 || this.handle2;
  },

  hasTwoAnchors() {
    return this.anchor1 && this.anchor2;
  },

  hasTwoHandles() {
    return this.handle1 && this.handle2;
  },

  hasOneAnchor() {
    return this.hasAnchor() && !this.hasTwoAnchors();
  },

  hasOneHandle() {
    return this.hasHandle() && !this.hasTwoHandles();
  },

  hasNoAnchor() {
    return !this.hasAnchor();
  },

  hasNoHandle() {
    return !this.hasHandle();
  },

  get bounds() {
    let min, max;

    if (this.isLine()) {
      const minX = Math.min(this.anchor1.x, this.anchor2.x);
      const minY = Math.min(this.anchor1.y, this.anchor2.y);
      const maxX = Math.max(this.anchor1.x, this.anchor2.x);
      const maxY = Math.max(this.anchor1.y, this.anchor2.y);

      min = Vector$$1.create(minX, minY);
      max = Vector$$1.create(maxX, maxY);
    } else {
      const bbox = new Bezier(...this.coords()).bbox();

      min = Vector$$1.create(bbox.x.min, bbox.y.min);
      max = Vector$$1.create(bbox.x.max, bbox.y.max);
    }

    return Rectangle$$1.createFromMinMax(min, max);
  },
};

const types = {
  DOC: 'doc',
  EDITOR: 'editor',
  MESSAGE: 'message',
  DOCS: 'docs',
  IDENTIFIER: 'identifier',

  // scenegraph
  CANVAS: 'canvas',
  GROUP: 'group',
  SHAPE: 'shape',
  SPLINE: 'spline',
  SEGMENT: 'segment',
  ANCHOR: 'anchor',
  HANDLEIN: 'handleIn',
  HANDLEOUT: 'handleOut',
  CURVE: 'curve',
  TOOLS: 'tools',
  TOOL: 'tool',

  // markup
  MARKUPNODE: 'markupNode',
  MARKUPROOT: 'markupRoot',
  LINE: 'line',
  TOKEN: 'token',
};

const attributeList = ['xmlns', 'viewBox', 'transform'];

const ProtoNode = {
  defineProps(propNames) {
    for (let propName of propNames) {
      Object.defineProperty(this, propName, {
        get() {
          return this.props[propName];
        },

        set(value) {
          this.props[propName] = value;

          if (this.isSceneNode()) {
            this.invalidateCache();
          }
        },
      });
    }

    return this;
  },

  set(opts) {
    for (let key of Object.keys(opts)) {
      this[key] = opts[key];
    }

    return this;
  },

  toJSON() {
    return {
      type: this.type,
      children: this.children,
      props: this.props,
    };
  },
};

const Node$$1 = Object.create(ProtoNode);
// Node.defineProps(['type', 'key', 'class']);
Node$$1.defineProps(['key', 'class']);

Object.assign(Node$$1, {
  create(opts = {}) {
    return Object.create(this)
      .set({
        children: [],
        parent: null,
        props: {},
      })
      .set({
        type: null,
        key: createID(),
        class: Class.create(),
      })
      .set(opts);
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
        if (val) {
          return val;
        }
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

  findDescendantByKey(key) {
    return this.findDescendant(node => {
      return node.key === key;
    });
  },

  findDescendantByClass(className) {
    return this.findDescendant(node => {
      return node.class.includes(className);
    });
  },

  findAncestorByClass(className) {
    return this.findAncestor(node => {
      return node.class.includes(className);
    });
  },

  mount(...nodes) {
    for (let node of nodes) {
      this.children = this.children.concat([node]);
      node.parent = this;

      if (node.isGroupOrShape()) {
        node.height = node.parent.height + 1;
      }
    }

    if (this.isSceneNode()) {
      this.invalidateCache();
    }

    return this;
  },

  replaceWith(node) {
    node.parent = this.parent;
    const index = this.parent.children.indexOf(this);
    this.parent.children.splice(index, 1, node);
  },

  unmount() {
    this.parent.unmountChild(this);
  },

  unmountChild(node) {
    const index = this.children.indexOf(node);

    if (index !== -1) {
      this.children.splice(index, 1);
      node.parent = null;

      if (this.isSceneNode()) {
        this.invalidateCache();
      }
    }
  },

  insertChild(node, index) {
    node.parent = this;
    this.children.splice(index, 0, node);
  },

  isLeaf() {
    return this.children.length === 0;
  },

  isRoot() {
    return this.parent === null;
  },

  isGraphicsNode() {
    return [types.CANVAS, types.GROUP, types.SHAPE].includes(this.type);
  },

  isGroupOrShape() {
    return [types.GROUP, types.SHAPE].includes(this.type);
  },

  isSceneNode() {
    return [
      types.CANVAS,
      types.GROUP,
      types.SHAPE,
      types.SPLINE,
      types.SEGMENT,
      types.ANCHOR,
      types.HANDLEIN,
      types.HANDLEOUT,
    ].includes(this.type);
  },
});

Object.defineProperty(Node$$1, 'root', {
  get() {
    return this.findAncestor(node => node.parent === null);
  },
});

Object.defineProperty(Node$$1, 'leaves', {
  get() {
    return this.findDescendants(node => node.children.length === 0);
  },
});

Object.defineProperty(Node$$1, 'ancestors', {
  get() {
    return this.findAncestors(node => true);
  },
});

Object.defineProperty(Node$$1, 'properAncestors', {
  get() {
    return this.parent.findAncestors(node => true);
  },
});

Object.defineProperty(Node$$1, 'descendants', {
  get() {
    return this.findDescendants(node => true);
  },
});

Object.defineProperty(Node$$1, 'siblings', {
  get() {
    return this.parent.children.filter(node => node !== this);
  },
});

Object.defineProperty(Node$$1, 'lastChild', {
  get() {
    return this.children[this.children.length - 1];
  },
});

Object.defineProperty(Node$$1, 'graphicsChildren', {
  get() {
    return this.children.filter(node => node.isGraphicsNode());
  },
});

Object.defineProperty(Node$$1, 'graphicsAncestors', {
  get() {
    return this.ancestors.filter(node => node.isGraphicsNode());
  },
});

Object.defineProperty(Node$$1, 'shapeOrGroupAncestors', {
  get() {
    return this.ancestors.filter(node => node.isGroupOrShape());
  },
});

const SceneNode$$1 = Object.create(Node$$1);

Object.assign(SceneNode$$1, {
  invalidateCache() {
    for (let ancestor of this.graphicsAncestors) {
      ancestor.cache = {};
    }
  },
});

Object.defineProperty(SceneNode$$1, 'canvas', {
  get() {
    return this.findAncestor(node => node.type === types.CANVAS);
  },
});

Object.defineProperty(SceneNode$$1, 'doc', {
  get() {
    return this.findAncestor(node => node.type === types.DOC);
  },
});

const GraphicsNode$$1 = SceneNode$$1.create();
GraphicsNode$$1.defineProps(['transform', 'height']);

Object.assign(GraphicsNode$$1, {
  create() {
    return SceneNode$$1.create
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
    this.transform = Matrix$$1.rotation(angle, center).multiply(
      this.transform || Matrix$$1.identity()
    );
  },

  scale(factor, center) {
    center = center.transform(this.properAncestorTransform().invert());
    this.transform = Matrix$$1.scale(factor, center).multiply(
      this.transform || Matrix$$1.identity()
    );
  },

  translate(offset) {
    this.transform = this.properAncestorTransform()
      .invert()
      .multiply(Matrix$$1.translation(offset))
      .multiply(this.globalTransform());
  },

  globalTransform() {
    return this.properAncestorTransform().multiply(
      this.transform || Matrix$$1.identity()
    );
  },

  properAncestorTransform() {
    let matrix = Matrix$$1.identity();

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
          corners.push(corner.transform(child.transform || Matrix$$1.identity()));
        }
      }
    }

    const xValue = vector => vector.x;
    const xValues = corners.map(xValue);
    const yValue = vector => vector.y;
    const yValues = corners.map(yValue);

    const min = Vector$$1.create(Math.min(...xValues), Math.min(...yValues));
    const max = Vector$$1.create(Math.max(...xValues), Math.max(...yValues));

    const bounds = Rectangle$$1.createFromMinMax(min, max);

    this.bounds = bounds;
    return bounds;
  },

  renderElement() {
    return this.component();
  },
});

Object.defineProperty(GraphicsNode$$1, 'bounds', {
  get() {
    return this.props.bounds || this.computeBounds();
  },

  set(value) {
    this.props.bounds = value;
  },
});

Object.defineProperty(GraphicsNode$$1, 'attributes', {
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
Object.defineProperty(GraphicsNode$$1, 'tags', {
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
Object.defineProperty(GraphicsNode$$1, 'component', {
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

const Canvas$$1 = Object.create(GraphicsNode$$1);
Canvas$$1.defineProps(['viewBox', 'xmlns', 'cursor']);
 
Object.assign(Canvas$$1, {
  create(opts = {}) {
    return GraphicsNode$$1.create
      .bind(this)()
      .set({
        type: types.CANVAS,
        xmlns: 'http://www.w3.org/2000/svg',
      })
      .set({ height: 0 })
      .set(opts);
  },

  findFocus() {
    return this.findDescendant(node => node.class.includes('focus'));
  },

  removeFocus() {
    const focus = this.findFocus();

    if (focus) {
      focus.class = focus.class.remove('focus');
    }
  },

  findSelection() {
    return this.findDescendant(node => node.class.includes('selected'));
  },

  removeSelection() {
    const selected = this.findSelection();

    if (selected) {
      selected.class = selected.class.remove('selected');
    }

    this.updateFrontier();
  },

  findPen() {
    return this.findDescendant(node => node.class.includes('pen'));
  },

  removePen() {
    const pen = this.findPen();

    if (pen) {
      pen.class = pen.class.remove('pen');
      this.removePenTip();
    }
  },

  findPenTip() {
    return this.findDescendant(node => node.class.includes('tip'));
  },

  removePenTip() {
    const penTip = this.findPenTip();

    if (penTip) {
      penTip.class = penTip.class.remove('tip');
      penTip.parent.class = penTip.parent.class.remove('containsTip');
    }
  },

  findFrontier() {
    return this.findDescendants(node => node.class.includes('frontier'));
  },

  removeFrontier() {
    for (let node of this.findFrontier()) {
      node.class = node.class.remove('frontier');
    }
  },

  updateFrontier() {
    this.removeFrontier();

    if (this.findSelection() && this.findSelection() !== this) {
      const selected = this.findSelection();
      selected.class = selected.class.add('frontier');

      let node = selected;

      do {
        for (let sibling of node.siblings) {
          sibling.class = sibling.class.add('frontier');
        }
        node = node.parent;
      } while (node.parent.type !== types.DOC);
    } else {
      for (let child of this.children) {
        child.class = child.class.add('frontier');
      }
    }
  },

  updateBounds(graphicsNode) {
    for (let child of graphicsNode.children) {
      child.computeBounds();
    }

    for (let ancestor of graphicsNode.shapeOrGroupAncestors) {
      ancestor.computeBounds();
    }
  },

  setCursor(input, stateDescription) {
    const mode = stateDescription.mode;
    const label = stateDescription.label;
    const update = stateDescription.update;
    const inputType = input.type;
    const inputTarget = input.target;

    if (mode === 'pen') {
      this.activateCursor('penCursor');
    }

    if (mode === 'select' && label === 'idle' && inputType === 'mousemove') {
      switch (inputTarget) {
        case 'dot':
          this.activateCursor('rotationCursor');
          break;
        case 'nw-corner':
          this.activateCursor('scaleCursorSE');
          break;
        case 'se-corner':
          this.activateCursor('scaleCursorSE');
          break;
        case 'ne-corner':
          this.activateCursor('scaleCursorNE');
          break;
        case 'sw-corner':
          this.activateCursor('scaleCursorNE');
          break;
        case 'group':
          // only visualize group as shiftable if "closed":
          const node = this.findDescendantByKey(input.key);
          if (node && node.class.includes('focus')) {
            this.activateCursor('shiftableCursor');
          } else {
            this.activateCursor('selectCursor');
          }
          break;
        case 'shape':
          this.activateCursor('shiftableCursor');
          break;
        case 'curve':
          this.activateCursor('shiftableCursor');
          break;
        case 'canvas':
          this.activateCursor('selectCursor');
          break;
      }
    }

    // two special cases:

    // shift/shiftable cursors:
    if (update === 'select') {
      this.activateCursor('shiftCursor');
    } else if (this.cursor === 'shiftCursor' && update === 'release') {
      this.activateCursor('shiftableCursor');
    }

    // escape from penMode (need selectCursor *immediately*):
    if (input.target === 'esc') {
      this.activateCursor('selectCursor');
    }
  },

  activateCursor(cursorName) {
    this.class = this.class.remove(this.cursor).add(cursorName);
    this.cursor = cursorName;
  },

  mountShape() {
    const shape = Shape$$1.create();
    this.mount(shape);
    return shape;
  },

  toTags() {
    const open = Line$$1.create({ indent: 0 }).mount(
      Token$$1.create({
        markup: `<svg xmlns="${
          this.xmlns
        }" viewBox="${this.viewBox.toString()}">`,
        key: this.key,
      })
    );

    const close = Line$$1.create({ indent: 0 }).mount(
      Token$$1.create({
        markup: '</svg>',
        key: this.key,
      })
    );

    return () => {
      return MarkupRoot$$1.create().mount(
        open,
        ...this.children.flatMap(child => child.tags()),
        close
      );
    };
  },

  toComponent() {
    const canvas = comps$$1.canvas(this);

    return () => {
      canvas.children = this.children.map(child => child.renderElement());
      return canvas;
    };
  },

  renderTags() {
    return this.tags(); // TODO: tags is an odd name for a *function* that returns tags!
  },
});

const Group$$1 = Object.create(GraphicsNode$$1);

Object.assign(Group$$1, {
  create(opts = {}) {
    return GraphicsNode$$1.create
      .bind(this)()
      .set({ type: types.GROUP })
      .set(opts);
  },

  toTags(level) {
    let openMarkup;
    if (this.transform) {
      openMarkup = `<g transform="${this.transform.toString()}">`;
    } else {
      openMarkup = `<g>`;
    }

    const open = Line$$1.create({ indent: this.height }).mount(
      Token$$1.create({
        markup: openMarkup,
        key: this.key,
        class: this.class,
      })
    );

    const close = Line$$1.create({ indent: this.height }).mount(
      Token$$1.create({
        markup: '</g>',
        key: this.key,
        class: this.class,
      })
    );

    return () => [open, ...this.children.flatMap(child => child.tags()), close];
  },

  toComponent() {
    const wrapper = comps$$1.wrapper(this);
    const group = comps$$1.group(this);
    const outerUI = comps$$1.outerUI(this);
    wrapper.children.push(group);
    wrapper.children.push(outerUI);

    return () => {
      group.children = this.children.map(child => child.renderElement());
      return wrapper;
    };
  },
});

const Shape$$1 = Object.create(GraphicsNode$$1);
Shape$$1.defineProps(['fill', 'stroke', 'splitter']);

Object.assign(Shape$$1, {
  create(opts = {}) {
    return GraphicsNode$$1.create
      .bind(this)()
      .set({
        type: types.SHAPE,
        splitter: Vector$$1.create(-1000, -1000),
        fill: 'none', // TODO: extract to constant
        stroke: '#000', // TODO: extract to constant
      })
      .set(opts);
  },

  mountSpline() {
    const spline = Spline$$1.create();
    this.mount(spline);
    return spline;
  },

  toPathString() {
    let commands = [];

    for (let spline of this.children) {
      commands.push(
        spline.commands().map(command =>
          command
            .map(part => (Array.isArray(part) ? part[0] : part))
            // ^ TODO: refactor to use object instead of array
            .join(' ')
        )
      );
    }

    const pathString = commands.map(command => command.join(' ')).join(' ');

    return pathString;
  },

  // TODO: refactor
  toTags() {
    const open = [];

    open.push(
      Line$$1.create({ indent: this.height }).mount(
        Token$$1.create({
          markup: '<path',
          key: this.key,
          class: this.class,
        })
      )
    );

    open.push(
      Line$$1.create({ indent: this.height + 1 }).mount(
        Token$$1.create({
          markup: `fill="${this.fill}" stroke="${this.stroke}"`,
        })
      )
    );

    open.push(
      Line$$1.create({ indent: this.height + 1 }).mount(
        Token$$1.create({
          markup: 'd="',
        })
      )
    );

    for (let spline of this.children) {
      const commands = spline.commands();

      for (let command of commands) {
        const indent = this.height + 2;

        const line = Line$$1.create({ indent: indent }).mount(
          Token$$1.create({
            markup: command[0],
          })
        );

        for (let i = 1; i < command.length; i += 1) {
          line.mount(
            Token$$1.create({
              markup: command[i][0],
              key: command[i][1], // will be undefined for Z command
              class: command[i][2], // will be undefined for Z command
            })
          );
        }

        open.push(line);
      }
    }

    open.push(
      Line$$1.create({ indent: this.height + 1 }).mount(
        Token$$1.create({
          markup: '"',
        })
      )
    );

    if (this.transform) {
      open.push(
        Line$$1.create({ indent: this.height + 1 }).mount(
          Token$$1.create({
            markup: `transform="${this.transform.toString()}"`,
          })
        )
      );
    }

    open.push(
      Line$$1.create({ indent: this.height }).mount(Token$$1.create({ markup: '/>' }))
    );

    return () => open;
  },

  toComponent() {
    const wrapper = comps$$1.wrapper(this);
    const curves = comps$$1.curves(this);
    const segments = comps$$1.segments(this);
    const outerUI = comps$$1.outerUI(this);

    wrapper.children.push(curves);
    wrapper.children.push(segments);
    wrapper.children.push(outerUI);

    return () => wrapper;
  },
});

const Spline$$1 = Object.create(SceneNode$$1);
Spline$$1.defineProps(['closed']);

Object.defineProperty(Spline$$1, 'bounds', {
  get() {
    return this.props.bounds || this.computeBounds();
  },

  set(value) {
    this.props.bounds = value;
  },
});

Object.assign(Spline$$1, {
  create(opts = {}) {
    return SceneNode$$1.create
      .bind(this)()
      .set({
        type: types.SPLINE,
        closed: false,
      })
      .set(opts);
  },

  mountSegment() {
    const segment = Segment$$1.create();
    this.mount(segment);
    return segment;
  },

  close() {
    this.closed = true;
  },

  open() {
    this.closed = false;
  },

  isClosed() {
    return this.closed === true;
  },

  curves() {
    const theCurves = [];

    switch (this.children.length) {
      case 1:
        theCurves.push(
          Curve$$1.createFromSegments(this.children[0], Segment$$1.create())
        );
        break;

      default:
        for (let i = 0; i + 1 < this.children.length; i += 1) {
          theCurves.push(
            Curve$$1.createFromSegments(this.children[i], this.children[i + 1])
          );
        }

        if (this.isClosed()) {
          theCurves.push(
            Curve$$1.createFromSegments(
              this.children[this.children.length - 1],
              this.children[0]
            )
          );
        }
    }

    return theCurves;
  },

  commands() {
    const commands = [];

    commands.push(this.command(this.children[0])); // 'M' command

    for (let i = 1; i < this.children.length; i += 1) {
      commands.push(this.command(this.children[i - 1], this.children[i]));
    }

    if (this.isClosed()) {
      commands.push(
        this.command(this.children[this.children.length - 1], this.children[0])
      );

      commands.push(this.command()); // 'Z' command
    }

    return commands;
  },

  command(fromSegment, toSegment) {
    const command = [];

    if (fromSegment && toSegment) {
      if (fromSegment.handleOut && toSegment.handleIn) {
        command.push('C');
      } else if (fromSegment.handleOut || toSegment.handleIn) {
        command.push('Q');
      } else {
        command.push('L');
      }

      if (fromSegment.handleOut) {
        command.push([
          fromSegment.handleOut.toString(),
          fromSegment.handleOut.key,
          fromSegment.handleOut.class,
        ]);
      }

      if (toSegment.handleIn) {
        command.push([
          toSegment.handleIn.toString(),
          toSegment.handleIn.key,
          toSegment.handleIn.class,
        ]);
      }

      command.push([
        toSegment.anchor.toString(),
        toSegment.anchor.key,
        toSegment.anchor.class,
      ]);
    } else if (fromSegment) {
      command.push('M');
      command.push([
        this.children[0].anchor.toString(),
        this.children[0].anchor.key,
        this.children[0].anchor.class,
      ]);
    } else {
      command.push('Z');
    }

    return command;
  },

  computeBounds() {
    const curves = this.curves();
    let bounds;

    // TODO: make a switch statement

    // no curves
    if (curves.length === 0) {
      bounds = Rectangle$$1.create();
      this.bounds = bounds;
      return bounds;
    }

    // a single, degenerate curve
    if (curves.length === 1 && curves[0].isDegenerate()) {
      bounds = Rectangle$$1.create();
      this.bounds = bounds;
      return bounds;
    }

    // one or more (non-degenerate) curves
    bounds = curves[0] && curves[0].bounds; // computed by Bezier plugin

    for (let i = 1; i < curves.length; i += 1) {
      const curveBounds = curves[i].bounds;
      bounds = bounds.getBoundingRect(curveBounds);
    }

    this.bounds = bounds;
    return bounds;
  },
});

const Segment$$1 = Object.create(SceneNode$$1);

Object.assign(Segment$$1, {
  create(opts = {}) {
    return SceneNode$$1.create
      .bind(this)()
      .set({ type: types.SEGMENT })
      .set(opts);
  },

  mountAnchor(vector) {
    const anchor = Anchor$$1.create();
    anchor.vector = vector;
    this.mount(anchor);
    return anchor;
  },

  mountHandleIn(vector) {
    const handleIn = HandleIn$$1.create();
    handleIn.vector = vector;
    this.mount(handleIn);
    return handleIn;
  },

  mountHandleOut(vector) {
    const handleOut = HandleOut$$1.create();
    handleOut.vector = vector;
    this.mount(handleOut);
    return handleOut;
  },
});

Object.defineProperty(Segment$$1, 'anchor', {
  get() {
    return this.children.find(child => child.type === types.ANCHOR);
  },
});

Object.defineProperty(Segment$$1, 'handleIn', {
  get() {
    return this.children.find(child => child.type === types.HANDLEIN);
  },
});

Object.defineProperty(Segment$$1, 'handleOut', {
  get() {
    return this.children.find(child => child.type === types.HANDLEOUT);
  },
});

const ControlNode$$1 = SceneNode$$1.create();
ControlNode$$1.defineProps(['vector']);

Object.assign(ControlNode$$1, {
  placePenTip() {
    this.canvas.removePenTip();
    this.class = this.class.add('tip');
    this.parent.class = this.parent.class.add('containsTip');
  },

  toString() {
    return this.vector.toString();
  },

  enclosingShape() {
    return this.parent && this.parent.parent && this.parent.parent.parent;
  },
});

const Anchor$$1 = Object.create(ControlNode$$1);

Object.assign(Anchor$$1, {
  create(opts = {}) {
    return ControlNode$$1.create
      .bind(this)()
      .set({ type: types.ANCHOR })
      .set(opts);
  },
});

const HandleIn$$1 = Object.create(ControlNode$$1);

Object.assign(HandleIn$$1, {
  create(opts = {}) {
    return ControlNode$$1.create
      .bind(this)()
      .set({ type: types.HANDLEIN })
      .set(opts);
  },
});

const HandleOut$$1 = Object.create(ControlNode$$1);

Object.assign(HandleOut$$1, {
  create(opts = {}) {
    return ControlNode$$1.create
      .bind(this)()
      .set({ type: types.HANDLEOUT })
      .set(opts);
  },
});

const Doc$$1 = Object.create(Node$$1);
Doc$$1.defineProps(['_id', 'canvasWidth']);

Object.assign(Doc$$1, {
  create(opts = {}) {
    return Node$$1.create
      .bind(this)()
      .set({
        type: types.DOC,
        _id: createID(),
      })
      .set(opts);
  },
});

const Editor$$1 = Object.create(Node$$1);

Object.assign(Editor$$1, {
  create(opts = {}) {
    return Node$$1.create
      .bind(this)()
      .set({ type: types.EDITOR })
      .set(opts);
  },
});

Object.defineProperty(Editor$$1, 'message', {
  get() {
    return this.root.findDescendant(node => node.type === types.MESSAGE);
  },
});

Object.defineProperty(Editor$$1, 'canvas', {
  get() {
    return this.root.findDescendant(node => node.type === types.CANVAS);
  },
});

Object.defineProperty(Editor$$1, 'tools', {
  get() {
    return this.root.findDescendant(node => node.type === types.TOOLS);
  },
});

Object.defineProperty(Editor$$1, 'docs', {
  get() {
    return this.root.findDescendant(node => node.type === types.DOCS);
  },
});

Object.defineProperty(Editor$$1, 'doc', {
  get() {
    return this.root.findDescendant(node => node.type === types.DOC);
  },
});

const Docs$$1 = Object.create(Node$$1);

Object.assign(Docs$$1, {
  create(opts = {}) {
    return Node$$1.create
      .bind(this)()
      .set({
        type: types.DOCS,
      })
      .set(opts);
  },

  setActiveStatus(id) {
    for (let child of this.children) {
      child.deactivate();
    }

    const toActivate = this.children.find(child => child._id === id);

    if (toActivate) {
      toActivate.activate();
    }
  },
});

const Message$$1 = Object.create(Node$$1);
Message$$1.defineProps(['text']);

Object.assign(Message$$1, {
  create(opts = {}) {
    return Node$$1.create
      .bind(this)()
      .set({ type: types.MESSAGE })
      .set(opts);
  },
});

const Identifier$$1 = Object.create(Node$$1);
Identifier$$1.defineProps(['_id']);

Object.assign(Identifier$$1, {
  create(opts = {}) {
    return Node$$1.create
      .bind(this)()
      .set({ type: types.IDENTIFIER })
      .set(opts);
  },

  activate() {
    this.class = this.class.add('active');
  },

  deactivate() {
    this.class = this.class.remove('active');
  },
});

const MarkupNode$$1 = Object.create(Node$$1);

Object.assign(MarkupNode$$1, {
  create(opts = {}) {
    return Node$$1.create
      .bind(this)()
      .set(opts);
  },

  toMarkupString() {
    switch (this.type) {
      case types.TOKEN:
        return this.markup;
      case types.LINE:
        return (
          '  '.repeat(this.indent) +
          // TODO: '  ' should be extracted to constant ('unitPad')
          this.children.map(node => node.toMarkupString()).join(' ')
        );
      case types.MARKUPROOT:
        return (
          this.children.map(node => node.toMarkupString()).join('\n') + '\n' // <= here, we insert trailing newline!
        );
    }
  },
});

const MarkupRoot$$1 = Object.create(MarkupNode$$1);

Object.assign(MarkupRoot$$1, {
  create(opts = {}) {
    return MarkupNode$$1.create
      .bind(this)()
      .set({ type: types.MARKUPROOT })
      .set(opts);
  },

  findTokenByPosition(position) {
    const lineNode = this.children[position.line];
    return lineNode.findTokenByCharIndex(position.ch - lineNode.indent * 2);
    // ^ TODO: magic number represents "unitPad" for indentation
  },
});

const Line$$1 = Object.create(MarkupNode$$1);
Line$$1.defineProps(['indent']);

Object.assign(Line$$1, {
  create(opts = {}) {
    return MarkupNode$$1.create
      .bind(this)()
      .set({ type: types.LINE })
      .set(opts);
  },

  findTokenByCharIndex(ch) {
    let index = 0;

    for (let token of this.children) {
      const start = index;
      const end = index + token.markup.length;

      if (start <= ch && ch <= end) {
        return token;
      }

      index = end + 1;
    }
  },
});

const Token$$1 = Object.create(MarkupNode$$1);
Token$$1.defineProps(['markup']);

Object.assign(Token$$1, {
  create(opts = {}) {
    return MarkupNode$$1.create
      .bind(this)()
      .set({ type: types.TOKEN })
      .set(opts);
  },

  getRange() {
    const lineNode = this.parent;
    const rootNode = lineNode.parent;

    const line = rootNode.children.indexOf(lineNode);
    const tokenIndex = lineNode.children.indexOf(this);

    const start =
      lineNode.children
        .slice(0, tokenIndex)
        .reduce((sum, node) => sum + node.markup.length, 0) +
      tokenIndex +
      lineNode.indent * 2;
    // ^ TODO: magic number representing unitPad length

    const from = {
      line: line,
      ch: start,
    };

    const to = {
      line: line,
      ch: start + this.markup.length,
    };

    return [from, to];
  },
});

const Tools$$1 = Object.create(Node$$1);

Object.assign(Tools$$1, {
  create(opts = {}) {
    return Node$$1.create
      .bind(this)()
      .set({
        type: types.TOOLS,
      })
      .set(opts);
  },

  setActiveStatus(stateDescription) {
    for (let child of this.children) {
      child.deactivate();
    }

    switch (stateDescription.mode) {
      case 'pen':
        this.pen.activate();
        break;
      case 'select':
        this.select.activate();
        break;
    }

    if (stateDescription.layout.menuVisible) {
      this.open.activate();
    }
  },
});

Object.defineProperty(Tools$$1, 'pen', {
  get() {
    return this.children[0];
  },
});

Object.defineProperty(Tools$$1, 'select', {
  get() {
    return this.children[1];
  },
});

Object.defineProperty(Tools$$1, 'open', {
  get() {
    return this.children[5];
  },
});

const Tool$$1 = Object.create(Node$$1);
Tool$$1.defineProps(['name', 'iconPath', 'toolType']);

Object.assign(Tool$$1, {
  create(opts = {}) {
    return Node$$1.create
      .bind(this)()
      .set({
        type: types.Tool,
      })
      .set(opts);
  },

  activate() {
    this.class = this.class.add('active');
  },

  deactivate() {
    this.class = this.class.remove('active');
  },
});

const docToObject = doc => {
  return {
    doc: JSON.parse(JSON.stringify(doc)),
  };
};

const nodeProtos = {
  Editor: Editor$$1,
  Docs: Docs$$1,
  Doc: Doc$$1,
  Message: Message$$1,
  Canvas: Canvas$$1,
  Shape: Shape$$1,
  Group: Group$$1,
  Spline: Spline$$1,
  Segment: Segment$$1,
  Anchor: Anchor$$1,
  HandleIn: HandleIn$$1,
  HandleOut: HandleOut$$1,
};

const objectToDoc = object => {
  const node = nodeProtos[capitalize(object.type)].create();
  node.type = object.type;
  setProps(node, object);

  for (let child of object.children) {
    node.mount(objectToDoc(child));
  }

  return node;
};

const setProps = (node, object) => {
  for (let [key, value] of Object.entries(object.props)) {
    switch (key) {
      case 'viewBox':
        node.viewBox = Rectangle$$1.createFromObject(value);
        break;
      case 'transform':
        node.transform = Matrix$$1.create(value);
        break;
      case 'class':
        node.class = Class.create(value);
        break;
      case 'text':
        node.text = value;
        break;
      case 'bounds':
        if (value) {
          node.bounds = Rectangle$$1.createFromObject(value);
        }
        break;
      case 'vector':
        node.vector = Vector$$1.createFromObject(value);
        break;
      default:
        node[key] = value;
    }
  }
};

const capitalize = string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

var extendStatics=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,a){t.__proto__=a;}||function(t,a){for(var r in a)a.hasOwnProperty(r)&&(t[r]=a[r]);};function __extends(t,a){function r(){this.constructor=t;}extendStatics(t,a),t.prototype=null===a?Object.create(a):(r.prototype=a.prototype,new r);}function rotate$2(t,a){var r=t[0],e=t[1];return [r*Math.cos(a)-e*Math.sin(a),r*Math.sin(a)+e*Math.cos(a)]}function assertNumbers(){for(var t=[],a=0;a<arguments.length;a++)t[a]=arguments[a];for(var r=0;r<t.length;r++)if("number"!=typeof t[r])throw new Error("assertNumbers arguments["+r+"] is not a number. "+typeof t[r]+" == typeof "+t[r]);return !0}var PI=Math.PI;function annotateArcCommand(t,a,r){t.lArcFlag=0===t.lArcFlag?0:1,t.sweepFlag=0===t.sweepFlag?0:1;var e=t.rX,n=t.rY,i=t.x,o=t.y;e=Math.abs(t.rX),n=Math.abs(t.rY);var s=rotate$2([(a-i)/2,(r-o)/2],-t.xRot/180*PI),h=s[0],u=s[1],c=Math.pow(h,2)/Math.pow(e,2)+Math.pow(u,2)/Math.pow(n,2);1<c&&(e*=Math.sqrt(c),n*=Math.sqrt(c)),t.rX=e,t.rY=n;var m=Math.pow(e,2)*Math.pow(u,2)+Math.pow(n,2)*Math.pow(h,2),_=(t.lArcFlag!==t.sweepFlag?1:-1)*Math.sqrt(Math.max(0,(Math.pow(e,2)*Math.pow(n,2)-m)/m)),T=e*u/n*_,O=-n*h/e*_,p=rotate$2([T,O],t.xRot/180*PI);t.cX=p[0]+(a+i)/2,t.cY=p[1]+(r+o)/2,t.phi1=Math.atan2((u-O)/n,(h-T)/e),t.phi2=Math.atan2((-u-O)/n,(-h-T)/e),0===t.sweepFlag&&t.phi2>t.phi1&&(t.phi2-=2*PI),1===t.sweepFlag&&t.phi2<t.phi1&&(t.phi2+=2*PI),t.phi1*=180/PI,t.phi2*=180/PI;}function intersectionUnitCircleLine(t,a,r){assertNumbers(t,a,r);var e=t*t+a*a-r*r;if(0>e)return [];if(0===e)return [[t*r/(t*t+a*a),a*r/(t*t+a*a)]];var n=Math.sqrt(e);return [[(t*r+a*n)/(t*t+a*a),(a*r-t*n)/(t*t+a*a)],[(t*r-a*n)/(t*t+a*a),(a*r+t*n)/(t*t+a*a)]]}var SVGPathDataTransformer,DEG=Math.PI/180;function lerp$1(t,a,r){return (1-r)*t+r*a}function arcAt(t,a,r,e){return t+Math.cos(e/180*PI)*a+Math.sin(e/180*PI)*r}function bezierRoot(t,a,r,e){var n=a-t,i=r-a,o=3*n+3*(e-r)-6*i,s=6*(i-n),h=3*n;return Math.abs(o)<1e-6?[-h/s]:pqFormula(s/o,h/o,1e-6)}function bezierAt(t,a,r,e,n){var i=1-n;return t*(i*i*i)+a*(3*i*i*n)+r*(3*i*n*n)+e*(n*n*n)}function pqFormula(t,a,r){void 0===r&&(r=1e-6);var e=t*t/4-a;if(e<-r)return [];if(e<=r)return [-t/2];var n=Math.sqrt(e);return [-t/2-n,-t/2+n]}function a2c(t,a,r){var e,n,i,o;t.cX||annotateArcCommand(t,a,r);for(var s=Math.min(t.phi1,t.phi2),h=Math.max(t.phi1,t.phi2)-s,u=Math.ceil(h/90),c=new Array(u),m=a,_=r,T=0;T<u;T++){var O=lerp$1(t.phi1,t.phi2,T/u),p=lerp$1(t.phi1,t.phi2,(T+1)/u),y=p-O,S=4/3*Math.tan(y*DEG/4),f=[Math.cos(O*DEG)-S*Math.sin(O*DEG),Math.sin(O*DEG)+S*Math.cos(O*DEG)],V=f[0],N=f[1],D=[Math.cos(p*DEG),Math.sin(p*DEG)],P=D[0],l=D[1],v=[P+S*Math.sin(p*DEG),l-S*Math.cos(p*DEG)],E=v[0],A=v[1];c[T]={relative:t.relative,type:SVGPathData.CURVE_TO};var d=function(a,r){var e=rotate$2([a*t.rX,r*t.rY],t.xRot),n=e[0],i=e[1];return [t.cX+n,t.cY+i]};e=d(V,N),c[T].x1=e[0],c[T].y1=e[1],n=d(E,A),c[T].x2=n[0],c[T].y2=n[1],i=d(P,l),c[T].x=i[0],c[T].y=i[1],t.relative&&(c[T].x1-=m,c[T].y1-=_,c[T].x2-=m,c[T].y2-=_,c[T].x-=m,c[T].y-=_),m=(o=[c[T].x,c[T].y])[0],_=o[1];}return c}!function(t){function a(){return n(function(t,a,r){return t.relative&&(void 0!==t.x1&&(t.x1+=a),void 0!==t.y1&&(t.y1+=r),void 0!==t.x2&&(t.x2+=a),void 0!==t.y2&&(t.y2+=r),void 0!==t.x&&(t.x+=a),void 0!==t.y&&(t.y+=r),t.relative=!1),t})}function r(){var t=NaN,a=NaN,r=NaN,e=NaN;return n(function(n,i,o){return n.type&SVGPathData.SMOOTH_CURVE_TO&&(n.type=SVGPathData.CURVE_TO,t=isNaN(t)?i:t,a=isNaN(a)?o:a,n.x1=n.relative?i-t:2*i-t,n.y1=n.relative?o-a:2*o-a),n.type&SVGPathData.CURVE_TO?(t=n.relative?i+n.x2:n.x2,a=n.relative?o+n.y2:n.y2):(t=NaN,a=NaN),n.type&SVGPathData.SMOOTH_QUAD_TO&&(n.type=SVGPathData.QUAD_TO,r=isNaN(r)?i:r,e=isNaN(e)?o:e,n.x1=n.relative?i-r:2*i-r,n.y1=n.relative?o-e:2*o-e),n.type&SVGPathData.QUAD_TO?(r=n.relative?i+n.x1:n.x1,e=n.relative?o+n.y1:n.y1):(r=NaN,e=NaN),n})}function e(){var t=NaN,a=NaN;return n(function(r,e,n){if(r.type&SVGPathData.SMOOTH_QUAD_TO&&(r.type=SVGPathData.QUAD_TO,t=isNaN(t)?e:t,a=isNaN(a)?n:a,r.x1=r.relative?e-t:2*e-t,r.y1=r.relative?n-a:2*n-a),r.type&SVGPathData.QUAD_TO){t=r.relative?e+r.x1:r.x1,a=r.relative?n+r.y1:r.y1;var i=r.x1,o=r.y1;r.type=SVGPathData.CURVE_TO,r.x1=((r.relative?0:e)+2*i)/3,r.y1=((r.relative?0:n)+2*o)/3,r.x2=(r.x+2*i)/3,r.y2=(r.y+2*o)/3;}else t=NaN,a=NaN;return r})}function n(t){var a=0,r=0,e=NaN,n=NaN;return function(i){if(isNaN(e)&&!(i.type&SVGPathData.MOVE_TO))throw new Error("path must start with moveto");var o=t(i,a,r,e,n);return i.type&SVGPathData.CLOSE_PATH&&(a=e,r=n),void 0!==i.x&&(a=i.relative?a+i.x:i.x),void 0!==i.y&&(r=i.relative?r+i.y:i.y),i.type&SVGPathData.MOVE_TO&&(e=a,n=r),o}}function i(t,a,r,e,i,o){return assertNumbers(t,a,r,e,i,o),n(function(n,s,h,u){var c=n.x1,m=n.x2,_=n.relative&&!isNaN(u),T=void 0!==n.x?n.x:_?0:s,O=void 0!==n.y?n.y:_?0:h;function p(t){return t*t}n.type&SVGPathData.HORIZ_LINE_TO&&0!==a&&(n.type=SVGPathData.LINE_TO,n.y=n.relative?0:h),n.type&SVGPathData.VERT_LINE_TO&&0!==r&&(n.type=SVGPathData.LINE_TO,n.x=n.relative?0:s),void 0!==n.x&&(n.x=n.x*t+O*r+(_?0:i)),void 0!==n.y&&(n.y=T*a+n.y*e+(_?0:o)),void 0!==n.x1&&(n.x1=n.x1*t+n.y1*r+(_?0:i)),void 0!==n.y1&&(n.y1=c*a+n.y1*e+(_?0:o)),void 0!==n.x2&&(n.x2=n.x2*t+n.y2*r+(_?0:i)),void 0!==n.y2&&(n.y2=m*a+n.y2*e+(_?0:o));var y=t*e-a*r;if(void 0!==n.xRot&&(1!==t||0!==a||0!==r||1!==e))if(0===y)delete n.rX,delete n.rY,delete n.xRot,delete n.lArcFlag,delete n.sweepFlag,n.type=SVGPathData.LINE_TO;else{var S=n.xRot*Math.PI/180,f=Math.sin(S),V=Math.cos(S),N=1/p(n.rX),D=1/p(n.rY),P=p(V)*N+p(f)*D,l=2*f*V*(N-D),v=p(f)*N+p(V)*D,E=P*e*e-l*a*e+v*a*a,A=l*(t*e+a*r)-2*(P*r*e+v*t*a),d=P*r*r-l*t*r+v*t*t,G=(Math.atan2(A,E-d)+Math.PI)%Math.PI/2,C=Math.sin(G),x=Math.cos(G);n.rX=Math.abs(y)/Math.sqrt(E*p(x)+A*C*x+d*p(C)),n.rY=Math.abs(y)/Math.sqrt(E*p(C)-A*C*x+d*p(x)),n.xRot=180*G/Math.PI;}return void 0!==n.sweepFlag&&0>y&&(n.sweepFlag=+!n.sweepFlag),n})}function o(){return function(t){var a={};for(var r in t)a[r]=t[r];return a}}t.ROUND=function(t){function a(a){return Math.round(a*t)/t}return void 0===t&&(t=1e13),assertNumbers(t),function(t){return void 0!==t.x1&&(t.x1=a(t.x1)),void 0!==t.y1&&(t.y1=a(t.y1)),void 0!==t.x2&&(t.x2=a(t.x2)),void 0!==t.y2&&(t.y2=a(t.y2)),void 0!==t.x&&(t.x=a(t.x)),void 0!==t.y&&(t.y=a(t.y)),t}},t.TO_ABS=a,t.TO_REL=function(){return n(function(t,a,r){return t.relative||(void 0!==t.x1&&(t.x1-=a),void 0!==t.y1&&(t.y1-=r),void 0!==t.x2&&(t.x2-=a),void 0!==t.y2&&(t.y2-=r),void 0!==t.x&&(t.x-=a),void 0!==t.y&&(t.y-=r),t.relative=!0),t})},t.NORMALIZE_HVZ=function(t,a,r){return void 0===t&&(t=!0),void 0===a&&(a=!0),void 0===r&&(r=!0),n(function(e,n,i,o,s){if(isNaN(o)&&!(e.type&SVGPathData.MOVE_TO))throw new Error("path must start with moveto");return a&&e.type&SVGPathData.HORIZ_LINE_TO&&(e.type=SVGPathData.LINE_TO,e.y=e.relative?0:i),r&&e.type&SVGPathData.VERT_LINE_TO&&(e.type=SVGPathData.LINE_TO,e.x=e.relative?0:n),t&&e.type&SVGPathData.CLOSE_PATH&&(e.type=SVGPathData.LINE_TO,e.x=e.relative?o-n:o,e.y=e.relative?s-i:s),e.type&SVGPathData.ARC&&(0===e.rX||0===e.rY)&&(e.type=SVGPathData.LINE_TO,delete e.rX,delete e.rY,delete e.xRot,delete e.lArcFlag,delete e.sweepFlag),e})},t.NORMALIZE_ST=r,t.QT_TO_C=e,t.INFO=n,t.SANITIZE=function(t){void 0===t&&(t=0),assertNumbers(t);var a=NaN,r=NaN,e=NaN,i=NaN;return n(function(n,o,s,h,u){var c=Math.abs,m=!1,_=0,T=0;if(n.type&SVGPathData.SMOOTH_CURVE_TO&&(_=isNaN(a)?0:o-a,T=isNaN(r)?0:s-r),n.type&(SVGPathData.CURVE_TO|SVGPathData.SMOOTH_CURVE_TO)?(a=n.relative?o+n.x2:n.x2,r=n.relative?s+n.y2:n.y2):(a=NaN,r=NaN),n.type&SVGPathData.SMOOTH_QUAD_TO?(e=isNaN(e)?o:2*o-e,i=isNaN(i)?s:2*s-i):n.type&SVGPathData.QUAD_TO?(e=n.relative?o+n.x1:n.x1,i=n.relative?s+n.y1:n.y2):(e=NaN,i=NaN),n.type&SVGPathData.LINE_COMMANDS||n.type&SVGPathData.ARC&&(0===n.rX||0===n.rY||!n.lArcFlag)||n.type&SVGPathData.CURVE_TO||n.type&SVGPathData.SMOOTH_CURVE_TO||n.type&SVGPathData.QUAD_TO||n.type&SVGPathData.SMOOTH_QUAD_TO){var O=void 0===n.x?0:n.relative?n.x:n.x-o,p=void 0===n.y?0:n.relative?n.y:n.y-s;_=isNaN(e)?void 0===n.x1?_:n.relative?n.x:n.x1-o:e-o,T=isNaN(i)?void 0===n.y1?T:n.relative?n.y:n.y1-s:i-s;var y=void 0===n.x2?0:n.relative?n.x:n.x2-o,S=void 0===n.y2?0:n.relative?n.y:n.y2-s;c(O)<=t&&c(p)<=t&&c(_)<=t&&c(T)<=t&&c(y)<=t&&c(S)<=t&&(m=!0);}return n.type&SVGPathData.CLOSE_PATH&&c(o-h)<=t&&c(s-u)<=t&&(m=!0),m?[]:n})},t.MATRIX=i,t.ROTATE=function(t,a,r){void 0===a&&(a=0),void 0===r&&(r=0),assertNumbers(t,a,r);var e=Math.sin(t),n=Math.cos(t);return i(n,e,-e,n,a-a*n+r*e,r-a*e-r*n)},t.TRANSLATE=function(t,a){return void 0===a&&(a=0),assertNumbers(t,a),i(1,0,0,1,t,a)},t.SCALE=function(t,a){return void 0===a&&(a=t),assertNumbers(t,a),i(t,0,0,a,0,0)},t.SKEW_X=function(t){return assertNumbers(t),i(1,0,Math.atan(t),1,0,0)},t.SKEW_Y=function(t){return assertNumbers(t),i(1,Math.atan(t),0,1,0,0)},t.X_AXIS_SYMMETRY=function(t){return void 0===t&&(t=0),assertNumbers(t),i(-1,0,0,1,t,0)},t.Y_AXIS_SYMMETRY=function(t){return void 0===t&&(t=0),assertNumbers(t),i(1,0,0,-1,0,t)},t.A_TO_C=function(){return n(function(t,a,r){return SVGPathData.ARC===t.type?a2c(t,t.relative?0:a,t.relative?0:r):t})},t.ANNOTATE_ARCS=function(){return n(function(t,a,r){return t.relative&&(a=0,r=0),SVGPathData.ARC===t.type&&annotateArcCommand(t,a,r),t})},t.CLONE=o,t.CALCULATE_BOUNDS=function(){var t=function(t){var a={};for(var r in t)a[r]=t[r];return a},i=a(),o=e(),s=r(),h=n(function(a,r,e){var n=s(o(i(t(a))));function u(t){t>h.maxX&&(h.maxX=t),t<h.minX&&(h.minX=t);}function c(t){t>h.maxY&&(h.maxY=t),t<h.minY&&(h.minY=t);}if(n.type&SVGPathData.DRAWING_COMMANDS&&(u(r),c(e)),n.type&SVGPathData.HORIZ_LINE_TO&&u(n.x),n.type&SVGPathData.VERT_LINE_TO&&c(n.y),n.type&SVGPathData.LINE_TO&&(u(n.x),c(n.y)),n.type&SVGPathData.CURVE_TO){u(n.x),c(n.y);for(var m=0,_=bezierRoot(r,n.x1,n.x2,n.x);m<_.length;m++)0<(G=_[m])&&1>G&&u(bezierAt(r,n.x1,n.x2,n.x,G));for(var T=0,O=bezierRoot(e,n.y1,n.y2,n.y);T<O.length;T++)0<(G=O[T])&&1>G&&c(bezierAt(e,n.y1,n.y2,n.y,G));}if(n.type&SVGPathData.ARC){u(n.x),c(n.y),annotateArcCommand(n,r,e);for(var p=n.xRot/180*Math.PI,y=Math.cos(p)*n.rX,S=Math.sin(p)*n.rX,f=-Math.sin(p)*n.rY,V=Math.cos(p)*n.rY,N=n.phi1<n.phi2?[n.phi1,n.phi2]:-180>n.phi2?[n.phi2+360,n.phi1+360]:[n.phi2,n.phi1],D=N[0],P=N[1],l=function(t){var a=t[0],r=t[1],e=180*Math.atan2(r,a)/Math.PI;return e<D?e+360:e},v=0,E=intersectionUnitCircleLine(f,-y,0).map(l);v<E.length;v++)(G=E[v])>D&&G<P&&u(arcAt(n.cX,y,f,G));for(var A=0,d=intersectionUnitCircleLine(V,-S,0).map(l);A<d.length;A++){var G;(G=d[A])>D&&G<P&&c(arcAt(n.cY,S,V,G));}}return a});return h.minX=1/0,h.maxX=-1/0,h.minY=1/0,h.maxY=-1/0,h};}(SVGPathDataTransformer||(SVGPathDataTransformer={}));var _a,_a$1,TransformableSVG=function(){function t(){}return t.prototype.round=function(t){return this.transform(SVGPathDataTransformer.ROUND(t))},t.prototype.toAbs=function(){return this.transform(SVGPathDataTransformer.TO_ABS())},t.prototype.toRel=function(){return this.transform(SVGPathDataTransformer.TO_REL())},t.prototype.normalizeHVZ=function(t,a,r){return this.transform(SVGPathDataTransformer.NORMALIZE_HVZ(t,a,r))},t.prototype.normalizeST=function(){return this.transform(SVGPathDataTransformer.NORMALIZE_ST())},t.prototype.qtToC=function(){return this.transform(SVGPathDataTransformer.QT_TO_C())},t.prototype.aToC=function(){return this.transform(SVGPathDataTransformer.A_TO_C())},t.prototype.sanitize=function(t){return this.transform(SVGPathDataTransformer.SANITIZE(t))},t.prototype.translate=function(t,a){return this.transform(SVGPathDataTransformer.TRANSLATE(t,a))},t.prototype.scale=function(t,a){return this.transform(SVGPathDataTransformer.SCALE(t,a))},t.prototype.rotate=function(t,a,r){return this.transform(SVGPathDataTransformer.ROTATE(t,a,r))},t.prototype.matrix=function(t,a,r,e,n,i){return this.transform(SVGPathDataTransformer.MATRIX(t,a,r,e,n,i))},t.prototype.skewX=function(t){return this.transform(SVGPathDataTransformer.SKEW_X(t))},t.prototype.skewY=function(t){return this.transform(SVGPathDataTransformer.SKEW_Y(t))},t.prototype.xSymmetry=function(t){return this.transform(SVGPathDataTransformer.X_AXIS_SYMMETRY(t))},t.prototype.ySymmetry=function(t){return this.transform(SVGPathDataTransformer.Y_AXIS_SYMMETRY(t))},t.prototype.annotateArcs=function(){return this.transform(SVGPathDataTransformer.ANNOTATE_ARCS())},t}(),isWhiteSpace=function(t){return " "===t||"\t"===t||"\r"===t||"\n"===t},isDigit=function(t){return "0".charCodeAt(0)<=t.charCodeAt(0)&&t.charCodeAt(0)<="9".charCodeAt(0)},SVGPathDataParser$$1=function(t){function a(){var a=t.call(this)||this;return a.curNumber="",a.curCommandType=-1,a.curCommandRelative=!1,a.canParseCommandOrComma=!0,a.curNumberHasExp=!1,a.curNumberHasExpDigits=!1,a.curNumberHasDecimal=!1,a.curArgs=[],a}return __extends(a,t),a.prototype.finish=function(t){if(void 0===t&&(t=[]),this.parse(" ",t),0!==this.curArgs.length||!this.canParseCommandOrComma)throw new SyntaxError("Unterminated command at the path end.");return t},a.prototype.parse=function(t,a){var r=this;void 0===a&&(a=[]);for(var e=function(t){a.push(t),r.curArgs.length=0,r.canParseCommandOrComma=!0;},n=0;n<t.length;n++){var i=t[n];if(isDigit(i))this.curNumber+=i,this.curNumberHasExpDigits=this.curNumberHasExp;else if("e"!==i&&"E"!==i)if("-"!==i&&"+"!==i||!this.curNumberHasExp||this.curNumberHasExpDigits)if("."!==i||this.curNumberHasExp||this.curNumberHasDecimal){if(this.curNumber&&-1!==this.curCommandType){var o=Number(this.curNumber);if(isNaN(o))throw new SyntaxError("Invalid number ending at "+n);if(this.curCommandType===SVGPathData.ARC)if(0===this.curArgs.length||1===this.curArgs.length){if(0>o)throw new SyntaxError('Expected positive number, got "'+o+'" at index "'+n+'"')}else if((3===this.curArgs.length||4===this.curArgs.length)&&"0"!==this.curNumber&&"1"!==this.curNumber)throw new SyntaxError('Expected a flag, got "'+this.curNumber+'" at index "'+n+'"');this.curArgs.push(o),this.curArgs.length===COMMAND_ARG_COUNTS[this.curCommandType]&&(SVGPathData.HORIZ_LINE_TO===this.curCommandType?e({type:SVGPathData.HORIZ_LINE_TO,relative:this.curCommandRelative,x:o}):SVGPathData.VERT_LINE_TO===this.curCommandType?e({type:SVGPathData.VERT_LINE_TO,relative:this.curCommandRelative,y:o}):this.curCommandType===SVGPathData.MOVE_TO||this.curCommandType===SVGPathData.LINE_TO||this.curCommandType===SVGPathData.SMOOTH_QUAD_TO?(e({type:this.curCommandType,relative:this.curCommandRelative,x:this.curArgs[0],y:this.curArgs[1]}),SVGPathData.MOVE_TO===this.curCommandType&&(this.curCommandType=SVGPathData.LINE_TO)):this.curCommandType===SVGPathData.CURVE_TO?e({type:SVGPathData.CURVE_TO,relative:this.curCommandRelative,x1:this.curArgs[0],y1:this.curArgs[1],x2:this.curArgs[2],y2:this.curArgs[3],x:this.curArgs[4],y:this.curArgs[5]}):this.curCommandType===SVGPathData.SMOOTH_CURVE_TO?e({type:SVGPathData.SMOOTH_CURVE_TO,relative:this.curCommandRelative,x2:this.curArgs[0],y2:this.curArgs[1],x:this.curArgs[2],y:this.curArgs[3]}):this.curCommandType===SVGPathData.QUAD_TO?e({type:SVGPathData.QUAD_TO,relative:this.curCommandRelative,x1:this.curArgs[0],y1:this.curArgs[1],x:this.curArgs[2],y:this.curArgs[3]}):this.curCommandType===SVGPathData.ARC&&e({type:SVGPathData.ARC,relative:this.curCommandRelative,rX:this.curArgs[0],rY:this.curArgs[1],xRot:this.curArgs[2],lArcFlag:this.curArgs[3],sweepFlag:this.curArgs[4],x:this.curArgs[5],y:this.curArgs[6]})),this.curNumber="",this.curNumberHasExpDigits=!1,this.curNumberHasExp=!1,this.curNumberHasDecimal=!1,this.canParseCommandOrComma=!0;}if(!isWhiteSpace(i))if(","===i&&this.canParseCommandOrComma)this.canParseCommandOrComma=!1;else if("+"!==i&&"-"!==i&&"."!==i){if(0!==this.curArgs.length)throw new SyntaxError("Unterminated command at index "+n+".");if(!this.canParseCommandOrComma)throw new SyntaxError('Unexpected character "'+i+'" at index '+n+". Command cannot follow comma");if(this.canParseCommandOrComma=!1,"z"!==i&&"Z"!==i)if("h"===i||"H"===i)this.curCommandType=SVGPathData.HORIZ_LINE_TO,this.curCommandRelative="h"===i;else if("v"===i||"V"===i)this.curCommandType=SVGPathData.VERT_LINE_TO,this.curCommandRelative="v"===i;else if("m"===i||"M"===i)this.curCommandType=SVGPathData.MOVE_TO,this.curCommandRelative="m"===i;else if("l"===i||"L"===i)this.curCommandType=SVGPathData.LINE_TO,this.curCommandRelative="l"===i;else if("c"===i||"C"===i)this.curCommandType=SVGPathData.CURVE_TO,this.curCommandRelative="c"===i;else if("s"===i||"S"===i)this.curCommandType=SVGPathData.SMOOTH_CURVE_TO,this.curCommandRelative="s"===i;else if("q"===i||"Q"===i)this.curCommandType=SVGPathData.QUAD_TO,this.curCommandRelative="q"===i;else if("t"===i||"T"===i)this.curCommandType=SVGPathData.SMOOTH_QUAD_TO,this.curCommandRelative="t"===i;else{if("a"!==i&&"A"!==i)throw new SyntaxError('Unexpected character "'+i+'" at index '+n+".");this.curCommandType=SVGPathData.ARC,this.curCommandRelative="a"===i;}else a.push({type:SVGPathData.CLOSE_PATH}),this.canParseCommandOrComma=!0,this.curCommandType=-1;}else this.curNumber=i,this.curNumberHasDecimal="."===i;}else this.curNumber+=i,this.curNumberHasDecimal=!0;else this.curNumber+=i;else this.curNumber+=i,this.curNumberHasExp=!0;}return a},a.prototype.transform=function(t){return Object.create(this,{parse:{value:function(a,r){void 0===r&&(r=[]);for(var e=0,n=Object.getPrototypeOf(this).parse.call(this,a);e<n.length;e++){var i=n[e],o=t(i);Array.isArray(o)?r.push.apply(r,o):r.push(o);}return r}}})},a}(TransformableSVG),SVGPathData=function(t){function a(r){var e=t.call(this)||this;return e.commands="string"==typeof r?a.parse(r):r,e}return __extends(a,t),a.prototype.encode=function(){return a.encode(this.commands)},a.prototype.getBounds=function(){var t=SVGPathDataTransformer.CALCULATE_BOUNDS();return this.transform(t),t},a.prototype.transform=function(t){for(var a=[],r=0,e=this.commands;r<e.length;r++){var n=t(e[r]);Array.isArray(n)?a.push.apply(a,n):a.push(n);}return this.commands=a,this},a.encode=function(t){return encodeSVGPath$$1(t)},a.parse=function(t){var a=new SVGPathDataParser$$1,r=[];return a.parse(t,r),a.finish(r),r},a.CLOSE_PATH=1,a.MOVE_TO=2,a.HORIZ_LINE_TO=4,a.VERT_LINE_TO=8,a.LINE_TO=16,a.CURVE_TO=32,a.SMOOTH_CURVE_TO=64,a.QUAD_TO=128,a.SMOOTH_QUAD_TO=256,a.ARC=512,a.LINE_COMMANDS=a.LINE_TO|a.HORIZ_LINE_TO|a.VERT_LINE_TO,a.DRAWING_COMMANDS=a.HORIZ_LINE_TO|a.VERT_LINE_TO|a.LINE_TO|a.CURVE_TO|a.SMOOTH_CURVE_TO|a.QUAD_TO|a.SMOOTH_QUAD_TO|a.ARC,a}(TransformableSVG),COMMAND_ARG_COUNTS=((_a={})[SVGPathData.MOVE_TO]=2,_a[SVGPathData.LINE_TO]=2,_a[SVGPathData.HORIZ_LINE_TO]=1,_a[SVGPathData.VERT_LINE_TO]=1,_a[SVGPathData.CLOSE_PATH]=0,_a[SVGPathData.QUAD_TO]=4,_a[SVGPathData.SMOOTH_QUAD_TO]=2,_a[SVGPathData.CURVE_TO]=6,_a[SVGPathData.SMOOTH_CURVE_TO]=4,_a[SVGPathData.ARC]=7,_a),WSP=" ";function encodeSVGPath$$1(t){var a="";Array.isArray(t)||(t=[t]);for(var r=0;r<t.length;r++){var e=t[r];if(e.type===SVGPathData.CLOSE_PATH)a+="z";else if(e.type===SVGPathData.HORIZ_LINE_TO)a+=(e.relative?"h":"H")+e.x;else if(e.type===SVGPathData.VERT_LINE_TO)a+=(e.relative?"v":"V")+e.y;else if(e.type===SVGPathData.MOVE_TO)a+=(e.relative?"m":"M")+e.x+WSP+e.y;else if(e.type===SVGPathData.LINE_TO)a+=(e.relative?"l":"L")+e.x+WSP+e.y;else if(e.type===SVGPathData.CURVE_TO)a+=(e.relative?"c":"C")+e.x1+WSP+e.y1+WSP+e.x2+WSP+e.y2+WSP+e.x+WSP+e.y;else if(e.type===SVGPathData.SMOOTH_CURVE_TO)a+=(e.relative?"s":"S")+e.x2+WSP+e.y2+WSP+e.x+WSP+e.y;else if(e.type===SVGPathData.QUAD_TO)a+=(e.relative?"q":"Q")+e.x1+WSP+e.y1+WSP+e.x+WSP+e.y;else if(e.type===SVGPathData.SMOOTH_QUAD_TO)a+=(e.relative?"t":"T")+e.x+WSP+e.y;else{if(e.type!==SVGPathData.ARC)throw new Error('Unexpected command type "'+e.type+'" at index '+r+".");a+=(e.relative?"a":"A")+e.rX+WSP+e.rY+WSP+e.xRot+WSP+ +e.lArcFlag+WSP+ +e.sweepFlag+WSP+e.x+WSP+e.y;}}return a}var SVGPathData$1=function(t){function a(r){var e=t.call(this)||this;return e.commands="string"==typeof r?a.parse(r):r,e}return __extends(a,t),a.prototype.encode=function(){return a.encode(this.commands)},a.prototype.getBounds=function(){var t=SVGPathDataTransformer.CALCULATE_BOUNDS();return this.transform(t),t},a.prototype.transform=function(t){for(var a=[],r=0,e=this.commands;r<e.length;r++){var n=t(e[r]);Array.isArray(n)?a.push.apply(a,n):a.push(n);}return this.commands=a,this},a.encode=function(t){return encodeSVGPath$$1(t)},a.parse=function(t){var a=new SVGPathDataParser$$1,r=[];return a.parse(t,r),a.finish(r),r},a.CLOSE_PATH=1,a.MOVE_TO=2,a.HORIZ_LINE_TO=4,a.VERT_LINE_TO=8,a.LINE_TO=16,a.CURVE_TO=32,a.SMOOTH_CURVE_TO=64,a.QUAD_TO=128,a.SMOOTH_QUAD_TO=256,a.ARC=512,a.LINE_COMMANDS=a.LINE_TO|a.HORIZ_LINE_TO|a.VERT_LINE_TO,a.DRAWING_COMMANDS=a.HORIZ_LINE_TO|a.VERT_LINE_TO|a.LINE_TO|a.CURVE_TO|a.SMOOTH_CURVE_TO|a.QUAD_TO|a.SMOOTH_QUAD_TO|a.ARC,a}(TransformableSVG),COMMAND_ARG_COUNTS$1=((_a$1={})[SVGPathData$1.MOVE_TO]=2,_a$1[SVGPathData$1.LINE_TO]=2,_a$1[SVGPathData$1.HORIZ_LINE_TO]=1,_a$1[SVGPathData$1.VERT_LINE_TO]=1,_a$1[SVGPathData$1.CLOSE_PATH]=0,_a$1[SVGPathData$1.QUAD_TO]=4,_a$1[SVGPathData$1.SMOOTH_QUAD_TO]=2,_a$1[SVGPathData$1.CURVE_TO]=6,_a$1[SVGPathData$1.SMOOTH_CURVE_TO]=4,_a$1[SVGPathData$1.ARC]=7,_a$1);

const markupToCanvas = markup => {
  const $svg = markupToDOM(markup);

  if ($svg) {
    return domToScene($svg);
  } else {
    return null;
  }
};

const markupToDOM = markup => {
  const $svg = new DOMParser().parseFromString(markup, 'image/svg+xml')
    .documentElement;

  if ($svg instanceof SVGElement) {
    return $svg;
  } else {
    return null;
  }
};

const domToScene = $svg => {
  const canvas = Canvas$$1.create();
  buildTree($svg, canvas);
  canvas.updateFrontier();
  return canvas;
};

const buildTree = ($node, node) => {
  processAttributes($node, node);

  const $graphicsChildren = Array.from($node.children).filter($child => {
    return (
      $child instanceof SVGGElement || $child instanceof SVGGeometryElement
    );
  });

  for (let $child of $graphicsChildren) {
    let child;

    if ($child instanceof SVGGElement) {
      child = Group$$1.create();
      node.mount(child);
      buildTree($child, child);
      // ^ the order of the preceding two lines cannot be reversed
      //   if the order is reserved, node heights are set incorrectly
    } else {
      child = buildShapeTree($child);
      node.mount(child);
    }
  }
};

const processAttributes = ($node, node) => {
  // viewBox
  if ($node.tagName === 'svg') {
    const viewBox = $node
      .getAttributeNS(null, 'viewBox')
      .split(' ')
      .map(val => Number(val));
    const origin = Vector$$1.create(viewBox[0], viewBox[1]);
    const size = Vector$$1.create(viewBox[2], viewBox[3]);
    node.viewBox = Rectangle$$1.create(origin, size);
  }

  // transform
  if (
    $node.transform &&
    $node.transform.baseVal &&
    $node.transform.baseVal.consolidate()
  ) {
    const $matrix = $node.transform.baseVal.consolidate().matrix;
    node.transform = Matrix$$1.createFromDOMMatrix($matrix);
  }

  // classes
  node.class = Class.create(Array.from($node.classList));

  // fill
  if ($node.attributes.fill) {
    node.fill = $node.getAttributeNS(null, 'fill');
  }

  // stroke
  if ($node.attributes.stroke) {
    node.stroke = $node.getAttributeNS(null, 'stroke');
  }
};

const buildShapeTree = $geometryNode => {
  const shape = Shape$$1.create();
  processAttributes($geometryNode, shape);

  let pathData;

  switch ($geometryNode.tagName) {
    // TODO: not used
    case 'rect':
      const x = Number($geometryNode.getAttributeNS(null, 'x'));
      const y = Number($geometryNode.getAttributeNS(null, 'y'));
      const width = Number($geometryNode.getAttributeNS(null, 'width'));
      const height = Number($geometryNode.getAttributeNS(null, 'height'));

      pathData = pathDataParser(`
        M ${x} ${y}
        H ${x + width}
        V ${y + height}
        H ${x}
        Z
      `);
      break;
    case 'path':
      pathData = pathDataParser($geometryNode.getAttributeNS(null, 'd'));
      break;
  }

  const pathDataPerSpline = splitPathData(pathData);

  for (let sequence of pathDataPerSpline) {
    const spline = buildSplineTree(sequence);
    shape.mount(spline);
  }

  return shape;
};

const buildSplineTree = pathData => {
  const CLOSE = 1; // NOTE: constant is introduced by svg-pathdata module
  const spline = Spline$$1.create({
    closed: pathData[pathData.length - 1].type === CLOSE,
  });

  const segments = buildSegmentList(pathData, spline);
  for (let segment of segments) {
    spline.mount(segment);
  }

  return spline;
};

const buildSegmentList = (pathData, spline) => {
  const segments = [];

  segments.push(
    Segment$$1.create().mount(
      Anchor$$1.create({
        vector: Vector$$1.create(pathData[0].x, pathData[0].y),
      })
    )
  );

  // the pathData for a closed spline has two additional pathDataItems
  // that we do not wish to add as segments
  const upperBound = spline.isClosed() ? pathData.length - 2 : pathData.length;

  for (let i = 1; i < upperBound; i += 1) {
    segments.push(makeSegment(pathData[i], segments[i - 1]));
  }

  addRotatedHandles(segments);

  return segments;
};

const makeSegment = (pathDataItem, prevSeg) => {
  // structure of pathDataItem (from vendor):
  // (pathDataItem.x, pathDataItem.y) represents anchor
  // (pathDataItem.x1 or x2, pathDataItem.y1 or y2) represent handles

  const currSeg = Segment$$1.create().mount(
    Anchor$$1.create({
      vector: Vector$$1.create(pathDataItem.x, pathDataItem.y),
    })
  );

  if (pathDataItem.x1 && pathDataItem.x2) {
    prevSeg.mount(
      HandleOut$$1.create({
        vector: Vector$$1.create(pathDataItem.x1, pathDataItem.y1),
      })
    );

    currSeg.mount(
      HandleIn$$1.create({
        vector: Vector$$1.create(pathDataItem.x2, pathDataItem.y2),
      })
    );
  } else if (pathDataItem.x1) {
    currSeg.mount(
      HandleIn$$1.create({
        vector: Vector$$1.create(pathDataItem.x1, pathDataItem.y1),
      })
    );
  }

  return currSeg;
};

const addRotatedHandles = segments => {
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  if (firstSegment.handleOut) {
    firstSegment.mount(
      HandleIn$$1.create({
        vector: firstSegment.handleOut.vector.rotate(
          Math.PI,
          firstSegment.anchor.vector
        ),
      })
    );
  }

  if (lastSegment.handleIn) {
    lastSegment.mount(
      HandleOut$$1.create({
        vector: lastSegment.handleIn.vector.rotate(
          Math.PI,
          lastSegment.anchor.vector
        ),
      })
    );
  }
};

const splitPathData = pathData => {
  const MOVE = 2; // NOTE: constant is introduced by svg-pathdata module
  const pathDataLists = [];

  for (let pathDataItem of pathData) {
    if (pathDataItem.type === MOVE) {
      pathDataLists.push([pathDataItem]);
    } else {
      pathDataLists[pathDataLists.length - 1].push(pathDataItem);
    }
  }

  return pathDataLists;
};

const pathDataParser = d => {
  return (
    new SVGPathData$1(d)
      .transform(SVGPathDataTransformer.NORMALIZE_HVZ(false))
      // ^ no H or V shortcuts (but we do use Z, hence the `false`)
      .transform(SVGPathDataTransformer.NORMALIZE_ST()) // no S (smooth multi-Bezier)
      .transform(SVGPathDataTransformer.A_TO_C()) // no A (arcs)
      .toAbs().commands // no relative commands
  );
};

const State = {
  create(canvasWidth) {
    return Object.create(State).init(canvasWidth);
  },

  init(canvasWidth) {
    this.editor = this.buildEditor(canvasWidth);

    this.description = {
      mode: 'start',
      label: undefined,
      input: {},
      update: undefined,
      layout: {
        menuVisible: false,
      },
    };

    this.temp = {};
    this.snapshots = {};

    return this;
  },

  buildEditor(canvasWidth) {
    return Editor$$1.create().mount(
      this.buildDoc(canvasWidth),
      this.buildTools(),
      Docs$$1.create(),
      this.buildMessage()
    );
  },

  buildMessage() {
    return Message$$1.create({ text: 'Welcome!' });
  },

  buildTools() {
    return Tools$$1.create().mount(
      Tool$$1.create({
        name: 'Pen',
        iconPath: '/assets/buttons/pen.svg',
        toolType: 'penButton',
      }),
      Tool$$1.create({
        name: 'Select',
        iconPath: '/assets/buttons/select.svg',
        toolType: 'selectButton',
      }),
      Tool$$1.create({
        name: 'Undo',
        iconPath: '/assets/buttons/undo.svg',
        toolType: 'getPrevious',
      }),
      Tool$$1.create({
        name: 'Redo',
        iconPath: '/assets/buttons/redo.svg',
        toolType: 'getNext',
      }),
      Tool$$1.create({
        name: 'New',
        iconPath: '/assets/buttons/new.svg',
        toolType: 'newDocButton',
      }),
      Tool$$1.create({
        name: 'Open',
        iconPath: '/assets/buttons/open.svg',
        toolType: 'docListButton',
      })
    );
  },

  buildDoc(canvasWidth) {
    return Doc$$1.create({ canvasWidth: canvasWidth }).mount(
      Canvas$$1.create({
        viewBox: Rectangle$$1.createFromDimensions(0, 0, 800, 1600),
      })
    );
  },

  docToObject() {
    return docToObject(this.doc);
  },

  objectToDoc(object) {
    return objectToDoc(object);
  },

  markupToCanvas(markup) {
    return markupToCanvas(markup);
  },

  snapshot(label) {
    if (this.snapshots[label]) {
      return this.snapshots[label];
    }

    // TODO: clean up the structure
    switch (label) {
      case 'vDOM':
        return (this.snapshots['vDOM'] = {
          tools: comps$$1.tools(this.tools),
          menu: comps$$1.menu(this.docs),
          message: this.editor.message.text,
          canvas: this.canvas.renderElement(),
        });
      case 'plain':
        return (this.snapshots['plain'] = this.docToObject());
      case 'markupTree':
        return (this.snapshots['markupTree'] = this.canvas.renderTags());
    }
  },
};

Object.defineProperty(State, 'mode', {
  get() {
    return this.description.mode;
  },

  set(value) {
    this.description.mode = value;
  },
});

Object.defineProperty(State, 'label', {
  get() {
    return this.description.label;
  },

  set(value) {
    this.description.label = value;
  },
});

Object.defineProperty(State, 'input', {
  get() {
    return this.description.input;
  },

  set(value) {
    this.description.input = value;
  },
});

Object.defineProperty(State, 'update', {
  get() {
    return this.description.update;
  },

  set(value) {
    this.description.update = value;
  },
});

Object.defineProperty(State, 'layout', {
  get() {
    return this.description.layout;
  },

  set(value) {
    this.description.layout = value;
  },
});

Object.defineProperty(State, 'canvas', {
  get() {
    return this.editor.canvas;
  },
});

Object.defineProperty(State, 'doc', {
  get() {
    return this.editor.doc;
  },
});

Object.defineProperty(State, 'tools', {
  get() {
    return this.editor.tools;
  },
});

Object.defineProperty(State, 'docs', {
  get() {
    return this.editor.docs;
  },
});

Object.defineProperty(State, 'message', {
  get() {
    return this.editor.message;
  },
});

Object.defineProperty(State, 'target', {
  get() {
    return this.temp.target;
  },

  set(value) {
    this.temp.target = value;
  },
});

Object.defineProperty(State, 'from', {
  get() {
    return this.temp.from;
  },

  set(value) {
    this.temp.from = value;
  },
});

// NOTE:
// mandatory: 'type', `do`
// optional: 'from', 'to', 'target', 'do'

const transitions$$1 = [
  // KICKOFF
  {
    from: { mode: 'start' },
    type: 'go',
    do: 'go',
    to: { mode: 'select', label: 'idle' },
  },

  // RESIZE
  {
    type: 'resize',
    do: 'refresh',
  },

  // TOOLS

  // create new document
  {
    type: 'click',
    target: 'newDocButton',
    do: 'createDoc',
    to: { mode: 'select', label: 'idle' },
  },

  // toggle menu view
  {
    type: 'click',
    target: 'docListButton',
    do: 'toggleMenu',
  },

  // request editor document
  {
    type: 'click',
    target: 'doc-identifier',
    do: 'requestDoc',
  },

  // select button
  {
    type: 'click',
    target: 'selectButton',
    do: 'cleanup',
    to: { mode: 'select', label: 'idle' },
  },

  // s key => switch to select
  {
    type: 'keydown',
    target: 'letterS',
    do: 'cleanup',
    to: { mode: 'select', label: 'idle' },
  },

  // pen button
  {
    type: 'click',
    target: 'penButton',
    do: 'cleanup',
    to: { mode: 'pen', label: 'idle' },
  },

  // v key => switch to pen
  {
    type: 'keydown',
    target: 'letterV',
    do: 'cleanup',
    to: { mode: 'pen', label: 'idle' },
  },

  // trigger undo
  {
    type: 'click',
    target: 'getPrevious',
    do: 'getPrevious',
    to: { mode: 'select', label: 'idle' },
  },

  // trigger redo
  {
    type: 'click',
    target: 'getNext',
    do: 'getNext',
    to: { mode: 'select', label: 'idle' },
  },

  // escape

  {
    type: 'keydown',
    target: 'esc',
    do: 'exitEdit',
  },

  // delete

  {
    type: 'keydown',
    target: 'delete',
    do: 'deleteNode',
  },

  {
    from: { mode: 'pen', label: 'idle' },
    type: 'keydown',
    target: 'letterC',
    do: 'toggleClosedStatus',
  },

  // SELECT MODE

  // focus shape on hover
  {
    from: { mode: 'select', label: 'idle' },
    type: 'mousemove',
    do: 'focus',
  },

  // open a group or shape
  {
    from: { mode: 'select', label: 'idle' },
    type: 'dblclick',
    // target: [types.SEGMENT, types.GROUP, types.CANVAS],  // unnecessary?
    do: 'deepSelect',
  },

  // initiate shift transformation
  {
    from: { mode: 'select', label: 'idle' },
    type: 'mousedown',   // inp
    target: [types.CURVE, types.SHAPE, types.GROUP, types.CANVAS], // inp
    do: 'select',
    to: { mode: 'select', label: 'shifting' },
  },

  // initate rotate transformation
  {
    from: { mode: 'select', label: 'idle' },
    type: 'mousedown',
    target: 'dot',
    do: 'initTransform',
    to: { mode: 'select', label: 'rotating' },
  },

  // initiate scale transformation
  {
    from: { mode: 'select', label: 'idle' },
    type: 'mousedown',
    target: ['nw-corner', 'ne-corner', 'sw-corner', 'se-corner'],
    do: 'initTransform',
    to: { mode: 'select', label: 'scaling' },
  },

  // shift the shape
  {
    from: { mode: 'select', label: 'shifting' },
    type: 'mousemove',
    do: 'shift',
  },

  // finalize shift translation
  {
    from: { mode: 'select', label: 'shifting' },
    type: 'mouseup',
    do: 'release',
    to: { mode: 'select', label: 'idle' },
  },

  // rotate the shape
  {
    from: { mode: 'select', label: 'rotating' },
    type: 'mousemove',
    do: 'rotate',
  },

  // finalize rotate transformation
  {
    from: { mode: 'select', label: 'rotating' },
    type: 'mouseup',
    do: 'release',
    to: { mode: 'select', label: 'idle' },
  },

  // scale the shape
  {
    from: { mode: 'select', label: 'scaling' },
    type: 'mousemove',
    do: 'scale',
  },

  // finalize scale transformation
  {
    from: { mode: 'select', label: 'scaling' },
    type: 'mouseup',
    do: 'release',
    to: { mode: 'select', label: 'idle' },
  },

  // PEN MODE

  // add segment to (current or new) shape
  {
    from: { mode: 'pen', label: 'idle' },
    type: 'mousedown',
    target: [types.SHAPE, types.GROUP, types.CANVAS],
    do: 'addSegment',
    to: { mode: 'pen', label: 'settingHandles' },
  },

  // set handles for current segment
  {
    from: { mode: 'pen', label: 'settingHandles' },
    type: 'mousemove',
    do: 'setHandles',
  },

  // finish up setting handles
  {
    from: { mode: 'pen', label: 'settingHandles' },
    type: 'mouseup',
    do: 'releasePen', // TODO: does nothing (?)
    to: { mode: 'pen', label: 'idle' },
  },

  // initiate adjustment of segment (OR close path)
  {
    from: { mode: 'pen', label: 'idle' },
    type: 'mousedown',
    target: [types.ANCHOR, types.HANDLEIN, types.HANDLEOUT],
    do: 'initAdjustSegment',
    to: { mode: 'pen', label: 'adjustingSegment' },
  },

  // adjust segment
  {
    from: { mode: 'pen', label: 'adjustingSegment' },
    type: 'mousemove',
    do: 'adjustSegment',
  },

  // finish up adjusting segment
  {
    from: { mode: 'pen', label: 'adjustingSegment' },
    type: 'mouseup',
    do: 'releasePen', // TODO: does nothing (?)
    to: { mode: 'pen', label: 'idle' },
  },

  // place split point
  {
    from: { mode: 'pen', label: 'idle' },
    type: 'mousemove',
    target: 'curve',
    do: 'projectInput',
  },

  // hide split point

  {
    from: { mode: 'pen', label: 'idle' },
    type: 'mouseout',
    target: 'curve',
    do: 'hideSplitter',
  },

  // split curve

  {
    from: { mode: 'pen', label: 'idle' },
    type: 'mousedown',
    target: 'curve',
    do: 'splitCurve',
    to: { mode: 'pen', label: 'adjustingSegment' },
  },

  // MARKUP

  {
    type: 'userChangedMarkup',
    do: 'userChangedMarkup',
  },

  {
    type: 'userSelectedMarkupNode',
    do: 'userSelectedMarkupNode',
  },

  // MISCELLANEOUS

  // set message to "Saved" (=> to message module)
  {
    type: 'docSaved',
    do: 'setSavedMessage',
  },

  // wipe current message (=> to message module)
  {
    type: 'wipeMessage',
    do: 'wipeMessage',
  },

  // update document list (=> to tools module)
  {
    type: 'updateDocList',
    do: 'updateDocList',
  },

  // switch to document provided (=> from db module or hist module)
  {
    type: 'switchDocument',
    do: 'switchDocument',
  },
];

// NEW
transitions$$1.get = function(state, input) {
  const isMatch = row => {
    const from = row.from;
    const type = row.type;
    const target = row.target;

    const stateMatch =
      from === undefined ||
      (from.mode === state.mode && from.label === state.label);
    const typeMatch = type === input.type;

    const targetMatch =
      (Array.isArray(target) && target.includes(input.target)) ||
      (typeof target === 'string' && target === input.target) ||
      target === undefined;

    return stateMatch && typeMatch && targetMatch;
  };

  const match = transitions$$1.find(isMatch);

  if (match) {
    return {
      do: match.do,
      to: match.to || { mode: state.mode, label: state.label },
    };
  }
};

const updates = {
  after(state, input) {
    if (input.type !== 'mousemove') {
      state.tools.setActiveStatus(state.description);
      state.docs.setActiveStatus(state.doc._id);
    }

    state.canvas.setCursor(state.input, state.description);
  },

  refresh(state, input) {
    if (input.width > 0) {
      state.doc.canvasWidth = input.width;
    }

    for (let leaf of state.canvas.leaves) {
      leaf.invalidateCache();
    }
  },

  // BUG in this update
  focus(state, input) {
    console.log('focus update called');
    state.canvas.removeFocus(); // remove focus from other nodes
    const node = state.canvas.findDescendantByKey(input.key);

    console.log('node', node);

    if (!node) {
      return;
    }

    const hit = Vector$$1.create(input.x, input.y);
    state.target = node.findAncestorByClass('frontier');

    console.log('target', state.target);

    if (state.target && state.target.contains(hit)) {
      console.log('taking last step');
      state.target.focus();
    }
  },

  select(state, input) {
    // user can only select what she has focused first:
    state.target = state.canvas.findFocus();

    if (!state.target) {
      state.canvas.removeSelection();
      return;
    }

    state.target.select();

    state.from = Vector$$1.create(input.x, input.y);
    state.temp.center = state.target.bounds.center.transform(
      state.target.globalTransform()
    ); // ^ TODO: temp.center should perhaps be `center` with defined property?
  },

  deepSelect(state, input) {
    const node = state.canvas.findDescendantByKey(input.key);
    const target = node && node.findAncestorByClass('frontier');

    if (!target) {
      return;
    }

    if (target.type === types.SHAPE) {
      target.placePen();
      state.mode = 'pen';
      state.label = 'idle';
      state.canvas.removeFocus();
    } else if (target.type === types.GROUP) {
      if (target === node) {
        state.canvas.select();
        state.canvas.removeFocus();
      } else {
        target.children
          .find(aNode => aNode.descendants.includes(node))
          .select();
        state.canvas.updateFrontier();
        state.canvas.removeFocus();
      }
    }
  },

  // release is the 'do' action for various mouseup events
  release(state, input) {
    if (!state.target) {
      return;
    }

    state.canvas.updateBounds(state.target);
    state.temp = {};
  },

  // cleanup is called internally from other updates
  // it is useful to call within some pen-related actions!
  cleanup(state, event) {
    const current = state.canvas.findPen();

    if (current) {
      state.canvas.updateBounds(current);
    }

    state.canvas.removeSelection();
    state.canvas.removePen();

    // we cannot reset temp here, because state.target might still be needed.
  },

  // TODO: weird name
  // triggered by escape key
  exitEdit(state, input) {
    if (state.mode === 'pen' && state.label === 'idle') {
      state.target = state.canvas.findPen();
      updates.cleanup(state, input);
      state.target.select();
      state.mode = 'select';
      state.label = 'idle';
    } else if (state.mode === 'select' && state.label === 'idle') {
      updates.cleanup(state, input);
    }
  },

  deleteNode(state, input) {
    let node = state.canvas.findSelection() || state.canvas.findPenTip();

    if (!node) {
      return;
    }

    if (node.type === types.ANCHOR) {
      node.parent.unmount();
    } else if (
      [types.GROUP, types.SHAPE, types.HANDLEIN, types.HANDLEOUT].includes(
        node.type
      )
    ) {
      node.unmount();
    }
  },

  // TRANSFORMS
  initTransform(state, input) {
    state.target = state.canvas.findDescendantByKey(input.key);

    // input => dot or corner

    state.from = Vector$$1.create(input.x, input.y);
    state.temp.center = state.target.bounds.center.transform(
      state.target.globalTransform()
    ); // ^ TODO: temp.center should perhaps be `center` with defined property?
  },

  shift(state, input) {
    if (!state.target) {
      return;
    }

    const to = Vector$$1.create(input.x, input.y);
    const from = state.from;
    const offset = to.minus(from);

    state.target.translate(offset);

    // bookkeeping
    state.from = to;
  },

  rotate(state, input) {
    if (!state.target) {
      return;
    }

    const to = Vector$$1.create(input.x, input.y);
    const from = state.from;
    const center = state.temp.center;
    const angle = center.angle(from, to);

    state.target.rotate(angle, center);

    state.from = to;
  },

  scale(state, input) {
    if (!state.target) {
      return;
    }

    const to = Vector$$1.create(input.x, input.y);
    const from = state.from;
    const center = state.temp.center;
    const factor = to.minus(center).length() / from.minus(center).length();

    state.target.scale(factor, center);

    state.from = to;
  },

  addSegment(state, input) {
    state.target =
      state.canvas.findPen() || state.canvas.mountShape().placePen();

    const spline = state.target.lastChild || state.target.mountSpline();

    if (spline.isClosed()) {
      state.mode = 'pen'; // TODO: hack(ish)
      state.label = 'idle';
      return;
    }

    spline
      .mountSegment()
      .mountAnchor(
        Vector$$1.create(input.x, input.y).transformToLocal(state.target)
      )
      .placePenTip();
  },

  setHandles(state, input) {
    state.target = state.canvas.findPen();
    const segment = state.target.lastChild.lastChild;

    const handleOut = segment.handleOut || segment.mountHandleOut();
    handleOut.vector = Vector$$1.create(input.x, input.y).transformToLocal(
      state.target
    );

    const handleIn = segment.handleIn || segment.mountHandleIn();
    handleIn.vector = handleOut.vector.rotate(Math.PI, segment.anchor.vector);

    handleOut.placePenTip();
  },

  initAdjustSegment(state, input) {
    const control = state.canvas.findDescendantByKey(input.key);
    state.target = control.parent.parent.parent; // TODO: great
    state.from = Vector$$1.create(input.x, input.y).transformToLocal(state.target);
    control.placePenTip();
  },

  toggleClosedStatus(state, input) {
    console.log('toggleClosedStatus update');
    const control = state.canvas.findPenTip();
    const spline = control.parent.parent;

    spline.isClosed() ? spline.open() : spline.close();
  },

  adjustSegment(state, input) {
    const control = state.canvas.findPenTip();
    const segment = control.parent;
    state.target = segment.parent.parent;
    const to = Vector$$1.create(input.x, input.y).transformToLocal(state.target);
    const change = to.minus(state.from);
    control.vector = control.vector.add(change);

    switch (control.type) {
      case 'anchor':
        if (segment.handleIn) {
          segment.handleIn.vector = segment.handleIn.vector.add(change);
        }
        if (segment.handleOut) {
          segment.handleOut.vector = segment.handleOut.vector.add(change);
        }
        break;
      case 'handleIn':
        segment.handleOut.vector = segment.handleIn.vector.rotate(
          Math.PI,
          segment.anchor.vector
        );
        break;
      case 'handleOut':
        // TODO: bug, segment.handleIn could be undefined
        segment.handleIn.vector = segment.handleOut.vector.rotate(
          Math.PI,
          segment.anchor.vector
        );
        break;
    }

    state.from = to;
  },

  projectInput(state, input) {
    // console.log('projectInput');
    const startSegment = state.canvas.findDescendantByKey(input.key);
    const spline = startSegment.parent;
    const target = spline.parent;
    const startIndex = spline.children.indexOf(startSegment);
    const endSegment = spline.children[startIndex + 1] || spline.children[0];
    // ^ second disjunct: wrap around for curve linking last to first segment in spline
    const curve = Curve$$1.createFromSegments(startSegment, endSegment);
    const bCurve = new Bezier(...curve.coords());

    const from = Vector$$1.create(input.x, input.y).transformToLocal(target);
    const pointOnCurve = bCurve.project({ x: from.x, y: from.y });
    target.splitter = Vector$$1.createFromObject(pointOnCurve);

    // BOOKKEEPING
    state.temp.spline = spline;
    state.temp.splitter = target.splitter;
    state.temp.startSegment = startSegment;
    state.temp.endSegment = endSegment;
    state.temp.insertionIndex = startIndex + 1;
    state.temp.bCurve = bCurve;
    state.temp.curveTime = pointOnCurve.t;
    state.from = from;
    state.target = target;
  },

  // TODO: refactor
  splitCurve(state, input) {
    const target = state.target;
    const spline = state.temp.spline;
    const splitter = state.temp.splitter;
    const startSegment = state.temp.startSegment;
    const endSegment = state.temp.endSegment;
    const insertionIndex = state.temp.insertionIndex;
    const bCurve = state.temp.bCurve;
    const curveTime = state.temp.curveTime;

    const splitCurves = bCurve.split(curveTime);
    const left = splitCurves.left;
    const right = splitCurves.right;

    const segment = Segment$$1.create();
    const anchor = segment.mountAnchor();
    const handleIn = segment.mountHandleIn();
    const handleOut = segment.mountHandleOut();

    spline.insertChild(segment, insertionIndex);

    anchor.vector = splitter;
    handleIn.vector = Vector$$1.createFromObject(left.points[2]);
    // ^ maybe there is no left.points[2]?
    handleOut.vector = Vector$$1.createFromObject(right.points[1]);
    // ^ maybe there is no right.points[1]?
    startSegment.handleOut.vector = Vector$$1.createFromObject(left.points[1]);
    // ^ maybe there is no handleOut
    endSegment.handleIn.vector = Vector$$1.createFromObject(right.points[2]);
    // ^ maybe there is no handleIn

    anchor.placePenTip();
    updates.hideSplitter(state, input);
    updates.adjustSegment(state, input);
  },

  hideSplitter(state, input) {
    const segment = state.canvas.findDescendantByKey(input.key);
    state.target = segment.parent.parent;
    state.target.splitter = Vector$$1.create(-1000, -1000);
  },

  // MARKUP

  userSelectedMarkupNode(state, input) {
    updates.cleanup(state, input);

    const node = state.canvas.findDescendantByKey(input.key);

    if (!node) {
      return;
    }

    if (node.type === types.SHAPE || node.type === types.GROUP) {
      state.target = node;
      node.select();
      state.mode = 'select';
      state.label = 'idle';
    } else if (node.type === types.SPLINE) {
      state.target = node.parent;
      state.target.placePen();
      state.canvas.removeFocus();
      state.mode = 'pen';
      state.label = 'idle';
    } else if (
      [types.ANCHOR, types.HANDLEIN, types.HANDLEOUT].includes(node.type)
    ) {
      state.target = node.parent.parent.parent; // TODO: great
      state.target.placePen();
      node.placePenTip();
      state.mode = 'pen';
      state.label = 'idle';
    }
  },

  userChangedMarkup(state, input) {
    const canvas = state.markupToCanvas(input.value);

    if (canvas) {
      state.canvas.replaceWith(canvas);
    }
  },

  // DOCUMENT MANAGEMENT

  // => 'New' button
  createDoc(state, input) {
    state.doc.replaceWith(state.buildDoc(state.doc.canvasWidth));
  },

  // => choice from menu (or history)
  switchDocument(state, input) {
    state.doc.replaceWith(state.objectToDoc(input.data.doc));
    updates.cleanup(state, input);
  },

  updateDocList(state, input) {
    state.docs.children = [];

    for (let id of input.data.docIDs) {
      const identNode = Identifier$$1.create();
      identNode._id = id;
      state.docs.mount(identNode);
    }
  },

  toggleMenu(state, input) {
    if (state.layout.menuVisible) {
      state.layout.menuVisible = false;
    } else {
      state.layout.menuVisible = true;
    }
  },

  getPrevious(state, input) {
    window.history.back(); // TODO: shouldn't we do this inside of hist?
  },

  getNext(state, input) {
    window.history.forward(); // TODO: shouldn't we do this inside of hist?
  },

  // MESSAGES

  setSavedMessage(state, input) {
    state.message.text = 'Saved';
  },

  wipeMessage(state, input) {
    state.message.text = '';
  },
};

const core = {
  init(canvasWidth) {
    this.state = State.create(canvasWidth);
    this.modules = [];

    return this;
  },

  attach(name, func) {
    this.modules[name] = func;
  },

  execute(input) {
    this.state.input = input;

    const transition = transitions$$1.get(this.state, input);

    if (transition) {
      this.state.update = transition.do; // a string
      this.state.mode = transition.to.mode;
      this.state.label = transition.to.label;

      const update = updates[transition.do];

      if (update) {
        this.invoke(update, this.state, input);
      }

      this.publish();
    }
  },

  invoke(update, state, input) {
    update(this.state, input);
    updates.after(this.state, input);
  },

  publish() {
    for (let key of Object.keys(this.modules)) {
      this.modules[key](this.state.description);
    }

    this.state.snapshots = {};

    // console.log(JSON.stringify(this.state));
    // console.log(document.querySelector('#canvas'));
  },

  kickoff() {
    this.execute({ type: 'go' });
  },
};

// set up test-specific app version without peripherals

const width = 800;

const app = {
  init() {
    this.core = core;
    
    core.init(width);
    core.kickoff();
  },
};

exports.app = app;
