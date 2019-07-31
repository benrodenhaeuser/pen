// - Bezier.js is copyright (c) by Pomax
//   Distributed under an MIT license
//   https://github.com/Pomax/bezierjs
// - CodeMirror is copyright (c) by Marijn Haverbeke and others
//   Distributed under an MIT license
//   https://codemirror.net/LICENSE
// - svg-pathdata library is copyright (c) by Nicolas Froidure
//   Distributed under an MIT license
//   https://github.com/nfroidure/svg-pathdata
// - gl-matrix is copyright (c) Brandon Jones, Colin MacKenzie IV
//   Distributed under an MIT License
//   https://github.com/toji/gl-matrix
    
(function () {
  'use strict';

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
      const m = [
        matrix.m[0][0],
        matrix.m[1][0],
        matrix.m[0][1],
        matrix.m[1][1],
        matrix.m[0][2],
        matrix.m[1][2],
      ];
      const out = create();
      transformMat2d(out, this.toArray(), m);
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
      return `${this.x} ${this.y}`;
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
        [$matrix.a, $matrix.c, $matrix.e],
        [$matrix.b, $matrix.d, $matrix.f],
        [0, 0, 1],
      ];

      return Matrix$$1.create(m);
    },

    equals(other) {
      for (let i = 0; i <= 2; i += 1) {
        for (let j = 0; j <= 2; j += 1) {
          if (this.m[i][j] !== other.m[i][j]) {
            return false;
          }
        }
      }

      return true;
    },

    toJSON() {
      return this.m;
    },

    // return value: string
    toString() {
      const sixValueMatrix = [
        this.m[0][0],
        this.m[1][0],
        this.m[0][1],
        this.m[1][1],
        this.m[0][2],
        this.m[1][2],
      ];

      return `matrix(${sixValueMatrix.join(', ')})`;
    },

    // return value: Array
    toArray() {
      return this.m;
    },

    // return value: new Matrix instance
    multiply(other) {
      const m1 = [
        this.m[0][0],
        this.m[1][0],
        this.m[0][1],
        this.m[1][1],
        this.m[0][2],
        this.m[1][2],
      ];
      const m2 = [
        other.m[0][0],
        other.m[1][0],
        other.m[0][1],
        other.m[1][1],
        other.m[0][2],
        other.m[1][2],
      ];

      const out = create$1();

      multiply$1(out, m1, m2);

      return Matrix$$1.create([
        [out[0], out[2], out[4]],
        [out[1], out[3], out[5]],
        [0, 0, 1],
      ]);
    },

    // return value: new Matrix instance
    invert() {
      const inp = [
        this.m[0][0],
        this.m[1][0],
        this.m[0][1],
        this.m[1][1],
        this.m[0][2],
        this.m[1][2],
      ];

      const out = create$1();

      invert(out, inp);

      return Matrix$$1.create([
        [out[0], out[2], out[4]],
        [out[1], out[3], out[5]],
        [0, 0, 1],
      ]);
    },

    // return value: new Matrix instance
    identity() {
      const m = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

      return Matrix$$1.create(m);
    },

    // return value: new Matrix instance
    rotation(angle, origin) {
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);

      const m = [
        [cos, -sin, -origin.x * cos + origin.y * sin + origin.x],
        [sin, cos, -origin.x * sin - origin.y * cos + origin.y],
        [0, 0, 1],
      ];

      return Matrix$$1.create(m);
    },

    // return value: new Matrix instance
    translation(vector) {
      const m = [[1, 0, vector.x], [0, 1, vector.y], [0, 0, 1]];

      return Matrix$$1.create(m);
    },

    // return value: new Matrix instance
    scale(factor, origin = Vector$$1.create(0, 0)) {
      const m = [
        [factor, 0, origin.x - factor * origin.x],
        [0, factor, origin.y - factor * origin.y],
        [0, 0, 1],
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
  var abs = Math.abs,
    min$1 = Math.min,
    max$1 = Math.max,
    cos = Math.cos,
    sin = Math.sin,
    acos = Math.acos,
    sqrt = Math.sqrt,
    pi = Math.PI,
    // a zero coordinate, which is surprisingly useful
    ZERO = { x: 0, y: 0, z: 0 };

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
        if (abs(a[i].y) > 0.0001) {
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
        p = [p[0], p[1], ZERO];
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
      var q = sqrt(d.x * d.x + d.y * d.y);
      return { x: -d.y / q, y: d.x / q };
    },
    __normal3: function(t) {
      // see http://stackoverflow.com/questions/25453159
      var r1 = this.derivative(t),
        r2 = this.derivative(t + 0.01),
        q1 = sqrt(r1.x * r1.x + r1.y * r1.y + r1.z * r1.z),
        q2 = sqrt(r2.x * r2.x + r2.y * r2.y + r2.z * r2.z);
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
      var m = sqrt(c.x * c.x + c.y * c.y + c.z * c.z);
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
      var angle = abs(acos(s));
      return angle < pi / 3;
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
              if (abs(t1 - t2) < step) {
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
          var m = sqrt(ov.x * ov.x + ov.y * ov.y);
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
      return abs(d1 - ref) + abs(d2 - ref);
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
                  x: arc.x + arc.r * cos(arc.e),
                  y: arc.y + arc.r * sin(arc.e)
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

  /**
    A javascript Bezier curve library by Pomax.
    Based on http://pomax.github.io/bezierinfo
    This code is MIT licensed.
  **/

  // math-inlining.
  var abs$1 = Math.abs,
    cos$1 = Math.cos,
    sin$1 = Math.sin,
    acos$1 = Math.acos,
    atan2 = Math.atan2,
    sqrt$1 = Math.sqrt,
    pow = Math.pow,
    // cube root function yielding real roots
    crt = function(v) {
      return v < 0 ? -pow(-v, 1 / 3) : pow(v, 1 / 3);
    },
    // trig constants
    pi$1 = Math.PI,
    tau = 2 * pi$1,
    quart = pi$1 / 2,
    // float precision significant decimal
    epsilon = 0.000001,
    // extremas used in bbox calculation and similar algorithms
    nMax = Number.MAX_SAFE_INTEGER || 9007199254740991,
    nMin = Number.MIN_SAFE_INTEGER || -9007199254740991,
    // a zero coordinate, which is surprisingly useful
    ZERO$1 = { x: 0, y: 0, z: 0 };

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
      return sqrt$1(l);
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
          p = [p[0], p[1], p[2], ZERO$1];
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
      return abs$1(a - b) <= (precision || epsilon);
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
      return sqrt$1(dx * dx + dy * dy);
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
      return abs$1(top / bottom);
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
            x: (v.x - tx) * cos$1(a) - (v.y - ty) * sin$1(a),
            y: (v.x - tx) * sin$1(a) + (v.y - ty) * cos$1(a)
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
          var m1 = -sqrt$1(b * b - a * c),
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
        var q = sqrt$1(b * b - 4 * a * c),
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
          r = sqrt$1(mp33),
          t = -q / (2 * r),
          cosphi = t < -1 ? -1 : t > 1 ? 1 : t,
          phi = acos$1(cosphi),
          crtr = crt(r),
          t1 = 2 * crtr;
        x1 = t1 * cos$1(phi / 3) - a / 3;
        x2 = t1 * cos$1((phi + tau) / 3) - a / 3;
        x3 = t1 * cos$1((phi + 2 * tau) / 3) - a / 3;
        return [x1, x2, x3].filter(reduce);
      } else if (discriminant === 0) {
        u1 = q2 < 0 ? crt(-q2) : -crt(q2);
        x1 = 2 * u1 - a / 3;
        x2 = -u1 - a / 3;
        return [x1, x2].filter(reduce);
      } else {
        var sd = sqrt$1(discriminant);
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
          var m1 = -sqrt$1(b * b - a * c),
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
        num = sqrt$1(
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
        if (abs$1(l - t) >= d) return false;
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
      var dx1p = dx1 * cos$1(quart) - dy1 * sin$1(quart),
        dy1p = dx1 * sin$1(quart) + dy1 * cos$1(quart),
        dx2p = dx2 * cos$1(quart) - dy2 * sin$1(quart),
        dy2p = dx2 * sin$1(quart) + dy2 * cos$1(quart);
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

  // math-inlining.
  var abs$2 = Math.abs,
    min$2 = Math.min,
    max$2 = Math.max,
    cos$2 = Math.cos,
    sin$2 = Math.sin,
    acos$2 = Math.acos,
    sqrt$2 = Math.sqrt,
    pi$2 = Math.PI,
    // a zero coordinate, which is surprisingly useful
    ZERO$2 = { x: 0, y: 0, z: 0 };

  /**
   * Bezier curve constructor. The constructor argument can be one of three things:
   *
   * 1. array/4 of {x:..., y:..., z:...}, z optional
   * 2. numerical array/8 ordered x1,y1,x2,y2,x3,y3,x4,y4
   * 3. numerical array/12 ordered x1,y1,z1,x2,y2,z2,x3,y3,z3,x4,y4,z4
   *
   */
  var Bezier$1 = function(coords) {
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
        if (abs$2(a[i].y) > 0.0001) {
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

  Bezier$1.quadraticFromPoints = function(p1, p2, p3, t) {
    if (typeof t === "undefined") {
      t = 0.5;
    }
    // shortcuts, although they're really dumb
    if (t === 0) {
      return new Bezier$1(p2, p2, p3);
    }
    if (t === 1) {
      return new Bezier$1(p1, p2, p2);
    }
    // real fitting.
    var abc = getABC(2, p1, p2, p3, t);
    return new Bezier$1(p1, abc.A, p3);
  };

  Bezier$1.cubicFromPoints = function(S, B, E, t, d1) {
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
    return new Bezier$1(S, nc1, nc2, E);
  };

  var getUtils$1 = function() {
    return utils;
  };

  Bezier$1.getUtils = getUtils$1;

  Bezier$1.PolyBezier = PolyBezier;

  Bezier$1.prototype = {
    getUtils: getUtils$1,
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
      return new Bezier$1(np);
    },
    derivative: function(t) {
      var mt = 1 - t,
        a,
        b,
        c = 0,
        p = this.dpoints[0];
      if (this.order === 2) {
        p = [p[0], p[1], ZERO$2];
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
      var q = sqrt$2(d.x * d.x + d.y * d.y);
      return { x: -d.y / q, y: d.x / q };
    },
    __normal3: function(t) {
      // see http://stackoverflow.com/questions/25453159
      var r1 = this.derivative(t),
        r2 = this.derivative(t + 0.01),
        q1 = sqrt$2(r1.x * r1.x + r1.y * r1.y + r1.z * r1.z),
        q2 = sqrt$2(r2.x * r2.x + r2.y * r2.y + r2.z * r2.z);
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
      var m = sqrt$2(c.x * c.x + c.y * c.y + c.z * c.z);
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
            ? new Bezier$1([q[0], q[3], q[5]])
            : new Bezier$1([q[0], q[4], q[7], q[9]]),
        right:
          this.order === 2
            ? new Bezier$1([q[5], q[4], q[2]])
            : new Bezier$1([q[9], q[8], q[6], q[3]]),
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
        return [new Bezier$1(coords)];
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
      var angle = abs$2(acos$2(s));
      return angle < pi$2 / 3;
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
              if (abs$2(t1 - t2) < step) {
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
        return new Bezier$1(np);
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
          var m = sqrt$2(ov.x * ov.x + ov.y * ov.y);
          ov.x /= m;
          ov.y /= m;
          np[t + 1] = {
            x: p.x + rc * ov.x,
            y: p.y + rc * ov.y
          };
        }.bind(this)
      );
      return new Bezier$1(np);
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
      if (curve instanceof Bezier$1) {
        curve = curve.reduce();
      }
      return this.curveintersects(
        this.reduce(),
        curve,
        curveIntersectionThreshold
      );
    },
    lineIntersects: function(line) {
      var mx = min$2(line.p1.x, line.p2.x),
        my = min$2(line.p1.y, line.p2.y),
        MX = max$2(line.p1.x, line.p2.x),
        MY = max$2(line.p1.y, line.p2.y),
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
      return abs$2(d1 - ref) + abs$2(d2 - ref);
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
                  x: arc.x + arc.r * cos$2(arc.e),
                  y: arc.y + arc.r * sin$2(arc.e)
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
        segment1.anchor,
        segment2.anchor,
        segment1.handleOut,
        segment2.handleIn
      );
    },

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
        const bbox = new Bezier$1(...this.coords()).bbox();

        min = Vector$$1.create(bbox.x.min, bbox.y.min);
        max = Vector$$1.create(bbox.x.max, bbox.y.max);
      }

      return Rectangle$$1.createFromMinMax(min, max);
    },
  };

  const Class = {
    create(classNames = []) {
      return Object.create(Class).init(classNames);
    },

    init(classNames) {
      if (classNames instanceof Array) {
        this.set = new Set(classNames);
      } else if (classNames instanceof Set) {
        this.set = classNames;
      } else {
        throw new Error('Create Class instances from array or set');
      }

      return this;
    },

    // return value: string
    toString() {
      return Array.from(this.set).join(' ');
    },

    toJSON() {
      return Array.from(this.set);
    },

    // return value: boolean
    includes(className) {
      return this.set.has(className);
    },

    // return value: new Class instance
    add(className) {
      return Class.create(this.set.add(className));
    },

    // return value: new Class instance
    remove(className) {
      this.set.delete(className);
      return Class.create(this.set);
    },
  };

  const createID = () => {
    const randomString = Math.random()
      .toString(36)
      .substring(2);
    const timestamp = new Date().getTime().toString(36);
    return randomString + timestamp;
  };

  const Node = {
    create() {
      return Object.create(this)
        .setType()
        .set(this.nodeDefaults());
    },

    // => set type as an own property of the instance created
    setType() {
      this.type = Object.getPrototypeOf(this).type;
      return this;
    },

    nodeDefaults() {
      return {
        key: createID(),
        children: [],
        parent: null,
        payload: {
          class: Class.create(),
        },
      };
    },

    set(opts) {
      for (let key of Object.keys(opts)) {
        this[key] = opts[key];
      }

      return this;
    },

    // search

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

    // hierarchy operations

    append(node) {
      this.children = this.children.concat([node]);
      node.parent = this;
    },

    replaceWith(node) {
      node.parent = this.parent;
      const index = this.parent.children.indexOf(this);
      this.parent.children.splice(index, 1, node);
    },

    insertChild(node, index) {
      node.parent = this;
      this.children.splice(index, 0, node);
    },

    // hierarchy tests

    isLeaf() {
      return this.children.length === 0;
    },

    isRoot() {
      return this.parent === null;
    },

    // string encoding

    toJSON() {
      return {
        key: this.key,
        type: this.type,
        children: this.children,
        payload: this.payload,
      };
    },
  };

  // Getters and setters

  Object.defineProperty(Node, 'root', {
    get() {
      return this.findAncestor(node => node.parent === null);
    },
  });

  Object.defineProperty(Node, 'leaves', {
    get() {
      return this.findDescendants(node => node.children.length === 0);
    },
  });

  Object.defineProperty(Node, 'ancestors', {
    get() {
      return this.findAncestors(node => true);
    },
  });

  Object.defineProperty(Node, 'properAncestors', {
    get() {
      return this.parent.findAncestors(node => true);
    },
  });

  Object.defineProperty(Node, 'descendants', {
    get() {
      return this.findDescendants(node => true);
    },
  });

  Object.defineProperty(Node, 'siblings', {
    get() {
      return this.parent.children.filter(node => node !== this);
    },
  });

  Object.defineProperty(Node, 'lastChild', {
    get() {
      return this.children[this.children.length - 1];
    },
  });

  Object.defineProperty(Node, 'class', {
    get() {
      return this.payload.class;
    },
    set(value) {
      this.payload.class = value;
    },
  });

  const SceneNode$$1 = Object.create(Node);

  Object.defineProperty(SceneNode$$1, 'canvas', {
    get() {
      return this.findAncestor(
        node => node.type === 'canvas'
      );
    },
  });

  const GraphicsNode$$1 = SceneNode$$1.create();

  Object.assign(GraphicsNode$$1, {
    create() {
      return SceneNode$$1
        .create.bind(this)()
        .set(this.graphicsNodeDefaults());
    },

    graphicsNodeDefaults() {
      return {
        payload: {
          transform: Matrix$$1.identity(),
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
      this.transform = Matrix$$1.rotation(angle, center).multiply(this.transform);
    },

    scale(factor, center) {
      center = center.transform(this.properAncestorTransform().invert());
      this.transform = Matrix$$1.scale(factor, center).multiply(this.transform);
    },

    translate(offset) {
      this.transform = this.properAncestorTransform()
        .invert()
        .multiply(Matrix$$1.translation(offset))
        .multiply(this.globalTransform());
    },

    globalTransform() {
      return this.properAncestorTransform().multiply(this.transform);
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

      const min = Vector$$1.create(Math.min(...xValues), Math.min(...yValues));
      const max = Vector$$1.create(Math.max(...xValues), Math.max(...yValues));

      const bounds = Rectangle$$1.createFromMinMax(min, max);

      this.payload.bounds = bounds;
      return bounds;
    },
  });

  Object.defineProperty(GraphicsNode$$1, 'bounds', {
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

  Object.defineProperty(GraphicsNode$$1, 'transform', {
    get() {
      return this.payload.transform;
    },
    set(value) {
      this.payload.transform = value;
    },
  });

  Object.defineProperty(GraphicsNode$$1, 'graphicsChildren', {
    get() {
      return this.children.filter(node =>
        ['canvas', 'group', 'shape'].includes(node.type)
      );
    },
  });

  Object.defineProperty(GraphicsNode$$1, 'graphicsAncestors', {
    get() {
      return this.ancestors.filter(node =>
        ['canvas', 'group', 'shape'].includes(node.type)
      );
    },
  });

  const xmlns = 'http://www.w3.org/2000/svg';

  const Canvas$$1 = Object.create(GraphicsNode$$1);
  Canvas$$1.type = 'canvas';

  Object.assign(Canvas$$1, {
    findFocus() {
      return this.findDescendant(
        node => node.class.includes('focus')
      );
    },

    removeFocus() {
      const focus = this.findFocus();

      if (focus) {
        focus.class.remove('focus');
      }
    },

    findFrontier() {
      return this.findDescendants(
        node => node.class.includes('frontier')
      );
    },

    removeFrontier() {
      for (let node of this.findFrontier()) {
        node.class.remove('frontier');
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
        } while (node.parent.type !== 'doc');
      } else {
        for (let child of this.children) {
          child.class = child.class.add('frontier');
        }
      }
    },

    findSelection() {
      return this.findDescendant(
        node => node.class.includes('selected')
      );
    },

    removeSelection() {
      const selected = this.findSelection();

      if (selected) {
        selected.class.remove('selected');
      }

      this.updateFrontier();
    },

    findEditing() {
      return this.findDescendant(
        node => node.class.includes('editing')
      );
    },

    removeEditing() {
      const editing = this.findEditing();

      if (editing) {
        editing.class.remove('editing');
      }
    },

    findPen() {
      return this.findDescendant(
        node => node.class.includes('pen')
      );
    },

    removePen() {
      const pen = this.findPen();

      if (pen) {
        pen.class.remove('pen');
      }
    },

    globallyUpdateBounds(graphicsNode) {
      for (let child of graphicsNode.children) {
        child.updateBounds();
      }

      for (let ancestor of graphicsNode.graphicsAncestors) {
        ancestor.updateBounds();
      }
    },

    toVDOMNode() {
      return {
        tag: 'svg',
        children: [],
        props: {
          'data-key': this.key,
          'data-type': 'canvas',
          viewBox: this.viewBox.toString(),
          xmlns: 'http://www.w3.org/2000/svg',
          class: this.class.toString(),
        },
      };
    },

    toSVGNode() {
      return {
        tag: 'svg',
        children: [],
        props: {
          viewBox: this.viewBox.toString(),
          xmlns: xmlns,
        },
      };
    },

    toASTNodes() {
      const open = SyntaxTree.create();
      open.markup = `<svg xmlns="${xmlns}" viewBox="${this.viewBox.toString()}">`;
      open.key = this.key;

      const close = SyntaxTree.create();
      close.markup = '</svg>';
      close.key = this.key;

      return {
        open: open,
        close: close,
      };
    },
  });

  Object.defineProperty(Canvas$$1, 'viewBox', {
    get() {
      return this.payload.viewBox;
    },
    set(value) {
      this.payload.viewBox = value;
    },
  });

  const Group$$1 = Object.create(GraphicsNode$$1);
  Group$$1.type = 'group';

  Group$$1.toVDOMNode = function() {
    return {
      tag: 'g',
      children: [],
      props: {
        'data-key': this.key,
        'data-type': 'group',
        transform: this.transform.toString(),
        class: this.class.toString(),
      },
    };
  };

  Group$$1.toSVGNode = function() {
    const svgNode = {
      tag: 'g',
      children: [],
      props: {},
    };

    if (!this.transform.equals(Matrix$$1.identity())) {
      svgNode.props.transform = this.transform.toString();
    }

    return svgNode;
  };

  Group$$1.toASTNodes = function() {
    const open = SyntaxTree.create();

    if (!this.transform.equals(Matrix$$1.identity())) {
      open.markup = `<g transform="${this.transform.toString()}">`;
    } else {
      open.markup = '<g>';
    }

    open.key = this.key;
    open.class = this.class;

    const close = SyntaxTree.create();
    close.markup = '</g>';
    close.key = this.key;

    return {
      open: open,
      close: close,
    };
  };

  const Shape$$1 = Object.create(GraphicsNode$$1);
  Shape$$1.type = 'shape';

  Shape$$1.create = function() {
    return GraphicsNode$$1
      .create.bind(this)()
      .set(this.shapeDefaults());
  };

  Shape$$1.shapeDefaults = function() {
    return {
      splitter: Vector$$1.create(-1000, -1000),
    };
  };

  Shape$$1.toVDOMNode = function() {
    return {
      tag: 'path',
      children: [],
      props: {
        'data-type': 'shape',
        'data-key': this.key,
        d: this.pathString(),
        transform: this.transform.toString(),
        class: this.class.toString(),
      },
    };
  };

  Shape$$1.toVDOMCurves = function() {
    const nodes = [];
    const splines = this.children;

    for (let spline of splines) {
      const segments = spline.children;
      const curves = spline.curves();

      for (let i = 0; i < curves.length; i += 1) {
        // this node will be the "hit target" for the curve:
        nodes.push({
          tag: 'path',
          children: [],
          props: {
            'data-type': 'curve',
            'data-key': segments[i].key,
            d: curves[i].toPathString(),
            transform: this.transform.toString(),
          },
        });

        // this node will display the curve stroke:
        nodes.push({
          tag: 'path',
          children: [],
          props: {
            'data-type': 'curve-stroke',
            d: curves[i].toPathString(),
            transform: this.transform.toString(),
          },
        });
      }
    }

    return nodes;
  };

  Shape$$1.toSVGNode = function() {
    const svgNode = {
      tag: 'path',
      children: [],
      props: { d: this.pathString() },
    };

    if (!this.transform.equals(Matrix$$1.identity())) {
      svgNode.props.transform = this.transform.toString();
    }

    return svgNode;
  };

  Shape$$1.toASTNodes = function() {
    const open = SyntaxTree.create();

    if (!this.transform.equals(Matrix$$1.identity())) {
      open.markup = `<path d="${this.pathString()}" transform="${this.transform.toString()}">`;
    } else {
      open.markup = `<path d="${this.pathString()}">`;
    }

    open.key = this.key;
    open.class = this.class;

    const close = SyntaxTree.create();
    close.markup = '</path>';
    close.key = this.key;

    return {
      open: open,
      close: close,
    };
  };

  Shape$$1.pathString = function() {
    let d = '';

    for (let spline of this.children) {
      const segment = spline.children[0];
      d += `M ${segment.anchor.x} ${segment.anchor.y}`;

      for (let i = 1; i < spline.children.length; i += 1) {
        const currSeg = spline.children[i];
        const prevSeg = spline.children[i - 1];

        if (prevSeg.handleOut && currSeg.handleIn) {
          d += ' C';
        } else if (currSeg.handleIn || prevSeg.handleOut) {
          d += ' Q';
        } else {
          d += ' L';
        }

        if (prevSeg.handleOut) {
          d += ` ${prevSeg.handleOut.x} ${prevSeg.handleOut.y}`;
        }

        if (currSeg.handleIn) {
          d += ` ${currSeg.handleIn.x} ${currSeg.handleIn.y}`;
        }

        d += ` ${currSeg.anchor.x} ${currSeg.anchor.y}`;
      }
    }

    return d;
  };

  const Spline$$1 = Object.create(SceneNode$$1);
  Spline$$1.type = 'spline';

  Object.assign(Spline$$1, {
    curves() {
      const theCurves = [];

      // this conditional creates a degenerate curve if
      // there is exactly 1 segment in the spline
      // TODO: this could be a problem!
      if (this.children.length === 1) {
        const start = this.children[0];
        const end = Segment$$1.create();

        theCurves.push(Curve$$1.createFromSegments(start, end));
      }

      // if spline has exactly 1 segment, no curves will be
      // generated by the following code
      for (let i = 0; i + 1 < this.children.length; i += 1) {
        const start = this.children[i];
        const end = this.children[i + 1];

        theCurves.push(Curve$$1.createFromSegments(start, end));
      }

      return theCurves;
    },

    updateBounds() {
      const curves = this.curves();
      let bounds;

      // no curves
      if (curves.length === 0) {
        bounds = Rectangle$$1.create();
        this.payload.bounds = bounds;
        return bounds;
      }

      // a single, degenerate curve
      if (curves.length === 1 && curves[0].isDegenerate()) {
        bounds = Rectangle$$1.create();
        this.payload.bounds = bounds;
        return bounds;
      }

      // one or more (non-degenerate) curves

      bounds = curves[0] && curves[0].bounds; // computed by Bezier plugin

      for (let i = 1; i < curves.length; i += 1) {
        const curveBounds = curves[i].bounds;
        bounds = bounds.getBoundingRect(curveBounds);
      }

      this.payload.bounds = bounds;
      return bounds;
    },
  });

  Object.defineProperty(Spline$$1, 'bounds', {
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

  const Segment$$1 = Object.create(SceneNode$$1);
  Segment$$1.type = 'segment';

  // convenience API for getting/setting anchor and handle values of a segment

  Object.defineProperty(Segment$$1, 'anchor', {
    get() {
      const anchorNode = this.children.find(child => child.type === 'anchor');

      if (anchorNode) {
        return anchorNode.vector;
      }

      return null;
    },
    set(value) {
      let anchorNode;

      if (this.anchor) {
        anchorNode = this.children.find(child => child.type === 'anchor');
      } else {
        anchorNode = Anchor$$1.create();
        this.append(anchorNode);
      }

      anchorNode.vector = value;
    },
  });

  Object.defineProperty(Segment$$1, 'handleIn', {
    get() {
      const handleNode = this.children.find(child => child.type === 'handleIn');

      if (handleNode) {
        return handleNode.vector;
      }

      return null;
    },

    set(value) {
      let handleNode;

      if (this.handleIn) {
        handleNode = this.children.find(child => child.type === 'handleIn');
      } else {
        handleNode = HandleIn$$1.create();
        this.append(handleNode);
      }

      handleNode.vector = value;
    },
  });

  Object.defineProperty(Segment$$1, 'handleOut', {
    get() {
      const handleNode = this.children.find(child => child.type === 'handleOut');

      if (handleNode) {
        return handleNode.vector;
      }

      return null;
    },
    set(value) {
      let handleNode;

      if (this.handleOut) {
        handleNode = this.children.find(child => child.type === 'handleOut');
      } else {
        handleNode = HandleOut$$1.create();
        this.append(handleNode);
      }

      handleNode.vector = value;
    },
  });

  const ControlNode$$1 = SceneNode$$1.create();

  Object.assign(ControlNode$$1, {
    placePen() {
      this.canvas.removePen();
      this.class = this.class.add('pen');
    },
  });

  Object.defineProperty(ControlNode$$1, 'vector', {
    get() {
      return this.payload.vector;
    },

    set(value) {
      this.payload.vector = value;
    },
  });

  const Anchor$$1 = Object.create(ControlNode$$1);
  Anchor$$1.type = 'anchor';

  const HandleIn$$1 = Object.create(ControlNode$$1);
  HandleIn$$1.type = 'handleIn';

  const HandleOut$$1 = Object.create(ControlNode$$1);
  HandleOut$$1.type = 'handleOut';

  const Doc$$1 = Object.create(Node);
  Doc$$1.type = 'doc';

  Object.assign(Doc$$1, {
    create() {
      return Node.create
        .bind(this)()
        .set({ _id: createID() });
    },

    toJSON() {
      const obj = Node.toJSON.bind(this)();
      obj._id = this._id;
      return obj;
    },
  });

  const Store$$1 = Object.create(Node);
  Store$$1.type = 'store';

  Object.defineProperty(Store$$1, 'message', {
    get() {
      return this.root.findDescendant(node => node.type === 'message');
    },
  });

  Object.defineProperty(Store$$1, 'canvas', {
    get() {
      return this.root.findDescendant(node => node.type === 'canvas');
    },
  });

  Object.defineProperty(Store$$1, 'docs', {
    get() {
      return this.root.findDescendant(node => node.type === 'docs');
    },
  });

  Object.defineProperty(Store$$1, 'doc', {
    get() {
      return this.root.findDescendant(node => node.type === 'doc');
    },
  });

  const Docs$$1 = Object.create(Node);
  Docs$$1.type = 'docs';

  const Message$$1 = Object.create(Node);
  Message$$1.type = 'message';

  const Identifier$$1 = Object.create(Node);
  Identifier$$1.type = 'identifier';

  const SyntaxTree = {
    create() {
      return Object.create(SyntaxTree).init();
    },

    init() {
      this.children = [];

      return this;
    },

    // decorate tree with start and end indices
    indexify(start = 0) {
      this.start = start;

      if (this.markup) {
        this.end = this.start + this.markup.length - 1;
        return this.end + 1;
      } else {
        for (let child of this.children) {
          start = child.indexify(start);
        }

        this.end = start - 1;

        return start;
      }
    },

    // find node whose start to end range includes given index
    findNodeByIndex(idx) {
      if (this.markup) {
        if (this.start <= idx && idx <= this.end) {
          return this;
        } else {
          return null;
        }
      } else {
        const child = this.children.find(
          child => child.start <= idx && idx <= child.end
        );

        if (child) {
          return child.findNodeByIndex(idx);
        } else {
          return null;
        }
      }
    },

    // find node whose class list includes given class name
    findNodeByClassName(cls) {
      if (this.markup) {
        if (this.class && this.class.includes(cls)) {
          return this;
        }
      } else {
        for (let child of this.children) {
          const val = child.findNodeByClassName(cls);
          if (val) {
            return val;
          }
        }
      }
    },

    // flatten tree to a list of leaf nodes
    flatten(list = []) {
      if (this.markup) {
        list.push(this);
      } else {
        for (let child of this.children) {
          child.flatten(list);
        }
      }

      return list;
    },

    toMarkup() {
      return this.flatten()
        .map(node => node.markup)
        .join('');
    },
  };

  const objectToDoc = object => {
    let node;

    switch (object.type) {
      case 'store':
        node = Store$$1.create();
        break;
      case 'doc':
        node = Doc$$1.create();
        break;
      case 'docs':
        node = Docs$$1.create();
        break;
      case 'identifier':
        node = Identifier.create();
        break;
      case 'message':
        node = Message$$1.create();
        break;
      case 'canvas':
        node = Canvas$$1.create();
        break;
      case 'group':
        node = Group$$1.create();
        break;
      case 'shape':
        node = Shape$$1.create();
        break;
      case 'spline':
        node = Spline$$1.create();
        break;
      case 'segment':
        node = Segment$$1.create();
        break;
      case 'anchor':
        node = Anchor$$1.create();
        node.type = 'anchor';
        break;
      case 'handleIn':
        node = HandleIn$$1.create();
        break;
      case 'handleOut':
        node = HandleOut$$1.create();
        break;
    }

    node.type = object.type;
    node.key = object.key;
    node._id = object._id;

    setPayload(node, object);

    for (let child of object.children) {
      node.append(objectToDoc(child));
    }

    return node;
  };

  const setPayload = (node, object) => {
    for (let [key, value] of Object.entries(object.payload)) {
      switch (key) {
        case 'viewBox':
          node.viewBox = Rectangle$$1.createFromObject(value);
          console.log(node);
          break;
        case 'transform':
          node.transform = Matrix$$1.create(value);
          break;
        case 'class':
          node.class = Class.create(value);
          break;
        case 'text':
          node.payload.text = value;
          break;
        case 'bounds':
          if (value) {
            node.bounds = Rectangle$$1.createFromObject(value);
          }
          break;
        case 'vector':
          node.vector = Vector$$1.createFromObject(value);
          break;
      }
    }
  };

  var extendStatics=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,a){t.__proto__=a;}||function(t,a){for(var r in a)a.hasOwnProperty(r)&&(t[r]=a[r]);};function __extends(t,a){function r(){this.constructor=t;}extendStatics(t,a),t.prototype=null===a?Object.create(a):(r.prototype=a.prototype,new r);}function rotate$2(t,a){var r=t[0],e=t[1];return [r*Math.cos(a)-e*Math.sin(a),r*Math.sin(a)+e*Math.cos(a)]}function assertNumbers(){for(var t=[],a=0;a<arguments.length;a++)t[a]=arguments[a];for(var r=0;r<t.length;r++)if("number"!=typeof t[r])throw new Error("assertNumbers arguments["+r+"] is not a number. "+typeof t[r]+" == typeof "+t[r]);return !0}var PI=Math.PI;function annotateArcCommand(t,a,r){t.lArcFlag=0===t.lArcFlag?0:1,t.sweepFlag=0===t.sweepFlag?0:1;var e=t.rX,n=t.rY,i=t.x,o=t.y;e=Math.abs(t.rX),n=Math.abs(t.rY);var s=rotate$2([(a-i)/2,(r-o)/2],-t.xRot/180*PI),h=s[0],u=s[1],c=Math.pow(h,2)/Math.pow(e,2)+Math.pow(u,2)/Math.pow(n,2);1<c&&(e*=Math.sqrt(c),n*=Math.sqrt(c)),t.rX=e,t.rY=n;var m=Math.pow(e,2)*Math.pow(u,2)+Math.pow(n,2)*Math.pow(h,2),_=(t.lArcFlag!==t.sweepFlag?1:-1)*Math.sqrt(Math.max(0,(Math.pow(e,2)*Math.pow(n,2)-m)/m)),T=e*u/n*_,O=-n*h/e*_,p=rotate$2([T,O],t.xRot/180*PI);t.cX=p[0]+(a+i)/2,t.cY=p[1]+(r+o)/2,t.phi1=Math.atan2((u-O)/n,(h-T)/e),t.phi2=Math.atan2((-u-O)/n,(-h-T)/e),0===t.sweepFlag&&t.phi2>t.phi1&&(t.phi2-=2*PI),1===t.sweepFlag&&t.phi2<t.phi1&&(t.phi2+=2*PI),t.phi1*=180/PI,t.phi2*=180/PI;}function intersectionUnitCircleLine(t,a,r){assertNumbers(t,a,r);var e=t*t+a*a-r*r;if(0>e)return [];if(0===e)return [[t*r/(t*t+a*a),a*r/(t*t+a*a)]];var n=Math.sqrt(e);return [[(t*r+a*n)/(t*t+a*a),(a*r-t*n)/(t*t+a*a)],[(t*r-a*n)/(t*t+a*a),(a*r+t*n)/(t*t+a*a)]]}var SVGPathDataTransformer,DEG=Math.PI/180;function lerp$1(t,a,r){return (1-r)*t+r*a}function arcAt(t,a,r,e){return t+Math.cos(e/180*PI)*a+Math.sin(e/180*PI)*r}function bezierRoot(t,a,r,e){var n=a-t,i=r-a,o=3*n+3*(e-r)-6*i,s=6*(i-n),h=3*n;return Math.abs(o)<1e-6?[-h/s]:pqFormula(s/o,h/o,1e-6)}function bezierAt(t,a,r,e,n){var i=1-n;return t*(i*i*i)+a*(3*i*i*n)+r*(3*i*n*n)+e*(n*n*n)}function pqFormula(t,a,r){void 0===r&&(r=1e-6);var e=t*t/4-a;if(e<-r)return [];if(e<=r)return [-t/2];var n=Math.sqrt(e);return [-t/2-n,-t/2+n]}function a2c(t,a,r){var e,n,i,o;t.cX||annotateArcCommand(t,a,r);for(var s=Math.min(t.phi1,t.phi2),h=Math.max(t.phi1,t.phi2)-s,u=Math.ceil(h/90),c=new Array(u),m=a,_=r,T=0;T<u;T++){var O=lerp$1(t.phi1,t.phi2,T/u),p=lerp$1(t.phi1,t.phi2,(T+1)/u),y=p-O,S=4/3*Math.tan(y*DEG/4),f=[Math.cos(O*DEG)-S*Math.sin(O*DEG),Math.sin(O*DEG)+S*Math.cos(O*DEG)],V=f[0],N=f[1],D=[Math.cos(p*DEG),Math.sin(p*DEG)],P=D[0],l=D[1],v=[P+S*Math.sin(p*DEG),l-S*Math.cos(p*DEG)],E=v[0],A=v[1];c[T]={relative:t.relative,type:SVGPathData.CURVE_TO};var d=function(a,r){var e=rotate$2([a*t.rX,r*t.rY],t.xRot),n=e[0],i=e[1];return [t.cX+n,t.cY+i]};e=d(V,N),c[T].x1=e[0],c[T].y1=e[1],n=d(E,A),c[T].x2=n[0],c[T].y2=n[1],i=d(P,l),c[T].x=i[0],c[T].y=i[1],t.relative&&(c[T].x1-=m,c[T].y1-=_,c[T].x2-=m,c[T].y2-=_,c[T].x-=m,c[T].y-=_),m=(o=[c[T].x,c[T].y])[0],_=o[1];}return c}!function(t){function a(){return n(function(t,a,r){return t.relative&&(void 0!==t.x1&&(t.x1+=a),void 0!==t.y1&&(t.y1+=r),void 0!==t.x2&&(t.x2+=a),void 0!==t.y2&&(t.y2+=r),void 0!==t.x&&(t.x+=a),void 0!==t.y&&(t.y+=r),t.relative=!1),t})}function r(){var t=NaN,a=NaN,r=NaN,e=NaN;return n(function(n,i,o){return n.type&SVGPathData.SMOOTH_CURVE_TO&&(n.type=SVGPathData.CURVE_TO,t=isNaN(t)?i:t,a=isNaN(a)?o:a,n.x1=n.relative?i-t:2*i-t,n.y1=n.relative?o-a:2*o-a),n.type&SVGPathData.CURVE_TO?(t=n.relative?i+n.x2:n.x2,a=n.relative?o+n.y2:n.y2):(t=NaN,a=NaN),n.type&SVGPathData.SMOOTH_QUAD_TO&&(n.type=SVGPathData.QUAD_TO,r=isNaN(r)?i:r,e=isNaN(e)?o:e,n.x1=n.relative?i-r:2*i-r,n.y1=n.relative?o-e:2*o-e),n.type&SVGPathData.QUAD_TO?(r=n.relative?i+n.x1:n.x1,e=n.relative?o+n.y1:n.y1):(r=NaN,e=NaN),n})}function e(){var t=NaN,a=NaN;return n(function(r,e,n){if(r.type&SVGPathData.SMOOTH_QUAD_TO&&(r.type=SVGPathData.QUAD_TO,t=isNaN(t)?e:t,a=isNaN(a)?n:a,r.x1=r.relative?e-t:2*e-t,r.y1=r.relative?n-a:2*n-a),r.type&SVGPathData.QUAD_TO){t=r.relative?e+r.x1:r.x1,a=r.relative?n+r.y1:r.y1;var i=r.x1,o=r.y1;r.type=SVGPathData.CURVE_TO,r.x1=((r.relative?0:e)+2*i)/3,r.y1=((r.relative?0:n)+2*o)/3,r.x2=(r.x+2*i)/3,r.y2=(r.y+2*o)/3;}else t=NaN,a=NaN;return r})}function n(t){var a=0,r=0,e=NaN,n=NaN;return function(i){if(isNaN(e)&&!(i.type&SVGPathData.MOVE_TO))throw new Error("path must start with moveto");var o=t(i,a,r,e,n);return i.type&SVGPathData.CLOSE_PATH&&(a=e,r=n),void 0!==i.x&&(a=i.relative?a+i.x:i.x),void 0!==i.y&&(r=i.relative?r+i.y:i.y),i.type&SVGPathData.MOVE_TO&&(e=a,n=r),o}}function i(t,a,r,e,i,o){return assertNumbers(t,a,r,e,i,o),n(function(n,s,h,u){var c=n.x1,m=n.x2,_=n.relative&&!isNaN(u),T=void 0!==n.x?n.x:_?0:s,O=void 0!==n.y?n.y:_?0:h;function p(t){return t*t}n.type&SVGPathData.HORIZ_LINE_TO&&0!==a&&(n.type=SVGPathData.LINE_TO,n.y=n.relative?0:h),n.type&SVGPathData.VERT_LINE_TO&&0!==r&&(n.type=SVGPathData.LINE_TO,n.x=n.relative?0:s),void 0!==n.x&&(n.x=n.x*t+O*r+(_?0:i)),void 0!==n.y&&(n.y=T*a+n.y*e+(_?0:o)),void 0!==n.x1&&(n.x1=n.x1*t+n.y1*r+(_?0:i)),void 0!==n.y1&&(n.y1=c*a+n.y1*e+(_?0:o)),void 0!==n.x2&&(n.x2=n.x2*t+n.y2*r+(_?0:i)),void 0!==n.y2&&(n.y2=m*a+n.y2*e+(_?0:o));var y=t*e-a*r;if(void 0!==n.xRot&&(1!==t||0!==a||0!==r||1!==e))if(0===y)delete n.rX,delete n.rY,delete n.xRot,delete n.lArcFlag,delete n.sweepFlag,n.type=SVGPathData.LINE_TO;else{var S=n.xRot*Math.PI/180,f=Math.sin(S),V=Math.cos(S),N=1/p(n.rX),D=1/p(n.rY),P=p(V)*N+p(f)*D,l=2*f*V*(N-D),v=p(f)*N+p(V)*D,E=P*e*e-l*a*e+v*a*a,A=l*(t*e+a*r)-2*(P*r*e+v*t*a),d=P*r*r-l*t*r+v*t*t,G=(Math.atan2(A,E-d)+Math.PI)%Math.PI/2,C=Math.sin(G),x=Math.cos(G);n.rX=Math.abs(y)/Math.sqrt(E*p(x)+A*C*x+d*p(C)),n.rY=Math.abs(y)/Math.sqrt(E*p(C)-A*C*x+d*p(x)),n.xRot=180*G/Math.PI;}return void 0!==n.sweepFlag&&0>y&&(n.sweepFlag=+!n.sweepFlag),n})}function o(){return function(t){var a={};for(var r in t)a[r]=t[r];return a}}t.ROUND=function(t){function a(a){return Math.round(a*t)/t}return void 0===t&&(t=1e13),assertNumbers(t),function(t){return void 0!==t.x1&&(t.x1=a(t.x1)),void 0!==t.y1&&(t.y1=a(t.y1)),void 0!==t.x2&&(t.x2=a(t.x2)),void 0!==t.y2&&(t.y2=a(t.y2)),void 0!==t.x&&(t.x=a(t.x)),void 0!==t.y&&(t.y=a(t.y)),t}},t.TO_ABS=a,t.TO_REL=function(){return n(function(t,a,r){return t.relative||(void 0!==t.x1&&(t.x1-=a),void 0!==t.y1&&(t.y1-=r),void 0!==t.x2&&(t.x2-=a),void 0!==t.y2&&(t.y2-=r),void 0!==t.x&&(t.x-=a),void 0!==t.y&&(t.y-=r),t.relative=!0),t})},t.NORMALIZE_HVZ=function(t,a,r){return void 0===t&&(t=!0),void 0===a&&(a=!0),void 0===r&&(r=!0),n(function(e,n,i,o,s){if(isNaN(o)&&!(e.type&SVGPathData.MOVE_TO))throw new Error("path must start with moveto");return a&&e.type&SVGPathData.HORIZ_LINE_TO&&(e.type=SVGPathData.LINE_TO,e.y=e.relative?0:i),r&&e.type&SVGPathData.VERT_LINE_TO&&(e.type=SVGPathData.LINE_TO,e.x=e.relative?0:n),t&&e.type&SVGPathData.CLOSE_PATH&&(e.type=SVGPathData.LINE_TO,e.x=e.relative?o-n:o,e.y=e.relative?s-i:s),e.type&SVGPathData.ARC&&(0===e.rX||0===e.rY)&&(e.type=SVGPathData.LINE_TO,delete e.rX,delete e.rY,delete e.xRot,delete e.lArcFlag,delete e.sweepFlag),e})},t.NORMALIZE_ST=r,t.QT_TO_C=e,t.INFO=n,t.SANITIZE=function(t){void 0===t&&(t=0),assertNumbers(t);var a=NaN,r=NaN,e=NaN,i=NaN;return n(function(n,o,s,h,u){var c=Math.abs,m=!1,_=0,T=0;if(n.type&SVGPathData.SMOOTH_CURVE_TO&&(_=isNaN(a)?0:o-a,T=isNaN(r)?0:s-r),n.type&(SVGPathData.CURVE_TO|SVGPathData.SMOOTH_CURVE_TO)?(a=n.relative?o+n.x2:n.x2,r=n.relative?s+n.y2:n.y2):(a=NaN,r=NaN),n.type&SVGPathData.SMOOTH_QUAD_TO?(e=isNaN(e)?o:2*o-e,i=isNaN(i)?s:2*s-i):n.type&SVGPathData.QUAD_TO?(e=n.relative?o+n.x1:n.x1,i=n.relative?s+n.y1:n.y2):(e=NaN,i=NaN),n.type&SVGPathData.LINE_COMMANDS||n.type&SVGPathData.ARC&&(0===n.rX||0===n.rY||!n.lArcFlag)||n.type&SVGPathData.CURVE_TO||n.type&SVGPathData.SMOOTH_CURVE_TO||n.type&SVGPathData.QUAD_TO||n.type&SVGPathData.SMOOTH_QUAD_TO){var O=void 0===n.x?0:n.relative?n.x:n.x-o,p=void 0===n.y?0:n.relative?n.y:n.y-s;_=isNaN(e)?void 0===n.x1?_:n.relative?n.x:n.x1-o:e-o,T=isNaN(i)?void 0===n.y1?T:n.relative?n.y:n.y1-s:i-s;var y=void 0===n.x2?0:n.relative?n.x:n.x2-o,S=void 0===n.y2?0:n.relative?n.y:n.y2-s;c(O)<=t&&c(p)<=t&&c(_)<=t&&c(T)<=t&&c(y)<=t&&c(S)<=t&&(m=!0);}return n.type&SVGPathData.CLOSE_PATH&&c(o-h)<=t&&c(s-u)<=t&&(m=!0),m?[]:n})},t.MATRIX=i,t.ROTATE=function(t,a,r){void 0===a&&(a=0),void 0===r&&(r=0),assertNumbers(t,a,r);var e=Math.sin(t),n=Math.cos(t);return i(n,e,-e,n,a-a*n+r*e,r-a*e-r*n)},t.TRANSLATE=function(t,a){return void 0===a&&(a=0),assertNumbers(t,a),i(1,0,0,1,t,a)},t.SCALE=function(t,a){return void 0===a&&(a=t),assertNumbers(t,a),i(t,0,0,a,0,0)},t.SKEW_X=function(t){return assertNumbers(t),i(1,0,Math.atan(t),1,0,0)},t.SKEW_Y=function(t){return assertNumbers(t),i(1,Math.atan(t),0,1,0,0)},t.X_AXIS_SYMMETRY=function(t){return void 0===t&&(t=0),assertNumbers(t),i(-1,0,0,1,t,0)},t.Y_AXIS_SYMMETRY=function(t){return void 0===t&&(t=0),assertNumbers(t),i(1,0,0,-1,0,t)},t.A_TO_C=function(){return n(function(t,a,r){return SVGPathData.ARC===t.type?a2c(t,t.relative?0:a,t.relative?0:r):t})},t.ANNOTATE_ARCS=function(){return n(function(t,a,r){return t.relative&&(a=0,r=0),SVGPathData.ARC===t.type&&annotateArcCommand(t,a,r),t})},t.CLONE=o,t.CALCULATE_BOUNDS=function(){var t=function(t){var a={};for(var r in t)a[r]=t[r];return a},i=a(),o=e(),s=r(),h=n(function(a,r,e){var n=s(o(i(t(a))));function u(t){t>h.maxX&&(h.maxX=t),t<h.minX&&(h.minX=t);}function c(t){t>h.maxY&&(h.maxY=t),t<h.minY&&(h.minY=t);}if(n.type&SVGPathData.DRAWING_COMMANDS&&(u(r),c(e)),n.type&SVGPathData.HORIZ_LINE_TO&&u(n.x),n.type&SVGPathData.VERT_LINE_TO&&c(n.y),n.type&SVGPathData.LINE_TO&&(u(n.x),c(n.y)),n.type&SVGPathData.CURVE_TO){u(n.x),c(n.y);for(var m=0,_=bezierRoot(r,n.x1,n.x2,n.x);m<_.length;m++)0<(G=_[m])&&1>G&&u(bezierAt(r,n.x1,n.x2,n.x,G));for(var T=0,O=bezierRoot(e,n.y1,n.y2,n.y);T<O.length;T++)0<(G=O[T])&&1>G&&c(bezierAt(e,n.y1,n.y2,n.y,G));}if(n.type&SVGPathData.ARC){u(n.x),c(n.y),annotateArcCommand(n,r,e);for(var p=n.xRot/180*Math.PI,y=Math.cos(p)*n.rX,S=Math.sin(p)*n.rX,f=-Math.sin(p)*n.rY,V=Math.cos(p)*n.rY,N=n.phi1<n.phi2?[n.phi1,n.phi2]:-180>n.phi2?[n.phi2+360,n.phi1+360]:[n.phi2,n.phi1],D=N[0],P=N[1],l=function(t){var a=t[0],r=t[1],e=180*Math.atan2(r,a)/Math.PI;return e<D?e+360:e},v=0,E=intersectionUnitCircleLine(f,-y,0).map(l);v<E.length;v++)(G=E[v])>D&&G<P&&u(arcAt(n.cX,y,f,G));for(var A=0,d=intersectionUnitCircleLine(V,-S,0).map(l);A<d.length;A++){var G;(G=d[A])>D&&G<P&&c(arcAt(n.cY,S,V,G));}}return a});return h.minX=1/0,h.maxX=-1/0,h.minY=1/0,h.maxY=-1/0,h};}(SVGPathDataTransformer||(SVGPathDataTransformer={}));var _a,_a$1,TransformableSVG=function(){function t(){}return t.prototype.round=function(t){return this.transform(SVGPathDataTransformer.ROUND(t))},t.prototype.toAbs=function(){return this.transform(SVGPathDataTransformer.TO_ABS())},t.prototype.toRel=function(){return this.transform(SVGPathDataTransformer.TO_REL())},t.prototype.normalizeHVZ=function(t,a,r){return this.transform(SVGPathDataTransformer.NORMALIZE_HVZ(t,a,r))},t.prototype.normalizeST=function(){return this.transform(SVGPathDataTransformer.NORMALIZE_ST())},t.prototype.qtToC=function(){return this.transform(SVGPathDataTransformer.QT_TO_C())},t.prototype.aToC=function(){return this.transform(SVGPathDataTransformer.A_TO_C())},t.prototype.sanitize=function(t){return this.transform(SVGPathDataTransformer.SANITIZE(t))},t.prototype.translate=function(t,a){return this.transform(SVGPathDataTransformer.TRANSLATE(t,a))},t.prototype.scale=function(t,a){return this.transform(SVGPathDataTransformer.SCALE(t,a))},t.prototype.rotate=function(t,a,r){return this.transform(SVGPathDataTransformer.ROTATE(t,a,r))},t.prototype.matrix=function(t,a,r,e,n,i){return this.transform(SVGPathDataTransformer.MATRIX(t,a,r,e,n,i))},t.prototype.skewX=function(t){return this.transform(SVGPathDataTransformer.SKEW_X(t))},t.prototype.skewY=function(t){return this.transform(SVGPathDataTransformer.SKEW_Y(t))},t.prototype.xSymmetry=function(t){return this.transform(SVGPathDataTransformer.X_AXIS_SYMMETRY(t))},t.prototype.ySymmetry=function(t){return this.transform(SVGPathDataTransformer.Y_AXIS_SYMMETRY(t))},t.prototype.annotateArcs=function(){return this.transform(SVGPathDataTransformer.ANNOTATE_ARCS())},t}(),isWhiteSpace=function(t){return " "===t||"\t"===t||"\r"===t||"\n"===t},isDigit=function(t){return "0".charCodeAt(0)<=t.charCodeAt(0)&&t.charCodeAt(0)<="9".charCodeAt(0)},SVGPathDataParser$$1=function(t){function a(){var a=t.call(this)||this;return a.curNumber="",a.curCommandType=-1,a.curCommandRelative=!1,a.canParseCommandOrComma=!0,a.curNumberHasExp=!1,a.curNumberHasExpDigits=!1,a.curNumberHasDecimal=!1,a.curArgs=[],a}return __extends(a,t),a.prototype.finish=function(t){if(void 0===t&&(t=[]),this.parse(" ",t),0!==this.curArgs.length||!this.canParseCommandOrComma)throw new SyntaxError("Unterminated command at the path end.");return t},a.prototype.parse=function(t,a){var r=this;void 0===a&&(a=[]);for(var e=function(t){a.push(t),r.curArgs.length=0,r.canParseCommandOrComma=!0;},n=0;n<t.length;n++){var i=t[n];if(isDigit(i))this.curNumber+=i,this.curNumberHasExpDigits=this.curNumberHasExp;else if("e"!==i&&"E"!==i)if("-"!==i&&"+"!==i||!this.curNumberHasExp||this.curNumberHasExpDigits)if("."!==i||this.curNumberHasExp||this.curNumberHasDecimal){if(this.curNumber&&-1!==this.curCommandType){var o=Number(this.curNumber);if(isNaN(o))throw new SyntaxError("Invalid number ending at "+n);if(this.curCommandType===SVGPathData.ARC)if(0===this.curArgs.length||1===this.curArgs.length){if(0>o)throw new SyntaxError('Expected positive number, got "'+o+'" at index "'+n+'"')}else if((3===this.curArgs.length||4===this.curArgs.length)&&"0"!==this.curNumber&&"1"!==this.curNumber)throw new SyntaxError('Expected a flag, got "'+this.curNumber+'" at index "'+n+'"');this.curArgs.push(o),this.curArgs.length===COMMAND_ARG_COUNTS[this.curCommandType]&&(SVGPathData.HORIZ_LINE_TO===this.curCommandType?e({type:SVGPathData.HORIZ_LINE_TO,relative:this.curCommandRelative,x:o}):SVGPathData.VERT_LINE_TO===this.curCommandType?e({type:SVGPathData.VERT_LINE_TO,relative:this.curCommandRelative,y:o}):this.curCommandType===SVGPathData.MOVE_TO||this.curCommandType===SVGPathData.LINE_TO||this.curCommandType===SVGPathData.SMOOTH_QUAD_TO?(e({type:this.curCommandType,relative:this.curCommandRelative,x:this.curArgs[0],y:this.curArgs[1]}),SVGPathData.MOVE_TO===this.curCommandType&&(this.curCommandType=SVGPathData.LINE_TO)):this.curCommandType===SVGPathData.CURVE_TO?e({type:SVGPathData.CURVE_TO,relative:this.curCommandRelative,x1:this.curArgs[0],y1:this.curArgs[1],x2:this.curArgs[2],y2:this.curArgs[3],x:this.curArgs[4],y:this.curArgs[5]}):this.curCommandType===SVGPathData.SMOOTH_CURVE_TO?e({type:SVGPathData.SMOOTH_CURVE_TO,relative:this.curCommandRelative,x2:this.curArgs[0],y2:this.curArgs[1],x:this.curArgs[2],y:this.curArgs[3]}):this.curCommandType===SVGPathData.QUAD_TO?e({type:SVGPathData.QUAD_TO,relative:this.curCommandRelative,x1:this.curArgs[0],y1:this.curArgs[1],x:this.curArgs[2],y:this.curArgs[3]}):this.curCommandType===SVGPathData.ARC&&e({type:SVGPathData.ARC,relative:this.curCommandRelative,rX:this.curArgs[0],rY:this.curArgs[1],xRot:this.curArgs[2],lArcFlag:this.curArgs[3],sweepFlag:this.curArgs[4],x:this.curArgs[5],y:this.curArgs[6]})),this.curNumber="",this.curNumberHasExpDigits=!1,this.curNumberHasExp=!1,this.curNumberHasDecimal=!1,this.canParseCommandOrComma=!0;}if(!isWhiteSpace(i))if(","===i&&this.canParseCommandOrComma)this.canParseCommandOrComma=!1;else if("+"!==i&&"-"!==i&&"."!==i){if(0!==this.curArgs.length)throw new SyntaxError("Unterminated command at index "+n+".");if(!this.canParseCommandOrComma)throw new SyntaxError('Unexpected character "'+i+'" at index '+n+". Command cannot follow comma");if(this.canParseCommandOrComma=!1,"z"!==i&&"Z"!==i)if("h"===i||"H"===i)this.curCommandType=SVGPathData.HORIZ_LINE_TO,this.curCommandRelative="h"===i;else if("v"===i||"V"===i)this.curCommandType=SVGPathData.VERT_LINE_TO,this.curCommandRelative="v"===i;else if("m"===i||"M"===i)this.curCommandType=SVGPathData.MOVE_TO,this.curCommandRelative="m"===i;else if("l"===i||"L"===i)this.curCommandType=SVGPathData.LINE_TO,this.curCommandRelative="l"===i;else if("c"===i||"C"===i)this.curCommandType=SVGPathData.CURVE_TO,this.curCommandRelative="c"===i;else if("s"===i||"S"===i)this.curCommandType=SVGPathData.SMOOTH_CURVE_TO,this.curCommandRelative="s"===i;else if("q"===i||"Q"===i)this.curCommandType=SVGPathData.QUAD_TO,this.curCommandRelative="q"===i;else if("t"===i||"T"===i)this.curCommandType=SVGPathData.SMOOTH_QUAD_TO,this.curCommandRelative="t"===i;else{if("a"!==i&&"A"!==i)throw new SyntaxError('Unexpected character "'+i+'" at index '+n+".");this.curCommandType=SVGPathData.ARC,this.curCommandRelative="a"===i;}else a.push({type:SVGPathData.CLOSE_PATH}),this.canParseCommandOrComma=!0,this.curCommandType=-1;}else this.curNumber=i,this.curNumberHasDecimal="."===i;}else this.curNumber+=i,this.curNumberHasDecimal=!0;else this.curNumber+=i;else this.curNumber+=i,this.curNumberHasExp=!0;}return a},a.prototype.transform=function(t){return Object.create(this,{parse:{value:function(a,r){void 0===r&&(r=[]);for(var e=0,n=Object.getPrototypeOf(this).parse.call(this,a);e<n.length;e++){var i=n[e],o=t(i);Array.isArray(o)?r.push.apply(r,o):r.push(o);}return r}}})},a}(TransformableSVG),SVGPathData=function(t){function a(r){var e=t.call(this)||this;return e.commands="string"==typeof r?a.parse(r):r,e}return __extends(a,t),a.prototype.encode=function(){return a.encode(this.commands)},a.prototype.getBounds=function(){var t=SVGPathDataTransformer.CALCULATE_BOUNDS();return this.transform(t),t},a.prototype.transform=function(t){for(var a=[],r=0,e=this.commands;r<e.length;r++){var n=t(e[r]);Array.isArray(n)?a.push.apply(a,n):a.push(n);}return this.commands=a,this},a.encode=function(t){return encodeSVGPath$$1(t)},a.parse=function(t){var a=new SVGPathDataParser$$1,r=[];return a.parse(t,r),a.finish(r),r},a.CLOSE_PATH=1,a.MOVE_TO=2,a.HORIZ_LINE_TO=4,a.VERT_LINE_TO=8,a.LINE_TO=16,a.CURVE_TO=32,a.SMOOTH_CURVE_TO=64,a.QUAD_TO=128,a.SMOOTH_QUAD_TO=256,a.ARC=512,a.LINE_COMMANDS=a.LINE_TO|a.HORIZ_LINE_TO|a.VERT_LINE_TO,a.DRAWING_COMMANDS=a.HORIZ_LINE_TO|a.VERT_LINE_TO|a.LINE_TO|a.CURVE_TO|a.SMOOTH_CURVE_TO|a.QUAD_TO|a.SMOOTH_QUAD_TO|a.ARC,a}(TransformableSVG),COMMAND_ARG_COUNTS=((_a={})[SVGPathData.MOVE_TO]=2,_a[SVGPathData.LINE_TO]=2,_a[SVGPathData.HORIZ_LINE_TO]=1,_a[SVGPathData.VERT_LINE_TO]=1,_a[SVGPathData.CLOSE_PATH]=0,_a[SVGPathData.QUAD_TO]=4,_a[SVGPathData.SMOOTH_QUAD_TO]=2,_a[SVGPathData.CURVE_TO]=6,_a[SVGPathData.SMOOTH_CURVE_TO]=4,_a[SVGPathData.ARC]=7,_a),WSP=" ";function encodeSVGPath$$1(t){var a="";Array.isArray(t)||(t=[t]);for(var r=0;r<t.length;r++){var e=t[r];if(e.type===SVGPathData.CLOSE_PATH)a+="z";else if(e.type===SVGPathData.HORIZ_LINE_TO)a+=(e.relative?"h":"H")+e.x;else if(e.type===SVGPathData.VERT_LINE_TO)a+=(e.relative?"v":"V")+e.y;else if(e.type===SVGPathData.MOVE_TO)a+=(e.relative?"m":"M")+e.x+WSP+e.y;else if(e.type===SVGPathData.LINE_TO)a+=(e.relative?"l":"L")+e.x+WSP+e.y;else if(e.type===SVGPathData.CURVE_TO)a+=(e.relative?"c":"C")+e.x1+WSP+e.y1+WSP+e.x2+WSP+e.y2+WSP+e.x+WSP+e.y;else if(e.type===SVGPathData.SMOOTH_CURVE_TO)a+=(e.relative?"s":"S")+e.x2+WSP+e.y2+WSP+e.x+WSP+e.y;else if(e.type===SVGPathData.QUAD_TO)a+=(e.relative?"q":"Q")+e.x1+WSP+e.y1+WSP+e.x+WSP+e.y;else if(e.type===SVGPathData.SMOOTH_QUAD_TO)a+=(e.relative?"t":"T")+e.x+WSP+e.y;else{if(e.type!==SVGPathData.ARC)throw new Error('Unexpected command type "'+e.type+'" at index '+r+".");a+=(e.relative?"a":"A")+e.rX+WSP+e.rY+WSP+e.xRot+WSP+ +e.lArcFlag+WSP+ +e.sweepFlag+WSP+e.x+WSP+e.y;}}return a}var SVGPathData$1=function(t){function a(r){var e=t.call(this)||this;return e.commands="string"==typeof r?a.parse(r):r,e}return __extends(a,t),a.prototype.encode=function(){return a.encode(this.commands)},a.prototype.getBounds=function(){var t=SVGPathDataTransformer.CALCULATE_BOUNDS();return this.transform(t),t},a.prototype.transform=function(t){for(var a=[],r=0,e=this.commands;r<e.length;r++){var n=t(e[r]);Array.isArray(n)?a.push.apply(a,n):a.push(n);}return this.commands=a,this},a.encode=function(t){return encodeSVGPath$$1(t)},a.parse=function(t){var a=new SVGPathDataParser$$1,r=[];return a.parse(t,r),a.finish(r),r},a.CLOSE_PATH=1,a.MOVE_TO=2,a.HORIZ_LINE_TO=4,a.VERT_LINE_TO=8,a.LINE_TO=16,a.CURVE_TO=32,a.SMOOTH_CURVE_TO=64,a.QUAD_TO=128,a.SMOOTH_QUAD_TO=256,a.ARC=512,a.LINE_COMMANDS=a.LINE_TO|a.HORIZ_LINE_TO|a.VERT_LINE_TO,a.DRAWING_COMMANDS=a.HORIZ_LINE_TO|a.VERT_LINE_TO|a.LINE_TO|a.CURVE_TO|a.SMOOTH_CURVE_TO|a.QUAD_TO|a.SMOOTH_QUAD_TO|a.ARC,a}(TransformableSVG),COMMAND_ARG_COUNTS$1=((_a$1={})[SVGPathData$1.MOVE_TO]=2,_a$1[SVGPathData$1.LINE_TO]=2,_a$1[SVGPathData$1.HORIZ_LINE_TO]=1,_a$1[SVGPathData$1.VERT_LINE_TO]=1,_a$1[SVGPathData$1.CLOSE_PATH]=0,_a$1[SVGPathData$1.QUAD_TO]=4,_a$1[SVGPathData$1.SMOOTH_QUAD_TO]=2,_a$1[SVGPathData$1.CURVE_TO]=6,_a$1[SVGPathData$1.SMOOTH_CURVE_TO]=4,_a$1[SVGPathData$1.ARC]=7,_a$1);

  const markupToScene = markup => {
    const $svg = new DOMParser().parseFromString(markup, 'image/svg+xml')
      .documentElement;

    if ($svg instanceof SVGElement) {
      const canvas = Canvas$$1.create();
      buildTree($svg, canvas);
      canvas.updateFrontier();
      return canvas;
    } else {
      return null;
    }
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
        node.append(child);
        buildTree($child, child);
      } else {
        child = buildShapeTree($child);
        node.append(child);
      }
    }
  };

  const processAttributes = ($node, node) => {
    // viewBox
    if ($node.tagName === 'svg') {
      const viewBox = $node.getAttributeNS(null, 'viewBox').split(' ');
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
  };

  const buildShapeTree = $geometryNode => {
    const shape = Shape$$1.create();

    processAttributes($geometryNode, shape);
    // ^ TODO: we are also calling processAttributes further above, duplication!

    let pathCommands;

    switch ($geometryNode.tagName) {
      case 'rect':
        const x = Number($geometryNode.getAttributeNS(null, 'x'));
        const y = Number($geometryNode.getAttributeNS(null, 'y'));
        const width = Number($geometryNode.getAttributeNS(null, 'width'));
        const height = Number($geometryNode.getAttributeNS(null, 'height'));

        pathCommands = commands(`
        M ${x} ${y}
        H ${x + width}
        V ${y + height}
        H ${x}
        Z
      `);
        break;
      case 'path':
        pathCommands = commands($geometryNode.getAttributeNS(null, 'd'));
        break;
    }

    const pathSequences = sequences(pathCommands);

    for (let sequence of pathSequences) {
      shape.append(buildSplineTree(sequence));
    }

    return shape;
  };

  const buildSplineTree = sequence => {
    const spline = Spline$$1.create();
    for (let segment of buildSegmentList(sequence)) {
      spline.append(segment);
    }

    return spline;
  };

  // helpers

  // we want a segment to have children 'handleIn', 'anchor' etc

  const buildSegmentList = commands => {
    const segments = [];

    // the first command is ALWAYS an `M` command (no handles)
    segments[0] = Segment$$1.create();
    const child = Anchor$$1.create();
    child.payload.vector = Vector$$1.create(commands[0].x, commands[0].y);
    segments[0].append(child);

    for (let i = 1; i < commands.length; i += 1) {
      const command = commands[i];
      const prevSeg = segments[i - 1];
      const currSeg = Segment$$1.create();

      const anchor = Anchor$$1.create();
      anchor.payload.vector = Vector$$1.create(command.x, command.y);
      currSeg.append(anchor);

      if (command.x1 && command.x2) {
        const handleOut = HandleOut$$1.create();
        handleOut.payload.vector = Vector$$1.create(command.x1, command.y1);
        prevSeg.append(handleOut);

        const handleIn = HandleIn$$1.create();
        handleIn.payload.vector = Vector$$1.create(command.x2, command.y2);
        currSeg.append(handleIn);
      } else if (command.x1) {
        const handleIn = HandleIn$$1.create();
        handleIn.payload.vector = Vector$$1.create(command.x1, command.y1);
        currSeg.append(handleIn);
      }

      segments[i] = currSeg;
    }

    return segments;
  };

  const sequences = svgCommands => {
    const MOVE = 2; // NOTE: constant is introduced by svg-pathdata module
    const theSequences = [];

    for (let command of svgCommands) {
      if (command.type === MOVE) {
        theSequences.push([command]);
      } else {
        theSequences[theSequences.length - 1].push(command);
      }
    }

    return theSequences;
  };

  const commands = svgPath => {
    return new SVGPathData$1(svgPath)
      .transform(SVGPathDataTransformer.NORMALIZE_HVZ()) // no H, V or Z shortcuts
      .transform(SVGPathDataTransformer.NORMALIZE_ST()) // no S (smooth multi-Bezier)
      .transform(SVGPathDataTransformer.A_TO_C()) // no A (arcs)
      .toAbs().commands; // no relative commands
  };

  const markupToDOM = markup => {
    const $svg = new DOMParser().parseFromString(markup, 'image/svg+xml')
      .documentElement;

    if ($svg instanceof SVGElement) {
      addKeys($svg);
      return $svg;
    } else {
      return null;
    }
  };

  const addKeys = $node => {
    $node.key = createID();

    for (let $child of $node.children) {
      addKeys($child);
    }
  };

  const domToScene = $svg => {
    if ($svg instanceof SVGElement) {
      const canvas = Canvas$$1.create();
      canvas.key = $svg.key;
      buildTree$1($svg, canvas);
      canvas.updateFrontier();
      return canvas;
    } else {
      return null;
    }
  };

  const buildTree$1 = ($node, node) => {
    processAttributes$1($node, node);

    const $graphicsChildren = Array.from($node.children).filter($child => {
      return (
        $child instanceof SVGGElement || $child instanceof SVGGeometryElement
      );
    });

    for (let $child of $graphicsChildren) {
      let child;

      if ($child instanceof SVGGElement) {
        child = Group$$1.create();
        child.key = $child.key;
        node.append(child);
        buildTree$1($child, child);
      } else {
        child = buildShapeTree$1($child);
        node.append(child);
      }
    }
  };

  const processAttributes$1 = ($node, node) => {
    // viewBox
    if ($node.tagName === 'svg') {
      const viewBox = $node.getAttributeNS(null, 'viewBox').split(' ');
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
  };

  const buildShapeTree$1 = $geometryNode => {
    const shape = Shape$$1.create();
    shape.key = $geometryNode.key;

    processAttributes$1($geometryNode, shape);
    // ^ TODO: we are also calling processAttributes further above, duplication!

    let pathCommands;

    switch ($geometryNode.tagName) {
      case 'rect':
        const x = Number($geometryNode.getAttributeNS(null, 'x'));
        const y = Number($geometryNode.getAttributeNS(null, 'y'));
        const width = Number($geometryNode.getAttributeNS(null, 'width'));
        const height = Number($geometryNode.getAttributeNS(null, 'height'));

        pathCommands = commands$1(`
        M ${x} ${y}
        H ${x + width}
        V ${y + height}
        H ${x}
        Z
      `);
        break;
      case 'path':
        pathCommands = commands$1($geometryNode.getAttributeNS(null, 'd'));
        break;
    }

    const pathSequences = sequences$1(pathCommands);

    for (let sequence of pathSequences) {
      shape.append(buildSplineTree$1(sequence));
    }

    return shape;
  };

  const buildSplineTree$1 = sequence => {
    const spline = Spline$$1.create();
    for (let segment of buildSegmentList$1(sequence)) {
      spline.append(segment);
    }

    return spline;
  };

  // helpers

  // we want a segment to have children 'handleIn', 'anchor' etc

  const buildSegmentList$1 = commands => {
    const segments = [];

    // the first command is ALWAYS an `M` command (no handles)
    segments[0] = Segment$$1.create();
    const child = Anchor$$1.create();
    child.payload.vector = Vector$$1.create(commands[0].x, commands[0].y);
    segments[0].append(child);

    for (let i = 1; i < commands.length; i += 1) {
      const command = commands[i];
      const prevSeg = segments[i - 1];
      const currSeg = Segment$$1.create();

      const anchor = Anchor$$1.create();
      anchor.payload.vector = Vector$$1.create(command.x, command.y);
      currSeg.append(anchor);

      if (command.x1 && command.x2) {
        const handleOut = HandleOut$$1.create();
        handleOut.payload.vector = Vector$$1.create(command.x1, command.y1);
        prevSeg.append(handleOut);

        const handleIn = HandleIn$$1.create();
        handleIn.payload.vector = Vector$$1.create(command.x2, command.y2);
        currSeg.append(handleIn);
      } else if (command.x1) {
        const handleIn = HandleIn$$1.create();
        handleIn.payload.vector = Vector$$1.create(command.x1, command.y1);
        currSeg.append(handleIn);
      }

      segments[i] = currSeg;
    }

    return segments;
  };

  const sequences$1 = svgCommands => {
    const MOVE = 2; // NOTE: constant is introduced by svg-pathdata module
    const theSequences = [];

    for (let command of svgCommands) {
      if (command.type === MOVE) {
        theSequences.push([command]);
      } else {
        theSequences[theSequences.length - 1].push(command);
      }
    }

    return theSequences;
  };

  const commands$1 = svgPath => {
    return new SVGPathData$1(svgPath)
      .transform(SVGPathDataTransformer.NORMALIZE_HVZ()) // no H, V or Z shortcuts
      .transform(SVGPathDataTransformer.NORMALIZE_ST()) // no S (smooth multi-Bezier)
      .transform(SVGPathDataTransformer.A_TO_C()) // no A (arcs)
      .toAbs().commands; // no relative commands
  };

  const domToSyntaxTree = $svg => {
    if ($svg instanceof SVGElement) {
      const node = SyntaxTree.create();
      return buildTree$2($svg, node);
    } else {
      return null;
    }
  };

  const buildTree$2 = ($node, node) => {
    if ($node.nodeName === '#text') {
      const tNode = SyntaxTree.create();
      tNode.markup = $node.nodeValue;
      node.children.push(tNode);
    } else {
      let openTag = `<${$node.nodeName}`;
      const attrs = [];
      for (let attr of $node.attributes) {
        attrs.push(`${attr.name}="${attr.value}"`);
      }
      openTag = [openTag, ...attrs].join(' ');
      openTag += '>';

      const closeTag = `</${$node.nodeName}>`;

      const openNode = SyntaxTree.create();
      const closeNode = SyntaxTree.create();

      openNode.markup = openTag;
      openNode.tag = $node.nodeName;
      closeNode.markup = closeTag;
      closeNode.tag = $node.nodeName;

      openNode.key = $node.key;
      closeNode.key = $node.key;

      node.children.push(openNode);

      if ($node.childNodes.length > 0) {
        const innerNode = SyntaxTree.create();

        for (let $child of $node.childNodes) {
          buildTree$2($child, innerNode);
        }

        node.children.push(innerNode);
      }

      node.children.push(closeNode);

      return node;
    }

    for (let $child of $node.childNodes) {
      node.children.push(buildTree$2($child));
    }

    return node;
  };

  const sceneToSyntaxTree = canvas => {
    const astRoot = SyntaxTree.create();
    parse(canvas, astRoot, 0);
    astRoot.indexify();
    return astRoot;
  };

  const parse = (sceneNode, astParent, level) => {
    const astNodes = sceneNode.toASTNodes();
    const open = astNodes.open;
    const close = astNodes.close;
    open.level = level;
    close.level = level;

    // indent
    const pad = indent(level);
    const indentNode = SyntaxTree.create();
    indentNode.markup = pad;
    astParent.children.push(indentNode);

    // open tag
    astParent.children.push(open);

    // linebreak
    const tNode = SyntaxTree.create();
    tNode.markup = '\n';
    astParent.children.push(tNode);

    if (sceneNode.graphicsChildren.length > 0) {
      const astNode = SyntaxTree.create();
      astParent.children.push(astNode);

      for (let sceneChild of sceneNode.graphicsChildren) {
        parse(sceneChild, astNode, level + 1);
      }
    }

    // indent
    astParent.children.push(indentNode);

    // close tag
    astParent.children.push(close);

    // linebreak
    astParent.children.push(tNode);
  };

  const indent = level => {
    let pad = '';

    for (let i = 0; i < level; i += 1) {
      pad += '  ';
    }

    return pad;
  };

  const h = (tag, props = {}, ...children) => {
    return {
      tag: tag,
      props: props,
      children: children || [],
    };
  };

  const tools$$1 = store => {
    return h(
      'ul',
      { id: 'buttons' },
      h(
        'li',
        {},
        h(
          'button',
          {
            id: 'newDocButton',
            class: 'pure-button',
            'data-type': 'newDocButton',
          },
          'New'
        )
      ),
      docs(store),
      h(
        'li',
        {},
        h(
          'button',
          {
            id: 'getPrevious',
            'data-type': 'getPrevious',
            class: 'pure-button',
          },
          'Undo'
        )
      ),
      h(
        'li',
        {},
        h(
          'button',
          {
            id: 'getNext',
            'data-type': 'getNext',
            class: 'pure-button',
          },
          'Redo'
        )
      ),
      h(
        'li',
        {},
        h(
          'button',
          {
            id: 'selectButton',
            'data-type': 'selectButton',
            class: 'pure-button',
          },
          'Select'
        )
      ),
      h(
        'li',
        {},
        h(
          'button',
          {
            id: 'penButton',
            'data-type': 'penButton',
            class: 'pure-button',
          },
          'Pen'
        )
      )
    );
  };

  const docs = store => {
    const vDocs = h('ul', {
      id: 'docs',
      class: 'pure-menu-children doc-list',
    });

    const docs = store.docs;

    for (let identifier of docs.children) {
      vDocs.children.push(
        h(
          'li',
          {
            class: 'pure-menu-item',
          },
          h(
            'a',
            {
              class: 'pure-menu-link',
              'data-key': identifier.payload._id,
              'data-type': 'doc-identifier',
            },
            identifier.payload._id
          )
          //  TODO: This is where we would need to put the *name* of the document.
        )
      );
    }

    const container = h(
      'div',
      { class: 'pure-menu pure-menu-horizontal' },
      h(
        'ul',
        { class: 'pure-menu-list' },
        h(
          'li',
          {
            class: 'pure-menu-item pure-menu-has-children pure-menu-allow-hover',
          },
          h('a', { href: '#', id: 'menuLink1', class: 'pure-menu-link' }, 'Open'),
          vDocs
        )
      )
    );

    return container;
  };

  // not needed atm

  const message = store => {
    return store.message.payload.text;
  };

  const LENGTHS_IN_PX = {
    cornerSideLength: 8,
    dotDiameter: 18,
    controlDiameter: 6,
  };

  const canvas$$1 = store => {
    return renderScene(store);
  };

  const renderScene = store => {
    if (store.canvas === null) {
      return '';
    }

    return buildTree$3(store.canvas);
  };

  const buildTree$3 = (node, vParent = null) => {
    const vNode = node.toVDOMNode();

    if (vParent) {
      const vWrapper = wrap(vNode, node);
      vParent.children.push(vWrapper);
    }

    for (let child of node.graphicsChildren) {
      buildTree$3(child, vNode);
    }

    return vNode;
  };

  // push curves here
  const wrap = (vNode, node) => {
    const vWrapper = h('g', {
      'data-type': `${node.type}-wrapper`,
      'data-key': node.key,
    });

    vWrapper.children.push(vNode);

    if (node.type === 'shape') {
      vWrapper.children.push(curves(node));
      vWrapper.children.push(innerUI(node));
    }

    vWrapper.children.push(outerUI(node));

    return vWrapper;
  };

  const curves = node => {
    const diameter = scale$2(node, LENGTHS_IN_PX.controlDiameter);
    const radius = diameter / 2;

    const vParts = node.toVDOMCurves();
    const splitter = h('circle', {
      'data-type': 'splitter',
      r: radius,
      cx: node.splitter.x,
      cy: node.splitter.y,
      transform: node.transform.toString(),
    });

    return h(
      'g',
      {
        'data-type': 'curves',
        'data-key': node.key,
      },
      ...vParts,
      splitter
    );
  };

  const outerUI = node => {
    const vOuterUI = h('g', {
      'data-type': 'outerUI',
      'data-key': node.key,
    });

    const vFrame = frame(node);
    const vDots = dots(node); // for rotation UI
    const vCorners = corners(node); // for scaling UI

    vOuterUI.children.push(vFrame);

    for (let vDot of vDots) {
      vOuterUI.children.push(vDot);
    }

    for (let vCorner of vCorners) {
      vOuterUI.children.push(vCorner);
    }

    return vOuterUI;
  };

  const corners = node => {
    const vTopLCorner = h('rect');
    const vBotLCorner = h('rect');
    const vTopRCorner = h('rect');
    const vBotRCorner = h('rect');
    const vCorners = [vTopLCorner, vBotLCorner, vTopRCorner, vBotRCorner];
    const length = scale$2(node, LENGTHS_IN_PX.cornerSideLength);

    for (let vCorner of vCorners) {
      Object.assign(vCorner.props, {
        'data-type': 'corner',
        'data-key': node.key,
        transform: node.transform.toString(),
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
  };

  const dots = node => {
    const vTopLDot = h('circle');
    const vBotLDot = h('circle');
    const vTopRDot = h('circle');
    const vBotRDot = h('circle');
    const vDots = [vTopLDot, vBotLDot, vTopRDot, vBotRDot];
    const diameter = scale$2(node, LENGTHS_IN_PX.dotDiameter);
    const radius = diameter / 2;

    for (let vDot of vDots) {
      Object.assign(vDot.props, {
        'data-type': 'dot',
        'data-key': node.key,
        transform: node.transform.toString(),
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
  };

  const frame = node => {
    return h('rect', {
      'data-type': 'frame',
      x: node.bounds.x,
      y: node.bounds.y,
      width: node.bounds.width,
      height: node.bounds.height,
      transform: node.transform.toString(),
      'data-key': node.key,
    });
  };

  const innerUI = node => {
    const spline = node.children[0];

    const vInnerUI = h('g', {
      'data-type': 'innerUI',
      'data-key': node.key,
    });

    const vConnections = connections(node);

    for (let vConnection of vConnections) {
      vInnerUI.children.push(vConnection);
    }

    const vControls = controls(node);

    for (let vControl of vControls) {
      vInnerUI.children.push(vControl);
    }

    return vInnerUI;
  };

  const connections = node => {
    const vConnections = [];

    for (let spline of node.children) {
      for (let segment of spline.children) {
        for (let handle of ['handleIn', 'handleOut']) {
          if (segment[handle] !== null) {
            vConnections.push(connection(node, segment.anchor, segment[handle]));
          }
        }
      }
    }

    return vConnections;
  };

  const connection = (node, anchor, handle) => {
    return h('line', {
      x1: anchor.x,
      y1: anchor.y,
      x2: handle.x,
      y2: handle.y,
      transform: node.transform.toString(),
    });
  };

  const controls = pathNode => {
    const vControls = [];
    const diameter = scale$2(pathNode, LENGTHS_IN_PX.controlDiameter);

    for (let spline of pathNode.children) {
      for (let segment of spline.children) {
        for (let aControl of segment.children) {
          vControls.push(control(pathNode, aControl, diameter));
        }
      }
    }

    return vControls;
  };

  const control = (pathNode, controlNode, diameter) => {
    return h('circle', {
      'data-type': 'control',
      'data-key': controlNode.key,
      transform: pathNode.transform.toString(),
      r: diameter / 2,
      cx: controlNode.vector.x,
      cy: controlNode.vector.y,
      class: controlNode.class.toString(), // add 'pen' to node that is being edited
    });
  };

  const scale$2 = (node, length) => {
    return length / node.globalScaleFactor();
  };

  const exportToVDOM$$1 = state => {
    return {
      tools: tools$$1(state.store),
      // editor:   editor(state),     // not needed atm
      message: message(state.store),
      canvas: canvas$$1(state.store),
    };
  };

  const exportToPlain = store => {
    return {
      doc: JSON.parse(JSON.stringify(store.doc)),
      docs: store.docs.children.map(child => child.payload.id),
      // ^ TODO: I think we don't need `docs`
    };
  };

  const exportToSVG = store => {
    const markup = [];
    const vNode = buildSceneNode(store.canvas);

    return convertToMarkup(markup, vNode, 0);
  };

  const buildSceneNode = (node, svgParent = null) => {
    const svgNode = node.toSVGNode();

    if (svgParent) {
      svgParent.children.push(svgNode);
    }

    for (let child of node.graphicsChildren) {
      buildSceneNode(child, svgNode);
    }

    return svgNode;
  };

  const convertToMarkup = (markup, svgNode, level) => {
    appendOpenTag(markup, svgNode, level);
    for (let child of svgNode.children) {
      convertToMarkup(markup, child, level + 1);
    }
    appendCloseTag(markup, svgNode, level);

    return markup.join('');
  };

  const appendOpenTag = (markup, svgNode, level) => {
    const tag = [];

    for (let i = 0; i < level; i += 1) {
      tag.push('  ');
    }

    tag.push('<');
    tag.push(svgNode.tag);

    const propsList = [];

    for (let [key, value] of Object.entries(svgNode.props)) {
      propsList.push(`${key}="${value}"`);
    }

    if (propsList.length > 0) {
      tag.push(' ');
    }

    tag.push(propsList.join(' '));

    tag.push('>');

    // if (svgNode.tag !== 'path') {
    tag.push('\n');
    // }

    markup.push(tag.join(''));
  };

  const appendCloseTag = (markup, svgNode, level) => {
    const tag = [];

    // if (svgNode.tag !== 'path') {
    for (let i = 0; i < level; i += 1) {
      tag.push('  ');
    }
    // }

    tag.push('</');
    tag.push(svgNode.tag);
    tag.push('>');
    tag.push('\n');

    markup.push(tag.join(''));
  };

  const State = {
    create() {
      return Object.create(State).init();
    },

    init() {
      this.label = 'start';
      this.input = {};
      this.update = '';
      this.store = this.buildStore();
      this.syntaxTree = SyntaxTree.create(); // TODO: make a part of buildStore

      return this;
    },

    buildStore() {
      const store = Store$$1.create();
      const docs = Docs$$1.create();
      const message = this.buildMessage();
      const doc = this.buildDoc();

      store.append(docs);
      store.append(doc);
      store.append(message);

      return store;
    },

    buildMessage() {
      const message = Message$$1.create();
      message.payload.text = 'Welcome!';
      return message;
    },

    buildDoc() {
      const doc = Doc$$1.create();
      const canvas = Canvas$$1.create();
      canvas.viewBox = Rectangle$$1.createFromDimensions(0, 0, 600, 395);
      doc.append(canvas);

      return doc;
    },

    get canvas() {
      return this.store.canvas;
    },

    get doc() {
      return this.store.doc;
    },

    get docs() {
      return this.store.docs;
    },

    get message() {
      return this.store.message;
    },

    export() {
      return {
        label: this.label,
        input: this.input,
        update: this.update,
        vDOM: this.exportToVDOM(),
        plain: this.exportToPlain(),
        syntaxTree: this.syntaxTree,
      };
    },

    objectToDoc(object) {
      return objectToDoc(object);
    },

    markupToDOM(markup) {
      return markupToDOM(markup);
    },

    domToScene($svg) {
      return domToScene($svg);
    },

    domToSyntaxTree($svg) {
      return domToSyntaxTree($svg);
    },

    sceneToSyntaxTree() {
      return sceneToSyntaxTree(this.store.canvas);
    },

    // returns a Canvas node
    markupToScene(markup) {
      return markupToScene(markup);
    },

    exportToSVG() {
      return exportToSVG(this.store);
    },

    // returns a Doc node and a list of ids (for docs)
    exportToVDOM() {
      return exportToVDOM$$1(this);
    },

    exportToAST() {
      return exportToAST(this);
    },

    // returns a plain representation of Doc node and a list of ids (for docs)
    exportToPlain() {
      return exportToPlain(this.store);
    },
  };

  // NOTE: 'type' (the event type) is mandatory. 'from', 'target' (the target type), 'to' and `do` are optional

  const transitions = [
    // KICKOFF
    {
      from: 'start',
      type: 'go',
      do: 'go',
      to: 'selectMode',
    },

    // TOOLS

    // create new document
    {
      type: 'click',
      target: 'newDocButton',
      do: 'createDoc',
      to: 'selectMode',
    },

    // request stored document
    {
      type: 'click',
      target: 'doc-identifier',
      do: 'requestDoc',
    },

    // switch to select mode
    {
      type: 'click',
      target: 'selectButton',
      do: 'cleanup',
      to: 'selectMode',
    },

    // switch to pen mode
    {
      type: 'click',
      target: 'penButton',
      do: 'cleanup',
      to: 'penMode',
    },

    // trigger undo
    {
      type: 'click',
      target: 'getPrevious',
      do: 'getPrevious',
      to: 'selectMode',
    },

    // trigger redo
    {
      type: 'click',
      target: 'getNext',
      do: 'getNext',
      to: 'selectMode',
    },

    // INPUT MODES

    {
      type: 'keydown',
      target: 'esc',
      do: 'exitEdit',
    },

    // SELECT MODE

    // focus shape on hover
    {
      from: 'selectMode',
      type: 'mousemove',
      do: 'focus',
    },

    // open a group or shape
    {
      from: 'selectMode',
      type: 'dblclick',
      target: ['shape', 'group', 'canvas'],
      do: 'deepSelect',
    },

    // initiate shift transformation
    {
      from: 'selectMode',
      type: 'mousedown',
      target: ['shape', 'group', 'canvas'],
      do: 'select',
      to: 'shifting',
    },

    // initate rotate transformation
    {
      from: 'selectMode',
      type: 'mousedown',
      target: 'dot',
      do: 'initTransform',
      to: 'rotating',
    },

    // initiate scale transformation
    {
      from: 'selectMode',
      type: 'mousedown',
      target: 'corner',
      do: 'initTransform',
      to: 'scaling',
    },

    // shift the shape
    {
      from: 'shifting',
      type: 'mousemove',
      do: 'shift',
    },

    // finalize shift translation
    {
      from: 'shifting',
      type: 'mouseup',
      do: 'release',
      to: 'selectMode',
    },

    // rotate the shape
    {
      from: 'rotating',
      type: 'mousemove',
      do: 'rotate',
    },

    // finalize rotate transformation
    {
      from: 'rotating',
      type: 'mouseup',
      do: 'release',
      to: 'selectMode',
    },

    // scale the shape
    {
      from: 'scaling',
      type: 'mousemove',
      do: 'scale',
    },

    // finalize scale transformation
    {
      from: 'scaling',
      type: 'mouseup',
      do: 'release',
      to: 'selectMode',
    },

    // PEN MODE

    // add segment to (current or new) shape
    {
      from: 'penMode',
      type: 'mousedown',
      target: ['shape', 'group', 'canvas'],
      do: 'addSegment',
      to: 'settingHandles',
    },

    // set handles for current segment
    {
      from: 'settingHandles',
      type: 'mousemove',
      do: 'setHandles',
      to: 'settingHandles',
    },

    // finish up setting handles
    {
      from: 'settingHandles',
      type: 'mouseup',
      do: 'releasePen',
      to: 'penMode',
    },

    // initiate editing of segment
    {
      from: 'penMode',
      type: 'mousedown',
      target: 'control', // TODO: ['anchor', 'handleIn', 'handleOut']
      do: 'initEditSegment',
      to: 'editingSegment',
    },

    // edit segment
    {
      from: 'editingSegment',
      type: 'mousemove',
      do: 'editSegment',
      to: 'editingSegment',
    },

    // finish up editing segment
    {
      from: 'editingSegment',
      type: 'mouseup',
      do: 'releasePen',
      to: 'penMode',
    },

    // place split point
    {
      from: 'penMode',
      type: 'mousemove',
      target: 'curve',
      do: 'projectInput',
      to: 'penMode',
    },

    // hide split point

    {
      from: 'penMode',
      type: 'mouseout',
      target: 'curve',
      do: 'hideSplitter',
      to: 'penMode',
    },

    // split curve

    {
      from: 'penMode',
      type: 'mousedown',
      target: 'curve',
      do: 'splitCurve',
      to: 'editingSegment',
    },

    // EDITOR

    // process editor input (=> from editor module)
    {
      type: 'userChangedMarkup',
      do: 'userChangedMarkup',
    },

    {
      type: 'userChangedEditorSelection',
      do: 'userChangedEditorSelection',
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

  transitions.get = function(state, input) {
    const isMatch = row => {
      const from = row.from;
      const type = row.type;
      const target = row.target;

      const stateMatch = from === state.label || from === undefined;
      const typeMatch = type === input.type;
      // const targetMatch = target === input.target || target === undefined;

      const targetMatch =
        (Array.isArray(target) && target.includes(input.target)) ||
        (typeof target === 'string' && target === input.target) ||
        target === undefined;

      return stateMatch && typeMatch && targetMatch;
    };

    const match = transitions.find(isMatch);

    if (match) {
      return {
        do: match.do,
        to: match.to || state.label,
      };
    }
  };

  const updates = {
    init() {
      this.aux = {};
    },

    after(state, input) {
      if (input.source === 'canvas') {
        // => scenegraph to syntaxtree
        state.syntaxTree = state.sceneToSyntaxTree();
      }
    },

    // SELECTION

    focus(state, input) {
      state.canvas.removeFocus();
      const target = state.canvas.findDescendantByKey(input.key);
      const hit = Vector$$1.create(input.x, input.y);

      if (target) {
        const toFocus = target.findAncestorByClass('frontier');

        if (toFocus && toFocus.contains(hit)) {
          toFocus.focus();
        }
      }
    },

    select(state, input) {
      const node = state.canvas.findFocus();

      if (node) {
        node.select();
        this.initTransform(state, input);
      } else {
        state.canvas.removeSelection();
      }
    },

    deepSelect(state, input) {
      const target = state.canvas.findDescendantByKey(input.key);

      if (!target) {
        return;
      }

      // TODO
      if (target.class.includes('frontier')) {
        // select in shape => TODO: selection mechanism
        target.edit();
        state.canvas.removeFocus();
        state.label = 'penMode';
      } else {
        // select in group
        const toSelect = target.findAncestor(node => {
          return node.parent && node.parent.class.includes('frontier');
        });

        if (toSelect) {
          toSelect.select();
          state.canvas.updateFrontier(); // TODO: why do we need to do this?
          state.canvas.removeFocus();
        }
      }
    },

    // TODO: cleanup and release do something very similar
    release(state, input) {
      const current = state.canvas.findSelection() || state.canvas.findEditing();

      if (current) {
        state.canvas.globallyUpdateBounds(current);
      }

      this.aux = {};
    },

    cleanup(state, event) {
      const current = state.canvas.findEditing();

      if (current) {
        state.canvas.globallyUpdateBounds(current);
      }

      state.canvas.removeSelection();
      state.canvas.removeEditing();
      this.aux = {};
    },

    // TODO
    // triggered by escape key
    exitEdit(state, input) {
      if (state.label === 'penMode') {
        const target = state.canvas.findEditing();
        this.cleanup(state, input);
        target.select();
        state.label = 'selectMode';
      } else if (state.label === 'selectMode') {
        this.cleanup(state, input);
      }
    },

    // TRANSFORMS

    initTransform(state, input) {
      const node = state.canvas.findSelection();
      this.aux.from = Vector$$1.create(input.x, input.y);
      this.aux.center = node.bounds.center.transform(node.globalTransform());
    },

    shift(state, input) {
      const node = state.canvas.findSelection();

      if (!node) {
        return;
      }

      const to = Vector$$1.create(input.x, input.y);
      const from = this.aux.from;
      const offset = to.minus(from);

      node.translate(offset);

      this.aux.from = to;
    },

    rotate(state, input) {
      const node = state.canvas.findSelection();

      if (!node) {
        return;
      }

      const to = Vector$$1.create(input.x, input.y);
      const from = this.aux.from;
      const center = this.aux.center;
      const angle = center.angle(from, to);

      node.rotate(angle, center);

      this.aux.from = to;
    },

    scale(state, input) {
      const node = state.canvas.findSelection();

      if (!node) {
        return;
      }

      const to = Vector$$1.create(input.x, input.y);
      const from = this.aux.from;
      const center = this.aux.center;
      const factor = to.minus(center).length() / from.minus(center).length();

      node.scale(factor, center);

      this.aux.from = to;
    },

    // PEN

    // TODO
    addSegment(state, input) {
      let shape;
      let spline;

      if (state.canvas.findEditing()) {
        shape = state.canvas.findEditing();
        spline = shape.lastChild;
      } else {
        shape = Shape$$1.create();
        state.canvas.append(shape);
        spline = Spline$$1.create();
        shape.append(spline);
        shape.edit();
      }

      const segment = Segment$$1.create();
      spline.append(segment);

      const anchor = Anchor$$1.create();
      segment.append(anchor);
      anchor.placePen();

      anchor.payload.vector = Vector$$1.create(input.x, input.y).transformToLocal(
        shape
      );

      this.aux.shape = shape;
      this.aux.segment = segment;
    },

    setHandles(state, input) {
      const shape = this.aux.shape;
      const segment = this.aux.segment;

      const anchor = segment.anchor;
      const handleIn = Vector$$1.create(input.x, input.y).transformToLocal(shape);
      // ^ TODO: not a node, but a vector!
      const handleOut = handleIn.rotate(Math.PI, anchor);
      // ^ TODO: not a node, but a vector!
      segment.handleIn = handleIn;
      segment.handleOut = handleOut;

      // TODO: segment.handleIn should be a node, not a vector.
      // anything else is confusing.

    },

    initEditSegment(state, input) {
      const control = state.canvas.findDescendantByKey(input.key);
      const shape = control.parent.parent.parent;
      const from = Vector$$1.create(input.x, input.y).transformToLocal(shape);

      this.aux.from = from;
      this.aux.control = control;
    },

    editSegment(state, input) {
      const control = this.aux.control;
      const from = this.aux.from;
      const segment = control.parent;
      const shape = segment.parent.parent;
      const to = Vector$$1.create(input.x, input.y).transformToLocal(shape);
      const change = to.minus(from);
      control.payload.vector = control.payload.vector.add(change);

      switch (control.type) {
        case 'anchor':
          if (segment.handleIn) {
            segment.handleIn = segment.handleIn.add(change);
          }
          if (segment.handleOut) {
            segment.handleOut = segment.handleOut.add(change);
          }
          break;
        case 'handleIn':
          segment.handleOut = segment.handleIn.rotate(Math.PI, segment.anchor);
          break;
        case 'handleOut':
          segment.handleIn = segment.handleOut.rotate(Math.PI, segment.anchor);
          break;
      }

      this.aux.from = to;
    },

    // find point on curve
    projectInput(state, input) {
      const startSegment = state.canvas.findDescendantByKey(input.key);
      const spline = startSegment.parent;
      const shape = spline.parent;
      const startIndex = spline.children.indexOf(startSegment);
      const endSegment = spline.children[startIndex + 1];
      const curve = Curve$$1.createFromSegments(startSegment, endSegment);
      const bCurve = new Bezier$1(...curve.coords());

      const from = Vector$$1.create(input.x, input.y).transformToLocal(shape);
      const pointOnCurve = bCurve.project({ x: from.x, y: from.y });
      shape.splitter = Vector$$1.createFromObject(pointOnCurve);

      this.aux.spline = spline;
      this.aux.splitter = shape.splitter;
      this.aux.startSegment = startSegment;
      this.aux.endSegment = endSegment;
      this.aux.insertionIndex = startIndex + 1;
      this.aux.bCurve = bCurve;
      this.aux.curveTime = pointOnCurve.t;
      this.aux.from = from;
    },

    splitCurve(state, input) {
      const spline = this.aux.spline;
      const newAnchor = this.aux.splitter; // careful: a vector, not a node!
      const startSegment = this.aux.startSegment;
      const endSegment = this.aux.endSegment;
      const insertionIndex = this.aux.insertionIndex;
      const bCurve = this.aux.bCurve;
      const curveTime = this.aux.curveTime;

      const splitCurves = bCurve.split(curveTime);
      const left = splitCurves.left;
      const right = splitCurves.right;
      const newSegment = Segment$$1.create();
      newSegment.anchor = newAnchor;
      newSegment.handleIn = Vector$$1.createFromObject(left.points[2]);
      newSegment.handleOut = Vector$$1.createFromObject(right.points[1]);
      startSegment.handleOut = Vector$$1.createFromObject(left.points[1]);
      endSegment.handleIn = Vector$$1.createFromObject(right.points[2]);

      spline.insertChild(newSegment, insertionIndex);

      this.aux.control = newSegment.findDescendant(
        node => node.type === 'anchor'
      );
      this.hideSplitter(state, input);
      this.editSegment(state, input);
    },

    hideSplitter(state, input) {
      const segment = state.canvas.findDescendantByKey(input.key);
      const shape = segment.parent.parent;
      shape.splitter = Vector$$1.create(-1000, -1000);
    },

    // DOCUMENT MANAGEMENT

    createDoc(state, input) {
      state.doc.replaceWith(state.buildDoc());
    },

    updateDocList(state, input) {
      state.docs.children = [];

      for (let id of input.data.docIDs) {
        const identNode = Identifier$$1.create();
        identNode.payload._id = id;
        state.docs.append(identNode);
      }
    },

    getPrevious(state, input) {
      window.history.back(); // TODO: shouldn't we do this inside of hist?
    },

    getNext(state, input) {
      window.history.forward(); // TODO: shouldn't we do this inside of hist?
    },

    switchDocument(state, input) {
      state.canvas.replaceWith(state.objectToDoc(input.data.doc));
      this.cleanup(state, input);
    },

    // MESSAGES

    setSavedMessage(state, input) {
      state.message.payload.text = 'Saved';
    },

    wipeMessage(state, input) {
      state.message.payload.text = '';
    },

    // EDITOR

    userChangedEditorSelection(state, input) {
      this.cleanup(state, input);

      let syntaxTreeNode;
      let sceneGraphNode;

      syntaxTreeNode = state.syntaxTree.findNodeByIndex(input.index);

      if (syntaxTreeNode) {
        sceneGraphNode = state.canvas.findDescendantByKey(syntaxTreeNode.key);
      }

      if (sceneGraphNode) {
        sceneGraphNode.select();
      }

      state.label = 'selectMode';
    },

    // => "syntaxtree to scenegraph"
    userChangedMarkup(state, input) {
      const $svg = state.markupToDOM(input.value);

      if ($svg) {
        const syntaxTree = state.domToSyntaxTree($svg);
        syntaxTree.indexify();

        state.syntaxTree = syntaxTree;
        state.canvas.replaceWith(state.domToScene($svg));
      } else {
        console.log('cannot update scenegraph and syntaxtree');
      }
    },
  };

  const core = {
    init() {
      updates.init();

      this.state = State.create();
      this.modules = [];

      return this;
    },

    attach(name, func) {
      this.modules[name] = func;
    },

    compute(input) {
      // console.log(this.state);

      this.state.input = input;

      const transition = transitions.get(this.state, input);

      if (transition) {
        this.state.update = transition.do;
        this.state.label = transition.to;

        const update = updates[transition.do];

        if (update) {
          update.bind(updates)(this.state, input);
          updates.after(this.state, input);
        }

        this.publish();
      }
    },

    publish() {
      for (let key of Object.keys(this.modules)) {
        this.modules[key](this.state.export());
      }
    },

    kickoff() {
      this.compute({ type: 'go' });
    },
  };

  const db = {
    init(state) {
      this.name = 'db';
      return this;
    },

    bindEvents(func) {
      window.addEventListener('upsertDoc', event => {
        const request = new XMLHttpRequest();

        request.addEventListener('load', () => {
          func({
            source: this.name,
            type: 'docSaved',
            data: {},
          });
        });

        request.open('POST', '/docs/' + event.detail._id);
        request.send(JSON.stringify(event.detail));
      });

      window.addEventListener('readDoc', event => {
        const request = new XMLHttpRequest();

        request.addEventListener('load', () => {
          func({
            source: this.name,
            type: 'switchDocument',
            data: {
              doc: request.response,
            },
          });
        });

        request.open('GET', '/docs/' + event.detail);
        request.responseType = 'json';
        request.send();
      });

      window.addEventListener('loadDocIDs', event => {
        const request = new XMLHttpRequest();

        request.addEventListener('load', () => {
          func({
            source: this.name,
            type: 'updateDocList',
            data: {
              docIDs: request.response,
            },
          });
        });

        request.open('GET', '/ids');
        request.responseType = 'json';
        request.send();
      });
    },

    react(state) {
      if (state.update === 'go') {
        window.dispatchEvent(new Event('loadDocIDs'));
      } else if (state.update === 'requestDoc') {
        window.dispatchEvent(
          new CustomEvent('readDoc', { detail: state.input.key })
        );
      } else if (
        ['release', 'releasePen', 'changeMarkup'].includes(state.update)
      ) {
        window.dispatchEvent(
          new CustomEvent('upsertDoc', { detail: state.plain.doc })
        );
      }

      this.previous = state;
    },
  };

  const hist = {
    init() {
      this.name = 'hist';
      return this;
    },

    bindEvents(func) {
      window.addEventListener('popstate', event => {
        if (event.state) {
          func({
            source: this.name,
            type: 'switchDocument',
            data: event.state,
          });
        }
      });
    },

    react(state) {
      if (this.isRelevant(state.update)) {
        window.history.pushState(state.plain, 'entry');
      }
    },

    isRelevant(update) {
      const release = update === 'release';
      const releasePen = update === 'releasePen';
      const go = update === 'go';
      const changeMarkup = update === 'changeMarkup';

      return release || releasePen || go || changeMarkup;
    },
  };

  const UIModule = {
    init(state) {
      this.mountPoint = document.querySelector(`#${this.name}`);
      this.dom = this.createElement(state.vDOM[this.name]);
      this.previousVDOM = state.vDOM[this.name];

      this.mount();
    },

    mount() {
      this.mountPoint.innerHTML = '';
      this.mountPoint.appendChild(this.dom);
    },

    react(state) {
      this.reconcile(this.previousVDOM, state.vDOM[this.name], this.dom);
      this.previousVDOM = state.vDOM[this.name];
    },

    createElement(vNode) {
      if (typeof vNode === 'string') {
        return document.createTextNode(vNode);
      }

      const $node = document.createElement(vNode.tag);

      for (let [key, value] of Object.entries(vNode.props)) {
        $node.setAttribute(key, value);
      }

      for (let vChild of vNode.children) {
        $node.appendChild(this.createElement(vChild));
      }

      return $node;
    },

    reconcile(oldVNode, newVNode, $node) {
      if (typeof newVNode === 'string') {
        if (newVNode !== oldVNode) {
          $node.replaceWith(this.createElement(newVNode));
        }
      } else if (oldVNode.tag !== newVNode.tag) {
        $node.replaceWith(this.createElement(newVNode));
      } else {
        this.reconcileProps(oldVNode, newVNode, $node);
        this.reconcileChildren(oldVNode, newVNode, $node);
      }
    },

    reconcileProps(oldVNode, newVNode, $node) {
      for (let [key, value] of Object.entries(newVNode.props)) {
        if (oldVNode.props[key] !== newVNode.props[key]) {
          $node.setAttributeNS(null, key, value);
        }
      }

      for (let [key, value] of Object.entries(oldVNode.props)) {
        if (newVNode.props[key] === undefined) {
          $node.removeAttributeNS(null, key);
        }
      }
    },

    reconcileChildren(oldVNode, newVNode, $node) {
      const maxLength = Math.max(
        oldVNode.children.length,
        newVNode.children.length
      );

      let $index = 0;

      for (let vIndex = 0; vIndex < maxLength; vIndex += 1) {
        const oldVChild = oldVNode.children[vIndex];
        const newVChild = newVNode.children[vIndex];
        const $child = $node.childNodes[$index];

        if (newVChild === undefined) {
          $child && $child.remove();
          $index -= 1;
        } else if (oldVChild === undefined) {
          $node.appendChild(this.createElement(newVChild));
        } else {
          this.reconcile(oldVChild, newVChild, $child);
        }

        $index += 1;
      }
    },
  };

  const svgns = 'http://www.w3.org/2000/svg';
  const xmlns$1 = 'http://www.w3.org/2000/xmlns/';

  const canvas$1 = Object.assign(Object.create(UIModule), {
    init(state) {
      this.name = 'canvas';
      UIModule.init.bind(this)(state);
      return this;
    },

    bindEvents(func) {
      const mouseEvents = [
        'mousedown',
        'mousemove',
        'mouseup',
        'mouseout',
        'click',
        'dblclick',
      ];

      for (let eventType of mouseEvents) {
        this.mountPoint.addEventListener(eventType, event => {
          if (this.clickLike(event) && event.detail > 1) {
            event.stopPropagation();
            return;
          }

          // TODO: ugly
          if (event.type === 'mousedown') {
            const textarea = document.querySelector('textarea');
            if (textarea) {
              textarea.blur();
            }
          }

          event.preventDefault();

          func({
            source: this.name,
            type: event.type,
            target: event.target.dataset.type,
            key: event.target.dataset.key,
            x: this.coordinates(event).x,
            y: this.coordinates(event).y,
          });
        });
      }

      window.addEventListener('keydown', event => {
        if (event.keyCode === 27) {
          func({
            source: this.name,
            type: event.type,
            target: 'esc',
          });
        }
      });
    },

    createElement(vNode) {
      if (typeof vNode === 'string') {
        return document.createTextNode(vNode);
      }

      const $node = document.createElementNS(svgns, vNode.tag);

      for (let [key, value] of Object.entries(vNode.props)) {
        if (key === 'xmlns') {
          $node.setAttributeNS(xmlns$1, key, value);
        } else {
          $node.setAttributeNS(null, key, value);
        }
      }

      for (let vChild of vNode.children) {
        $node.appendChild(this.createElement(vChild));
      }

      return $node;
    },

    clickLike(event) {
      return (
        event.type === 'click' ||
        event.type === 'mousedown' ||
        event.type === 'mouseup'
      );
    },

    coordinates(event) {
      const coords = {};

      const svg = document.querySelector('svg');

      if (svg) {
        let point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        point = point.matrixTransform(svg.getScreenCTM().inverse());
        coords.x = point.x;
        coords.y = point.y;
      }

      return coords;
    },
  });

  // Kludges for bugs and behavior differences that can't be feature
  // detected are enabled based on userAgent etc sniffing.
  let userAgent = navigator.userAgent;
  let platform = navigator.platform;

  let gecko = /gecko\/\d/i.test(userAgent);
  let ie_upto10 = /MSIE \d/.test(userAgent);
  let ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(userAgent);
  let edge = /Edge\/(\d+)/.exec(userAgent);
  let ie = ie_upto10 || ie_11up || edge;
  let ie_version = ie && (ie_upto10 ? document.documentMode || 6 : +(edge || ie_11up)[1]);
  let webkit = !edge && /WebKit\//.test(userAgent);
  let qtwebkit = webkit && /Qt\/\d+\.\d+/.test(userAgent);
  let chrome = !edge && /Chrome\//.test(userAgent);
  let presto = /Opera\//.test(userAgent);
  let safari = /Apple Computer/.test(navigator.vendor);
  let mac_geMountainLion = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(userAgent);
  let phantom = /PhantomJS/.test(userAgent);

  let ios = !edge && /AppleWebKit/.test(userAgent) && /Mobile\/\w+/.test(userAgent);
  let android = /Android/.test(userAgent);
  // This is woefully incomplete. Suggestions for alternative methods welcome.
  let mobile = ios || android || /webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(userAgent);
  let mac = ios || /Mac/.test(platform);
  let chromeOS = /\bCrOS\b/.test(userAgent);
  let windows = /win/i.test(platform);

  let presto_version = presto && userAgent.match(/Version\/(\d*\.\d*)/);
  if (presto_version) presto_version = Number(presto_version[1]);
  if (presto_version && presto_version >= 15) { presto = false; webkit = true; }
  // Some browsers use the wrong event properties to signal cmd/ctrl on OS X
  let flipCtrlCmd = mac && (qtwebkit || presto && (presto_version == null || presto_version < 12.11));
  let captureRightClick = gecko || (ie && ie_version >= 9);

  function classTest(cls) { return new RegExp("(^|\\s)" + cls + "(?:$|\\s)\\s*") }

  let rmClass = function(node, cls) {
    let current = node.className;
    let match = classTest(cls).exec(current);
    if (match) {
      let after = current.slice(match.index + match[0].length);
      node.className = current.slice(0, match.index) + (after ? match[1] + after : "");
    }
  };

  function removeChildren(e) {
    for (let count = e.childNodes.length; count > 0; --count)
      e.removeChild(e.firstChild);
    return e
  }

  function removeChildrenAndAdd(parent, e) {
    return removeChildren(parent).appendChild(e)
  }

  function elt(tag, content, className, style) {
    let e = document.createElement(tag);
    if (className) e.className = className;
    if (style) e.style.cssText = style;
    if (typeof content == "string") e.appendChild(document.createTextNode(content));
    else if (content) for (let i = 0; i < content.length; ++i) e.appendChild(content[i]);
    return e
  }
  // wrapper for elt, which removes the elt from the accessibility tree
  function eltP(tag, content, className, style) {
    let e = elt(tag, content, className, style);
    e.setAttribute("role", "presentation");
    return e
  }

  let range;
  if (document.createRange) range = function(node, start, end, endNode) {
    let r = document.createRange();
    r.setEnd(endNode || node, end);
    r.setStart(node, start);
    return r
  };
  else range = function(node, start, end) {
    let r = document.body.createTextRange();
    try { r.moveToElementText(node.parentNode); }
    catch(e) { return r }
    r.collapse(true);
    r.moveEnd("character", end);
    r.moveStart("character", start);
    return r
  };

  function contains(parent, child) {
    if (child.nodeType == 3) // Android browser always returns false when child is a textnode
      child = child.parentNode;
    if (parent.contains)
      return parent.contains(child)
    do {
      if (child.nodeType == 11) child = child.host;
      if (child == parent) return true
    } while (child = child.parentNode)
  }

  function activeElt() {
    // IE and Edge may throw an "Unspecified Error" when accessing document.activeElement.
    // IE < 10 will throw when accessed while the page is loading or in an iframe.
    // IE > 9 and Edge will throw when accessed in an iframe if document.body is unavailable.
    let activeElement;
    try {
      activeElement = document.activeElement;
    } catch(e) {
      activeElement = document.body || null;
    }
    while (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.activeElement)
      activeElement = activeElement.shadowRoot.activeElement;
    return activeElement
  }

  function addClass(node, cls) {
    let current = node.className;
    if (!classTest(cls).test(current)) node.className += (current ? " " : "") + cls;
  }
  function joinClasses(a, b) {
    let as = a.split(" ");
    for (let i = 0; i < as.length; i++)
      if (as[i] && !classTest(as[i]).test(b)) b += " " + as[i];
    return b
  }

  let selectInput = function(node) { node.select(); };
  if (ios) // Mobile Safari apparently has a bug where select() is broken.
    selectInput = function(node) { node.selectionStart = 0; node.selectionEnd = node.value.length; };
  else if (ie) // Suppress mysterious IE10 errors
    selectInput = function(node) { try { node.select(); } catch(_e) {} };

  function bind(f) {
    let args = Array.prototype.slice.call(arguments, 1);
    return function(){return f.apply(null, args)}
  }

  function copyObj(obj, target, overwrite) {
    if (!target) target = {};
    for (let prop in obj)
      if (obj.hasOwnProperty(prop) && (overwrite !== false || !target.hasOwnProperty(prop)))
        target[prop] = obj[prop];
    return target
  }

  // Counts the column offset in a string, taking tabs into account.
  // Used mostly to find indentation.
  function countColumn(string, end, tabSize, startIndex, startValue) {
    if (end == null) {
      end = string.search(/[^\s\u00a0]/);
      if (end == -1) end = string.length;
    }
    for (let i = startIndex || 0, n = startValue || 0;;) {
      let nextTab = string.indexOf("\t", i);
      if (nextTab < 0 || nextTab >= end)
        return n + (end - i)
      n += nextTab - i;
      n += tabSize - (n % tabSize);
      i = nextTab + 1;
    }
  }

  class Delayed {
    constructor() {this.id = null;}
    set(ms, f) {
      clearTimeout(this.id);
      this.id = setTimeout(f, ms);
    }
  }

  function indexOf(array, elt) {
    for (let i = 0; i < array.length; ++i)
      if (array[i] == elt) return i
    return -1
  }

  // Number of pixels added to scroller and sizer to hide scrollbar
  let scrollerGap = 30;

  // Returned or thrown by various protocols to signal 'I'm not
  // handling this'.
  let Pass = {toString: function(){return "CodeMirror.Pass"}};

  // Reused option objects for setSelection & friends
  let sel_dontScroll = {scroll: false}, sel_mouse = {origin: "*mouse"}, sel_move = {origin: "+move"};

  // The inverse of countColumn -- find the offset that corresponds to
  // a particular column.
  function findColumn(string, goal, tabSize) {
    for (let pos = 0, col = 0;;) {
      let nextTab = string.indexOf("\t", pos);
      if (nextTab == -1) nextTab = string.length;
      let skipped = nextTab - pos;
      if (nextTab == string.length || col + skipped >= goal)
        return pos + Math.min(skipped, goal - col)
      col += nextTab - pos;
      col += tabSize - (col % tabSize);
      pos = nextTab + 1;
      if (col >= goal) return pos
    }
  }

  let spaceStrs = [""];
  function spaceStr(n) {
    while (spaceStrs.length <= n)
      spaceStrs.push(lst(spaceStrs) + " ");
    return spaceStrs[n]
  }

  function lst(arr) { return arr[arr.length-1] }

  function map(array, f) {
    let out = [];
    for (let i = 0; i < array.length; i++) out[i] = f(array[i], i);
    return out
  }

  function insertSorted(array, value, score) {
    let pos = 0, priority = score(value);
    while (pos < array.length && score(array[pos]) <= priority) pos++;
    array.splice(pos, 0, value);
  }

  function nothing() {}

  function createObj(base, props) {
    let inst;
    if (Object.create) {
      inst = Object.create(base);
    } else {
      nothing.prototype = base;
      inst = new nothing();
    }
    if (props) copyObj(props, inst);
    return inst
  }

  let nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
  function isWordCharBasic(ch) {
    return /\w/.test(ch) || ch > "\x80" &&
      (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch))
  }
  function isWordChar(ch, helper) {
    if (!helper) return isWordCharBasic(ch)
    if (helper.source.indexOf("\\w") > -1 && isWordCharBasic(ch)) return true
    return helper.test(ch)
  }

  function isEmpty(obj) {
    for (let n in obj) if (obj.hasOwnProperty(n) && obj[n]) return false
    return true
  }

  // Extending unicode characters. A series of a non-extending char +
  // any number of extending chars is treated as a single unit as far
  // as editing and measuring is concerned. This is not fully correct,
  // since some scripts/fonts/browsers also treat other configurations
  // of code points as a group.
  let extendingChars = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/;
  function isExtendingChar(ch) { return ch.charCodeAt(0) >= 768 && extendingChars.test(ch) }

  // Returns a number from the range [`0`; `str.length`] unless `pos` is outside that range.
  function skipExtendingChars(str, pos, dir) {
    while ((dir < 0 ? pos > 0 : pos < str.length) && isExtendingChar(str.charAt(pos))) pos += dir;
    return pos
  }

  // Returns the value from the range [`from`; `to`] that satisfies
  // `pred` and is closest to `from`. Assumes that at least `to`
  // satisfies `pred`. Supports `from` being greater than `to`.
  function findFirst(pred, from, to) {
    // At any point we are certain `to` satisfies `pred`, don't know
    // whether `from` does.
    let dir = from > to ? -1 : 1;
    for (;;) {
      if (from == to) return from
      let midF = (from + to) / 2, mid = dir < 0 ? Math.ceil(midF) : Math.floor(midF);
      if (mid == from) return pred(mid) ? from : to
      if (pred(mid)) to = mid;
      else from = mid + dir;
    }
  }

  // BIDI HELPERS

  function iterateBidiSections(order, from, to, f) {
    if (!order) return f(from, to, "ltr", 0)
    let found = false;
    for (let i = 0; i < order.length; ++i) {
      let part = order[i];
      if (part.from < to && part.to > from || from == to && part.to == from) {
        f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1 ? "rtl" : "ltr", i);
        found = true;
      }
    }
    if (!found) f(from, to, "ltr");
  }

  let bidiOther = null;
  function getBidiPartAt(order, ch, sticky) {
    let found;
    bidiOther = null;
    for (let i = 0; i < order.length; ++i) {
      let cur = order[i];
      if (cur.from < ch && cur.to > ch) return i
      if (cur.to == ch) {
        if (cur.from != cur.to && sticky == "before") found = i;
        else bidiOther = i;
      }
      if (cur.from == ch) {
        if (cur.from != cur.to && sticky != "before") found = i;
        else bidiOther = i;
      }
    }
    return found != null ? found : bidiOther
  }

  // Bidirectional ordering algorithm
  // See http://unicode.org/reports/tr9/tr9-13.html for the algorithm
  // that this (partially) implements.

  // One-char codes used for character types:
  // L (L):   Left-to-Right
  // R (R):   Right-to-Left
  // r (AL):  Right-to-Left Arabic
  // 1 (EN):  European Number
  // + (ES):  European Number Separator
  // % (ET):  European Number Terminator
  // n (AN):  Arabic Number
  // , (CS):  Common Number Separator
  // m (NSM): Non-Spacing Mark
  // b (BN):  Boundary Neutral
  // s (B):   Paragraph Separator
  // t (S):   Segment Separator
  // w (WS):  Whitespace
  // N (ON):  Other Neutrals

  // Returns null if characters are ordered as they appear
  // (left-to-right), or an array of sections ({from, to, level}
  // objects) in the order in which they occur visually.
  let bidiOrdering = (function() {
    // Character types for codepoints 0 to 0xff
    let lowTypes = "bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN";
    // Character types for codepoints 0x600 to 0x6f9
    let arabicTypes = "nnnnnnNNr%%r,rNNmmmmmmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmmmnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmnNmmmmmmrrmmNmmmmrr1111111111";
    function charType(code) {
      if (code <= 0xf7) return lowTypes.charAt(code)
      else if (0x590 <= code && code <= 0x5f4) return "R"
      else if (0x600 <= code && code <= 0x6f9) return arabicTypes.charAt(code - 0x600)
      else if (0x6ee <= code && code <= 0x8ac) return "r"
      else if (0x2000 <= code && code <= 0x200b) return "w"
      else if (code == 0x200c) return "b"
      else return "L"
    }

    let bidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
    let isNeutral = /[stwN]/, isStrong = /[LRr]/, countsAsLeft = /[Lb1n]/, countsAsNum = /[1n]/;

    function BidiSpan(level, from, to) {
      this.level = level;
      this.from = from; this.to = to;
    }

    return function(str, direction) {
      let outerType = direction == "ltr" ? "L" : "R";

      if (str.length == 0 || direction == "ltr" && !bidiRE.test(str)) return false
      let len = str.length, types = [];
      for (let i = 0; i < len; ++i)
        types.push(charType(str.charCodeAt(i)));

      // W1. Examine each non-spacing mark (NSM) in the level run, and
      // change the type of the NSM to the type of the previous
      // character. If the NSM is at the start of the level run, it will
      // get the type of sor.
      for (let i = 0, prev = outerType; i < len; ++i) {
        let type = types[i];
        if (type == "m") types[i] = prev;
        else prev = type;
      }

      // W2. Search backwards from each instance of a European number
      // until the first strong type (R, L, AL, or sor) is found. If an
      // AL is found, change the type of the European number to Arabic
      // number.
      // W3. Change all ALs to R.
      for (let i = 0, cur = outerType; i < len; ++i) {
        let type = types[i];
        if (type == "1" && cur == "r") types[i] = "n";
        else if (isStrong.test(type)) { cur = type; if (type == "r") types[i] = "R"; }
      }

      // W4. A single European separator between two European numbers
      // changes to a European number. A single common separator between
      // two numbers of the same type changes to that type.
      for (let i = 1, prev = types[0]; i < len - 1; ++i) {
        let type = types[i];
        if (type == "+" && prev == "1" && types[i+1] == "1") types[i] = "1";
        else if (type == "," && prev == types[i+1] &&
                 (prev == "1" || prev == "n")) types[i] = prev;
        prev = type;
      }

      // W5. A sequence of European terminators adjacent to European
      // numbers changes to all European numbers.
      // W6. Otherwise, separators and terminators change to Other
      // Neutral.
      for (let i = 0; i < len; ++i) {
        let type = types[i];
        if (type == ",") types[i] = "N";
        else if (type == "%") {
          let end;
          for (end = i + 1; end < len && types[end] == "%"; ++end) {}
          let replace = (i && types[i-1] == "!") || (end < len && types[end] == "1") ? "1" : "N";
          for (let j = i; j < end; ++j) types[j] = replace;
          i = end - 1;
        }
      }

      // W7. Search backwards from each instance of a European number
      // until the first strong type (R, L, or sor) is found. If an L is
      // found, then change the type of the European number to L.
      for (let i = 0, cur = outerType; i < len; ++i) {
        let type = types[i];
        if (cur == "L" && type == "1") types[i] = "L";
        else if (isStrong.test(type)) cur = type;
      }

      // N1. A sequence of neutrals takes the direction of the
      // surrounding strong text if the text on both sides has the same
      // direction. European and Arabic numbers act as if they were R in
      // terms of their influence on neutrals. Start-of-level-run (sor)
      // and end-of-level-run (eor) are used at level run boundaries.
      // N2. Any remaining neutrals take the embedding direction.
      for (let i = 0; i < len; ++i) {
        if (isNeutral.test(types[i])) {
          let end;
          for (end = i + 1; end < len && isNeutral.test(types[end]); ++end) {}
          let before = (i ? types[i-1] : outerType) == "L";
          let after = (end < len ? types[end] : outerType) == "L";
          let replace = before == after ? (before ? "L" : "R") : outerType;
          for (let j = i; j < end; ++j) types[j] = replace;
          i = end - 1;
        }
      }

      // Here we depart from the documented algorithm, in order to avoid
      // building up an actual levels array. Since there are only three
      // levels (0, 1, 2) in an implementation that doesn't take
      // explicit embedding into account, we can build up the order on
      // the fly, without following the level-based algorithm.
      let order = [], m;
      for (let i = 0; i < len;) {
        if (countsAsLeft.test(types[i])) {
          let start = i;
          for (++i; i < len && countsAsLeft.test(types[i]); ++i) {}
          order.push(new BidiSpan(0, start, i));
        } else {
          let pos = i, at = order.length;
          for (++i; i < len && types[i] != "L"; ++i) {}
          for (let j = pos; j < i;) {
            if (countsAsNum.test(types[j])) {
              if (pos < j) order.splice(at, 0, new BidiSpan(1, pos, j));
              let nstart = j;
              for (++j; j < i && countsAsNum.test(types[j]); ++j) {}
              order.splice(at, 0, new BidiSpan(2, nstart, j));
              pos = j;
            } else ++j;
          }
          if (pos < i) order.splice(at, 0, new BidiSpan(1, pos, i));
        }
      }
      if (direction == "ltr") {
        if (order[0].level == 1 && (m = str.match(/^\s+/))) {
          order[0].from = m[0].length;
          order.unshift(new BidiSpan(0, 0, m[0].length));
        }
        if (lst(order).level == 1 && (m = str.match(/\s+$/))) {
          lst(order).to -= m[0].length;
          order.push(new BidiSpan(0, len - m[0].length, len));
        }
      }

      return direction == "rtl" ? order.reverse() : order
    }
  })();

  // Get the bidi ordering for the given line (and cache it). Returns
  // false for lines that are fully left-to-right, and an array of
  // BidiSpan objects otherwise.
  function getOrder(line, direction) {
    let order = line.order;
    if (order == null) order = line.order = bidiOrdering(line.text, direction);
    return order
  }

  // EVENT HANDLING

  // Lightweight event framework. on/off also work on DOM nodes,
  // registering native DOM handlers.

  const noHandlers = [];

  let on = function(emitter, type, f) {
    if (emitter.addEventListener) {
      emitter.addEventListener(type, f, false);
    } else if (emitter.attachEvent) {
      emitter.attachEvent("on" + type, f);
    } else {
      let map$$1 = emitter._handlers || (emitter._handlers = {});
      map$$1[type] = (map$$1[type] || noHandlers).concat(f);
    }
  };

  function getHandlers(emitter, type) {
    return emitter._handlers && emitter._handlers[type] || noHandlers
  }

  function off(emitter, type, f) {
    if (emitter.removeEventListener) {
      emitter.removeEventListener(type, f, false);
    } else if (emitter.detachEvent) {
      emitter.detachEvent("on" + type, f);
    } else {
      let map$$1 = emitter._handlers, arr = map$$1 && map$$1[type];
      if (arr) {
        let index = indexOf(arr, f);
        if (index > -1)
          map$$1[type] = arr.slice(0, index).concat(arr.slice(index + 1));
      }
    }
  }

  function signal(emitter, type /*, values...*/) {
    let handlers = getHandlers(emitter, type);
    if (!handlers.length) return
    let args = Array.prototype.slice.call(arguments, 2);
    for (let i = 0; i < handlers.length; ++i) handlers[i].apply(null, args);
  }

  // The DOM events that CodeMirror handles can be overridden by
  // registering a (non-DOM) handler on the editor for the event name,
  // and preventDefault-ing the event in that handler.
  function signalDOMEvent(cm, e, override) {
    if (typeof e == "string")
      e = {type: e, preventDefault: function() { this.defaultPrevented = true; }};
    signal(cm, override || e.type, cm, e);
    return e_defaultPrevented(e) || e.codemirrorIgnore
  }

  function signalCursorActivity(cm) {
    let arr = cm._handlers && cm._handlers.cursorActivity;
    if (!arr) return
    let set = cm.curOp.cursorActivityHandlers || (cm.curOp.cursorActivityHandlers = []);
    for (let i = 0; i < arr.length; ++i) if (indexOf(set, arr[i]) == -1)
      set.push(arr[i]);
  }

  function hasHandler(emitter, type) {
    return getHandlers(emitter, type).length > 0
  }

  // Add on and off methods to a constructor's prototype, to make
  // registering events on such objects more convenient.
  function eventMixin(ctor) {
    ctor.prototype.on = function(type, f) {on(this, type, f);};
    ctor.prototype.off = function(type, f) {off(this, type, f);};
  }

  // Due to the fact that we still support jurassic IE versions, some
  // compatibility wrappers are needed.

  function e_preventDefault(e) {
    if (e.preventDefault) e.preventDefault();
    else e.returnValue = false;
  }
  function e_stopPropagation(e) {
    if (e.stopPropagation) e.stopPropagation();
    else e.cancelBubble = true;
  }
  function e_defaultPrevented(e) {
    return e.defaultPrevented != null ? e.defaultPrevented : e.returnValue == false
  }
  function e_stop(e) {e_preventDefault(e); e_stopPropagation(e);}

  function e_target(e) {return e.target || e.srcElement}
  function e_button(e) {
    let b = e.which;
    if (b == null) {
      if (e.button & 1) b = 1;
      else if (e.button & 2) b = 3;
      else if (e.button & 4) b = 2;
    }
    if (mac && e.ctrlKey && b == 1) b = 3;
    return b
  }

  // Detect drag-and-drop
  let dragAndDrop = function() {
    // There is *some* kind of drag-and-drop support in IE6-8, but I
    // couldn't get it to work yet.
    if (ie && ie_version < 9) return false
    let div = elt('div');
    return "draggable" in div || "dragDrop" in div
  }();

  let zwspSupported;
  function zeroWidthElement(measure) {
    if (zwspSupported == null) {
      let test = elt("span", "\u200b");
      removeChildrenAndAdd(measure, elt("span", [test, document.createTextNode("x")]));
      if (measure.firstChild.offsetHeight != 0)
        zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !(ie && ie_version < 8);
    }
    let node = zwspSupported ? elt("span", "\u200b") :
      elt("span", "\u00a0", null, "display: inline-block; width: 1px; margin-right: -1px");
    node.setAttribute("cm-text", "");
    return node
  }

  // Feature-detect IE's crummy client rect reporting for bidi text
  let badBidiRects;
  function hasBadBidiRects(measure) {
    if (badBidiRects != null) return badBidiRects
    let txt = removeChildrenAndAdd(measure, document.createTextNode("A\u062eA"));
    let r0 = range(txt, 0, 1).getBoundingClientRect();
    let r1 = range(txt, 1, 2).getBoundingClientRect();
    removeChildren(measure);
    if (!r0 || r0.left == r0.right) return false // Safari returns null in some cases (#2780)
    return badBidiRects = (r1.right - r0.right < 3)
  }

  // See if "".split is the broken IE version, if so, provide an
  // alternative way to split lines.
  let splitLinesAuto = "\n\nb".split(/\n/).length != 3 ? string => {
    let pos = 0, result = [], l = string.length;
    while (pos <= l) {
      let nl = string.indexOf("\n", pos);
      if (nl == -1) nl = string.length;
      let line = string.slice(pos, string.charAt(nl - 1) == "\r" ? nl - 1 : nl);
      let rt = line.indexOf("\r");
      if (rt != -1) {
        result.push(line.slice(0, rt));
        pos += rt + 1;
      } else {
        result.push(line);
        pos = nl + 1;
      }
    }
    return result
  } : string => string.split(/\r\n?|\n/);

  let hasSelection = window.getSelection ? te => {
    try { return te.selectionStart != te.selectionEnd }
    catch(e) { return false }
  } : te => {
    let range$$1;
    try {range$$1 = te.ownerDocument.selection.createRange();}
    catch(e) {}
    if (!range$$1 || range$$1.parentElement() != te) return false
    return range$$1.compareEndPoints("StartToEnd", range$$1) != 0
  };

  let hasCopyEvent = (() => {
    let e = elt("div");
    if ("oncopy" in e) return true
    e.setAttribute("oncopy", "return;");
    return typeof e.oncopy == "function"
  })();

  let badZoomedRects = null;
  function hasBadZoomedRects(measure) {
    if (badZoomedRects != null) return badZoomedRects
    let node = removeChildrenAndAdd(measure, elt("span", "x"));
    let normal = node.getBoundingClientRect();
    let fromRange = range(node, 0, 1).getBoundingClientRect();
    return badZoomedRects = Math.abs(normal.left - fromRange.left) > 1
  }

  // Known modes, by name and by MIME
  let modes = {}, mimeModes = {};

  // Extra arguments are stored as the mode's dependencies, which is
  // used by (legacy) mechanisms like loadmode.js to automatically
  // load a mode. (Preferred mechanism is the require/define calls.)
  function defineMode(name, mode) {
    if (arguments.length > 2)
      mode.dependencies = Array.prototype.slice.call(arguments, 2);
    modes[name] = mode;
  }

  function defineMIME(mime, spec) {
    mimeModes[mime] = spec;
  }

  // Given a MIME type, a {name, ...options} config object, or a name
  // string, return a mode config object.
  function resolveMode(spec) {
    if (typeof spec == "string" && mimeModes.hasOwnProperty(spec)) {
      spec = mimeModes[spec];
    } else if (spec && typeof spec.name == "string" && mimeModes.hasOwnProperty(spec.name)) {
      let found = mimeModes[spec.name];
      if (typeof found == "string") found = {name: found};
      spec = createObj(found, spec);
      spec.name = found.name;
    } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)) {
      return resolveMode("application/xml")
    } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+json$/.test(spec)) {
      return resolveMode("application/json")
    }
    if (typeof spec == "string") return {name: spec}
    else return spec || {name: "null"}
  }

  // Given a mode spec (anything that resolveMode accepts), find and
  // initialize an actual mode object.
  function getMode(options, spec) {
    spec = resolveMode(spec);
    let mfactory = modes[spec.name];
    if (!mfactory) return getMode(options, "text/plain")
    let modeObj = mfactory(options, spec);
    if (modeExtensions.hasOwnProperty(spec.name)) {
      let exts = modeExtensions[spec.name];
      for (let prop in exts) {
        if (!exts.hasOwnProperty(prop)) continue
        if (modeObj.hasOwnProperty(prop)) modeObj["_" + prop] = modeObj[prop];
        modeObj[prop] = exts[prop];
      }
    }
    modeObj.name = spec.name;
    if (spec.helperType) modeObj.helperType = spec.helperType;
    if (spec.modeProps) for (let prop in spec.modeProps)
      modeObj[prop] = spec.modeProps[prop];

    return modeObj
  }

  // This can be used to attach properties to mode objects from
  // outside the actual mode definition.
  let modeExtensions = {};
  function extendMode(mode, properties) {
    let exts = modeExtensions.hasOwnProperty(mode) ? modeExtensions[mode] : (modeExtensions[mode] = {});
    copyObj(properties, exts);
  }

  function copyState(mode, state) {
    if (state === true) return state
    if (mode.copyState) return mode.copyState(state)
    let nstate = {};
    for (let n in state) {
      let val = state[n];
      if (val instanceof Array) val = val.concat([]);
      nstate[n] = val;
    }
    return nstate
  }

  // Given a mode and a state (for that mode), find the inner mode and
  // state at the position that the state refers to.
  function innerMode(mode, state) {
    let info;
    while (mode.innerMode) {
      info = mode.innerMode(state);
      if (!info || info.mode == mode) break
      state = info.state;
      mode = info.mode;
    }
    return info || {mode: mode, state: state}
  }

  function startState(mode, a1, a2) {
    return mode.startState ? mode.startState(a1, a2) : true
  }

  // STRING STREAM

  // Fed to the mode parsers, provides helper functions to make
  // parsers more succinct.

  class StringStream {
    constructor(string, tabSize, lineOracle) {
      this.pos = this.start = 0;
      this.string = string;
      this.tabSize = tabSize || 8;
      this.lastColumnPos = this.lastColumnValue = 0;
      this.lineStart = 0;
      this.lineOracle = lineOracle;
    }

    eol() {return this.pos >= this.string.length}
    sol() {return this.pos == this.lineStart}
    peek() {return this.string.charAt(this.pos) || undefined}
    next() {
      if (this.pos < this.string.length)
        return this.string.charAt(this.pos++)
    }
    eat(match) {
      let ch = this.string.charAt(this.pos);
      let ok;
      if (typeof match == "string") ok = ch == match;
      else ok = ch && (match.test ? match.test(ch) : match(ch));
      if (ok) {++this.pos; return ch}
    }
    eatWhile(match) {
      let start = this.pos;
      while (this.eat(match)){}
      return this.pos > start
    }
    eatSpace() {
      let start = this.pos;
      while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) ++this.pos;
      return this.pos > start
    }
    skipToEnd() {this.pos = this.string.length;}
    skipTo(ch) {
      let found = this.string.indexOf(ch, this.pos);
      if (found > -1) {this.pos = found; return true}
    }
    backUp(n) {this.pos -= n;}
    column() {
      if (this.lastColumnPos < this.start) {
        this.lastColumnValue = countColumn(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue);
        this.lastColumnPos = this.start;
      }
      return this.lastColumnValue - (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0)
    }
    indentation() {
      return countColumn(this.string, null, this.tabSize) -
        (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0)
    }
    match(pattern, consume, caseInsensitive) {
      if (typeof pattern == "string") {
        let cased = str => caseInsensitive ? str.toLowerCase() : str;
        let substr = this.string.substr(this.pos, pattern.length);
        if (cased(substr) == cased(pattern)) {
          if (consume !== false) this.pos += pattern.length;
          return true
        }
      } else {
        let match = this.string.slice(this.pos).match(pattern);
        if (match && match.index > 0) return null
        if (match && consume !== false) this.pos += match[0].length;
        return match
      }
    }
    current(){return this.string.slice(this.start, this.pos)}
    hideFirstChars(n, inner) {
      this.lineStart += n;
      try { return inner() }
      finally { this.lineStart -= n; }
    }
    lookAhead(n) {
      let oracle = this.lineOracle;
      return oracle && oracle.lookAhead(n)
    }
    baseToken() {
      let oracle = this.lineOracle;
      return oracle && oracle.baseToken(this.pos)
    }
  }

  // Find the line object corresponding to the given line number.
  function getLine(doc, n) {
    n -= doc.first;
    if (n < 0 || n >= doc.size) throw new Error("There is no line " + (n + doc.first) + " in the document.")
    let chunk = doc;
    while (!chunk.lines) {
      for (let i = 0;; ++i) {
        let child = chunk.children[i], sz = child.chunkSize();
        if (n < sz) { chunk = child; break }
        n -= sz;
      }
    }
    return chunk.lines[n]
  }

  // Get the part of a document between two positions, as an array of
  // strings.
  function getBetween(doc, start, end) {
    let out = [], n = start.line;
    doc.iter(start.line, end.line + 1, line => {
      let text = line.text;
      if (n == end.line) text = text.slice(0, end.ch);
      if (n == start.line) text = text.slice(start.ch);
      out.push(text);
      ++n;
    });
    return out
  }
  // Get the lines between from and to, as array of strings.
  function getLines(doc, from, to) {
    let out = [];
    doc.iter(from, to, line => { out.push(line.text); }); // iter aborts when callback returns truthy value
    return out
  }

  // Update the height of a line, propagating the height change
  // upwards to parent nodes.
  function updateLineHeight(line, height) {
    let diff = height - line.height;
    if (diff) for (let n = line; n; n = n.parent) n.height += diff;
  }

  // Given a line object, find its line number by walking up through
  // its parent links.
  function lineNo(line) {
    if (line.parent == null) return null
    let cur = line.parent, no = indexOf(cur.lines, line);
    for (let chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent) {
      for (let i = 0;; ++i) {
        if (chunk.children[i] == cur) break
        no += chunk.children[i].chunkSize();
      }
    }
    return no + cur.first
  }

  // Find the line at the given vertical position, using the height
  // information in the document tree.
  function lineAtHeight(chunk, h) {
    let n = chunk.first;
    outer: do {
      for (let i = 0; i < chunk.children.length; ++i) {
        let child = chunk.children[i], ch = child.height;
        if (h < ch) { chunk = child; continue outer }
        h -= ch;
        n += child.chunkSize();
      }
      return n
    } while (!chunk.lines)
    let i = 0;
    for (; i < chunk.lines.length; ++i) {
      let line = chunk.lines[i], lh = line.height;
      if (h < lh) break
      h -= lh;
    }
    return n + i
  }

  function isLine(doc, l) {return l >= doc.first && l < doc.first + doc.size}

  function lineNumberFor(options, i) {
    return String(options.lineNumberFormatter(i + options.firstLineNumber))
  }

  // A Pos instance represents a position within the text.
  function Pos(line, ch, sticky = null) {
    if (!(this instanceof Pos)) return new Pos(line, ch, sticky)
    this.line = line;
    this.ch = ch;
    this.sticky = sticky;
  }

  // Compare two positions, return 0 if they are the same, a negative
  // number when a is less, and a positive number otherwise.
  function cmp(a, b) { return a.line - b.line || a.ch - b.ch }

  function equalCursorPos(a, b) { return a.sticky == b.sticky && cmp(a, b) == 0 }

  function copyPos(x) {return Pos(x.line, x.ch)}
  function maxPos(a, b) { return cmp(a, b) < 0 ? b : a }
  function minPos(a, b) { return cmp(a, b) < 0 ? a : b }

  // Most of the external API clips given positions to make sure they
  // actually exist within the document.
  function clipLine(doc, n) {return Math.max(doc.first, Math.min(n, doc.first + doc.size - 1))}
  function clipPos(doc, pos) {
    if (pos.line < doc.first) return Pos(doc.first, 0)
    let last = doc.first + doc.size - 1;
    if (pos.line > last) return Pos(last, getLine(doc, last).text.length)
    return clipToLen(pos, getLine(doc, pos.line).text.length)
  }
  function clipToLen(pos, linelen) {
    let ch = pos.ch;
    if (ch == null || ch > linelen) return Pos(pos.line, linelen)
    else if (ch < 0) return Pos(pos.line, 0)
    else return pos
  }
  function clipPosArray(doc, array) {
    let out = [];
    for (let i = 0; i < array.length; i++) out[i] = clipPos(doc, array[i]);
    return out
  }

  class SavedContext {
    constructor(state, lookAhead) {
      this.state = state;
      this.lookAhead = lookAhead;
    }
  }

  class Context {
    constructor(doc, state, line, lookAhead) {
      this.state = state;
      this.doc = doc;
      this.line = line;
      this.maxLookAhead = lookAhead || 0;
      this.baseTokens = null;
      this.baseTokenPos = 1;
    }

    lookAhead(n) {
      let line = this.doc.getLine(this.line + n);
      if (line != null && n > this.maxLookAhead) this.maxLookAhead = n;
      return line
    }

    baseToken(n) {
      if (!this.baseTokens) return null
      while (this.baseTokens[this.baseTokenPos] <= n)
        this.baseTokenPos += 2;
      let type = this.baseTokens[this.baseTokenPos + 1];
      return {type: type && type.replace(/( |^)overlay .*/, ""),
              size: this.baseTokens[this.baseTokenPos] - n}
    }

    nextLine() {
      this.line++;
      if (this.maxLookAhead > 0) this.maxLookAhead--;
    }

    static fromSaved(doc, saved, line) {
      if (saved instanceof SavedContext)
        return new Context(doc, copyState(doc.mode, saved.state), line, saved.lookAhead)
      else
        return new Context(doc, copyState(doc.mode, saved), line)
    }

    save(copy) {
      let state = copy !== false ? copyState(this.doc.mode, this.state) : this.state;
      return this.maxLookAhead > 0 ? new SavedContext(state, this.maxLookAhead) : state
    }
  }


  // Compute a style array (an array starting with a mode generation
  // -- for invalidation -- followed by pairs of end positions and
  // style strings), which is used to highlight the tokens on the
  // line.
  function highlightLine(cm, line, context, forceToEnd) {
    // A styles array always starts with a number identifying the
    // mode/overlays that it is based on (for easy invalidation).
    let st = [cm.state.modeGen], lineClasses = {};
    // Compute the base array of styles
    runMode(cm, line.text, cm.doc.mode, context, (end, style) => st.push(end, style),
            lineClasses, forceToEnd);
    let state = context.state;

    // Run overlays, adjust style array.
    for (let o = 0; o < cm.state.overlays.length; ++o) {
      context.baseTokens = st;
      let overlay = cm.state.overlays[o], i = 1, at = 0;
      context.state = true;
      runMode(cm, line.text, overlay.mode, context, (end, style) => {
        let start = i;
        // Ensure there's a token end at the current position, and that i points at it
        while (at < end) {
          let i_end = st[i];
          if (i_end > end)
            st.splice(i, 1, end, st[i+1], i_end);
          i += 2;
          at = Math.min(end, i_end);
        }
        if (!style) return
        if (overlay.opaque) {
          st.splice(start, i - start, end, "overlay " + style);
          i = start + 2;
        } else {
          for (; start < i; start += 2) {
            let cur = st[start+1];
            st[start+1] = (cur ? cur + " " : "") + "overlay " + style;
          }
        }
      }, lineClasses);
      context.state = state;
      context.baseTokens = null;
      context.baseTokenPos = 1;
    }

    return {styles: st, classes: lineClasses.bgClass || lineClasses.textClass ? lineClasses : null}
  }

  function getLineStyles(cm, line, updateFrontier) {
    if (!line.styles || line.styles[0] != cm.state.modeGen) {
      let context = getContextBefore(cm, lineNo(line));
      let resetState = line.text.length > cm.options.maxHighlightLength && copyState(cm.doc.mode, context.state);
      let result = highlightLine(cm, line, context);
      if (resetState) context.state = resetState;
      line.stateAfter = context.save(!resetState);
      line.styles = result.styles;
      if (result.classes) line.styleClasses = result.classes;
      else if (line.styleClasses) line.styleClasses = null;
      if (updateFrontier === cm.doc.highlightFrontier)
        cm.doc.modeFrontier = Math.max(cm.doc.modeFrontier, ++cm.doc.highlightFrontier);
    }
    return line.styles
  }

  function getContextBefore(cm, n, precise) {
    let doc = cm.doc, display = cm.display;
    if (!doc.mode.startState) return new Context(doc, true, n)
    let start = findStartLine(cm, n, precise);
    let saved = start > doc.first && getLine(doc, start - 1).stateAfter;
    let context = saved ? Context.fromSaved(doc, saved, start) : new Context(doc, startState(doc.mode), start);

    doc.iter(start, n, line => {
      processLine(cm, line.text, context);
      let pos = context.line;
      line.stateAfter = pos == n - 1 || pos % 5 == 0 || pos >= display.viewFrom && pos < display.viewTo ? context.save() : null;
      context.nextLine();
    });
    if (precise) doc.modeFrontier = context.line;
    return context
  }

  // Lightweight form of highlight -- proceed over this line and
  // update state, but don't save a style array. Used for lines that
  // aren't currently visible.
  function processLine(cm, text, context, startAt) {
    let mode = cm.doc.mode;
    let stream = new StringStream(text, cm.options.tabSize, context);
    stream.start = stream.pos = startAt || 0;
    if (text == "") callBlankLine(mode, context.state);
    while (!stream.eol()) {
      readToken(mode, stream, context.state);
      stream.start = stream.pos;
    }
  }

  function callBlankLine(mode, state) {
    if (mode.blankLine) return mode.blankLine(state)
    if (!mode.innerMode) return
    let inner = innerMode(mode, state);
    if (inner.mode.blankLine) return inner.mode.blankLine(inner.state)
  }

  function readToken(mode, stream, state, inner) {
    for (let i = 0; i < 10; i++) {
      if (inner) inner[0] = innerMode(mode, state).mode;
      let style = mode.token(stream, state);
      if (stream.pos > stream.start) return style
    }
    throw new Error("Mode " + mode.name + " failed to advance stream.")
  }

  class Token {
    constructor(stream, type, state) {
      this.start = stream.start; this.end = stream.pos;
      this.string = stream.current();
      this.type = type || null;
      this.state = state;
    }
  }

  // Utility for getTokenAt and getLineTokens
  function takeToken(cm, pos, precise, asArray) {
    let doc = cm.doc, mode = doc.mode, style;
    pos = clipPos(doc, pos);
    let line = getLine(doc, pos.line), context = getContextBefore(cm, pos.line, precise);
    let stream = new StringStream(line.text, cm.options.tabSize, context), tokens;
    if (asArray) tokens = [];
    while ((asArray || stream.pos < pos.ch) && !stream.eol()) {
      stream.start = stream.pos;
      style = readToken(mode, stream, context.state);
      if (asArray) tokens.push(new Token(stream, style, copyState(doc.mode, context.state)));
    }
    return asArray ? tokens : new Token(stream, style, context.state)
  }

  function extractLineClasses(type, output) {
    if (type) for (;;) {
      let lineClass = type.match(/(?:^|\s+)line-(background-)?(\S+)/);
      if (!lineClass) break
      type = type.slice(0, lineClass.index) + type.slice(lineClass.index + lineClass[0].length);
      let prop = lineClass[1] ? "bgClass" : "textClass";
      if (output[prop] == null)
        output[prop] = lineClass[2];
      else if (!(new RegExp("(?:^|\s)" + lineClass[2] + "(?:$|\s)")).test(output[prop]))
        output[prop] += " " + lineClass[2];
    }
    return type
  }

  // Run the given mode's parser over a line, calling f for each token.
  function runMode(cm, text, mode, context, f, lineClasses, forceToEnd) {
    let flattenSpans = mode.flattenSpans;
    if (flattenSpans == null) flattenSpans = cm.options.flattenSpans;
    let curStart = 0, curStyle = null;
    let stream = new StringStream(text, cm.options.tabSize, context), style;
    let inner = cm.options.addModeClass && [null];
    if (text == "") extractLineClasses(callBlankLine(mode, context.state), lineClasses);
    while (!stream.eol()) {
      if (stream.pos > cm.options.maxHighlightLength) {
        flattenSpans = false;
        if (forceToEnd) processLine(cm, text, context, stream.pos);
        stream.pos = text.length;
        style = null;
      } else {
        style = extractLineClasses(readToken(mode, stream, context.state, inner), lineClasses);
      }
      if (inner) {
        let mName = inner[0].name;
        if (mName) style = "m-" + (style ? mName + " " + style : mName);
      }
      if (!flattenSpans || curStyle != style) {
        while (curStart < stream.start) {
          curStart = Math.min(stream.start, curStart + 5000);
          f(curStart, curStyle);
        }
        curStyle = style;
      }
      stream.start = stream.pos;
    }
    while (curStart < stream.pos) {
      // Webkit seems to refuse to render text nodes longer than 57444
      // characters, and returns inaccurate measurements in nodes
      // starting around 5000 chars.
      let pos = Math.min(stream.pos, curStart + 5000);
      f(pos, curStyle);
      curStart = pos;
    }
  }

  // Finds the line to start with when starting a parse. Tries to
  // find a line with a stateAfter, so that it can start with a
  // valid state. If that fails, it returns the line with the
  // smallest indentation, which tends to need the least context to
  // parse correctly.
  function findStartLine(cm, n, precise) {
    let minindent, minline, doc = cm.doc;
    let lim = precise ? -1 : n - (cm.doc.mode.innerMode ? 1000 : 100);
    for (let search = n; search > lim; --search) {
      if (search <= doc.first) return doc.first
      let line = getLine(doc, search - 1), after = line.stateAfter;
      if (after && (!precise || search + (after instanceof SavedContext ? after.lookAhead : 0) <= doc.modeFrontier))
        return search
      let indented = countColumn(line.text, null, cm.options.tabSize);
      if (minline == null || minindent > indented) {
        minline = search - 1;
        minindent = indented;
      }
    }
    return minline
  }

  function retreatFrontier(doc, n) {
    doc.modeFrontier = Math.min(doc.modeFrontier, n);
    if (doc.highlightFrontier < n - 10) return
    let start = doc.first;
    for (let line = n - 1; line > start; line--) {
      let saved = getLine(doc, line).stateAfter;
      // change is on 3
      // state on line 1 looked ahead 2 -- so saw 3
      // test 1 + 2 < 3 should cover this
      if (saved && (!(saved instanceof SavedContext) || line + saved.lookAhead < n)) {
        start = line + 1;
        break
      }
    }
    doc.highlightFrontier = Math.min(doc.highlightFrontier, start);
  }

  // Optimize some code when these features are not used.
  let sawReadOnlySpans = false, sawCollapsedSpans = false;

  function seeReadOnlySpans() {
    sawReadOnlySpans = true;
  }

  function seeCollapsedSpans() {
    sawCollapsedSpans = true;
  }

  // TEXTMARKER SPANS

  function MarkedSpan(marker, from, to) {
    this.marker = marker;
    this.from = from; this.to = to;
  }

  // Search an array of spans for a span matching the given marker.
  function getMarkedSpanFor(spans, marker) {
    if (spans) for (let i = 0; i < spans.length; ++i) {
      let span = spans[i];
      if (span.marker == marker) return span
    }
  }
  // Remove a span from an array, returning undefined if no spans are
  // left (we don't store arrays for lines without spans).
  function removeMarkedSpan(spans, span) {
    let r;
    for (let i = 0; i < spans.length; ++i)
      if (spans[i] != span) (r || (r = [])).push(spans[i]);
    return r
  }
  // Add a span to a line.
  function addMarkedSpan(line, span) {
    line.markedSpans = line.markedSpans ? line.markedSpans.concat([span]) : [span];
    span.marker.attachLine(line);
  }

  // Used for the algorithm that adjusts markers for a change in the
  // document. These functions cut an array of spans at a given
  // character position, returning an array of remaining chunks (or
  // undefined if nothing remains).
  function markedSpansBefore(old, startCh, isInsert) {
    let nw;
    if (old) for (let i = 0; i < old.length; ++i) {
      let span = old[i], marker = span.marker;
      let startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= startCh : span.from < startCh);
      if (startsBefore || span.from == startCh && marker.type == "bookmark" && (!isInsert || !span.marker.insertLeft)) {
        let endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= startCh : span.to > startCh)
        ;(nw || (nw = [])).push(new MarkedSpan(marker, span.from, endsAfter ? null : span.to));
      }
    }
    return nw
  }
  function markedSpansAfter(old, endCh, isInsert) {
    let nw;
    if (old) for (let i = 0; i < old.length; ++i) {
      let span = old[i], marker = span.marker;
      let endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= endCh : span.to > endCh);
      if (endsAfter || span.from == endCh && marker.type == "bookmark" && (!isInsert || span.marker.insertLeft)) {
        let startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= endCh : span.from < endCh)
        ;(nw || (nw = [])).push(new MarkedSpan(marker, startsBefore ? null : span.from - endCh,
                                              span.to == null ? null : span.to - endCh));
      }
    }
    return nw
  }

  // Given a change object, compute the new set of marker spans that
  // cover the line in which the change took place. Removes spans
  // entirely within the change, reconnects spans belonging to the
  // same marker that appear on both sides of the change, and cuts off
  // spans partially within the change. Returns an array of span
  // arrays with one element for each line in (after) the change.
  function stretchSpansOverChange(doc, change) {
    if (change.full) return null
    let oldFirst = isLine(doc, change.from.line) && getLine(doc, change.from.line).markedSpans;
    let oldLast = isLine(doc, change.to.line) && getLine(doc, change.to.line).markedSpans;
    if (!oldFirst && !oldLast) return null

    let startCh = change.from.ch, endCh = change.to.ch, isInsert = cmp(change.from, change.to) == 0;
    // Get the spans that 'stick out' on both sides
    let first = markedSpansBefore(oldFirst, startCh, isInsert);
    let last = markedSpansAfter(oldLast, endCh, isInsert);

    // Next, merge those two ends
    let sameLine = change.text.length == 1, offset = lst(change.text).length + (sameLine ? startCh : 0);
    if (first) {
      // Fix up .to properties of first
      for (let i = 0; i < first.length; ++i) {
        let span = first[i];
        if (span.to == null) {
          let found = getMarkedSpanFor(last, span.marker);
          if (!found) span.to = startCh;
          else if (sameLine) span.to = found.to == null ? null : found.to + offset;
        }
      }
    }
    if (last) {
      // Fix up .from in last (or move them into first in case of sameLine)
      for (let i = 0; i < last.length; ++i) {
        let span = last[i];
        if (span.to != null) span.to += offset;
        if (span.from == null) {
          let found = getMarkedSpanFor(first, span.marker);
          if (!found) {
            span.from = offset;
            if (sameLine) (first || (first = [])).push(span);
          }
        } else {
          span.from += offset;
          if (sameLine) (first || (first = [])).push(span);
        }
      }
    }
    // Make sure we didn't create any zero-length spans
    if (first) first = clearEmptySpans(first);
    if (last && last != first) last = clearEmptySpans(last);

    let newMarkers = [first];
    if (!sameLine) {
      // Fill gap with whole-line-spans
      let gap = change.text.length - 2, gapMarkers;
      if (gap > 0 && first)
        for (let i = 0; i < first.length; ++i)
          if (first[i].to == null)
            (gapMarkers || (gapMarkers = [])).push(new MarkedSpan(first[i].marker, null, null));
      for (let i = 0; i < gap; ++i)
        newMarkers.push(gapMarkers);
      newMarkers.push(last);
    }
    return newMarkers
  }

  // Remove spans that are empty and don't have a clearWhenEmpty
  // option of false.
  function clearEmptySpans(spans) {
    for (let i = 0; i < spans.length; ++i) {
      let span = spans[i];
      if (span.from != null && span.from == span.to && span.marker.clearWhenEmpty !== false)
        spans.splice(i--, 1);
    }
    if (!spans.length) return null
    return spans
  }

  // Used to 'clip' out readOnly ranges when making a change.
  function removeReadOnlyRanges(doc, from, to) {
    let markers = null;
    doc.iter(from.line, to.line + 1, line => {
      if (line.markedSpans) for (let i = 0; i < line.markedSpans.length; ++i) {
        let mark = line.markedSpans[i].marker;
        if (mark.readOnly && (!markers || indexOf(markers, mark) == -1))
          (markers || (markers = [])).push(mark);
      }
    });
    if (!markers) return null
    let parts = [{from: from, to: to}];
    for (let i = 0; i < markers.length; ++i) {
      let mk = markers[i], m = mk.find(0);
      for (let j = 0; j < parts.length; ++j) {
        let p = parts[j];
        if (cmp(p.to, m.from) < 0 || cmp(p.from, m.to) > 0) continue
        let newParts = [j, 1], dfrom = cmp(p.from, m.from), dto = cmp(p.to, m.to);
        if (dfrom < 0 || !mk.inclusiveLeft && !dfrom)
          newParts.push({from: p.from, to: m.from});
        if (dto > 0 || !mk.inclusiveRight && !dto)
          newParts.push({from: m.to, to: p.to});
        parts.splice.apply(parts, newParts);
        j += newParts.length - 3;
      }
    }
    return parts
  }

  // Connect or disconnect spans from a line.
  function detachMarkedSpans(line) {
    let spans = line.markedSpans;
    if (!spans) return
    for (let i = 0; i < spans.length; ++i)
      spans[i].marker.detachLine(line);
    line.markedSpans = null;
  }
  function attachMarkedSpans(line, spans) {
    if (!spans) return
    for (let i = 0; i < spans.length; ++i)
      spans[i].marker.attachLine(line);
    line.markedSpans = spans;
  }

  // Helpers used when computing which overlapping collapsed span
  // counts as the larger one.
  function extraLeft(marker) { return marker.inclusiveLeft ? -1 : 0 }
  function extraRight(marker) { return marker.inclusiveRight ? 1 : 0 }

  // Returns a number indicating which of two overlapping collapsed
  // spans is larger (and thus includes the other). Falls back to
  // comparing ids when the spans cover exactly the same range.
  function compareCollapsedMarkers(a, b) {
    let lenDiff = a.lines.length - b.lines.length;
    if (lenDiff != 0) return lenDiff
    let aPos = a.find(), bPos = b.find();
    let fromCmp = cmp(aPos.from, bPos.from) || extraLeft(a) - extraLeft(b);
    if (fromCmp) return -fromCmp
    let toCmp = cmp(aPos.to, bPos.to) || extraRight(a) - extraRight(b);
    if (toCmp) return toCmp
    return b.id - a.id
  }

  // Find out whether a line ends or starts in a collapsed span. If
  // so, return the marker for that span.
  function collapsedSpanAtSide(line, start) {
    let sps = sawCollapsedSpans && line.markedSpans, found;
    if (sps) for (let sp, i = 0; i < sps.length; ++i) {
      sp = sps[i];
      if (sp.marker.collapsed && (start ? sp.from : sp.to) == null &&
          (!found || compareCollapsedMarkers(found, sp.marker) < 0))
        found = sp.marker;
    }
    return found
  }
  function collapsedSpanAtStart(line) { return collapsedSpanAtSide(line, true) }
  function collapsedSpanAtEnd(line) { return collapsedSpanAtSide(line, false) }

  function collapsedSpanAround(line, ch) {
    let sps = sawCollapsedSpans && line.markedSpans, found;
    if (sps) for (let i = 0; i < sps.length; ++i) {
      let sp = sps[i];
      if (sp.marker.collapsed && (sp.from == null || sp.from < ch) && (sp.to == null || sp.to > ch) &&
          (!found || compareCollapsedMarkers(found, sp.marker) < 0)) found = sp.marker;
    }
    return found
  }

  // Test whether there exists a collapsed span that partially
  // overlaps (covers the start or end, but not both) of a new span.
  // Such overlap is not allowed.
  function conflictingCollapsedRange(doc, lineNo$$1, from, to, marker) {
    let line = getLine(doc, lineNo$$1);
    let sps = sawCollapsedSpans && line.markedSpans;
    if (sps) for (let i = 0; i < sps.length; ++i) {
      let sp = sps[i];
      if (!sp.marker.collapsed) continue
      let found = sp.marker.find(0);
      let fromCmp = cmp(found.from, from) || extraLeft(sp.marker) - extraLeft(marker);
      let toCmp = cmp(found.to, to) || extraRight(sp.marker) - extraRight(marker);
      if (fromCmp >= 0 && toCmp <= 0 || fromCmp <= 0 && toCmp >= 0) continue
      if (fromCmp <= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? cmp(found.to, from) >= 0 : cmp(found.to, from) > 0) ||
          fromCmp >= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? cmp(found.from, to) <= 0 : cmp(found.from, to) < 0))
        return true
    }
  }

  // A visual line is a line as drawn on the screen. Folding, for
  // example, can cause multiple logical lines to appear on the same
  // visual line. This finds the start of the visual line that the
  // given line is part of (usually that is the line itself).
  function visualLine(line) {
    let merged;
    while (merged = collapsedSpanAtStart(line))
      line = merged.find(-1, true).line;
    return line
  }

  function visualLineEnd(line) {
    let merged;
    while (merged = collapsedSpanAtEnd(line))
      line = merged.find(1, true).line;
    return line
  }

  // Returns an array of logical lines that continue the visual line
  // started by the argument, or undefined if there are no such lines.
  function visualLineContinued(line) {
    let merged, lines;
    while (merged = collapsedSpanAtEnd(line)) {
      line = merged.find(1, true).line
      ;(lines || (lines = [])).push(line);
    }
    return lines
  }

  // Get the line number of the start of the visual line that the
  // given line number is part of.
  function visualLineNo(doc, lineN) {
    let line = getLine(doc, lineN), vis = visualLine(line);
    if (line == vis) return lineN
    return lineNo(vis)
  }

  // Get the line number of the start of the next visual line after
  // the given line.
  function visualLineEndNo(doc, lineN) {
    if (lineN > doc.lastLine()) return lineN
    let line = getLine(doc, lineN), merged;
    if (!lineIsHidden(doc, line)) return lineN
    while (merged = collapsedSpanAtEnd(line))
      line = merged.find(1, true).line;
    return lineNo(line) + 1
  }

  // Compute whether a line is hidden. Lines count as hidden when they
  // are part of a visual line that starts with another line, or when
  // they are entirely covered by collapsed, non-widget span.
  function lineIsHidden(doc, line) {
    let sps = sawCollapsedSpans && line.markedSpans;
    if (sps) for (let sp, i = 0; i < sps.length; ++i) {
      sp = sps[i];
      if (!sp.marker.collapsed) continue
      if (sp.from == null) return true
      if (sp.marker.widgetNode) continue
      if (sp.from == 0 && sp.marker.inclusiveLeft && lineIsHiddenInner(doc, line, sp))
        return true
    }
  }
  function lineIsHiddenInner(doc, line, span) {
    if (span.to == null) {
      let end = span.marker.find(1, true);
      return lineIsHiddenInner(doc, end.line, getMarkedSpanFor(end.line.markedSpans, span.marker))
    }
    if (span.marker.inclusiveRight && span.to == line.text.length)
      return true
    for (let sp, i = 0; i < line.markedSpans.length; ++i) {
      sp = line.markedSpans[i];
      if (sp.marker.collapsed && !sp.marker.widgetNode && sp.from == span.to &&
          (sp.to == null || sp.to != span.from) &&
          (sp.marker.inclusiveLeft || span.marker.inclusiveRight) &&
          lineIsHiddenInner(doc, line, sp)) return true
    }
  }

  // Find the height above the given line.
  function heightAtLine(lineObj) {
    lineObj = visualLine(lineObj);

    let h = 0, chunk = lineObj.parent;
    for (let i = 0; i < chunk.lines.length; ++i) {
      let line = chunk.lines[i];
      if (line == lineObj) break
      else h += line.height;
    }
    for (let p = chunk.parent; p; chunk = p, p = chunk.parent) {
      for (let i = 0; i < p.children.length; ++i) {
        let cur = p.children[i];
        if (cur == chunk) break
        else h += cur.height;
      }
    }
    return h
  }

  // Compute the character length of a line, taking into account
  // collapsed ranges (see markText) that might hide parts, and join
  // other lines onto it.
  function lineLength(line) {
    if (line.height == 0) return 0
    let len = line.text.length, merged, cur = line;
    while (merged = collapsedSpanAtStart(cur)) {
      let found = merged.find(0, true);
      cur = found.from.line;
      len += found.from.ch - found.to.ch;
    }
    cur = line;
    while (merged = collapsedSpanAtEnd(cur)) {
      let found = merged.find(0, true);
      len -= cur.text.length - found.from.ch;
      cur = found.to.line;
      len += cur.text.length - found.to.ch;
    }
    return len
  }

  // Find the longest line in the document.
  function findMaxLine(cm) {
    let d = cm.display, doc = cm.doc;
    d.maxLine = getLine(doc, doc.first);
    d.maxLineLength = lineLength(d.maxLine);
    d.maxLineChanged = true;
    doc.iter(line => {
      let len = lineLength(line);
      if (len > d.maxLineLength) {
        d.maxLineLength = len;
        d.maxLine = line;
      }
    });
  }

  // LINE DATA STRUCTURE

  // Line objects. These hold state related to a line, including
  // highlighting info (the styles array).
  class Line {
    constructor(text, markedSpans, estimateHeight) {
      this.text = text;
      attachMarkedSpans(this, markedSpans);
      this.height = estimateHeight ? estimateHeight(this) : 1;
    }

    lineNo() { return lineNo(this) }
  }
  eventMixin(Line);

  // Change the content (text, markers) of a line. Automatically
  // invalidates cached information and tries to re-estimate the
  // line's height.
  function updateLine(line, text, markedSpans, estimateHeight) {
    line.text = text;
    if (line.stateAfter) line.stateAfter = null;
    if (line.styles) line.styles = null;
    if (line.order != null) line.order = null;
    detachMarkedSpans(line);
    attachMarkedSpans(line, markedSpans);
    let estHeight = estimateHeight ? estimateHeight(line) : 1;
    if (estHeight != line.height) updateLineHeight(line, estHeight);
  }

  // Detach a line from the document tree and its markers.
  function cleanUpLine(line) {
    line.parent = null;
    detachMarkedSpans(line);
  }

  // Convert a style as returned by a mode (either null, or a string
  // containing one or more styles) to a CSS style. This is cached,
  // and also looks for line-wide styles.
  let styleToClassCache = {}, styleToClassCacheWithMode = {};
  function interpretTokenStyle(style, options) {
    if (!style || /^\s*$/.test(style)) return null
    let cache = options.addModeClass ? styleToClassCacheWithMode : styleToClassCache;
    return cache[style] ||
      (cache[style] = style.replace(/\S+/g, "cm-$&"))
  }

  // Render the DOM representation of the text of a line. Also builds
  // up a 'line map', which points at the DOM nodes that represent
  // specific stretches of text, and is used by the measuring code.
  // The returned object contains the DOM node, this map, and
  // information about line-wide styles that were set by the mode.
  function buildLineContent(cm, lineView) {
    // The padding-right forces the element to have a 'border', which
    // is needed on Webkit to be able to get line-level bounding
    // rectangles for it (in measureChar).
    let content = eltP("span", null, null, webkit ? "padding-right: .1px" : null);
    let builder = {pre: eltP("pre", [content], "CodeMirror-line"), content: content,
                   col: 0, pos: 0, cm: cm,
                   trailingSpace: false,
                   splitSpaces: cm.getOption("lineWrapping")};
    lineView.measure = {};

    // Iterate over the logical lines that make up this visual line.
    for (let i = 0; i <= (lineView.rest ? lineView.rest.length : 0); i++) {
      let line = i ? lineView.rest[i - 1] : lineView.line, order;
      builder.pos = 0;
      builder.addToken = buildToken;
      // Optionally wire in some hacks into the token-rendering
      // algorithm, to deal with browser quirks.
      if (hasBadBidiRects(cm.display.measure) && (order = getOrder(line, cm.doc.direction)))
        builder.addToken = buildTokenBadBidi(builder.addToken, order);
      builder.map = [];
      let allowFrontierUpdate = lineView != cm.display.externalMeasured && lineNo(line);
      insertLineContent(line, builder, getLineStyles(cm, line, allowFrontierUpdate));
      if (line.styleClasses) {
        if (line.styleClasses.bgClass)
          builder.bgClass = joinClasses(line.styleClasses.bgClass, builder.bgClass || "");
        if (line.styleClasses.textClass)
          builder.textClass = joinClasses(line.styleClasses.textClass, builder.textClass || "");
      }

      // Ensure at least a single node is present, for measuring.
      if (builder.map.length == 0)
        builder.map.push(0, 0, builder.content.appendChild(zeroWidthElement(cm.display.measure)));

      // Store the map and a cache object for the current logical line
      if (i == 0) {
        lineView.measure.map = builder.map;
        lineView.measure.cache = {};
      } else {
  (lineView.measure.maps || (lineView.measure.maps = [])).push(builder.map)
        ;(lineView.measure.caches || (lineView.measure.caches = [])).push({});
      }
    }

    // See issue #2901
    if (webkit) {
      let last = builder.content.lastChild;
      if (/\bcm-tab\b/.test(last.className) || (last.querySelector && last.querySelector(".cm-tab")))
        builder.content.className = "cm-tab-wrap-hack";
    }

    signal(cm, "renderLine", cm, lineView.line, builder.pre);
    if (builder.pre.className)
      builder.textClass = joinClasses(builder.pre.className, builder.textClass || "");

    return builder
  }

  function defaultSpecialCharPlaceholder(ch) {
    let token = elt("span", "\u2022", "cm-invalidchar");
    token.title = "\\u" + ch.charCodeAt(0).toString(16);
    token.setAttribute("aria-label", token.title);
    return token
  }

  // Build up the DOM representation for a single token, and add it to
  // the line map. Takes care to render special characters separately.
  function buildToken(builder, text, style, startStyle, endStyle, css, attributes) {
    if (!text) return
    let displayText = builder.splitSpaces ? splitSpaces(text, builder.trailingSpace) : text;
    let special = builder.cm.state.specialChars, mustWrap = false;
    let content;
    if (!special.test(text)) {
      builder.col += text.length;
      content = document.createTextNode(displayText);
      builder.map.push(builder.pos, builder.pos + text.length, content);
      if (ie && ie_version < 9) mustWrap = true;
      builder.pos += text.length;
    } else {
      content = document.createDocumentFragment();
      let pos = 0;
      while (true) {
        special.lastIndex = pos;
        let m = special.exec(text);
        let skipped = m ? m.index - pos : text.length - pos;
        if (skipped) {
          let txt = document.createTextNode(displayText.slice(pos, pos + skipped));
          if (ie && ie_version < 9) content.appendChild(elt("span", [txt]));
          else content.appendChild(txt);
          builder.map.push(builder.pos, builder.pos + skipped, txt);
          builder.col += skipped;
          builder.pos += skipped;
        }
        if (!m) break
        pos += skipped + 1;
        let txt;
        if (m[0] == "\t") {
          let tabSize = builder.cm.options.tabSize, tabWidth = tabSize - builder.col % tabSize;
          txt = content.appendChild(elt("span", spaceStr(tabWidth), "cm-tab"));
          txt.setAttribute("role", "presentation");
          txt.setAttribute("cm-text", "\t");
          builder.col += tabWidth;
        } else if (m[0] == "\r" || m[0] == "\n") {
          txt = content.appendChild(elt("span", m[0] == "\r" ? "\u240d" : "\u2424", "cm-invalidchar"));
          txt.setAttribute("cm-text", m[0]);
          builder.col += 1;
        } else {
          txt = builder.cm.options.specialCharPlaceholder(m[0]);
          txt.setAttribute("cm-text", m[0]);
          if (ie && ie_version < 9) content.appendChild(elt("span", [txt]));
          else content.appendChild(txt);
          builder.col += 1;
        }
        builder.map.push(builder.pos, builder.pos + 1, txt);
        builder.pos++;
      }
    }
    builder.trailingSpace = displayText.charCodeAt(text.length - 1) == 32;
    if (style || startStyle || endStyle || mustWrap || css) {
      let fullStyle = style || "";
      if (startStyle) fullStyle += startStyle;
      if (endStyle) fullStyle += endStyle;
      let token = elt("span", [content], fullStyle, css);
      if (attributes) {
        for (let attr in attributes) if (attributes.hasOwnProperty(attr) && attr != "style" && attr != "class")
          token.setAttribute(attr, attributes[attr]);
      }
      return builder.content.appendChild(token)
    }
    builder.content.appendChild(content);
  }

  // Change some spaces to NBSP to prevent the browser from collapsing
  // trailing spaces at the end of a line when rendering text (issue #1362).
  function splitSpaces(text, trailingBefore) {
    if (text.length > 1 && !/  /.test(text)) return text
    let spaceBefore = trailingBefore, result = "";
    for (let i = 0; i < text.length; i++) {
      let ch = text.charAt(i);
      if (ch == " " && spaceBefore && (i == text.length - 1 || text.charCodeAt(i + 1) == 32))
        ch = "\u00a0";
      result += ch;
      spaceBefore = ch == " ";
    }
    return result
  }

  // Work around nonsense dimensions being reported for stretches of
  // right-to-left text.
  function buildTokenBadBidi(inner, order) {
    return (builder, text, style, startStyle, endStyle, css, attributes) => {
      style = style ? style + " cm-force-border" : "cm-force-border";
      let start = builder.pos, end = start + text.length;
      for (;;) {
        // Find the part that overlaps with the start of this text
        let part;
        for (let i = 0; i < order.length; i++) {
          part = order[i];
          if (part.to > start && part.from <= start) break
        }
        if (part.to >= end) return inner(builder, text, style, startStyle, endStyle, css, attributes)
        inner(builder, text.slice(0, part.to - start), style, startStyle, null, css, attributes);
        startStyle = null;
        text = text.slice(part.to - start);
        start = part.to;
      }
    }
  }

  function buildCollapsedSpan(builder, size, marker, ignoreWidget) {
    let widget = !ignoreWidget && marker.widgetNode;
    if (widget) builder.map.push(builder.pos, builder.pos + size, widget);
    if (!ignoreWidget && builder.cm.display.input.needsContentAttribute) {
      if (!widget)
        widget = builder.content.appendChild(document.createElement("span"));
      widget.setAttribute("cm-marker", marker.id);
    }
    if (widget) {
      builder.cm.display.input.setUneditable(widget);
      builder.content.appendChild(widget);
    }
    builder.pos += size;
    builder.trailingSpace = false;
  }

  // Outputs a number of spans to make up a line, taking highlighting
  // and marked text into account.
  function insertLineContent(line, builder, styles) {
    let spans = line.markedSpans, allText = line.text, at = 0;
    if (!spans) {
      for (let i = 1; i < styles.length; i+=2)
        builder.addToken(builder, allText.slice(at, at = styles[i]), interpretTokenStyle(styles[i+1], builder.cm.options));
      return
    }

    let len = allText.length, pos = 0, i = 1, text = "", style, css;
    let nextChange = 0, spanStyle, spanEndStyle, spanStartStyle, collapsed, attributes;
    for (;;) {
      if (nextChange == pos) { // Update current marker set
        spanStyle = spanEndStyle = spanStartStyle = css = "";
        attributes = null;
        collapsed = null; nextChange = Infinity;
        let foundBookmarks = [], endStyles;
        for (let j = 0; j < spans.length; ++j) {
          let sp = spans[j], m = sp.marker;
          if (m.type == "bookmark" && sp.from == pos && m.widgetNode) {
            foundBookmarks.push(m);
          } else if (sp.from <= pos && (sp.to == null || sp.to > pos || m.collapsed && sp.to == pos && sp.from == pos)) {
            if (sp.to != null && sp.to != pos && nextChange > sp.to) {
              nextChange = sp.to;
              spanEndStyle = "";
            }
            if (m.className) spanStyle += " " + m.className;
            if (m.css) css = (css ? css + ";" : "") + m.css;
            if (m.startStyle && sp.from == pos) spanStartStyle += " " + m.startStyle;
            if (m.endStyle && sp.to == nextChange) (endStyles || (endStyles = [])).push(m.endStyle, sp.to);
            // support for the old title property
            // https://github.com/codemirror/CodeMirror/pull/5673
            if (m.title) (attributes || (attributes = {})).title = m.title;
            if (m.attributes) {
              for (let attr in m.attributes)
                (attributes || (attributes = {}))[attr] = m.attributes[attr];
            }
            if (m.collapsed && (!collapsed || compareCollapsedMarkers(collapsed.marker, m) < 0))
              collapsed = sp;
          } else if (sp.from > pos && nextChange > sp.from) {
            nextChange = sp.from;
          }
        }
        if (endStyles) for (let j = 0; j < endStyles.length; j += 2)
          if (endStyles[j + 1] == nextChange) spanEndStyle += " " + endStyles[j];

        if (!collapsed || collapsed.from == pos) for (let j = 0; j < foundBookmarks.length; ++j)
          buildCollapsedSpan(builder, 0, foundBookmarks[j]);
        if (collapsed && (collapsed.from || 0) == pos) {
          buildCollapsedSpan(builder, (collapsed.to == null ? len + 1 : collapsed.to) - pos,
                             collapsed.marker, collapsed.from == null);
          if (collapsed.to == null) return
          if (collapsed.to == pos) collapsed = false;
        }
      }
      if (pos >= len) break

      let upto = Math.min(len, nextChange);
      while (true) {
        if (text) {
          let end = pos + text.length;
          if (!collapsed) {
            let tokenText = end > upto ? text.slice(0, upto - pos) : text;
            builder.addToken(builder, tokenText, style ? style + spanStyle : spanStyle,
                             spanStartStyle, pos + tokenText.length == nextChange ? spanEndStyle : "", css, attributes);
          }
          if (end >= upto) {text = text.slice(upto - pos); pos = upto; break}
          pos = end;
          spanStartStyle = "";
        }
        text = allText.slice(at, at = styles[i++]);
        style = interpretTokenStyle(styles[i++], builder.cm.options);
      }
    }
  }


  // These objects are used to represent the visible (currently drawn)
  // part of the document. A LineView may correspond to multiple
  // logical lines, if those are connected by collapsed ranges.
  function LineView(doc, line, lineN) {
    // The starting line
    this.line = line;
    // Continuing lines, if any
    this.rest = visualLineContinued(line);
    // Number of logical lines in this visual line
    this.size = this.rest ? lineNo(lst(this.rest)) - lineN + 1 : 1;
    this.node = this.text = null;
    this.hidden = lineIsHidden(doc, line);
  }

  // Create a range of LineView objects for the given lines.
  function buildViewArray(cm, from, to) {
    let array = [], nextPos;
    for (let pos = from; pos < to; pos = nextPos) {
      let view = new LineView(cm.doc, getLine(cm.doc, pos), pos);
      nextPos = pos + view.size;
      array.push(view);
    }
    return array
  }

  let operationGroup = null;

  function pushOperation(op) {
    if (operationGroup) {
      operationGroup.ops.push(op);
    } else {
      op.ownsGroup = operationGroup = {
        ops: [op],
        delayedCallbacks: []
      };
    }
  }

  function fireCallbacksForOps(group) {
    // Calls delayed callbacks and cursorActivity handlers until no
    // new ones appear
    let callbacks = group.delayedCallbacks, i = 0;
    do {
      for (; i < callbacks.length; i++)
        callbacks[i].call(null);
      for (let j = 0; j < group.ops.length; j++) {
        let op = group.ops[j];
        if (op.cursorActivityHandlers)
          while (op.cursorActivityCalled < op.cursorActivityHandlers.length)
            op.cursorActivityHandlers[op.cursorActivityCalled++].call(null, op.cm);
      }
    } while (i < callbacks.length)
  }

  function finishOperation(op, endCb) {
    let group = op.ownsGroup;
    if (!group) return

    try { fireCallbacksForOps(group); }
    finally {
      operationGroup = null;
      endCb(group);
    }
  }

  let orphanDelayedCallbacks = null;

  // Often, we want to signal events at a point where we are in the
  // middle of some work, but don't want the handler to start calling
  // other methods on the editor, which might be in an inconsistent
  // state or simply not expect any other events to happen.
  // signalLater looks whether there are any handlers, and schedules
  // them to be executed when the last operation ends, or, if no
  // operation is active, when a timeout fires.
  function signalLater(emitter, type /*, values...*/) {
    let arr = getHandlers(emitter, type);
    if (!arr.length) return
    let args = Array.prototype.slice.call(arguments, 2), list;
    if (operationGroup) {
      list = operationGroup.delayedCallbacks;
    } else if (orphanDelayedCallbacks) {
      list = orphanDelayedCallbacks;
    } else {
      list = orphanDelayedCallbacks = [];
      setTimeout(fireOrphanDelayed, 0);
    }
    for (let i = 0; i < arr.length; ++i)
      list.push(() => arr[i].apply(null, args));
  }

  function fireOrphanDelayed() {
    let delayed = orphanDelayedCallbacks;
    orphanDelayedCallbacks = null;
    for (let i = 0; i < delayed.length; ++i) delayed[i]();
  }

  // When an aspect of a line changes, a string is added to
  // lineView.changes. This updates the relevant part of the line's
  // DOM structure.
  function updateLineForChanges(cm, lineView, lineN, dims) {
    for (let j = 0; j < lineView.changes.length; j++) {
      let type = lineView.changes[j];
      if (type == "text") updateLineText(cm, lineView);
      else if (type == "gutter") updateLineGutter(cm, lineView, lineN, dims);
      else if (type == "class") updateLineClasses(cm, lineView);
      else if (type == "widget") updateLineWidgets(cm, lineView, dims);
    }
    lineView.changes = null;
  }

  // Lines with gutter elements, widgets or a background class need to
  // be wrapped, and have the extra elements added to the wrapper div
  function ensureLineWrapped(lineView) {
    if (lineView.node == lineView.text) {
      lineView.node = elt("div", null, null, "position: relative");
      if (lineView.text.parentNode)
        lineView.text.parentNode.replaceChild(lineView.node, lineView.text);
      lineView.node.appendChild(lineView.text);
      if (ie && ie_version < 8) lineView.node.style.zIndex = 2;
    }
    return lineView.node
  }

  function updateLineBackground(cm, lineView) {
    let cls = lineView.bgClass ? lineView.bgClass + " " + (lineView.line.bgClass || "") : lineView.line.bgClass;
    if (cls) cls += " CodeMirror-linebackground";
    if (lineView.background) {
      if (cls) lineView.background.className = cls;
      else { lineView.background.parentNode.removeChild(lineView.background); lineView.background = null; }
    } else if (cls) {
      let wrap = ensureLineWrapped(lineView);
      lineView.background = wrap.insertBefore(elt("div", null, cls), wrap.firstChild);
      cm.display.input.setUneditable(lineView.background);
    }
  }

  // Wrapper around buildLineContent which will reuse the structure
  // in display.externalMeasured when possible.
  function getLineContent(cm, lineView) {
    let ext = cm.display.externalMeasured;
    if (ext && ext.line == lineView.line) {
      cm.display.externalMeasured = null;
      lineView.measure = ext.measure;
      return ext.built
    }
    return buildLineContent(cm, lineView)
  }

  // Redraw the line's text. Interacts with the background and text
  // classes because the mode may output tokens that influence these
  // classes.
  function updateLineText(cm, lineView) {
    let cls = lineView.text.className;
    let built = getLineContent(cm, lineView);
    if (lineView.text == lineView.node) lineView.node = built.pre;
    lineView.text.parentNode.replaceChild(built.pre, lineView.text);
    lineView.text = built.pre;
    if (built.bgClass != lineView.bgClass || built.textClass != lineView.textClass) {
      lineView.bgClass = built.bgClass;
      lineView.textClass = built.textClass;
      updateLineClasses(cm, lineView);
    } else if (cls) {
      lineView.text.className = cls;
    }
  }

  function updateLineClasses(cm, lineView) {
    updateLineBackground(cm, lineView);
    if (lineView.line.wrapClass)
      ensureLineWrapped(lineView).className = lineView.line.wrapClass;
    else if (lineView.node != lineView.text)
      lineView.node.className = "";
    let textClass = lineView.textClass ? lineView.textClass + " " + (lineView.line.textClass || "") : lineView.line.textClass;
    lineView.text.className = textClass || "";
  }

  function updateLineGutter(cm, lineView, lineN, dims) {
    if (lineView.gutter) {
      lineView.node.removeChild(lineView.gutter);
      lineView.gutter = null;
    }
    if (lineView.gutterBackground) {
      lineView.node.removeChild(lineView.gutterBackground);
      lineView.gutterBackground = null;
    }
    if (lineView.line.gutterClass) {
      let wrap = ensureLineWrapped(lineView);
      lineView.gutterBackground = elt("div", null, "CodeMirror-gutter-background " + lineView.line.gutterClass,
                                      `left: ${cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth}px; width: ${dims.gutterTotalWidth}px`);
      cm.display.input.setUneditable(lineView.gutterBackground);
      wrap.insertBefore(lineView.gutterBackground, lineView.text);
    }
    let markers = lineView.line.gutterMarkers;
    if (cm.options.lineNumbers || markers) {
      let wrap = ensureLineWrapped(lineView);
      let gutterWrap = lineView.gutter = elt("div", null, "CodeMirror-gutter-wrapper", `left: ${cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth}px`);
      cm.display.input.setUneditable(gutterWrap);
      wrap.insertBefore(gutterWrap, lineView.text);
      if (lineView.line.gutterClass)
        gutterWrap.className += " " + lineView.line.gutterClass;
      if (cm.options.lineNumbers && (!markers || !markers["CodeMirror-linenumbers"]))
        lineView.lineNumber = gutterWrap.appendChild(
          elt("div", lineNumberFor(cm.options, lineN),
              "CodeMirror-linenumber CodeMirror-gutter-elt",
              `left: ${dims.gutterLeft["CodeMirror-linenumbers"]}px; width: ${cm.display.lineNumInnerWidth}px`));
      if (markers) for (let k = 0; k < cm.display.gutterSpecs.length; ++k) {
        let id = cm.display.gutterSpecs[k].className, found = markers.hasOwnProperty(id) && markers[id];
        if (found)
          gutterWrap.appendChild(elt("div", [found], "CodeMirror-gutter-elt",
                                     `left: ${dims.gutterLeft[id]}px; width: ${dims.gutterWidth[id]}px`));
      }
    }
  }

  function updateLineWidgets(cm, lineView, dims) {
    if (lineView.alignable) lineView.alignable = null;
    for (let node = lineView.node.firstChild, next; node; node = next) {
      next = node.nextSibling;
      if (node.className == "CodeMirror-linewidget")
        lineView.node.removeChild(node);
    }
    insertLineWidgets(cm, lineView, dims);
  }

  // Build a line's DOM representation from scratch
  function buildLineElement(cm, lineView, lineN, dims) {
    let built = getLineContent(cm, lineView);
    lineView.text = lineView.node = built.pre;
    if (built.bgClass) lineView.bgClass = built.bgClass;
    if (built.textClass) lineView.textClass = built.textClass;

    updateLineClasses(cm, lineView);
    updateLineGutter(cm, lineView, lineN, dims);
    insertLineWidgets(cm, lineView, dims);
    return lineView.node
  }

  // A lineView may contain multiple logical lines (when merged by
  // collapsed spans). The widgets for all of them need to be drawn.
  function insertLineWidgets(cm, lineView, dims) {
    insertLineWidgetsFor(cm, lineView.line, lineView, dims, true);
    if (lineView.rest) for (let i = 0; i < lineView.rest.length; i++)
      insertLineWidgetsFor(cm, lineView.rest[i], lineView, dims, false);
  }

  function insertLineWidgetsFor(cm, line, lineView, dims, allowAbove) {
    if (!line.widgets) return
    let wrap = ensureLineWrapped(lineView);
    for (let i = 0, ws = line.widgets; i < ws.length; ++i) {
      let widget = ws[i], node = elt("div", [widget.node], "CodeMirror-linewidget");
      if (!widget.handleMouseEvents) node.setAttribute("cm-ignore-events", "true");
      positionLineWidget(widget, node, lineView, dims);
      cm.display.input.setUneditable(node);
      if (allowAbove && widget.above)
        wrap.insertBefore(node, lineView.gutter || lineView.text);
      else
        wrap.appendChild(node);
      signalLater(widget, "redraw");
    }
  }

  function positionLineWidget(widget, node, lineView, dims) {
    if (widget.noHScroll) {
  (lineView.alignable || (lineView.alignable = [])).push(node);
      let width = dims.wrapperWidth;
      node.style.left = dims.fixedPos + "px";
      if (!widget.coverGutter) {
        width -= dims.gutterTotalWidth;
        node.style.paddingLeft = dims.gutterTotalWidth + "px";
      }
      node.style.width = width + "px";
    }
    if (widget.coverGutter) {
      node.style.zIndex = 5;
      node.style.position = "relative";
      if (!widget.noHScroll) node.style.marginLeft = -dims.gutterTotalWidth + "px";
    }
  }

  function widgetHeight(widget) {
    if (widget.height != null) return widget.height
    let cm = widget.doc.cm;
    if (!cm) return 0
    if (!contains(document.body, widget.node)) {
      let parentStyle = "position: relative;";
      if (widget.coverGutter)
        parentStyle += "margin-left: -" + cm.display.gutters.offsetWidth + "px;";
      if (widget.noHScroll)
        parentStyle += "width: " + cm.display.wrapper.clientWidth + "px;";
      removeChildrenAndAdd(cm.display.measure, elt("div", [widget.node], null, parentStyle));
    }
    return widget.height = widget.node.parentNode.offsetHeight
  }

  // Return true when the given mouse event happened in a widget
  function eventInWidget(display, e) {
    for (let n = e_target(e); n != display.wrapper; n = n.parentNode) {
      if (!n || (n.nodeType == 1 && n.getAttribute("cm-ignore-events") == "true") ||
          (n.parentNode == display.sizer && n != display.mover))
        return true
    }
  }

  // POSITION MEASUREMENT

  function paddingTop(display) {return display.lineSpace.offsetTop}
  function paddingVert(display) {return display.mover.offsetHeight - display.lineSpace.offsetHeight}
  function paddingH(display) {
    if (display.cachedPaddingH) return display.cachedPaddingH
    let e = removeChildrenAndAdd(display.measure, elt("pre", "x"));
    let style = window.getComputedStyle ? window.getComputedStyle(e) : e.currentStyle;
    let data = {left: parseInt(style.paddingLeft), right: parseInt(style.paddingRight)};
    if (!isNaN(data.left) && !isNaN(data.right)) display.cachedPaddingH = data;
    return data
  }

  function scrollGap(cm) { return scrollerGap - cm.display.nativeBarWidth }
  function displayWidth(cm) {
    return cm.display.scroller.clientWidth - scrollGap(cm) - cm.display.barWidth
  }
  function displayHeight(cm) {
    return cm.display.scroller.clientHeight - scrollGap(cm) - cm.display.barHeight
  }

  // Ensure the lineView.wrapping.heights array is populated. This is
  // an array of bottom offsets for the lines that make up a drawn
  // line. When lineWrapping is on, there might be more than one
  // height.
  function ensureLineHeights(cm, lineView, rect) {
    let wrapping = cm.options.lineWrapping;
    let curWidth = wrapping && displayWidth(cm);
    if (!lineView.measure.heights || wrapping && lineView.measure.width != curWidth) {
      let heights = lineView.measure.heights = [];
      if (wrapping) {
        lineView.measure.width = curWidth;
        let rects = lineView.text.firstChild.getClientRects();
        for (let i = 0; i < rects.length - 1; i++) {
          let cur = rects[i], next = rects[i + 1];
          if (Math.abs(cur.bottom - next.bottom) > 2)
            heights.push((cur.bottom + next.top) / 2 - rect.top);
        }
      }
      heights.push(rect.bottom - rect.top);
    }
  }

  // Find a line map (mapping character offsets to text nodes) and a
  // measurement cache for the given line number. (A line view might
  // contain multiple lines when collapsed ranges are present.)
  function mapFromLineView(lineView, line, lineN) {
    if (lineView.line == line)
      return {map: lineView.measure.map, cache: lineView.measure.cache}
    for (let i = 0; i < lineView.rest.length; i++)
      if (lineView.rest[i] == line)
        return {map: lineView.measure.maps[i], cache: lineView.measure.caches[i]}
    for (let i = 0; i < lineView.rest.length; i++)
      if (lineNo(lineView.rest[i]) > lineN)
        return {map: lineView.measure.maps[i], cache: lineView.measure.caches[i], before: true}
  }

  // Render a line into the hidden node display.externalMeasured. Used
  // when measurement is needed for a line that's not in the viewport.
  function updateExternalMeasurement(cm, line) {
    line = visualLine(line);
    let lineN = lineNo(line);
    let view = cm.display.externalMeasured = new LineView(cm.doc, line, lineN);
    view.lineN = lineN;
    let built = view.built = buildLineContent(cm, view);
    view.text = built.pre;
    removeChildrenAndAdd(cm.display.lineMeasure, built.pre);
    return view
  }

  // Get a {top, bottom, left, right} box (in line-local coordinates)
  // for a given character.
  function measureChar(cm, line, ch, bias) {
    return measureCharPrepared(cm, prepareMeasureForLine(cm, line), ch, bias)
  }

  // Find a line view that corresponds to the given line number.
  function findViewForLine(cm, lineN) {
    if (lineN >= cm.display.viewFrom && lineN < cm.display.viewTo)
      return cm.display.view[findViewIndex(cm, lineN)]
    let ext = cm.display.externalMeasured;
    if (ext && lineN >= ext.lineN && lineN < ext.lineN + ext.size)
      return ext
  }

  // Measurement can be split in two steps, the set-up work that
  // applies to the whole line, and the measurement of the actual
  // character. Functions like coordsChar, that need to do a lot of
  // measurements in a row, can thus ensure that the set-up work is
  // only done once.
  function prepareMeasureForLine(cm, line) {
    let lineN = lineNo(line);
    let view = findViewForLine(cm, lineN);
    if (view && !view.text) {
      view = null;
    } else if (view && view.changes) {
      updateLineForChanges(cm, view, lineN, getDimensions(cm));
      cm.curOp.forceUpdate = true;
    }
    if (!view)
      view = updateExternalMeasurement(cm, line);

    let info = mapFromLineView(view, line, lineN);
    return {
      line: line, view: view, rect: null,
      map: info.map, cache: info.cache, before: info.before,
      hasHeights: false
    }
  }

  // Given a prepared measurement object, measures the position of an
  // actual character (or fetches it from the cache).
  function measureCharPrepared(cm, prepared, ch, bias, varHeight) {
    if (prepared.before) ch = -1;
    let key = ch + (bias || ""), found;
    if (prepared.cache.hasOwnProperty(key)) {
      found = prepared.cache[key];
    } else {
      if (!prepared.rect)
        prepared.rect = prepared.view.text.getBoundingClientRect();
      if (!prepared.hasHeights) {
        ensureLineHeights(cm, prepared.view, prepared.rect);
        prepared.hasHeights = true;
      }
      found = measureCharInner(cm, prepared, ch, bias);
      if (!found.bogus) prepared.cache[key] = found;
    }
    return {left: found.left, right: found.right,
            top: varHeight ? found.rtop : found.top,
            bottom: varHeight ? found.rbottom : found.bottom}
  }

  let nullRect = {left: 0, right: 0, top: 0, bottom: 0};

  function nodeAndOffsetInLineMap(map$$1, ch, bias) {
    let node, start, end, collapse, mStart, mEnd;
    // First, search the line map for the text node corresponding to,
    // or closest to, the target character.
    for (let i = 0; i < map$$1.length; i += 3) {
      mStart = map$$1[i];
      mEnd = map$$1[i + 1];
      if (ch < mStart) {
        start = 0; end = 1;
        collapse = "left";
      } else if (ch < mEnd) {
        start = ch - mStart;
        end = start + 1;
      } else if (i == map$$1.length - 3 || ch == mEnd && map$$1[i + 3] > ch) {
        end = mEnd - mStart;
        start = end - 1;
        if (ch >= mEnd) collapse = "right";
      }
      if (start != null) {
        node = map$$1[i + 2];
        if (mStart == mEnd && bias == (node.insertLeft ? "left" : "right"))
          collapse = bias;
        if (bias == "left" && start == 0)
          while (i && map$$1[i - 2] == map$$1[i - 3] && map$$1[i - 1].insertLeft) {
            node = map$$1[(i -= 3) + 2];
            collapse = "left";
          }
        if (bias == "right" && start == mEnd - mStart)
          while (i < map$$1.length - 3 && map$$1[i + 3] == map$$1[i + 4] && !map$$1[i + 5].insertLeft) {
            node = map$$1[(i += 3) + 2];
            collapse = "right";
          }
        break
      }
    }
    return {node: node, start: start, end: end, collapse: collapse, coverStart: mStart, coverEnd: mEnd}
  }

  function getUsefulRect(rects, bias) {
    let rect = nullRect;
    if (bias == "left") for (let i = 0; i < rects.length; i++) {
      if ((rect = rects[i]).left != rect.right) break
    } else for (let i = rects.length - 1; i >= 0; i--) {
      if ((rect = rects[i]).left != rect.right) break
    }
    return rect
  }

  function measureCharInner(cm, prepared, ch, bias) {
    let place = nodeAndOffsetInLineMap(prepared.map, ch, bias);
    let node = place.node, start = place.start, end = place.end, collapse = place.collapse;

    let rect;
    if (node.nodeType == 3) { // If it is a text node, use a range to retrieve the coordinates.
      for (let i = 0; i < 4; i++) { // Retry a maximum of 4 times when nonsense rectangles are returned
        while (start && isExtendingChar(prepared.line.text.charAt(place.coverStart + start))) --start;
        while (place.coverStart + end < place.coverEnd && isExtendingChar(prepared.line.text.charAt(place.coverStart + end))) ++end;
        if (ie && ie_version < 9 && start == 0 && end == place.coverEnd - place.coverStart)
          rect = node.parentNode.getBoundingClientRect();
        else
          rect = getUsefulRect(range(node, start, end).getClientRects(), bias);
        if (rect.left || rect.right || start == 0) break
        end = start;
        start = start - 1;
        collapse = "right";
      }
      if (ie && ie_version < 11) rect = maybeUpdateRectForZooming(cm.display.measure, rect);
    } else { // If it is a widget, simply get the box for the whole widget.
      if (start > 0) collapse = bias = "right";
      let rects;
      if (cm.options.lineWrapping && (rects = node.getClientRects()).length > 1)
        rect = rects[bias == "right" ? rects.length - 1 : 0];
      else
        rect = node.getBoundingClientRect();
    }
    if (ie && ie_version < 9 && !start && (!rect || !rect.left && !rect.right)) {
      let rSpan = node.parentNode.getClientRects()[0];
      if (rSpan)
        rect = {left: rSpan.left, right: rSpan.left + charWidth(cm.display), top: rSpan.top, bottom: rSpan.bottom};
      else
        rect = nullRect;
    }

    let rtop = rect.top - prepared.rect.top, rbot = rect.bottom - prepared.rect.top;
    let mid = (rtop + rbot) / 2;
    let heights = prepared.view.measure.heights;
    let i = 0;
    for (; i < heights.length - 1; i++)
      if (mid < heights[i]) break
    let top = i ? heights[i - 1] : 0, bot = heights[i];
    let result = {left: (collapse == "right" ? rect.right : rect.left) - prepared.rect.left,
                  right: (collapse == "left" ? rect.left : rect.right) - prepared.rect.left,
                  top: top, bottom: bot};
    if (!rect.left && !rect.right) result.bogus = true;
    if (!cm.options.singleCursorHeightPerLine) { result.rtop = rtop; result.rbottom = rbot; }

    return result
  }

  // Work around problem with bounding client rects on ranges being
  // returned incorrectly when zoomed on IE10 and below.
  function maybeUpdateRectForZooming(measure, rect) {
    if (!window.screen || screen.logicalXDPI == null ||
        screen.logicalXDPI == screen.deviceXDPI || !hasBadZoomedRects(measure))
      return rect
    let scaleX = screen.logicalXDPI / screen.deviceXDPI;
    let scaleY = screen.logicalYDPI / screen.deviceYDPI;
    return {left: rect.left * scaleX, right: rect.right * scaleX,
            top: rect.top * scaleY, bottom: rect.bottom * scaleY}
  }

  function clearLineMeasurementCacheFor(lineView) {
    if (lineView.measure) {
      lineView.measure.cache = {};
      lineView.measure.heights = null;
      if (lineView.rest) for (let i = 0; i < lineView.rest.length; i++)
        lineView.measure.caches[i] = {};
    }
  }

  function clearLineMeasurementCache(cm) {
    cm.display.externalMeasure = null;
    removeChildren(cm.display.lineMeasure);
    for (let i = 0; i < cm.display.view.length; i++)
      clearLineMeasurementCacheFor(cm.display.view[i]);
  }

  function clearCaches(cm) {
    clearLineMeasurementCache(cm);
    cm.display.cachedCharWidth = cm.display.cachedTextHeight = cm.display.cachedPaddingH = null;
    if (!cm.options.lineWrapping) cm.display.maxLineChanged = true;
    cm.display.lineNumChars = null;
  }

  function pageScrollX() {
    // Work around https://bugs.chromium.org/p/chromium/issues/detail?id=489206
    // which causes page_Offset and bounding client rects to use
    // different reference viewports and invalidate our calculations.
    if (chrome && android) return -(document.body.getBoundingClientRect().left - parseInt(getComputedStyle(document.body).marginLeft))
    return window.pageXOffset || (document.documentElement || document.body).scrollLeft
  }
  function pageScrollY() {
    if (chrome && android) return -(document.body.getBoundingClientRect().top - parseInt(getComputedStyle(document.body).marginTop))
    return window.pageYOffset || (document.documentElement || document.body).scrollTop
  }

  function widgetTopHeight(lineObj) {
    let height = 0;
    if (lineObj.widgets) for (let i = 0; i < lineObj.widgets.length; ++i) if (lineObj.widgets[i].above)
      height += widgetHeight(lineObj.widgets[i]);
    return height
  }

  // Converts a {top, bottom, left, right} box from line-local
  // coordinates into another coordinate system. Context may be one of
  // "line", "div" (display.lineDiv), "local"./null (editor), "window",
  // or "page".
  function intoCoordSystem(cm, lineObj, rect, context, includeWidgets) {
    if (!includeWidgets) {
      let height = widgetTopHeight(lineObj);
      rect.top += height; rect.bottom += height;
    }
    if (context == "line") return rect
    if (!context) context = "local";
    let yOff = heightAtLine(lineObj);
    if (context == "local") yOff += paddingTop(cm.display);
    else yOff -= cm.display.viewOffset;
    if (context == "page" || context == "window") {
      let lOff = cm.display.lineSpace.getBoundingClientRect();
      yOff += lOff.top + (context == "window" ? 0 : pageScrollY());
      let xOff = lOff.left + (context == "window" ? 0 : pageScrollX());
      rect.left += xOff; rect.right += xOff;
    }
    rect.top += yOff; rect.bottom += yOff;
    return rect
  }

  // Coverts a box from "div" coords to another coordinate system.
  // Context may be "window", "page", "div", or "local"./null.
  function fromCoordSystem(cm, coords, context) {
    if (context == "div") return coords
    let left = coords.left, top = coords.top;
    // First move into "page" coordinate system
    if (context == "page") {
      left -= pageScrollX();
      top -= pageScrollY();
    } else if (context == "local" || !context) {
      let localBox = cm.display.sizer.getBoundingClientRect();
      left += localBox.left;
      top += localBox.top;
    }

    let lineSpaceBox = cm.display.lineSpace.getBoundingClientRect();
    return {left: left - lineSpaceBox.left, top: top - lineSpaceBox.top}
  }

  function charCoords(cm, pos, context, lineObj, bias) {
    if (!lineObj) lineObj = getLine(cm.doc, pos.line);
    return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch, bias), context)
  }

  // Returns a box for a given cursor position, which may have an
  // 'other' property containing the position of the secondary cursor
  // on a bidi boundary.
  // A cursor Pos(line, char, "before") is on the same visual line as `char - 1`
  // and after `char - 1` in writing order of `char - 1`
  // A cursor Pos(line, char, "after") is on the same visual line as `char`
  // and before `char` in writing order of `char`
  // Examples (upper-case letters are RTL, lower-case are LTR):
  //     Pos(0, 1, ...)
  //     before   after
  // ab     a|b     a|b
  // aB     a|B     aB|
  // Ab     |Ab     A|b
  // AB     B|A     B|A
  // Every position after the last character on a line is considered to stick
  // to the last character on the line.
  function cursorCoords(cm, pos, context, lineObj, preparedMeasure, varHeight) {
    lineObj = lineObj || getLine(cm.doc, pos.line);
    if (!preparedMeasure) preparedMeasure = prepareMeasureForLine(cm, lineObj);
    function get(ch, right) {
      let m = measureCharPrepared(cm, preparedMeasure, ch, right ? "right" : "left", varHeight);
      if (right) m.left = m.right; else m.right = m.left;
      return intoCoordSystem(cm, lineObj, m, context)
    }
    let order = getOrder(lineObj, cm.doc.direction), ch = pos.ch, sticky = pos.sticky;
    if (ch >= lineObj.text.length) {
      ch = lineObj.text.length;
      sticky = "before";
    } else if (ch <= 0) {
      ch = 0;
      sticky = "after";
    }
    if (!order) return get(sticky == "before" ? ch - 1 : ch, sticky == "before")

    function getBidi(ch, partPos, invert) {
      let part = order[partPos], right = part.level == 1;
      return get(invert ? ch - 1 : ch, right != invert)
    }
    let partPos = getBidiPartAt(order, ch, sticky);
    let other = bidiOther;
    let val = getBidi(ch, partPos, sticky == "before");
    if (other != null) val.other = getBidi(ch, other, sticky != "before");
    return val
  }

  // Used to cheaply estimate the coordinates for a position. Used for
  // intermediate scroll updates.
  function estimateCoords(cm, pos) {
    let left = 0;
    pos = clipPos(cm.doc, pos);
    if (!cm.options.lineWrapping) left = charWidth(cm.display) * pos.ch;
    let lineObj = getLine(cm.doc, pos.line);
    let top = heightAtLine(lineObj) + paddingTop(cm.display);
    return {left: left, right: left, top: top, bottom: top + lineObj.height}
  }

  // Positions returned by coordsChar contain some extra information.
  // xRel is the relative x position of the input coordinates compared
  // to the found position (so xRel > 0 means the coordinates are to
  // the right of the character position, for example). When outside
  // is true, that means the coordinates lie outside the line's
  // vertical range.
  function PosWithInfo(line, ch, sticky, outside, xRel) {
    let pos = Pos(line, ch, sticky);
    pos.xRel = xRel;
    if (outside) pos.outside = true;
    return pos
  }

  // Compute the character position closest to the given coordinates.
  // Input must be lineSpace-local ("div" coordinate system).
  function coordsChar(cm, x, y) {
    let doc = cm.doc;
    y += cm.display.viewOffset;
    if (y < 0) return PosWithInfo(doc.first, 0, null, true, -1)
    let lineN = lineAtHeight(doc, y), last = doc.first + doc.size - 1;
    if (lineN > last)
      return PosWithInfo(doc.first + doc.size - 1, getLine(doc, last).text.length, null, true, 1)
    if (x < 0) x = 0;

    let lineObj = getLine(doc, lineN);
    for (;;) {
      let found = coordsCharInner(cm, lineObj, lineN, x, y);
      let collapsed = collapsedSpanAround(lineObj, found.ch + (found.xRel > 0 ? 1 : 0));
      if (!collapsed) return found
      let rangeEnd = collapsed.find(1);
      if (rangeEnd.line == lineN) return rangeEnd
      lineObj = getLine(doc, lineN = rangeEnd.line);
    }
  }

  function wrappedLineExtent(cm, lineObj, preparedMeasure, y) {
    y -= widgetTopHeight(lineObj);
    let end = lineObj.text.length;
    let begin = findFirst(ch => measureCharPrepared(cm, preparedMeasure, ch - 1).bottom <= y, end, 0);
    end = findFirst(ch => measureCharPrepared(cm, preparedMeasure, ch).top > y, begin, end);
    return {begin, end}
  }

  function wrappedLineExtentChar(cm, lineObj, preparedMeasure, target) {
    if (!preparedMeasure) preparedMeasure = prepareMeasureForLine(cm, lineObj);
    let targetTop = intoCoordSystem(cm, lineObj, measureCharPrepared(cm, preparedMeasure, target), "line").top;
    return wrappedLineExtent(cm, lineObj, preparedMeasure, targetTop)
  }

  // Returns true if the given side of a box is after the given
  // coordinates, in top-to-bottom, left-to-right order.
  function boxIsAfter(box, x, y, left) {
    return box.bottom <= y ? false : box.top > y ? true : (left ? box.left : box.right) > x
  }

  function coordsCharInner(cm, lineObj, lineNo$$1, x, y) {
    // Move y into line-local coordinate space
    y -= heightAtLine(lineObj);
    let preparedMeasure = prepareMeasureForLine(cm, lineObj);
    // When directly calling `measureCharPrepared`, we have to adjust
    // for the widgets at this line.
    let widgetHeight$$1 = widgetTopHeight(lineObj);
    let begin = 0, end = lineObj.text.length, ltr = true;

    let order = getOrder(lineObj, cm.doc.direction);
    // If the line isn't plain left-to-right text, first figure out
    // which bidi section the coordinates fall into.
    if (order) {
      let part = (cm.options.lineWrapping ? coordsBidiPartWrapped : coordsBidiPart)
                   (cm, lineObj, lineNo$$1, preparedMeasure, order, x, y);
      ltr = part.level != 1;
      // The awkward -1 offsets are needed because findFirst (called
      // on these below) will treat its first bound as inclusive,
      // second as exclusive, but we want to actually address the
      // characters in the part's range
      begin = ltr ? part.from : part.to - 1;
      end = ltr ? part.to : part.from - 1;
    }

    // A binary search to find the first character whose bounding box
    // starts after the coordinates. If we run across any whose box wrap
    // the coordinates, store that.
    let chAround = null, boxAround = null;
    let ch = findFirst(ch => {
      let box = measureCharPrepared(cm, preparedMeasure, ch);
      box.top += widgetHeight$$1; box.bottom += widgetHeight$$1;
      if (!boxIsAfter(box, x, y, false)) return false
      if (box.top <= y && box.left <= x) {
        chAround = ch;
        boxAround = box;
      }
      return true
    }, begin, end);

    let baseX, sticky, outside = false;
    // If a box around the coordinates was found, use that
    if (boxAround) {
      // Distinguish coordinates nearer to the left or right side of the box
      let atLeft = x - boxAround.left < boxAround.right - x, atStart = atLeft == ltr;
      ch = chAround + (atStart ? 0 : 1);
      sticky = atStart ? "after" : "before";
      baseX = atLeft ? boxAround.left : boxAround.right;
    } else {
      // (Adjust for extended bound, if necessary.)
      if (!ltr && (ch == end || ch == begin)) ch++;
      // To determine which side to associate with, get the box to the
      // left of the character and compare it's vertical position to the
      // coordinates
      sticky = ch == 0 ? "after" : ch == lineObj.text.length ? "before" :
        (measureCharPrepared(cm, preparedMeasure, ch - (ltr ? 1 : 0)).bottom + widgetHeight$$1 <= y) == ltr ?
        "after" : "before";
      // Now get accurate coordinates for this place, in order to get a
      // base X position
      let coords = cursorCoords(cm, Pos(lineNo$$1, ch, sticky), "line", lineObj, preparedMeasure);
      baseX = coords.left;
      outside = y < coords.top || y >= coords.bottom;
    }

    ch = skipExtendingChars(lineObj.text, ch, 1);
    return PosWithInfo(lineNo$$1, ch, sticky, outside, x - baseX)
  }

  function coordsBidiPart(cm, lineObj, lineNo$$1, preparedMeasure, order, x, y) {
    // Bidi parts are sorted left-to-right, and in a non-line-wrapping
    // situation, we can take this ordering to correspond to the visual
    // ordering. This finds the first part whose end is after the given
    // coordinates.
    let index = findFirst(i => {
      let part = order[i], ltr = part.level != 1;
      return boxIsAfter(cursorCoords(cm, Pos(lineNo$$1, ltr ? part.to : part.from, ltr ? "before" : "after"),
                                     "line", lineObj, preparedMeasure), x, y, true)
    }, 0, order.length - 1);
    let part = order[index];
    // If this isn't the first part, the part's start is also after
    // the coordinates, and the coordinates aren't on the same line as
    // that start, move one part back.
    if (index > 0) {
      let ltr = part.level != 1;
      let start = cursorCoords(cm, Pos(lineNo$$1, ltr ? part.from : part.to, ltr ? "after" : "before"),
                               "line", lineObj, preparedMeasure);
      if (boxIsAfter(start, x, y, true) && start.top > y)
        part = order[index - 1];
    }
    return part
  }

  function coordsBidiPartWrapped(cm, lineObj, _lineNo, preparedMeasure, order, x, y) {
    // In a wrapped line, rtl text on wrapping boundaries can do things
    // that don't correspond to the ordering in our `order` array at
    // all, so a binary search doesn't work, and we want to return a
    // part that only spans one line so that the binary search in
    // coordsCharInner is safe. As such, we first find the extent of the
    // wrapped line, and then do a flat search in which we discard any
    // spans that aren't on the line.
    let {begin, end} = wrappedLineExtent(cm, lineObj, preparedMeasure, y);
    if (/\s/.test(lineObj.text.charAt(end - 1))) end--;
    let part = null, closestDist = null;
    for (let i = 0; i < order.length; i++) {
      let p = order[i];
      if (p.from >= end || p.to <= begin) continue
      let ltr = p.level != 1;
      let endX = measureCharPrepared(cm, preparedMeasure, ltr ? Math.min(end, p.to) - 1 : Math.max(begin, p.from)).right;
      // Weigh against spans ending before this, so that they are only
      // picked if nothing ends after
      let dist = endX < x ? x - endX + 1e9 : endX - x;
      if (!part || closestDist > dist) {
        part = p;
        closestDist = dist;
      }
    }
    if (!part) part = order[order.length - 1];
    // Clip the part to the wrapped line.
    if (part.from < begin) part = {from: begin, to: part.to, level: part.level};
    if (part.to > end) part = {from: part.from, to: end, level: part.level};
    return part
  }

  let measureText;
  // Compute the default text height.
  function textHeight(display) {
    if (display.cachedTextHeight != null) return display.cachedTextHeight
    if (measureText == null) {
      measureText = elt("pre");
      // Measure a bunch of lines, for browsers that compute
      // fractional heights.
      for (let i = 0; i < 49; ++i) {
        measureText.appendChild(document.createTextNode("x"));
        measureText.appendChild(elt("br"));
      }
      measureText.appendChild(document.createTextNode("x"));
    }
    removeChildrenAndAdd(display.measure, measureText);
    let height = measureText.offsetHeight / 50;
    if (height > 3) display.cachedTextHeight = height;
    removeChildren(display.measure);
    return height || 1
  }

  // Compute the default character width.
  function charWidth(display) {
    if (display.cachedCharWidth != null) return display.cachedCharWidth
    let anchor = elt("span", "xxxxxxxxxx");
    let pre = elt("pre", [anchor]);
    removeChildrenAndAdd(display.measure, pre);
    let rect = anchor.getBoundingClientRect(), width = (rect.right - rect.left) / 10;
    if (width > 2) display.cachedCharWidth = width;
    return width || 10
  }

  // Do a bulk-read of the DOM positions and sizes needed to draw the
  // view, so that we don't interleave reading and writing to the DOM.
  function getDimensions(cm) {
    let d = cm.display, left = {}, width = {};
    let gutterLeft = d.gutters.clientLeft;
    for (let n = d.gutters.firstChild, i = 0; n; n = n.nextSibling, ++i) {
      let id = cm.display.gutterSpecs[i].className;
      left[id] = n.offsetLeft + n.clientLeft + gutterLeft;
      width[id] = n.clientWidth;
    }
    return {fixedPos: compensateForHScroll(d),
            gutterTotalWidth: d.gutters.offsetWidth,
            gutterLeft: left,
            gutterWidth: width,
            wrapperWidth: d.wrapper.clientWidth}
  }

  // Computes display.scroller.scrollLeft + display.gutters.offsetWidth,
  // but using getBoundingClientRect to get a sub-pixel-accurate
  // result.
  function compensateForHScroll(display) {
    return display.scroller.getBoundingClientRect().left - display.sizer.getBoundingClientRect().left
  }

  // Returns a function that estimates the height of a line, to use as
  // first approximation until the line becomes visible (and is thus
  // properly measurable).
  function estimateHeight(cm) {
    let th = textHeight(cm.display), wrapping = cm.options.lineWrapping;
    let perLine = wrapping && Math.max(5, cm.display.scroller.clientWidth / charWidth(cm.display) - 3);
    return line => {
      if (lineIsHidden(cm.doc, line)) return 0

      let widgetsHeight = 0;
      if (line.widgets) for (let i = 0; i < line.widgets.length; i++) {
        if (line.widgets[i].height) widgetsHeight += line.widgets[i].height;
      }

      if (wrapping)
        return widgetsHeight + (Math.ceil(line.text.length / perLine) || 1) * th
      else
        return widgetsHeight + th
    }
  }

  function estimateLineHeights(cm) {
    let doc = cm.doc, est = estimateHeight(cm);
    doc.iter(line => {
      let estHeight = est(line);
      if (estHeight != line.height) updateLineHeight(line, estHeight);
    });
  }

  // Given a mouse event, find the corresponding position. If liberal
  // is false, it checks whether a gutter or scrollbar was clicked,
  // and returns null if it was. forRect is used by rectangular
  // selections, and tries to estimate a character position even for
  // coordinates beyond the right of the text.
  function posFromMouse(cm, e, liberal, forRect) {
    let display = cm.display;
    if (!liberal && e_target(e).getAttribute("cm-not-content") == "true") return null

    let x, y, space = display.lineSpace.getBoundingClientRect();
    // Fails unpredictably on IE[67] when mouse is dragged around quickly.
    try { x = e.clientX - space.left; y = e.clientY - space.top; }
    catch (e) { return null }
    let coords = coordsChar(cm, x, y), line;
    if (forRect && coords.xRel == 1 && (line = getLine(cm.doc, coords.line).text).length == coords.ch) {
      let colDiff = countColumn(line, line.length, cm.options.tabSize) - line.length;
      coords = Pos(coords.line, Math.max(0, Math.round((x - paddingH(cm.display).left) / charWidth(cm.display)) - colDiff));
    }
    return coords
  }

  // Find the view element corresponding to a given line. Return null
  // when the line isn't visible.
  function findViewIndex(cm, n) {
    if (n >= cm.display.viewTo) return null
    n -= cm.display.viewFrom;
    if (n < 0) return null
    let view = cm.display.view;
    for (let i = 0; i < view.length; i++) {
      n -= view[i].size;
      if (n < 0) return i
    }
  }

  // Updates the display.view data structure for a given change to the
  // document. From and to are in pre-change coordinates. Lendiff is
  // the amount of lines added or subtracted by the change. This is
  // used for changes that span multiple lines, or change the way
  // lines are divided into visual lines. regLineChange (below)
  // registers single-line changes.
  function regChange(cm, from, to, lendiff) {
    if (from == null) from = cm.doc.first;
    if (to == null) to = cm.doc.first + cm.doc.size;
    if (!lendiff) lendiff = 0;

    let display = cm.display;
    if (lendiff && to < display.viewTo &&
        (display.updateLineNumbers == null || display.updateLineNumbers > from))
      display.updateLineNumbers = from;

    cm.curOp.viewChanged = true;

    if (from >= display.viewTo) { // Change after
      if (sawCollapsedSpans && visualLineNo(cm.doc, from) < display.viewTo)
        resetView(cm);
    } else if (to <= display.viewFrom) { // Change before
      if (sawCollapsedSpans && visualLineEndNo(cm.doc, to + lendiff) > display.viewFrom) {
        resetView(cm);
      } else {
        display.viewFrom += lendiff;
        display.viewTo += lendiff;
      }
    } else if (from <= display.viewFrom && to >= display.viewTo) { // Full overlap
      resetView(cm);
    } else if (from <= display.viewFrom) { // Top overlap
      let cut = viewCuttingPoint(cm, to, to + lendiff, 1);
      if (cut) {
        display.view = display.view.slice(cut.index);
        display.viewFrom = cut.lineN;
        display.viewTo += lendiff;
      } else {
        resetView(cm);
      }
    } else if (to >= display.viewTo) { // Bottom overlap
      let cut = viewCuttingPoint(cm, from, from, -1);
      if (cut) {
        display.view = display.view.slice(0, cut.index);
        display.viewTo = cut.lineN;
      } else {
        resetView(cm);
      }
    } else { // Gap in the middle
      let cutTop = viewCuttingPoint(cm, from, from, -1);
      let cutBot = viewCuttingPoint(cm, to, to + lendiff, 1);
      if (cutTop && cutBot) {
        display.view = display.view.slice(0, cutTop.index)
          .concat(buildViewArray(cm, cutTop.lineN, cutBot.lineN))
          .concat(display.view.slice(cutBot.index));
        display.viewTo += lendiff;
      } else {
        resetView(cm);
      }
    }

    let ext = display.externalMeasured;
    if (ext) {
      if (to < ext.lineN)
        ext.lineN += lendiff;
      else if (from < ext.lineN + ext.size)
        display.externalMeasured = null;
    }
  }

  // Register a change to a single line. Type must be one of "text",
  // "gutter", "class", "widget"
  function regLineChange(cm, line, type) {
    cm.curOp.viewChanged = true;
    let display = cm.display, ext = cm.display.externalMeasured;
    if (ext && line >= ext.lineN && line < ext.lineN + ext.size)
      display.externalMeasured = null;

    if (line < display.viewFrom || line >= display.viewTo) return
    let lineView = display.view[findViewIndex(cm, line)];
    if (lineView.node == null) return
    let arr = lineView.changes || (lineView.changes = []);
    if (indexOf(arr, type) == -1) arr.push(type);
  }

  // Clear the view.
  function resetView(cm) {
    cm.display.viewFrom = cm.display.viewTo = cm.doc.first;
    cm.display.view = [];
    cm.display.viewOffset = 0;
  }

  function viewCuttingPoint(cm, oldN, newN, dir) {
    let index = findViewIndex(cm, oldN), diff, view = cm.display.view;
    if (!sawCollapsedSpans || newN == cm.doc.first + cm.doc.size)
      return {index: index, lineN: newN}
    let n = cm.display.viewFrom;
    for (let i = 0; i < index; i++)
      n += view[i].size;
    if (n != oldN) {
      if (dir > 0) {
        if (index == view.length - 1) return null
        diff = (n + view[index].size) - oldN;
        index++;
      } else {
        diff = n - oldN;
      }
      oldN += diff; newN += diff;
    }
    while (visualLineNo(cm.doc, newN) != newN) {
      if (index == (dir < 0 ? 0 : view.length - 1)) return null
      newN += dir * view[index - (dir < 0 ? 1 : 0)].size;
      index += dir;
    }
    return {index: index, lineN: newN}
  }

  // Force the view to cover a given range, adding empty view element
  // or clipping off existing ones as needed.
  function adjustView(cm, from, to) {
    let display = cm.display, view = display.view;
    if (view.length == 0 || from >= display.viewTo || to <= display.viewFrom) {
      display.view = buildViewArray(cm, from, to);
      display.viewFrom = from;
    } else {
      if (display.viewFrom > from)
        display.view = buildViewArray(cm, from, display.viewFrom).concat(display.view);
      else if (display.viewFrom < from)
        display.view = display.view.slice(findViewIndex(cm, from));
      display.viewFrom = from;
      if (display.viewTo < to)
        display.view = display.view.concat(buildViewArray(cm, display.viewTo, to));
      else if (display.viewTo > to)
        display.view = display.view.slice(0, findViewIndex(cm, to));
    }
    display.viewTo = to;
  }

  // Count the number of lines in the view whose DOM representation is
  // out of date (or nonexistent).
  function countDirtyView(cm) {
    let view = cm.display.view, dirty = 0;
    for (let i = 0; i < view.length; i++) {
      let lineView = view[i];
      if (!lineView.hidden && (!lineView.node || lineView.changes)) ++dirty;
    }
    return dirty
  }

  function updateSelection(cm) {
    cm.display.input.showSelection(cm.display.input.prepareSelection());
  }

  function prepareSelection(cm, primary = true) {
    let doc = cm.doc, result = {};
    let curFragment = result.cursors = document.createDocumentFragment();
    let selFragment = result.selection = document.createDocumentFragment();

    for (let i = 0; i < doc.sel.ranges.length; i++) {
      if (!primary && i == doc.sel.primIndex) continue
      let range$$1 = doc.sel.ranges[i];
      if (range$$1.from().line >= cm.display.viewTo || range$$1.to().line < cm.display.viewFrom) continue
      let collapsed = range$$1.empty();
      if (collapsed || cm.options.showCursorWhenSelecting)
        drawSelectionCursor(cm, range$$1.head, curFragment);
      if (!collapsed)
        drawSelectionRange(cm, range$$1, selFragment);
    }
    return result
  }

  // Draws a cursor for the given range
  function drawSelectionCursor(cm, head, output) {
    let pos = cursorCoords(cm, head, "div", null, null, !cm.options.singleCursorHeightPerLine);

    let cursor = output.appendChild(elt("div", "\u00a0", "CodeMirror-cursor"));
    cursor.style.left = pos.left + "px";
    cursor.style.top = pos.top + "px";
    cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options.cursorHeight + "px";

    if (pos.other) {
      // Secondary cursor, shown when on a 'jump' in bi-directional text
      let otherCursor = output.appendChild(elt("div", "\u00a0", "CodeMirror-cursor CodeMirror-secondarycursor"));
      otherCursor.style.display = "";
      otherCursor.style.left = pos.other.left + "px";
      otherCursor.style.top = pos.other.top + "px";
      otherCursor.style.height = (pos.other.bottom - pos.other.top) * .85 + "px";
    }
  }

  function cmpCoords(a, b) { return a.top - b.top || a.left - b.left }

  // Draws the given range as a highlighted selection
  function drawSelectionRange(cm, range$$1, output) {
    let display = cm.display, doc = cm.doc;
    let fragment = document.createDocumentFragment();
    let padding = paddingH(cm.display), leftSide = padding.left;
    let rightSide = Math.max(display.sizerWidth, displayWidth(cm) - display.sizer.offsetLeft) - padding.right;
    let docLTR = doc.direction == "ltr";

    function add(left, top, width, bottom) {
      if (top < 0) top = 0;
      top = Math.round(top);
      bottom = Math.round(bottom);
      fragment.appendChild(elt("div", null, "CodeMirror-selected", `position: absolute; left: ${left}px;
                             top: ${top}px; width: ${width == null ? rightSide - left : width}px;
                             height: ${bottom - top}px`));
    }

    function drawForLine(line, fromArg, toArg) {
      let lineObj = getLine(doc, line);
      let lineLen = lineObj.text.length;
      let start, end;
      function coords(ch, bias) {
        return charCoords(cm, Pos(line, ch), "div", lineObj, bias)
      }

      function wrapX(pos, dir, side) {
        let extent = wrappedLineExtentChar(cm, lineObj, null, pos);
        let prop = (dir == "ltr") == (side == "after") ? "left" : "right";
        let ch = side == "after" ? extent.begin : extent.end - (/\s/.test(lineObj.text.charAt(extent.end - 1)) ? 2 : 1);
        return coords(ch, prop)[prop]
      }

      let order = getOrder(lineObj, doc.direction);
      iterateBidiSections(order, fromArg || 0, toArg == null ? lineLen : toArg, (from, to, dir, i) => {
        let ltr = dir == "ltr";
        let fromPos = coords(from, ltr ? "left" : "right");
        let toPos = coords(to - 1, ltr ? "right" : "left");

        let openStart = fromArg == null && from == 0, openEnd = toArg == null && to == lineLen;
        let first = i == 0, last = !order || i == order.length - 1;
        if (toPos.top - fromPos.top <= 3) { // Single line
          let openLeft = (docLTR ? openStart : openEnd) && first;
          let openRight = (docLTR ? openEnd : openStart) && last;
          let left = openLeft ? leftSide : (ltr ? fromPos : toPos).left;
          let right = openRight ? rightSide : (ltr ? toPos : fromPos).right;
          add(left, fromPos.top, right - left, fromPos.bottom);
        } else { // Multiple lines
          let topLeft, topRight, botLeft, botRight;
          if (ltr) {
            topLeft = docLTR && openStart && first ? leftSide : fromPos.left;
            topRight = docLTR ? rightSide : wrapX(from, dir, "before");
            botLeft = docLTR ? leftSide : wrapX(to, dir, "after");
            botRight = docLTR && openEnd && last ? rightSide : toPos.right;
          } else {
            topLeft = !docLTR ? leftSide : wrapX(from, dir, "before");
            topRight = !docLTR && openStart && first ? rightSide : fromPos.right;
            botLeft = !docLTR && openEnd && last ? leftSide : toPos.left;
            botRight = !docLTR ? rightSide : wrapX(to, dir, "after");
          }
          add(topLeft, fromPos.top, topRight - topLeft, fromPos.bottom);
          if (fromPos.bottom < toPos.top) add(leftSide, fromPos.bottom, null, toPos.top);
          add(botLeft, toPos.top, botRight - botLeft, toPos.bottom);
        }

        if (!start || cmpCoords(fromPos, start) < 0) start = fromPos;
        if (cmpCoords(toPos, start) < 0) start = toPos;
        if (!end || cmpCoords(fromPos, end) < 0) end = fromPos;
        if (cmpCoords(toPos, end) < 0) end = toPos;
      });
      return {start: start, end: end}
    }

    let sFrom = range$$1.from(), sTo = range$$1.to();
    if (sFrom.line == sTo.line) {
      drawForLine(sFrom.line, sFrom.ch, sTo.ch);
    } else {
      let fromLine = getLine(doc, sFrom.line), toLine = getLine(doc, sTo.line);
      let singleVLine = visualLine(fromLine) == visualLine(toLine);
      let leftEnd = drawForLine(sFrom.line, sFrom.ch, singleVLine ? fromLine.text.length + 1 : null).end;
      let rightStart = drawForLine(sTo.line, singleVLine ? 0 : null, sTo.ch).start;
      if (singleVLine) {
        if (leftEnd.top < rightStart.top - 2) {
          add(leftEnd.right, leftEnd.top, null, leftEnd.bottom);
          add(leftSide, rightStart.top, rightStart.left, rightStart.bottom);
        } else {
          add(leftEnd.right, leftEnd.top, rightStart.left - leftEnd.right, leftEnd.bottom);
        }
      }
      if (leftEnd.bottom < rightStart.top)
        add(leftSide, leftEnd.bottom, null, rightStart.top);
    }

    output.appendChild(fragment);
  }

  // Cursor-blinking
  function restartBlink(cm) {
    if (!cm.state.focused) return
    let display = cm.display;
    clearInterval(display.blinker);
    let on = true;
    display.cursorDiv.style.visibility = "";
    if (cm.options.cursorBlinkRate > 0)
      display.blinker = setInterval(() => display.cursorDiv.style.visibility = (on = !on) ? "" : "hidden",
        cm.options.cursorBlinkRate);
    else if (cm.options.cursorBlinkRate < 0)
      display.cursorDiv.style.visibility = "hidden";
  }

  function ensureFocus(cm) {
    if (!cm.state.focused) { cm.display.input.focus(); onFocus(cm); }
  }

  function delayBlurEvent(cm) {
    cm.state.delayingBlurEvent = true;
    setTimeout(() => { if (cm.state.delayingBlurEvent) {
      cm.state.delayingBlurEvent = false;
      onBlur(cm);
    } }, 100);
  }

  function onFocus(cm, e) {
    if (cm.state.delayingBlurEvent) cm.state.delayingBlurEvent = false;

    if (cm.options.readOnly == "nocursor") return
    if (!cm.state.focused) {
      signal(cm, "focus", cm, e);
      cm.state.focused = true;
      addClass(cm.display.wrapper, "CodeMirror-focused");
      // This test prevents this from firing when a context
      // menu is closed (since the input reset would kill the
      // select-all detection hack)
      if (!cm.curOp && cm.display.selForContextMenu != cm.doc.sel) {
        cm.display.input.reset();
        if (webkit) setTimeout(() => cm.display.input.reset(true), 20); // Issue #1730
      }
      cm.display.input.receivedFocus();
    }
    restartBlink(cm);
  }
  function onBlur(cm, e) {
    if (cm.state.delayingBlurEvent) return

    if (cm.state.focused) {
      signal(cm, "blur", cm, e);
      cm.state.focused = false;
      rmClass(cm.display.wrapper, "CodeMirror-focused");
    }
    clearInterval(cm.display.blinker);
    setTimeout(() => { if (!cm.state.focused) cm.display.shift = false; }, 150);
  }

  // Read the actual heights of the rendered lines, and update their
  // stored heights to match.
  function updateHeightsInViewport(cm) {
    let display = cm.display;
    let prevBottom = display.lineDiv.offsetTop;
    for (let i = 0; i < display.view.length; i++) {
      let cur = display.view[i], wrapping = cm.options.lineWrapping;
      let height, width = 0;
      if (cur.hidden) continue
      if (ie && ie_version < 8) {
        let bot = cur.node.offsetTop + cur.node.offsetHeight;
        height = bot - prevBottom;
        prevBottom = bot;
      } else {
        let box = cur.node.getBoundingClientRect();
        height = box.bottom - box.top;
        // Check that lines don't extend past the right of the current
        // editor width
        if (!wrapping && cur.text.firstChild)
          width = cur.text.firstChild.getBoundingClientRect().right - box.left - 1;
      }
      let diff = cur.line.height - height;
      if (diff > .005 || diff < -.005) {
        updateLineHeight(cur.line, height);
        updateWidgetHeight(cur.line);
        if (cur.rest) for (let j = 0; j < cur.rest.length; j++)
          updateWidgetHeight(cur.rest[j]);
      }
      if (width > cm.display.sizerWidth) {
        let chWidth = Math.ceil(width / charWidth(cm.display));
        if (chWidth > cm.display.maxLineLength) {
          cm.display.maxLineLength = chWidth;
          cm.display.maxLine = cur.line;
          cm.display.maxLineChanged = true;
        }
      }
    }
  }

  // Read and store the height of line widgets associated with the
  // given line.
  function updateWidgetHeight(line) {
    if (line.widgets) for (let i = 0; i < line.widgets.length; ++i) {
      let w = line.widgets[i], parent = w.node.parentNode;
      if (parent) w.height = parent.offsetHeight;
    }
  }

  // Compute the lines that are visible in a given viewport (defaults
  // the the current scroll position). viewport may contain top,
  // height, and ensure (see op.scrollToPos) properties.
  function visibleLines(display, doc, viewport) {
    let top = viewport && viewport.top != null ? Math.max(0, viewport.top) : display.scroller.scrollTop;
    top = Math.floor(top - paddingTop(display));
    let bottom = viewport && viewport.bottom != null ? viewport.bottom : top + display.wrapper.clientHeight;

    let from = lineAtHeight(doc, top), to = lineAtHeight(doc, bottom);
    // Ensure is a {from: {line, ch}, to: {line, ch}} object, and
    // forces those lines into the viewport (if possible).
    if (viewport && viewport.ensure) {
      let ensureFrom = viewport.ensure.from.line, ensureTo = viewport.ensure.to.line;
      if (ensureFrom < from) {
        from = ensureFrom;
        to = lineAtHeight(doc, heightAtLine(getLine(doc, ensureFrom)) + display.wrapper.clientHeight);
      } else if (Math.min(ensureTo, doc.lastLine()) >= to) {
        from = lineAtHeight(doc, heightAtLine(getLine(doc, ensureTo)) - display.wrapper.clientHeight);
        to = ensureTo;
      }
    }
    return {from: from, to: Math.max(to, from + 1)}
  }

  // SCROLLING THINGS INTO VIEW

  // If an editor sits on the top or bottom of the window, partially
  // scrolled out of view, this ensures that the cursor is visible.
  function maybeScrollWindow(cm, rect) {
    if (signalDOMEvent(cm, "scrollCursorIntoView")) return

    let display = cm.display, box = display.sizer.getBoundingClientRect(), doScroll = null;
    if (rect.top + box.top < 0) doScroll = true;
    else if (rect.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight)) doScroll = false;
    if (doScroll != null && !phantom) {
      let scrollNode = elt("div", "\u200b", null, `position: absolute;
                         top: ${rect.top - display.viewOffset - paddingTop(cm.display)}px;
                         height: ${rect.bottom - rect.top + scrollGap(cm) + display.barHeight}px;
                         left: ${rect.left}px; width: ${Math.max(2, rect.right - rect.left)}px;`);
      cm.display.lineSpace.appendChild(scrollNode);
      scrollNode.scrollIntoView(doScroll);
      cm.display.lineSpace.removeChild(scrollNode);
    }
  }

  // Scroll a given position into view (immediately), verifying that
  // it actually became visible (as line heights are accurately
  // measured, the position of something may 'drift' during drawing).
  function scrollPosIntoView(cm, pos, end, margin) {
    if (margin == null) margin = 0;
    let rect;
    if (!cm.options.lineWrapping && pos == end) {
      // Set pos and end to the cursor positions around the character pos sticks to
      // If pos.sticky == "before", that is around pos.ch - 1, otherwise around pos.ch
      // If pos == Pos(_, 0, "before"), pos and end are unchanged
      pos = pos.ch ? Pos(pos.line, pos.sticky == "before" ? pos.ch - 1 : pos.ch, "after") : pos;
      end = pos.sticky == "before" ? Pos(pos.line, pos.ch + 1, "before") : pos;
    }
    for (let limit = 0; limit < 5; limit++) {
      let changed = false;
      let coords = cursorCoords(cm, pos);
      let endCoords = !end || end == pos ? coords : cursorCoords(cm, end);
      rect = {left: Math.min(coords.left, endCoords.left),
              top: Math.min(coords.top, endCoords.top) - margin,
              right: Math.max(coords.left, endCoords.left),
              bottom: Math.max(coords.bottom, endCoords.bottom) + margin};
      let scrollPos = calculateScrollPos(cm, rect);
      let startTop = cm.doc.scrollTop, startLeft = cm.doc.scrollLeft;
      if (scrollPos.scrollTop != null) {
        updateScrollTop(cm, scrollPos.scrollTop);
        if (Math.abs(cm.doc.scrollTop - startTop) > 1) changed = true;
      }
      if (scrollPos.scrollLeft != null) {
        setScrollLeft(cm, scrollPos.scrollLeft);
        if (Math.abs(cm.doc.scrollLeft - startLeft) > 1) changed = true;
      }
      if (!changed) break
    }
    return rect
  }

  // Scroll a given set of coordinates into view (immediately).
  function scrollIntoView(cm, rect) {
    let scrollPos = calculateScrollPos(cm, rect);
    if (scrollPos.scrollTop != null) updateScrollTop(cm, scrollPos.scrollTop);
    if (scrollPos.scrollLeft != null) setScrollLeft(cm, scrollPos.scrollLeft);
  }

  // Calculate a new scroll position needed to scroll the given
  // rectangle into view. Returns an object with scrollTop and
  // scrollLeft properties. When these are undefined, the
  // vertical/horizontal position does not need to be adjusted.
  function calculateScrollPos(cm, rect) {
    let display = cm.display, snapMargin = textHeight(cm.display);
    if (rect.top < 0) rect.top = 0;
    let screentop = cm.curOp && cm.curOp.scrollTop != null ? cm.curOp.scrollTop : display.scroller.scrollTop;
    let screen = displayHeight(cm), result = {};
    if (rect.bottom - rect.top > screen) rect.bottom = rect.top + screen;
    let docBottom = cm.doc.height + paddingVert(display);
    let atTop = rect.top < snapMargin, atBottom = rect.bottom > docBottom - snapMargin;
    if (rect.top < screentop) {
      result.scrollTop = atTop ? 0 : rect.top;
    } else if (rect.bottom > screentop + screen) {
      let newTop = Math.min(rect.top, (atBottom ? docBottom : rect.bottom) - screen);
      if (newTop != screentop) result.scrollTop = newTop;
    }

    let screenleft = cm.curOp && cm.curOp.scrollLeft != null ? cm.curOp.scrollLeft : display.scroller.scrollLeft;
    let screenw = displayWidth(cm) - (cm.options.fixedGutter ? display.gutters.offsetWidth : 0);
    let tooWide = rect.right - rect.left > screenw;
    if (tooWide) rect.right = rect.left + screenw;
    if (rect.left < 10)
      result.scrollLeft = 0;
    else if (rect.left < screenleft)
      result.scrollLeft = Math.max(0, rect.left - (tooWide ? 0 : 10));
    else if (rect.right > screenw + screenleft - 3)
      result.scrollLeft = rect.right + (tooWide ? 0 : 10) - screenw;
    return result
  }

  // Store a relative adjustment to the scroll position in the current
  // operation (to be applied when the operation finishes).
  function addToScrollTop(cm, top) {
    if (top == null) return
    resolveScrollToPos(cm);
    cm.curOp.scrollTop = (cm.curOp.scrollTop == null ? cm.doc.scrollTop : cm.curOp.scrollTop) + top;
  }

  // Make sure that at the end of the operation the current cursor is
  // shown.
  function ensureCursorVisible(cm) {
    resolveScrollToPos(cm);
    let cur = cm.getCursor();
    cm.curOp.scrollToPos = {from: cur, to: cur, margin: cm.options.cursorScrollMargin};
  }

  function scrollToCoords(cm, x, y) {
    if (x != null || y != null) resolveScrollToPos(cm);
    if (x != null) cm.curOp.scrollLeft = x;
    if (y != null) cm.curOp.scrollTop = y;
  }

  function scrollToRange(cm, range$$1) {
    resolveScrollToPos(cm);
    cm.curOp.scrollToPos = range$$1;
  }

  // When an operation has its scrollToPos property set, and another
  // scroll action is applied before the end of the operation, this
  // 'simulates' scrolling that position into view in a cheap way, so
  // that the effect of intermediate scroll commands is not ignored.
  function resolveScrollToPos(cm) {
    let range$$1 = cm.curOp.scrollToPos;
    if (range$$1) {
      cm.curOp.scrollToPos = null;
      let from = estimateCoords(cm, range$$1.from), to = estimateCoords(cm, range$$1.to);
      scrollToCoordsRange(cm, from, to, range$$1.margin);
    }
  }

  function scrollToCoordsRange(cm, from, to, margin) {
    let sPos = calculateScrollPos(cm, {
      left: Math.min(from.left, to.left),
      top: Math.min(from.top, to.top) - margin,
      right: Math.max(from.right, to.right),
      bottom: Math.max(from.bottom, to.bottom) + margin
    });
    scrollToCoords(cm, sPos.scrollLeft, sPos.scrollTop);
  }

  // Sync the scrollable area and scrollbars, ensure the viewport
  // covers the visible area.
  function updateScrollTop(cm, val) {
    if (Math.abs(cm.doc.scrollTop - val) < 2) return
    if (!gecko) updateDisplaySimple(cm, {top: val});
    setScrollTop(cm, val, true);
    if (gecko) updateDisplaySimple(cm);
    startWorker(cm, 100);
  }

  function setScrollTop(cm, val, forceScroll) {
    val = Math.min(cm.display.scroller.scrollHeight - cm.display.scroller.clientHeight, val);
    if (cm.display.scroller.scrollTop == val && !forceScroll) return
    cm.doc.scrollTop = val;
    cm.display.scrollbars.setScrollTop(val);
    if (cm.display.scroller.scrollTop != val) cm.display.scroller.scrollTop = val;
  }

  // Sync scroller and scrollbar, ensure the gutter elements are
  // aligned.
  function setScrollLeft(cm, val, isScroller, forceScroll) {
    val = Math.min(val, cm.display.scroller.scrollWidth - cm.display.scroller.clientWidth);
    if ((isScroller ? val == cm.doc.scrollLeft : Math.abs(cm.doc.scrollLeft - val) < 2) && !forceScroll) return
    cm.doc.scrollLeft = val;
    alignHorizontally(cm);
    if (cm.display.scroller.scrollLeft != val) cm.display.scroller.scrollLeft = val;
    cm.display.scrollbars.setScrollLeft(val);
  }

  // SCROLLBARS

  // Prepare DOM reads needed to update the scrollbars. Done in one
  // shot to minimize update/measure roundtrips.
  function measureForScrollbars(cm) {
    let d = cm.display, gutterW = d.gutters.offsetWidth;
    let docH = Math.round(cm.doc.height + paddingVert(cm.display));
    return {
      clientHeight: d.scroller.clientHeight,
      viewHeight: d.wrapper.clientHeight,
      scrollWidth: d.scroller.scrollWidth, clientWidth: d.scroller.clientWidth,
      viewWidth: d.wrapper.clientWidth,
      barLeft: cm.options.fixedGutter ? gutterW : 0,
      docHeight: docH,
      scrollHeight: docH + scrollGap(cm) + d.barHeight,
      nativeBarWidth: d.nativeBarWidth,
      gutterWidth: gutterW
    }
  }

  class NativeScrollbars {
    constructor(place, scroll, cm) {
      this.cm = cm;
      let vert = this.vert = elt("div", [elt("div", null, null, "min-width: 1px")], "CodeMirror-vscrollbar");
      let horiz = this.horiz = elt("div", [elt("div", null, null, "height: 100%; min-height: 1px")], "CodeMirror-hscrollbar");
      vert.tabIndex = horiz.tabIndex = -1;
      place(vert); place(horiz);

      on(vert, "scroll", () => {
        if (vert.clientHeight) scroll(vert.scrollTop, "vertical");
      });
      on(horiz, "scroll", () => {
        if (horiz.clientWidth) scroll(horiz.scrollLeft, "horizontal");
      });

      this.checkedZeroWidth = false;
      // Need to set a minimum width to see the scrollbar on IE7 (but must not set it on IE8).
      if (ie && ie_version < 8) this.horiz.style.minHeight = this.vert.style.minWidth = "18px";
    }

    update(measure) {
      let needsH = measure.scrollWidth > measure.clientWidth + 1;
      let needsV = measure.scrollHeight > measure.clientHeight + 1;
      let sWidth = measure.nativeBarWidth;

      if (needsV) {
        this.vert.style.display = "block";
        this.vert.style.bottom = needsH ? sWidth + "px" : "0";
        let totalHeight = measure.viewHeight - (needsH ? sWidth : 0);
        // A bug in IE8 can cause this value to be negative, so guard it.
        this.vert.firstChild.style.height =
          Math.max(0, measure.scrollHeight - measure.clientHeight + totalHeight) + "px";
      } else {
        this.vert.style.display = "";
        this.vert.firstChild.style.height = "0";
      }

      if (needsH) {
        this.horiz.style.display = "block";
        this.horiz.style.right = needsV ? sWidth + "px" : "0";
        this.horiz.style.left = measure.barLeft + "px";
        let totalWidth = measure.viewWidth - measure.barLeft - (needsV ? sWidth : 0);
        this.horiz.firstChild.style.width =
          Math.max(0, measure.scrollWidth - measure.clientWidth + totalWidth) + "px";
      } else {
        this.horiz.style.display = "";
        this.horiz.firstChild.style.width = "0";
      }

      if (!this.checkedZeroWidth && measure.clientHeight > 0) {
        if (sWidth == 0) this.zeroWidthHack();
        this.checkedZeroWidth = true;
      }

      return {right: needsV ? sWidth : 0, bottom: needsH ? sWidth : 0}
    }

    setScrollLeft(pos) {
      if (this.horiz.scrollLeft != pos) this.horiz.scrollLeft = pos;
      if (this.disableHoriz) this.enableZeroWidthBar(this.horiz, this.disableHoriz, "horiz");
    }

    setScrollTop(pos) {
      if (this.vert.scrollTop != pos) this.vert.scrollTop = pos;
      if (this.disableVert) this.enableZeroWidthBar(this.vert, this.disableVert, "vert");
    }

    zeroWidthHack() {
      let w = mac && !mac_geMountainLion ? "12px" : "18px";
      this.horiz.style.height = this.vert.style.width = w;
      this.horiz.style.pointerEvents = this.vert.style.pointerEvents = "none";
      this.disableHoriz = new Delayed;
      this.disableVert = new Delayed;
    }

    enableZeroWidthBar(bar, delay, type) {
      bar.style.pointerEvents = "auto";
      function maybeDisable() {
        // To find out whether the scrollbar is still visible, we
        // check whether the element under the pixel in the bottom
        // right corner of the scrollbar box is the scrollbar box
        // itself (when the bar is still visible) or its filler child
        // (when the bar is hidden). If it is still visible, we keep
        // it enabled, if it's hidden, we disable pointer events.
        let box = bar.getBoundingClientRect();
        let elt$$1 = type == "vert" ? document.elementFromPoint(box.right - 1, (box.top + box.bottom) / 2)
            : document.elementFromPoint((box.right + box.left) / 2, box.bottom - 1);
        if (elt$$1 != bar) bar.style.pointerEvents = "none";
        else delay.set(1000, maybeDisable);
      }
      delay.set(1000, maybeDisable);
    }

    clear() {
      let parent = this.horiz.parentNode;
      parent.removeChild(this.horiz);
      parent.removeChild(this.vert);
    }
  }

  class NullScrollbars {
    update() { return {bottom: 0, right: 0} }
    setScrollLeft() {}
    setScrollTop() {}
    clear() {}
  }

  function updateScrollbars(cm, measure) {
    if (!measure) measure = measureForScrollbars(cm);
    let startWidth = cm.display.barWidth, startHeight = cm.display.barHeight;
    updateScrollbarsInner(cm, measure);
    for (let i = 0; i < 4 && startWidth != cm.display.barWidth || startHeight != cm.display.barHeight; i++) {
      if (startWidth != cm.display.barWidth && cm.options.lineWrapping)
        updateHeightsInViewport(cm);
      updateScrollbarsInner(cm, measureForScrollbars(cm));
      startWidth = cm.display.barWidth; startHeight = cm.display.barHeight;
    }
  }

  // Re-synchronize the fake scrollbars with the actual size of the
  // content.
  function updateScrollbarsInner(cm, measure) {
    let d = cm.display;
    let sizes = d.scrollbars.update(measure);

    d.sizer.style.paddingRight = (d.barWidth = sizes.right) + "px";
    d.sizer.style.paddingBottom = (d.barHeight = sizes.bottom) + "px";
    d.heightForcer.style.borderBottom = sizes.bottom + "px solid transparent";

    if (sizes.right && sizes.bottom) {
      d.scrollbarFiller.style.display = "block";
      d.scrollbarFiller.style.height = sizes.bottom + "px";
      d.scrollbarFiller.style.width = sizes.right + "px";
    } else d.scrollbarFiller.style.display = "";
    if (sizes.bottom && cm.options.coverGutterNextToScrollbar && cm.options.fixedGutter) {
      d.gutterFiller.style.display = "block";
      d.gutterFiller.style.height = sizes.bottom + "px";
      d.gutterFiller.style.width = measure.gutterWidth + "px";
    } else d.gutterFiller.style.display = "";
  }

  let scrollbarModel = {"native": NativeScrollbars, "null": NullScrollbars};

  function initScrollbars(cm) {
    if (cm.display.scrollbars) {
      cm.display.scrollbars.clear();
      if (cm.display.scrollbars.addClass)
        rmClass(cm.display.wrapper, cm.display.scrollbars.addClass);
    }

    cm.display.scrollbars = new scrollbarModel[cm.options.scrollbarStyle](node => {
      cm.display.wrapper.insertBefore(node, cm.display.scrollbarFiller);
      // Prevent clicks in the scrollbars from killing focus
      on(node, "mousedown", () => {
        if (cm.state.focused) setTimeout(() => cm.display.input.focus(), 0);
      });
      node.setAttribute("cm-not-content", "true");
    }, (pos, axis) => {
      if (axis == "horizontal") setScrollLeft(cm, pos);
      else updateScrollTop(cm, pos);
    }, cm);
    if (cm.display.scrollbars.addClass)
      addClass(cm.display.wrapper, cm.display.scrollbars.addClass);
  }

  // Operations are used to wrap a series of changes to the editor
  // state in such a way that each change won't have to update the
  // cursor and display (which would be awkward, slow, and
  // error-prone). Instead, display updates are batched and then all
  // combined and executed at once.

  let nextOpId = 0;
  // Start a new operation.
  function startOperation(cm) {
    cm.curOp = {
      cm: cm,
      viewChanged: false,      // Flag that indicates that lines might need to be redrawn
      startHeight: cm.doc.height, // Used to detect need to update scrollbar
      forceUpdate: false,      // Used to force a redraw
      updateInput: 0,       // Whether to reset the input textarea
      typing: false,           // Whether this reset should be careful to leave existing text (for compositing)
      changeObjs: null,        // Accumulated changes, for firing change events
      cursorActivityHandlers: null, // Set of handlers to fire cursorActivity on
      cursorActivityCalled: 0, // Tracks which cursorActivity handlers have been called already
      selectionChanged: false, // Whether the selection needs to be redrawn
      updateMaxLine: false,    // Set when the widest line needs to be determined anew
      scrollLeft: null, scrollTop: null, // Intermediate scroll position, not pushed to DOM yet
      scrollToPos: null,       // Used to scroll to a specific position
      focus: false,
      id: ++nextOpId           // Unique ID
    };
    pushOperation(cm.curOp);
  }

  // Finish an operation, updating the display and signalling delayed events
  function endOperation(cm) {
    let op = cm.curOp;
    if (op) finishOperation(op, group => {
      for (let i = 0; i < group.ops.length; i++)
        group.ops[i].cm.curOp = null;
      endOperations(group);
    });
  }

  // The DOM updates done when an operation finishes are batched so
  // that the minimum number of relayouts are required.
  function endOperations(group) {
    let ops = group.ops;
    for (let i = 0; i < ops.length; i++) // Read DOM
      endOperation_R1(ops[i]);
    for (let i = 0; i < ops.length; i++) // Write DOM (maybe)
      endOperation_W1(ops[i]);
    for (let i = 0; i < ops.length; i++) // Read DOM
      endOperation_R2(ops[i]);
    for (let i = 0; i < ops.length; i++) // Write DOM (maybe)
      endOperation_W2(ops[i]);
    for (let i = 0; i < ops.length; i++) // Read DOM
      endOperation_finish(ops[i]);
  }

  function endOperation_R1(op) {
    let cm = op.cm, display = cm.display;
    maybeClipScrollbars(cm);
    if (op.updateMaxLine) findMaxLine(cm);

    op.mustUpdate = op.viewChanged || op.forceUpdate || op.scrollTop != null ||
      op.scrollToPos && (op.scrollToPos.from.line < display.viewFrom ||
                         op.scrollToPos.to.line >= display.viewTo) ||
      display.maxLineChanged && cm.options.lineWrapping;
    op.update = op.mustUpdate &&
      new DisplayUpdate(cm, op.mustUpdate && {top: op.scrollTop, ensure: op.scrollToPos}, op.forceUpdate);
  }

  function endOperation_W1(op) {
    op.updatedDisplay = op.mustUpdate && updateDisplayIfNeeded(op.cm, op.update);
  }

  function endOperation_R2(op) {
    let cm = op.cm, display = cm.display;
    if (op.updatedDisplay) updateHeightsInViewport(cm);

    op.barMeasure = measureForScrollbars(cm);

    // If the max line changed since it was last measured, measure it,
    // and ensure the document's width matches it.
    // updateDisplay_W2 will use these properties to do the actual resizing
    if (display.maxLineChanged && !cm.options.lineWrapping) {
      op.adjustWidthTo = measureChar(cm, display.maxLine, display.maxLine.text.length).left + 3;
      cm.display.sizerWidth = op.adjustWidthTo;
      op.barMeasure.scrollWidth =
        Math.max(display.scroller.clientWidth, display.sizer.offsetLeft + op.adjustWidthTo + scrollGap(cm) + cm.display.barWidth);
      op.maxScrollLeft = Math.max(0, display.sizer.offsetLeft + op.adjustWidthTo - displayWidth(cm));
    }

    if (op.updatedDisplay || op.selectionChanged)
      op.preparedSelection = display.input.prepareSelection();
  }

  function endOperation_W2(op) {
    let cm = op.cm;

    if (op.adjustWidthTo != null) {
      cm.display.sizer.style.minWidth = op.adjustWidthTo + "px";
      if (op.maxScrollLeft < cm.doc.scrollLeft)
        setScrollLeft(cm, Math.min(cm.display.scroller.scrollLeft, op.maxScrollLeft), true);
      cm.display.maxLineChanged = false;
    }

    let takeFocus = op.focus && op.focus == activeElt();
    if (op.preparedSelection)
      cm.display.input.showSelection(op.preparedSelection, takeFocus);
    if (op.updatedDisplay || op.startHeight != cm.doc.height)
      updateScrollbars(cm, op.barMeasure);
    if (op.updatedDisplay)
      setDocumentHeight(cm, op.barMeasure);

    if (op.selectionChanged) restartBlink(cm);

    if (cm.state.focused && op.updateInput)
      cm.display.input.reset(op.typing);
    if (takeFocus) ensureFocus(op.cm);
  }

  function endOperation_finish(op) {
    let cm = op.cm, display = cm.display, doc = cm.doc;

    if (op.updatedDisplay) postUpdateDisplay(cm, op.update);

    // Abort mouse wheel delta measurement, when scrolling explicitly
    if (display.wheelStartX != null && (op.scrollTop != null || op.scrollLeft != null || op.scrollToPos))
      display.wheelStartX = display.wheelStartY = null;

    // Propagate the scroll position to the actual DOM scroller
    if (op.scrollTop != null) setScrollTop(cm, op.scrollTop, op.forceScroll);

    if (op.scrollLeft != null) setScrollLeft(cm, op.scrollLeft, true, true);
    // If we need to scroll a specific position into view, do so.
    if (op.scrollToPos) {
      let rect = scrollPosIntoView(cm, clipPos(doc, op.scrollToPos.from),
                                   clipPos(doc, op.scrollToPos.to), op.scrollToPos.margin);
      maybeScrollWindow(cm, rect);
    }

    // Fire events for markers that are hidden/unidden by editing or
    // undoing
    let hidden = op.maybeHiddenMarkers, unhidden = op.maybeUnhiddenMarkers;
    if (hidden) for (let i = 0; i < hidden.length; ++i)
      if (!hidden[i].lines.length) signal(hidden[i], "hide");
    if (unhidden) for (let i = 0; i < unhidden.length; ++i)
      if (unhidden[i].lines.length) signal(unhidden[i], "unhide");

    if (display.wrapper.offsetHeight)
      doc.scrollTop = cm.display.scroller.scrollTop;

    // Fire change events, and delayed event handlers
    if (op.changeObjs)
      signal(cm, "changes", cm, op.changeObjs);
    if (op.update)
      op.update.finish();
  }

  // Run the given function in an operation
  function runInOp(cm, f) {
    if (cm.curOp) return f()
    startOperation(cm);
    try { return f() }
    finally { endOperation(cm); }
  }
  // Wraps a function in an operation. Returns the wrapped function.
  function operation(cm, f) {
    return function() {
      if (cm.curOp) return f.apply(cm, arguments)
      startOperation(cm);
      try { return f.apply(cm, arguments) }
      finally { endOperation(cm); }
    }
  }
  // Used to add methods to editor and doc instances, wrapping them in
  // operations.
  function methodOp(f) {
    return function() {
      if (this.curOp) return f.apply(this, arguments)
      startOperation(this);
      try { return f.apply(this, arguments) }
      finally { endOperation(this); }
    }
  }
  function docMethodOp(f) {
    return function() {
      let cm = this.cm;
      if (!cm || cm.curOp) return f.apply(this, arguments)
      startOperation(cm);
      try { return f.apply(this, arguments) }
      finally { endOperation(cm); }
    }
  }

  // HIGHLIGHT WORKER

  function startWorker(cm, time) {
    if (cm.doc.highlightFrontier < cm.display.viewTo)
      cm.state.highlight.set(time, bind(highlightWorker, cm));
  }

  function highlightWorker(cm) {
    let doc = cm.doc;
    if (doc.highlightFrontier >= cm.display.viewTo) return
    let end = +new Date + cm.options.workTime;
    let context = getContextBefore(cm, doc.highlightFrontier);
    let changedLines = [];

    doc.iter(context.line, Math.min(doc.first + doc.size, cm.display.viewTo + 500), line => {
      if (context.line >= cm.display.viewFrom) { // Visible
        let oldStyles = line.styles;
        let resetState = line.text.length > cm.options.maxHighlightLength ? copyState(doc.mode, context.state) : null;
        let highlighted = highlightLine(cm, line, context, true);
        if (resetState) context.state = resetState;
        line.styles = highlighted.styles;
        let oldCls = line.styleClasses, newCls = highlighted.classes;
        if (newCls) line.styleClasses = newCls;
        else if (oldCls) line.styleClasses = null;
        let ischange = !oldStyles || oldStyles.length != line.styles.length ||
          oldCls != newCls && (!oldCls || !newCls || oldCls.bgClass != newCls.bgClass || oldCls.textClass != newCls.textClass);
        for (let i = 0; !ischange && i < oldStyles.length; ++i) ischange = oldStyles[i] != line.styles[i];
        if (ischange) changedLines.push(context.line);
        line.stateAfter = context.save();
        context.nextLine();
      } else {
        if (line.text.length <= cm.options.maxHighlightLength)
          processLine(cm, line.text, context);
        line.stateAfter = context.line % 5 == 0 ? context.save() : null;
        context.nextLine();
      }
      if (+new Date > end) {
        startWorker(cm, cm.options.workDelay);
        return true
      }
    });
    doc.highlightFrontier = context.line;
    doc.modeFrontier = Math.max(doc.modeFrontier, context.line);
    if (changedLines.length) runInOp(cm, () => {
      for (let i = 0; i < changedLines.length; i++)
        regLineChange(cm, changedLines[i], "text");
    });
  }

  // DISPLAY DRAWING

  class DisplayUpdate {
    constructor(cm, viewport, force) {
      let display = cm.display;

      this.viewport = viewport;
      // Store some values that we'll need later (but don't want to force a relayout for)
      this.visible = visibleLines(display, cm.doc, viewport);
      this.editorIsHidden = !display.wrapper.offsetWidth;
      this.wrapperHeight = display.wrapper.clientHeight;
      this.wrapperWidth = display.wrapper.clientWidth;
      this.oldDisplayWidth = displayWidth(cm);
      this.force = force;
      this.dims = getDimensions(cm);
      this.events = [];
    }

    signal(emitter, type) {
      if (hasHandler(emitter, type))
        this.events.push(arguments);
    }
    finish() {
      for (let i = 0; i < this.events.length; i++)
        signal.apply(null, this.events[i]);
    }
  }

  function maybeClipScrollbars(cm) {
    let display = cm.display;
    if (!display.scrollbarsClipped && display.scroller.offsetWidth) {
      display.nativeBarWidth = display.scroller.offsetWidth - display.scroller.clientWidth;
      display.heightForcer.style.height = scrollGap(cm) + "px";
      display.sizer.style.marginBottom = -display.nativeBarWidth + "px";
      display.sizer.style.borderRightWidth = scrollGap(cm) + "px";
      display.scrollbarsClipped = true;
    }
  }

  function selectionSnapshot(cm) {
    if (cm.hasFocus()) return null
    let active = activeElt();
    if (!active || !contains(cm.display.lineDiv, active)) return null
    let result = {activeElt: active};
    if (window.getSelection) {
      let sel = window.getSelection();
      if (sel.anchorNode && sel.extend && contains(cm.display.lineDiv, sel.anchorNode)) {
        result.anchorNode = sel.anchorNode;
        result.anchorOffset = sel.anchorOffset;
        result.focusNode = sel.focusNode;
        result.focusOffset = sel.focusOffset;
      }
    }
    return result
  }

  function restoreSelection(snapshot) {
    if (!snapshot || !snapshot.activeElt || snapshot.activeElt == activeElt()) return
    snapshot.activeElt.focus();
    if (snapshot.anchorNode && contains(document.body, snapshot.anchorNode) && contains(document.body, snapshot.focusNode)) {
      let sel = window.getSelection(), range$$1 = document.createRange();
      range$$1.setEnd(snapshot.anchorNode, snapshot.anchorOffset);
      range$$1.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range$$1);
      sel.extend(snapshot.focusNode, snapshot.focusOffset);
    }
  }

  // Does the actual updating of the line display. Bails out
  // (returning false) when there is nothing to be done and forced is
  // false.
  function updateDisplayIfNeeded(cm, update) {
    let display = cm.display, doc = cm.doc;

    if (update.editorIsHidden) {
      resetView(cm);
      return false
    }

    // Bail out if the visible area is already rendered and nothing changed.
    if (!update.force &&
        update.visible.from >= display.viewFrom && update.visible.to <= display.viewTo &&
        (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo) &&
        display.renderedView == display.view && countDirtyView(cm) == 0)
      return false

    if (maybeUpdateLineNumberWidth(cm)) {
      resetView(cm);
      update.dims = getDimensions(cm);
    }

    // Compute a suitable new viewport (from & to)
    let end = doc.first + doc.size;
    let from = Math.max(update.visible.from - cm.options.viewportMargin, doc.first);
    let to = Math.min(end, update.visible.to + cm.options.viewportMargin);
    if (display.viewFrom < from && from - display.viewFrom < 20) from = Math.max(doc.first, display.viewFrom);
    if (display.viewTo > to && display.viewTo - to < 20) to = Math.min(end, display.viewTo);
    if (sawCollapsedSpans) {
      from = visualLineNo(cm.doc, from);
      to = visualLineEndNo(cm.doc, to);
    }

    let different = from != display.viewFrom || to != display.viewTo ||
      display.lastWrapHeight != update.wrapperHeight || display.lastWrapWidth != update.wrapperWidth;
    adjustView(cm, from, to);

    display.viewOffset = heightAtLine(getLine(cm.doc, display.viewFrom));
    // Position the mover div to align with the current scroll position
    cm.display.mover.style.top = display.viewOffset + "px";

    let toUpdate = countDirtyView(cm);
    if (!different && toUpdate == 0 && !update.force && display.renderedView == display.view &&
        (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo))
      return false

    // For big changes, we hide the enclosing element during the
    // update, since that speeds up the operations on most browsers.
    let selSnapshot = selectionSnapshot(cm);
    if (toUpdate > 4) display.lineDiv.style.display = "none";
    patchDisplay(cm, display.updateLineNumbers, update.dims);
    if (toUpdate > 4) display.lineDiv.style.display = "";
    display.renderedView = display.view;
    // There might have been a widget with a focused element that got
    // hidden or updated, if so re-focus it.
    restoreSelection(selSnapshot);

    // Prevent selection and cursors from interfering with the scroll
    // width and height.
    removeChildren(display.cursorDiv);
    removeChildren(display.selectionDiv);
    display.gutters.style.height = display.sizer.style.minHeight = 0;

    if (different) {
      display.lastWrapHeight = update.wrapperHeight;
      display.lastWrapWidth = update.wrapperWidth;
      startWorker(cm, 400);
    }

    display.updateLineNumbers = null;

    return true
  }

  function postUpdateDisplay(cm, update) {
    let viewport = update.viewport;

    for (let first = true;; first = false) {
      if (!first || !cm.options.lineWrapping || update.oldDisplayWidth == displayWidth(cm)) {
        // Clip forced viewport to actual scrollable area.
        if (viewport && viewport.top != null)
          viewport = {top: Math.min(cm.doc.height + paddingVert(cm.display) - displayHeight(cm), viewport.top)};
        // Updated line heights might result in the drawn area not
        // actually covering the viewport. Keep looping until it does.
        update.visible = visibleLines(cm.display, cm.doc, viewport);
        if (update.visible.from >= cm.display.viewFrom && update.visible.to <= cm.display.viewTo)
          break
      }
      if (!updateDisplayIfNeeded(cm, update)) break
      updateHeightsInViewport(cm);
      let barMeasure = measureForScrollbars(cm);
      updateSelection(cm);
      updateScrollbars(cm, barMeasure);
      setDocumentHeight(cm, barMeasure);
      update.force = false;
    }

    update.signal(cm, "update", cm);
    if (cm.display.viewFrom != cm.display.reportedViewFrom || cm.display.viewTo != cm.display.reportedViewTo) {
      update.signal(cm, "viewportChange", cm, cm.display.viewFrom, cm.display.viewTo);
      cm.display.reportedViewFrom = cm.display.viewFrom; cm.display.reportedViewTo = cm.display.viewTo;
    }
  }

  function updateDisplaySimple(cm, viewport) {
    let update = new DisplayUpdate(cm, viewport);
    if (updateDisplayIfNeeded(cm, update)) {
      updateHeightsInViewport(cm);
      postUpdateDisplay(cm, update);
      let barMeasure = measureForScrollbars(cm);
      updateSelection(cm);
      updateScrollbars(cm, barMeasure);
      setDocumentHeight(cm, barMeasure);
      update.finish();
    }
  }

  // Sync the actual display DOM structure with display.view, removing
  // nodes for lines that are no longer in view, and creating the ones
  // that are not there yet, and updating the ones that are out of
  // date.
  function patchDisplay(cm, updateNumbersFrom, dims) {
    let display = cm.display, lineNumbers = cm.options.lineNumbers;
    let container = display.lineDiv, cur = container.firstChild;

    function rm(node) {
      let next = node.nextSibling;
      // Works around a throw-scroll bug in OS X Webkit
      if (webkit && mac && cm.display.currentWheelTarget == node)
        node.style.display = "none";
      else
        node.parentNode.removeChild(node);
      return next
    }

    let view = display.view, lineN = display.viewFrom;
    // Loop over the elements in the view, syncing cur (the DOM nodes
    // in display.lineDiv) with the view as we go.
    for (let i = 0; i < view.length; i++) {
      let lineView = view[i];
      if (lineView.hidden) ; else if (!lineView.node || lineView.node.parentNode != container) { // Not drawn yet
        let node = buildLineElement(cm, lineView, lineN, dims);
        container.insertBefore(node, cur);
      } else { // Already drawn
        while (cur != lineView.node) cur = rm(cur);
        let updateNumber = lineNumbers && updateNumbersFrom != null &&
          updateNumbersFrom <= lineN && lineView.lineNumber;
        if (lineView.changes) {
          if (indexOf(lineView.changes, "gutter") > -1) updateNumber = false;
          updateLineForChanges(cm, lineView, lineN, dims);
        }
        if (updateNumber) {
          removeChildren(lineView.lineNumber);
          lineView.lineNumber.appendChild(document.createTextNode(lineNumberFor(cm.options, lineN)));
        }
        cur = lineView.node.nextSibling;
      }
      lineN += lineView.size;
    }
    while (cur) cur = rm(cur);
  }

  function updateGutterSpace(display) {
    let width = display.gutters.offsetWidth;
    display.sizer.style.marginLeft = width + "px";
  }

  function setDocumentHeight(cm, measure) {
    cm.display.sizer.style.minHeight = measure.docHeight + "px";
    cm.display.heightForcer.style.top = measure.docHeight + "px";
    cm.display.gutters.style.height = (measure.docHeight + cm.display.barHeight + scrollGap(cm)) + "px";
  }

  // Re-align line numbers and gutter marks to compensate for
  // horizontal scrolling.
  function alignHorizontally(cm) {
    let display = cm.display, view = display.view;
    if (!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter)) return
    let comp = compensateForHScroll(display) - display.scroller.scrollLeft + cm.doc.scrollLeft;
    let gutterW = display.gutters.offsetWidth, left = comp + "px";
    for (let i = 0; i < view.length; i++) if (!view[i].hidden) {
      if (cm.options.fixedGutter) {
        if (view[i].gutter)
          view[i].gutter.style.left = left;
        if (view[i].gutterBackground)
          view[i].gutterBackground.style.left = left;
      }
      let align = view[i].alignable;
      if (align) for (let j = 0; j < align.length; j++)
        align[j].style.left = left;
    }
    if (cm.options.fixedGutter)
      display.gutters.style.left = (comp + gutterW) + "px";
  }

  // Used to ensure that the line number gutter is still the right
  // size for the current document size. Returns true when an update
  // is needed.
  function maybeUpdateLineNumberWidth(cm) {
    if (!cm.options.lineNumbers) return false
    let doc = cm.doc, last = lineNumberFor(cm.options, doc.first + doc.size - 1), display = cm.display;
    if (last.length != display.lineNumChars) {
      let test = display.measure.appendChild(elt("div", [elt("div", last)],
                                                 "CodeMirror-linenumber CodeMirror-gutter-elt"));
      let innerW = test.firstChild.offsetWidth, padding = test.offsetWidth - innerW;
      display.lineGutter.style.width = "";
      display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth - padding) + 1;
      display.lineNumWidth = display.lineNumInnerWidth + padding;
      display.lineNumChars = display.lineNumInnerWidth ? last.length : -1;
      display.lineGutter.style.width = display.lineNumWidth + "px";
      updateGutterSpace(cm.display);
      return true
    }
    return false
  }

  function getGutters(gutters, lineNumbers) {
    let result = [], sawLineNumbers = false;
    for (let i = 0; i < gutters.length; i++) {
      let name = gutters[i], style = null;
      if (typeof name != "string") { style = name.style; name = name.className; }
      if (name == "CodeMirror-linenumbers") {
        if (!lineNumbers) continue
        else sawLineNumbers = true;
      }
      result.push({className: name, style});
    }
    if (lineNumbers && !sawLineNumbers) result.push({className: "CodeMirror-linenumbers", style: null});
    return result
  }

  // Rebuild the gutter elements, ensure the margin to the left of the
  // code matches their width.
  function renderGutters(display) {
    let gutters = display.gutters, specs = display.gutterSpecs;
    removeChildren(gutters);
    display.lineGutter = null;
    for (let i = 0; i < specs.length; ++i) {
      let {className, style} = specs[i];
      let gElt = gutters.appendChild(elt("div", null, "CodeMirror-gutter " + className));
      if (style) gElt.style.cssText = style;
      if (className == "CodeMirror-linenumbers") {
        display.lineGutter = gElt;
        gElt.style.width = (display.lineNumWidth || 1) + "px";
      }
    }
    gutters.style.display = specs.length ? "" : "none";
    updateGutterSpace(display);
  }

  function updateGutters(cm) {
    renderGutters(cm.display);
    regChange(cm);
    alignHorizontally(cm);
  }

  // The display handles the DOM integration, both for input reading
  // and content drawing. It holds references to DOM nodes and
  // display-related state.

  function Display(place, doc, input, options) {
    let d = this;
    this.input = input;

    // Covers bottom-right square when both scrollbars are present.
    d.scrollbarFiller = elt("div", null, "CodeMirror-scrollbar-filler");
    d.scrollbarFiller.setAttribute("cm-not-content", "true");
    // Covers bottom of gutter when coverGutterNextToScrollbar is on
    // and h scrollbar is present.
    d.gutterFiller = elt("div", null, "CodeMirror-gutter-filler");
    d.gutterFiller.setAttribute("cm-not-content", "true");
    // Will contain the actual code, positioned to cover the viewport.
    d.lineDiv = eltP("div", null, "CodeMirror-code");
    // Elements are added to these to represent selection and cursors.
    d.selectionDiv = elt("div", null, null, "position: relative; z-index: 1");
    d.cursorDiv = elt("div", null, "CodeMirror-cursors");
    // A visibility: hidden element used to find the size of things.
    d.measure = elt("div", null, "CodeMirror-measure");
    // When lines outside of the viewport are measured, they are drawn in this.
    d.lineMeasure = elt("div", null, "CodeMirror-measure");
    // Wraps everything that needs to exist inside the vertically-padded coordinate system
    d.lineSpace = eltP("div", [d.measure, d.lineMeasure, d.selectionDiv, d.cursorDiv, d.lineDiv],
                      null, "position: relative; outline: none");
    let lines = eltP("div", [d.lineSpace], "CodeMirror-lines");
    // Moved around its parent to cover visible view.
    d.mover = elt("div", [lines], null, "position: relative");
    // Set to the height of the document, allowing scrolling.
    d.sizer = elt("div", [d.mover], "CodeMirror-sizer");
    d.sizerWidth = null;
    // Behavior of elts with overflow: auto and padding is
    // inconsistent across browsers. This is used to ensure the
    // scrollable area is big enough.
    d.heightForcer = elt("div", null, null, "position: absolute; height: " + scrollerGap + "px; width: 1px;");
    // Will contain the gutters, if any.
    d.gutters = elt("div", null, "CodeMirror-gutters");
    d.lineGutter = null;
    // Actual scrollable element.
    d.scroller = elt("div", [d.sizer, d.heightForcer, d.gutters], "CodeMirror-scroll");
    d.scroller.setAttribute("tabIndex", "-1");
    // The element in which the editor lives.
    d.wrapper = elt("div", [d.scrollbarFiller, d.gutterFiller, d.scroller], "CodeMirror");

    // Work around IE7 z-index bug (not perfect, hence IE7 not really being supported)
    if (ie && ie_version < 8) { d.gutters.style.zIndex = -1; d.scroller.style.paddingRight = 0; }
    if (!webkit && !(gecko && mobile)) d.scroller.draggable = true;

    if (place) {
      if (place.appendChild) place.appendChild(d.wrapper);
      else place(d.wrapper);
    }

    // Current rendered range (may be bigger than the view window).
    d.viewFrom = d.viewTo = doc.first;
    d.reportedViewFrom = d.reportedViewTo = doc.first;
    // Information about the rendered lines.
    d.view = [];
    d.renderedView = null;
    // Holds info about a single rendered line when it was rendered
    // for measurement, while not in view.
    d.externalMeasured = null;
    // Empty space (in pixels) above the view
    d.viewOffset = 0;
    d.lastWrapHeight = d.lastWrapWidth = 0;
    d.updateLineNumbers = null;

    d.nativeBarWidth = d.barHeight = d.barWidth = 0;
    d.scrollbarsClipped = false;

    // Used to only resize the line number gutter when necessary (when
    // the amount of lines crosses a boundary that makes its width change)
    d.lineNumWidth = d.lineNumInnerWidth = d.lineNumChars = null;
    // Set to true when a non-horizontal-scrolling line widget is
    // added. As an optimization, line widget aligning is skipped when
    // this is false.
    d.alignWidgets = false;

    d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;

    // Tracks the maximum line length so that the horizontal scrollbar
    // can be kept static when scrolling.
    d.maxLine = null;
    d.maxLineLength = 0;
    d.maxLineChanged = false;

    // Used for measuring wheel scrolling granularity
    d.wheelDX = d.wheelDY = d.wheelStartX = d.wheelStartY = null;

    // True when shift is held down.
    d.shift = false;

    // Used to track whether anything happened since the context menu
    // was opened.
    d.selForContextMenu = null;

    d.activeTouch = null;

    d.gutterSpecs = getGutters(options.gutters, options.lineNumbers);
    renderGutters(d);

    input.init(d);
  }

  // Since the delta values reported on mouse wheel events are
  // unstandardized between browsers and even browser versions, and
  // generally horribly unpredictable, this code starts by measuring
  // the scroll effect that the first few mouse wheel events have,
  // and, from that, detects the way it can convert deltas to pixel
  // offsets afterwards.
  //
  // The reason we want to know the amount a wheel event will scroll
  // is that it gives us a chance to update the display before the
  // actual scrolling happens, reducing flickering.

  let wheelSamples = 0, wheelPixelsPerUnit = null;
  // Fill in a browser-detected starting value on browsers where we
  // know one. These don't have to be accurate -- the result of them
  // being wrong would just be a slight flicker on the first wheel
  // scroll (if it is large enough).
  if (ie) wheelPixelsPerUnit = -.53;
  else if (gecko) wheelPixelsPerUnit = 15;
  else if (chrome) wheelPixelsPerUnit = -.7;
  else if (safari) wheelPixelsPerUnit = -1/3;

  function wheelEventDelta(e) {
    let dx = e.wheelDeltaX, dy = e.wheelDeltaY;
    if (dx == null && e.detail && e.axis == e.HORIZONTAL_AXIS) dx = e.detail;
    if (dy == null && e.detail && e.axis == e.VERTICAL_AXIS) dy = e.detail;
    else if (dy == null) dy = e.wheelDelta;
    return {x: dx, y: dy}
  }
  function wheelEventPixels(e) {
    let delta = wheelEventDelta(e);
    delta.x *= wheelPixelsPerUnit;
    delta.y *= wheelPixelsPerUnit;
    return delta
  }

  function onScrollWheel(cm, e) {
    let delta = wheelEventDelta(e), dx = delta.x, dy = delta.y;

    let display = cm.display, scroll = display.scroller;
    // Quit if there's nothing to scroll here
    let canScrollX = scroll.scrollWidth > scroll.clientWidth;
    let canScrollY = scroll.scrollHeight > scroll.clientHeight;
    if (!(dx && canScrollX || dy && canScrollY)) return

    // Webkit browsers on OS X abort momentum scrolls when the target
    // of the scroll event is removed from the scrollable element.
    // This hack (see related code in patchDisplay) makes sure the
    // element is kept around.
    if (dy && mac && webkit) {
      outer: for (let cur = e.target, view = display.view; cur != scroll; cur = cur.parentNode) {
        for (let i = 0; i < view.length; i++) {
          if (view[i].node == cur) {
            cm.display.currentWheelTarget = cur;
            break outer
          }
        }
      }
    }

    // On some browsers, horizontal scrolling will cause redraws to
    // happen before the gutter has been realigned, causing it to
    // wriggle around in a most unseemly way. When we have an
    // estimated pixels/delta value, we just handle horizontal
    // scrolling entirely here. It'll be slightly off from native, but
    // better than glitching out.
    if (dx && !gecko && !presto && wheelPixelsPerUnit != null) {
      if (dy && canScrollY)
        updateScrollTop(cm, Math.max(0, scroll.scrollTop + dy * wheelPixelsPerUnit));
      setScrollLeft(cm, Math.max(0, scroll.scrollLeft + dx * wheelPixelsPerUnit));
      // Only prevent default scrolling if vertical scrolling is
      // actually possible. Otherwise, it causes vertical scroll
      // jitter on OSX trackpads when deltaX is small and deltaY
      // is large (issue #3579)
      if (!dy || (dy && canScrollY))
        e_preventDefault(e);
      display.wheelStartX = null; // Abort measurement, if in progress
      return
    }

    // 'Project' the visible viewport to cover the area that is being
    // scrolled into view (if we know enough to estimate it).
    if (dy && wheelPixelsPerUnit != null) {
      let pixels = dy * wheelPixelsPerUnit;
      let top = cm.doc.scrollTop, bot = top + display.wrapper.clientHeight;
      if (pixels < 0) top = Math.max(0, top + pixels - 50);
      else bot = Math.min(cm.doc.height, bot + pixels + 50);
      updateDisplaySimple(cm, {top: top, bottom: bot});
    }

    if (wheelSamples < 20) {
      if (display.wheelStartX == null) {
        display.wheelStartX = scroll.scrollLeft; display.wheelStartY = scroll.scrollTop;
        display.wheelDX = dx; display.wheelDY = dy;
        setTimeout(() => {
          if (display.wheelStartX == null) return
          let movedX = scroll.scrollLeft - display.wheelStartX;
          let movedY = scroll.scrollTop - display.wheelStartY;
          let sample = (movedY && display.wheelDY && movedY / display.wheelDY) ||
            (movedX && display.wheelDX && movedX / display.wheelDX);
          display.wheelStartX = display.wheelStartY = null;
          if (!sample) return
          wheelPixelsPerUnit = (wheelPixelsPerUnit * wheelSamples + sample) / (wheelSamples + 1);
          ++wheelSamples;
        }, 200);
      } else {
        display.wheelDX += dx; display.wheelDY += dy;
      }
    }
  }

  // Selection objects are immutable. A new one is created every time
  // the selection changes. A selection is one or more non-overlapping
  // (and non-touching) ranges, sorted, and an integer that indicates
  // which one is the primary selection (the one that's scrolled into
  // view, that getCursor returns, etc).
  class Selection {
    constructor(ranges, primIndex) {
      this.ranges = ranges;
      this.primIndex = primIndex;
    }

    primary() { return this.ranges[this.primIndex] }

    equals(other) {
      if (other == this) return true
      if (other.primIndex != this.primIndex || other.ranges.length != this.ranges.length) return false
      for (let i = 0; i < this.ranges.length; i++) {
        let here = this.ranges[i], there = other.ranges[i];
        if (!equalCursorPos(here.anchor, there.anchor) || !equalCursorPos(here.head, there.head)) return false
      }
      return true
    }

    deepCopy() {
      let out = [];
      for (let i = 0; i < this.ranges.length; i++)
        out[i] = new Range(copyPos(this.ranges[i].anchor), copyPos(this.ranges[i].head));
      return new Selection(out, this.primIndex)
    }

    somethingSelected() {
      for (let i = 0; i < this.ranges.length; i++)
        if (!this.ranges[i].empty()) return true
      return false
    }

    contains(pos, end) {
      if (!end) end = pos;
      for (let i = 0; i < this.ranges.length; i++) {
        let range = this.ranges[i];
        if (cmp(end, range.from()) >= 0 && cmp(pos, range.to()) <= 0)
          return i
      }
      return -1
    }
  }

  class Range {
    constructor(anchor, head) {
      this.anchor = anchor; this.head = head;
    }

    from() { return minPos(this.anchor, this.head) }
    to() { return maxPos(this.anchor, this.head) }
    empty() { return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch }
  }

  // Take an unsorted, potentially overlapping set of ranges, and
  // build a selection out of it. 'Consumes' ranges array (modifying
  // it).
  function normalizeSelection(cm, ranges, primIndex) {
    let mayTouch = cm && cm.options.selectionsMayTouch;
    let prim = ranges[primIndex];
    ranges.sort((a, b) => cmp(a.from(), b.from()));
    primIndex = indexOf(ranges, prim);
    for (let i = 1; i < ranges.length; i++) {
      let cur = ranges[i], prev = ranges[i - 1];
      let diff = cmp(prev.to(), cur.from());
      if (mayTouch && !cur.empty() ? diff > 0 : diff >= 0) {
        let from = minPos(prev.from(), cur.from()), to = maxPos(prev.to(), cur.to());
        let inv = prev.empty() ? cur.from() == cur.head : prev.from() == prev.head;
        if (i <= primIndex) --primIndex;
        ranges.splice(--i, 2, new Range(inv ? to : from, inv ? from : to));
      }
    }
    return new Selection(ranges, primIndex)
  }

  function simpleSelection(anchor, head) {
    return new Selection([new Range(anchor, head || anchor)], 0)
  }

  // Compute the position of the end of a change (its 'to' property
  // refers to the pre-change end).
  function changeEnd(change) {
    if (!change.text) return change.to
    return Pos(change.from.line + change.text.length - 1,
               lst(change.text).length + (change.text.length == 1 ? change.from.ch : 0))
  }

  // Adjust a position to refer to the post-change position of the
  // same text, or the end of the change if the change covers it.
  function adjustForChange(pos, change) {
    if (cmp(pos, change.from) < 0) return pos
    if (cmp(pos, change.to) <= 0) return changeEnd(change)

    let line = pos.line + change.text.length - (change.to.line - change.from.line) - 1, ch = pos.ch;
    if (pos.line == change.to.line) ch += changeEnd(change).ch - change.to.ch;
    return Pos(line, ch)
  }

  function computeSelAfterChange(doc, change) {
    let out = [];
    for (let i = 0; i < doc.sel.ranges.length; i++) {
      let range = doc.sel.ranges[i];
      out.push(new Range(adjustForChange(range.anchor, change),
                         adjustForChange(range.head, change)));
    }
    return normalizeSelection(doc.cm, out, doc.sel.primIndex)
  }

  function offsetPos(pos, old, nw) {
    if (pos.line == old.line)
      return Pos(nw.line, pos.ch - old.ch + nw.ch)
    else
      return Pos(nw.line + (pos.line - old.line), pos.ch)
  }

  // Used by replaceSelections to allow moving the selection to the
  // start or around the replaced test. Hint may be "start" or "around".
  function computeReplacedSel(doc, changes, hint) {
    let out = [];
    let oldPrev = Pos(doc.first, 0), newPrev = oldPrev;
    for (let i = 0; i < changes.length; i++) {
      let change = changes[i];
      let from = offsetPos(change.from, oldPrev, newPrev);
      let to = offsetPos(changeEnd(change), oldPrev, newPrev);
      oldPrev = change.to;
      newPrev = to;
      if (hint == "around") {
        let range = doc.sel.ranges[i], inv = cmp(range.head, range.anchor) < 0;
        out[i] = new Range(inv ? to : from, inv ? from : to);
      } else {
        out[i] = new Range(from, from);
      }
    }
    return new Selection(out, doc.sel.primIndex)
  }

  // Used to get the editor into a consistent state again when options change.

  function loadMode(cm) {
    cm.doc.mode = getMode(cm.options, cm.doc.modeOption);
    resetModeState(cm);
  }

  function resetModeState(cm) {
    cm.doc.iter(line => {
      if (line.stateAfter) line.stateAfter = null;
      if (line.styles) line.styles = null;
    });
    cm.doc.modeFrontier = cm.doc.highlightFrontier = cm.doc.first;
    startWorker(cm, 100);
    cm.state.modeGen++;
    if (cm.curOp) regChange(cm);
  }

  // DOCUMENT DATA STRUCTURE

  // By default, updates that start and end at the beginning of a line
  // are treated specially, in order to make the association of line
  // widgets and marker elements with the text behave more intuitive.
  function isWholeLineUpdate(doc, change) {
    return change.from.ch == 0 && change.to.ch == 0 && lst(change.text) == "" &&
      (!doc.cm || doc.cm.options.wholeLineUpdateBefore)
  }

  // Perform a change on the document data structure.
  function updateDoc(doc, change, markedSpans, estimateHeight$$1) {
    function spansFor(n) {return markedSpans ? markedSpans[n] : null}
    function update(line, text, spans) {
      updateLine(line, text, spans, estimateHeight$$1);
      signalLater(line, "change", line, change);
    }
    function linesFor(start, end) {
      let result = [];
      for (let i = start; i < end; ++i)
        result.push(new Line(text[i], spansFor(i), estimateHeight$$1));
      return result
    }

    let from = change.from, to = change.to, text = change.text;
    let firstLine = getLine(doc, from.line), lastLine = getLine(doc, to.line);
    let lastText = lst(text), lastSpans = spansFor(text.length - 1), nlines = to.line - from.line;

    // Adjust the line structure
    if (change.full) {
      doc.insert(0, linesFor(0, text.length));
      doc.remove(text.length, doc.size - text.length);
    } else if (isWholeLineUpdate(doc, change)) {
      // This is a whole-line replace. Treated specially to make
      // sure line objects move the way they are supposed to.
      let added = linesFor(0, text.length - 1);
      update(lastLine, lastLine.text, lastSpans);
      if (nlines) doc.remove(from.line, nlines);
      if (added.length) doc.insert(from.line, added);
    } else if (firstLine == lastLine) {
      if (text.length == 1) {
        update(firstLine, firstLine.text.slice(0, from.ch) + lastText + firstLine.text.slice(to.ch), lastSpans);
      } else {
        let added = linesFor(1, text.length - 1);
        added.push(new Line(lastText + firstLine.text.slice(to.ch), lastSpans, estimateHeight$$1));
        update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
        doc.insert(from.line + 1, added);
      }
    } else if (text.length == 1) {
      update(firstLine, firstLine.text.slice(0, from.ch) + text[0] + lastLine.text.slice(to.ch), spansFor(0));
      doc.remove(from.line + 1, nlines);
    } else {
      update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
      update(lastLine, lastText + lastLine.text.slice(to.ch), lastSpans);
      let added = linesFor(1, text.length - 1);
      if (nlines > 1) doc.remove(from.line + 1, nlines - 1);
      doc.insert(from.line + 1, added);
    }

    signalLater(doc, "change", doc, change);
  }

  // Call f for all linked documents.
  function linkedDocs(doc, f, sharedHistOnly) {
    function propagate(doc, skip, sharedHist) {
      if (doc.linked) for (let i = 0; i < doc.linked.length; ++i) {
        let rel = doc.linked[i];
        if (rel.doc == skip) continue
        let shared = sharedHist && rel.sharedHist;
        if (sharedHistOnly && !shared) continue
        f(rel.doc, shared);
        propagate(rel.doc, doc, shared);
      }
    }
    propagate(doc, null, true);
  }

  // Attach a document to an editor.
  function attachDoc(cm, doc) {
    if (doc.cm) throw new Error("This document is already in use.")
    cm.doc = doc;
    doc.cm = cm;
    estimateLineHeights(cm);
    loadMode(cm);
    setDirectionClass(cm);
    if (!cm.options.lineWrapping) findMaxLine(cm);
    cm.options.mode = doc.modeOption;
    regChange(cm);
  }

  function setDirectionClass(cm) {
  (cm.doc.direction == "rtl" ? addClass : rmClass)(cm.display.lineDiv, "CodeMirror-rtl");
  }

  function directionChanged(cm) {
    runInOp(cm, () => {
      setDirectionClass(cm);
      regChange(cm);
    });
  }

  function History(startGen) {
    // Arrays of change events and selections. Doing something adds an
    // event to done and clears undo. Undoing moves events from done
    // to undone, redoing moves them in the other direction.
    this.done = []; this.undone = [];
    this.undoDepth = Infinity;
    // Used to track when changes can be merged into a single undo
    // event
    this.lastModTime = this.lastSelTime = 0;
    this.lastOp = this.lastSelOp = null;
    this.lastOrigin = this.lastSelOrigin = null;
    // Used by the isClean() method
    this.generation = this.maxGeneration = startGen || 1;
  }

  // Create a history change event from an updateDoc-style change
  // object.
  function historyChangeFromChange(doc, change) {
    let histChange = {from: copyPos(change.from), to: changeEnd(change), text: getBetween(doc, change.from, change.to)};
    attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);
    linkedDocs(doc, doc => attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1), true);
    return histChange
  }

  // Pop all selection events off the end of a history array. Stop at
  // a change event.
  function clearSelectionEvents(array) {
    while (array.length) {
      let last = lst(array);
      if (last.ranges) array.pop();
      else break
    }
  }

  // Find the top change event in the history. Pop off selection
  // events that are in the way.
  function lastChangeEvent(hist, force) {
    if (force) {
      clearSelectionEvents(hist.done);
      return lst(hist.done)
    } else if (hist.done.length && !lst(hist.done).ranges) {
      return lst(hist.done)
    } else if (hist.done.length > 1 && !hist.done[hist.done.length - 2].ranges) {
      hist.done.pop();
      return lst(hist.done)
    }
  }

  // Register a change in the history. Merges changes that are within
  // a single operation, or are close together with an origin that
  // allows merging (starting with "+") into a single event.
  function addChangeToHistory(doc, change, selAfter, opId) {
    let hist = doc.history;
    hist.undone.length = 0;
    let time = +new Date, cur;
    let last;

    if ((hist.lastOp == opId ||
         hist.lastOrigin == change.origin && change.origin &&
         ((change.origin.charAt(0) == "+" && hist.lastModTime > time - (doc.cm ? doc.cm.options.historyEventDelay : 500)) ||
          change.origin.charAt(0) == "*")) &&
        (cur = lastChangeEvent(hist, hist.lastOp == opId))) {
      // Merge this change into the last event
      last = lst(cur.changes);
      if (cmp(change.from, change.to) == 0 && cmp(change.from, last.to) == 0) {
        // Optimized case for simple insertion -- don't want to add
        // new changesets for every character typed
        last.to = changeEnd(change);
      } else {
        // Add new sub-event
        cur.changes.push(historyChangeFromChange(doc, change));
      }
    } else {
      // Can not be merged, start a new event.
      let before = lst(hist.done);
      if (!before || !before.ranges)
        pushSelectionToHistory(doc.sel, hist.done);
      cur = {changes: [historyChangeFromChange(doc, change)],
             generation: hist.generation};
      hist.done.push(cur);
      while (hist.done.length > hist.undoDepth) {
        hist.done.shift();
        if (!hist.done[0].ranges) hist.done.shift();
      }
    }
    hist.done.push(selAfter);
    hist.generation = ++hist.maxGeneration;
    hist.lastModTime = hist.lastSelTime = time;
    hist.lastOp = hist.lastSelOp = opId;
    hist.lastOrigin = hist.lastSelOrigin = change.origin;

    if (!last) signal(doc, "historyAdded");
  }

  function selectionEventCanBeMerged(doc, origin, prev, sel) {
    let ch = origin.charAt(0);
    return ch == "*" ||
      ch == "+" &&
      prev.ranges.length == sel.ranges.length &&
      prev.somethingSelected() == sel.somethingSelected() &&
      new Date - doc.history.lastSelTime <= (doc.cm ? doc.cm.options.historyEventDelay : 500)
  }

  // Called whenever the selection changes, sets the new selection as
  // the pending selection in the history, and pushes the old pending
  // selection into the 'done' array when it was significantly
  // different (in number of selected ranges, emptiness, or time).
  function addSelectionToHistory(doc, sel, opId, options) {
    let hist = doc.history, origin = options && options.origin;

    // A new event is started when the previous origin does not match
    // the current, or the origins don't allow matching. Origins
    // starting with * are always merged, those starting with + are
    // merged when similar and close together in time.
    if (opId == hist.lastSelOp ||
        (origin && hist.lastSelOrigin == origin &&
         (hist.lastModTime == hist.lastSelTime && hist.lastOrigin == origin ||
          selectionEventCanBeMerged(doc, origin, lst(hist.done), sel))))
      hist.done[hist.done.length - 1] = sel;
    else
      pushSelectionToHistory(sel, hist.done);

    hist.lastSelTime = +new Date;
    hist.lastSelOrigin = origin;
    hist.lastSelOp = opId;
    if (options && options.clearRedo !== false)
      clearSelectionEvents(hist.undone);
  }

  function pushSelectionToHistory(sel, dest) {
    let top = lst(dest);
    if (!(top && top.ranges && top.equals(sel)))
      dest.push(sel);
  }

  // Used to store marked span information in the history.
  function attachLocalSpans(doc, change, from, to) {
    let existing = change["spans_" + doc.id], n = 0;
    doc.iter(Math.max(doc.first, from), Math.min(doc.first + doc.size, to), line => {
      if (line.markedSpans)
        (existing || (existing = change["spans_" + doc.id] = {}))[n] = line.markedSpans;
      ++n;
    });
  }

  // When un/re-doing restores text containing marked spans, those
  // that have been explicitly cleared should not be restored.
  function removeClearedSpans(spans) {
    if (!spans) return null
    let out;
    for (let i = 0; i < spans.length; ++i) {
      if (spans[i].marker.explicitlyCleared) { if (!out) out = spans.slice(0, i); }
      else if (out) out.push(spans[i]);
    }
    return !out ? spans : out.length ? out : null
  }

  // Retrieve and filter the old marked spans stored in a change event.
  function getOldSpans(doc, change) {
    let found = change["spans_" + doc.id];
    if (!found) return null
    let nw = [];
    for (let i = 0; i < change.text.length; ++i)
      nw.push(removeClearedSpans(found[i]));
    return nw
  }

  // Used for un/re-doing changes from the history. Combines the
  // result of computing the existing spans with the set of spans that
  // existed in the history (so that deleting around a span and then
  // undoing brings back the span).
  function mergeOldSpans(doc, change) {
    let old = getOldSpans(doc, change);
    let stretched = stretchSpansOverChange(doc, change);
    if (!old) return stretched
    if (!stretched) return old

    for (let i = 0; i < old.length; ++i) {
      let oldCur = old[i], stretchCur = stretched[i];
      if (oldCur && stretchCur) {
        spans: for (let j = 0; j < stretchCur.length; ++j) {
          let span = stretchCur[j];
          for (let k = 0; k < oldCur.length; ++k)
            if (oldCur[k].marker == span.marker) continue spans
          oldCur.push(span);
        }
      } else if (stretchCur) {
        old[i] = stretchCur;
      }
    }
    return old
  }

  // Used both to provide a JSON-safe object in .getHistory, and, when
  // detaching a document, to split the history in two
  function copyHistoryArray(events, newGroup, instantiateSel) {
    let copy = [];
    for (let i = 0; i < events.length; ++i) {
      let event = events[i];
      if (event.ranges) {
        copy.push(instantiateSel ? Selection.prototype.deepCopy.call(event) : event);
        continue
      }
      let changes = event.changes, newChanges = [];
      copy.push({changes: newChanges});
      for (let j = 0; j < changes.length; ++j) {
        let change = changes[j], m;
        newChanges.push({from: change.from, to: change.to, text: change.text});
        if (newGroup) for (var prop in change) if (m = prop.match(/^spans_(\d+)$/)) {
          if (indexOf(newGroup, Number(m[1])) > -1) {
            lst(newChanges)[prop] = change[prop];
            delete change[prop];
          }
        }
      }
    }
    return copy
  }

  // The 'scroll' parameter given to many of these indicated whether
  // the new cursor position should be scrolled into view after
  // modifying the selection.

  // If shift is held or the extend flag is set, extends a range to
  // include a given position (and optionally a second position).
  // Otherwise, simply returns the range between the given positions.
  // Used for cursor motion and such.
  function extendRange(range, head, other, extend) {
    if (extend) {
      let anchor = range.anchor;
      if (other) {
        let posBefore = cmp(head, anchor) < 0;
        if (posBefore != (cmp(other, anchor) < 0)) {
          anchor = head;
          head = other;
        } else if (posBefore != (cmp(head, other) < 0)) {
          head = other;
        }
      }
      return new Range(anchor, head)
    } else {
      return new Range(other || head, head)
    }
  }

  // Extend the primary selection range, discard the rest.
  function extendSelection(doc, head, other, options, extend) {
    if (extend == null) extend = doc.cm && (doc.cm.display.shift || doc.extend);
    setSelection(doc, new Selection([extendRange(doc.sel.primary(), head, other, extend)], 0), options);
  }

  // Extend all selections (pos is an array of selections with length
  // equal the number of selections)
  function extendSelections(doc, heads, options) {
    let out = [];
    let extend = doc.cm && (doc.cm.display.shift || doc.extend);
    for (let i = 0; i < doc.sel.ranges.length; i++)
      out[i] = extendRange(doc.sel.ranges[i], heads[i], null, extend);
    let newSel = normalizeSelection(doc.cm, out, doc.sel.primIndex);
    setSelection(doc, newSel, options);
  }

  // Updates a single range in the selection.
  function replaceOneSelection(doc, i, range, options) {
    let ranges = doc.sel.ranges.slice(0);
    ranges[i] = range;
    setSelection(doc, normalizeSelection(doc.cm, ranges, doc.sel.primIndex), options);
  }

  // Reset the selection to a single range.
  function setSimpleSelection(doc, anchor, head, options) {
    setSelection(doc, simpleSelection(anchor, head), options);
  }

  // Give beforeSelectionChange handlers a change to influence a
  // selection update.
  function filterSelectionChange(doc, sel, options) {
    let obj = {
      ranges: sel.ranges,
      update: function(ranges) {
        this.ranges = [];
        for (let i = 0; i < ranges.length; i++)
          this.ranges[i] = new Range(clipPos(doc, ranges[i].anchor),
                                     clipPos(doc, ranges[i].head));
      },
      origin: options && options.origin
    };
    signal(doc, "beforeSelectionChange", doc, obj);
    if (doc.cm) signal(doc.cm, "beforeSelectionChange", doc.cm, obj);
    if (obj.ranges != sel.ranges) return normalizeSelection(doc.cm, obj.ranges, obj.ranges.length - 1)
    else return sel
  }

  function setSelectionReplaceHistory(doc, sel, options) {
    let done = doc.history.done, last = lst(done);
    if (last && last.ranges) {
      done[done.length - 1] = sel;
      setSelectionNoUndo(doc, sel, options);
    } else {
      setSelection(doc, sel, options);
    }
  }

  // Set a new selection.
  function setSelection(doc, sel, options) {
    setSelectionNoUndo(doc, sel, options);
    addSelectionToHistory(doc, doc.sel, doc.cm ? doc.cm.curOp.id : NaN, options);
  }

  function setSelectionNoUndo(doc, sel, options) {
    if (hasHandler(doc, "beforeSelectionChange") || doc.cm && hasHandler(doc.cm, "beforeSelectionChange"))
      sel = filterSelectionChange(doc, sel, options);

    let bias = options && options.bias ||
      (cmp(sel.primary().head, doc.sel.primary().head) < 0 ? -1 : 1);
    setSelectionInner(doc, skipAtomicInSelection(doc, sel, bias, true));

    if (!(options && options.scroll === false) && doc.cm)
      ensureCursorVisible(doc.cm);
  }

  function setSelectionInner(doc, sel) {
    if (sel.equals(doc.sel)) return

    doc.sel = sel;

    if (doc.cm) {
      doc.cm.curOp.updateInput = 1;
      doc.cm.curOp.selectionChanged = true;
      signalCursorActivity(doc.cm);
    }
    signalLater(doc, "cursorActivity", doc);
  }

  // Verify that the selection does not partially select any atomic
  // marked ranges.
  function reCheckSelection(doc) {
    setSelectionInner(doc, skipAtomicInSelection(doc, doc.sel, null, false));
  }

  // Return a selection that does not partially select any atomic
  // ranges.
  function skipAtomicInSelection(doc, sel, bias, mayClear) {
    let out;
    for (let i = 0; i < sel.ranges.length; i++) {
      let range = sel.ranges[i];
      let old = sel.ranges.length == doc.sel.ranges.length && doc.sel.ranges[i];
      let newAnchor = skipAtomic(doc, range.anchor, old && old.anchor, bias, mayClear);
      let newHead = skipAtomic(doc, range.head, old && old.head, bias, mayClear);
      if (out || newAnchor != range.anchor || newHead != range.head) {
        if (!out) out = sel.ranges.slice(0, i);
        out[i] = new Range(newAnchor, newHead);
      }
    }
    return out ? normalizeSelection(doc.cm, out, sel.primIndex) : sel
  }

  function skipAtomicInner(doc, pos, oldPos, dir, mayClear) {
    let line = getLine(doc, pos.line);
    if (line.markedSpans) for (let i = 0; i < line.markedSpans.length; ++i) {
      let sp = line.markedSpans[i], m = sp.marker;

      // Determine if we should prevent the cursor being placed to the left/right of an atomic marker
      // Historically this was determined using the inclusiveLeft/Right option, but the new way to control it
      // is with selectLeft/Right
      let preventCursorLeft = ("selectLeft" in m) ? !m.selectLeft : m.inclusiveLeft;
      let preventCursorRight = ("selectRight" in m) ? !m.selectRight : m.inclusiveRight;

      if ((sp.from == null || (preventCursorLeft ? sp.from <= pos.ch : sp.from < pos.ch)) &&
          (sp.to == null || (preventCursorRight ? sp.to >= pos.ch : sp.to > pos.ch))) {
        if (mayClear) {
          signal(m, "beforeCursorEnter");
          if (m.explicitlyCleared) {
            if (!line.markedSpans) break
            else {--i; continue}
          }
        }
        if (!m.atomic) continue

        if (oldPos) {
          let near = m.find(dir < 0 ? 1 : -1), diff;
          if (dir < 0 ? preventCursorRight : preventCursorLeft)
            near = movePos(doc, near, -dir, near && near.line == pos.line ? line : null);
          if (near && near.line == pos.line && (diff = cmp(near, oldPos)) && (dir < 0 ? diff < 0 : diff > 0))
            return skipAtomicInner(doc, near, pos, dir, mayClear)
        }

        let far = m.find(dir < 0 ? -1 : 1);
        if (dir < 0 ? preventCursorLeft : preventCursorRight)
          far = movePos(doc, far, dir, far.line == pos.line ? line : null);
        return far ? skipAtomicInner(doc, far, pos, dir, mayClear) : null
      }
    }
    return pos
  }

  // Ensure a given position is not inside an atomic range.
  function skipAtomic(doc, pos, oldPos, bias, mayClear) {
    let dir = bias || 1;
    let found = skipAtomicInner(doc, pos, oldPos, dir, mayClear) ||
        (!mayClear && skipAtomicInner(doc, pos, oldPos, dir, true)) ||
        skipAtomicInner(doc, pos, oldPos, -dir, mayClear) ||
        (!mayClear && skipAtomicInner(doc, pos, oldPos, -dir, true));
    if (!found) {
      doc.cantEdit = true;
      return Pos(doc.first, 0)
    }
    return found
  }

  function movePos(doc, pos, dir, line) {
    if (dir < 0 && pos.ch == 0) {
      if (pos.line > doc.first) return clipPos(doc, Pos(pos.line - 1))
      else return null
    } else if (dir > 0 && pos.ch == (line || getLine(doc, pos.line)).text.length) {
      if (pos.line < doc.first + doc.size - 1) return Pos(pos.line + 1, 0)
      else return null
    } else {
      return new Pos(pos.line, pos.ch + dir)
    }
  }

  function selectAll(cm) {
    cm.setSelection(Pos(cm.firstLine(), 0), Pos(cm.lastLine()), sel_dontScroll);
  }

  // UPDATING

  // Allow "beforeChange" event handlers to influence a change
  function filterChange(doc, change, update) {
    let obj = {
      canceled: false,
      from: change.from,
      to: change.to,
      text: change.text,
      origin: change.origin,
      cancel: () => obj.canceled = true
    };
    if (update) obj.update = (from, to, text, origin) => {
      if (from) obj.from = clipPos(doc, from);
      if (to) obj.to = clipPos(doc, to);
      if (text) obj.text = text;
      if (origin !== undefined) obj.origin = origin;
    };
    signal(doc, "beforeChange", doc, obj);
    if (doc.cm) signal(doc.cm, "beforeChange", doc.cm, obj);

    if (obj.canceled) {
      if (doc.cm) doc.cm.curOp.updateInput = 2;
      return null
    }
    return {from: obj.from, to: obj.to, text: obj.text, origin: obj.origin}
  }

  // Apply a change to a document, and add it to the document's
  // history, and propagating it to all linked documents.
  function makeChange(doc, change, ignoreReadOnly) {
    if (doc.cm) {
      if (!doc.cm.curOp) return operation(doc.cm, makeChange)(doc, change, ignoreReadOnly)
      if (doc.cm.state.suppressEdits) return
    }

    if (hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange")) {
      change = filterChange(doc, change, true);
      if (!change) return
    }

    // Possibly split or suppress the update based on the presence
    // of read-only spans in its range.
    let split = sawReadOnlySpans && !ignoreReadOnly && removeReadOnlyRanges(doc, change.from, change.to);
    if (split) {
      for (let i = split.length - 1; i >= 0; --i)
        makeChangeInner(doc, {from: split[i].from, to: split[i].to, text: i ? [""] : change.text, origin: change.origin});
    } else {
      makeChangeInner(doc, change);
    }
  }

  function makeChangeInner(doc, change) {
    if (change.text.length == 1 && change.text[0] == "" && cmp(change.from, change.to) == 0) return
    let selAfter = computeSelAfterChange(doc, change);
    addChangeToHistory(doc, change, selAfter, doc.cm ? doc.cm.curOp.id : NaN);

    makeChangeSingleDoc(doc, change, selAfter, stretchSpansOverChange(doc, change));
    let rebased = [];

    linkedDocs(doc, (doc, sharedHist) => {
      if (!sharedHist && indexOf(rebased, doc.history) == -1) {
        rebaseHist(doc.history, change);
        rebased.push(doc.history);
      }
      makeChangeSingleDoc(doc, change, null, stretchSpansOverChange(doc, change));
    });
  }

  // Revert a change stored in a document's history.
  function makeChangeFromHistory(doc, type, allowSelectionOnly) {
    let suppress = doc.cm && doc.cm.state.suppressEdits;
    if (suppress && !allowSelectionOnly) return

    let hist = doc.history, event, selAfter = doc.sel;
    let source = type == "undo" ? hist.done : hist.undone, dest = type == "undo" ? hist.undone : hist.done;

    // Verify that there is a useable event (so that ctrl-z won't
    // needlessly clear selection events)
    let i = 0;
    for (; i < source.length; i++) {
      event = source[i];
      if (allowSelectionOnly ? event.ranges && !event.equals(doc.sel) : !event.ranges)
        break
    }
    if (i == source.length) return
    hist.lastOrigin = hist.lastSelOrigin = null;

    for (;;) {
      event = source.pop();
      if (event.ranges) {
        pushSelectionToHistory(event, dest);
        if (allowSelectionOnly && !event.equals(doc.sel)) {
          setSelection(doc, event, {clearRedo: false});
          return
        }
        selAfter = event;
      } else if (suppress) {
        source.push(event);
        return
      } else break
    }

    // Build up a reverse change object to add to the opposite history
    // stack (redo when undoing, and vice versa).
    let antiChanges = [];
    pushSelectionToHistory(selAfter, dest);
    dest.push({changes: antiChanges, generation: hist.generation});
    hist.generation = event.generation || ++hist.maxGeneration;

    let filter = hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange");

    for (let i = event.changes.length - 1; i >= 0; --i) {
      let change = event.changes[i];
      change.origin = type;
      if (filter && !filterChange(doc, change, false)) {
        source.length = 0;
        return
      }

      antiChanges.push(historyChangeFromChange(doc, change));

      let after = i ? computeSelAfterChange(doc, change) : lst(source);
      makeChangeSingleDoc(doc, change, after, mergeOldSpans(doc, change));
      if (!i && doc.cm) doc.cm.scrollIntoView({from: change.from, to: changeEnd(change)});
      let rebased = [];

      // Propagate to the linked documents
      linkedDocs(doc, (doc, sharedHist) => {
        if (!sharedHist && indexOf(rebased, doc.history) == -1) {
          rebaseHist(doc.history, change);
          rebased.push(doc.history);
        }
        makeChangeSingleDoc(doc, change, null, mergeOldSpans(doc, change));
      });
    }
  }

  // Sub-views need their line numbers shifted when text is added
  // above or below them in the parent document.
  function shiftDoc(doc, distance) {
    if (distance == 0) return
    doc.first += distance;
    doc.sel = new Selection(map(doc.sel.ranges, range => new Range(
      Pos(range.anchor.line + distance, range.anchor.ch),
      Pos(range.head.line + distance, range.head.ch)
    )), doc.sel.primIndex);
    if (doc.cm) {
      regChange(doc.cm, doc.first, doc.first - distance, distance);
      for (let d = doc.cm.display, l = d.viewFrom; l < d.viewTo; l++)
        regLineChange(doc.cm, l, "gutter");
    }
  }

  // More lower-level change function, handling only a single document
  // (not linked ones).
  function makeChangeSingleDoc(doc, change, selAfter, spans) {
    if (doc.cm && !doc.cm.curOp)
      return operation(doc.cm, makeChangeSingleDoc)(doc, change, selAfter, spans)

    if (change.to.line < doc.first) {
      shiftDoc(doc, change.text.length - 1 - (change.to.line - change.from.line));
      return
    }
    if (change.from.line > doc.lastLine()) return

    // Clip the change to the size of this doc
    if (change.from.line < doc.first) {
      let shift = change.text.length - 1 - (doc.first - change.from.line);
      shiftDoc(doc, shift);
      change = {from: Pos(doc.first, 0), to: Pos(change.to.line + shift, change.to.ch),
                text: [lst(change.text)], origin: change.origin};
    }
    let last = doc.lastLine();
    if (change.to.line > last) {
      change = {from: change.from, to: Pos(last, getLine(doc, last).text.length),
                text: [change.text[0]], origin: change.origin};
    }

    change.removed = getBetween(doc, change.from, change.to);

    if (!selAfter) selAfter = computeSelAfterChange(doc, change);
    if (doc.cm) makeChangeSingleDocInEditor(doc.cm, change, spans);
    else updateDoc(doc, change, spans);
    setSelectionNoUndo(doc, selAfter, sel_dontScroll);
  }

  // Handle the interaction of a change to a document with the editor
  // that this document is part of.
  function makeChangeSingleDocInEditor(cm, change, spans) {
    let doc = cm.doc, display = cm.display, from = change.from, to = change.to;

    let recomputeMaxLength = false, checkWidthStart = from.line;
    if (!cm.options.lineWrapping) {
      checkWidthStart = lineNo(visualLine(getLine(doc, from.line)));
      doc.iter(checkWidthStart, to.line + 1, line => {
        if (line == display.maxLine) {
          recomputeMaxLength = true;
          return true
        }
      });
    }

    if (doc.sel.contains(change.from, change.to) > -1)
      signalCursorActivity(cm);

    updateDoc(doc, change, spans, estimateHeight(cm));

    if (!cm.options.lineWrapping) {
      doc.iter(checkWidthStart, from.line + change.text.length, line => {
        let len = lineLength(line);
        if (len > display.maxLineLength) {
          display.maxLine = line;
          display.maxLineLength = len;
          display.maxLineChanged = true;
          recomputeMaxLength = false;
        }
      });
      if (recomputeMaxLength) cm.curOp.updateMaxLine = true;
    }

    retreatFrontier(doc, from.line);
    startWorker(cm, 400);

    let lendiff = change.text.length - (to.line - from.line) - 1;
    // Remember that these lines changed, for updating the display
    if (change.full)
      regChange(cm);
    else if (from.line == to.line && change.text.length == 1 && !isWholeLineUpdate(cm.doc, change))
      regLineChange(cm, from.line, "text");
    else
      regChange(cm, from.line, to.line + 1, lendiff);

    let changesHandler = hasHandler(cm, "changes"), changeHandler = hasHandler(cm, "change");
    if (changeHandler || changesHandler) {
      let obj = {
        from: from, to: to,
        text: change.text,
        removed: change.removed,
        origin: change.origin
      };
      if (changeHandler) signalLater(cm, "change", cm, obj);
      if (changesHandler) (cm.curOp.changeObjs || (cm.curOp.changeObjs = [])).push(obj);
    }
    cm.display.selForContextMenu = null;
  }

  function replaceRange(doc, code, from, to, origin) {
    if (!to) to = from;
    if (cmp(to, from) < 0) [from, to] = [to, from];
    if (typeof code == "string") code = doc.splitLines(code);
    makeChange(doc, {from, to, text: code, origin});
  }

  // Rebasing/resetting history to deal with externally-sourced changes

  function rebaseHistSelSingle(pos, from, to, diff) {
    if (to < pos.line) {
      pos.line += diff;
    } else if (from < pos.line) {
      pos.line = from;
      pos.ch = 0;
    }
  }

  // Tries to rebase an array of history events given a change in the
  // document. If the change touches the same lines as the event, the
  // event, and everything 'behind' it, is discarded. If the change is
  // before the event, the event's positions are updated. Uses a
  // copy-on-write scheme for the positions, to avoid having to
  // reallocate them all on every rebase, but also avoid problems with
  // shared position objects being unsafely updated.
  function rebaseHistArray(array, from, to, diff) {
    for (let i = 0; i < array.length; ++i) {
      let sub = array[i], ok = true;
      if (sub.ranges) {
        if (!sub.copied) { sub = array[i] = sub.deepCopy(); sub.copied = true; }
        for (let j = 0; j < sub.ranges.length; j++) {
          rebaseHistSelSingle(sub.ranges[j].anchor, from, to, diff);
          rebaseHistSelSingle(sub.ranges[j].head, from, to, diff);
        }
        continue
      }
      for (let j = 0; j < sub.changes.length; ++j) {
        let cur = sub.changes[j];
        if (to < cur.from.line) {
          cur.from = Pos(cur.from.line + diff, cur.from.ch);
          cur.to = Pos(cur.to.line + diff, cur.to.ch);
        } else if (from <= cur.to.line) {
          ok = false;
          break
        }
      }
      if (!ok) {
        array.splice(0, i + 1);
        i = 0;
      }
    }
  }

  function rebaseHist(hist, change) {
    let from = change.from.line, to = change.to.line, diff = change.text.length - (to - from) - 1;
    rebaseHistArray(hist.done, from, to, diff);
    rebaseHistArray(hist.undone, from, to, diff);
  }

  // Utility for applying a change to a line by handle or number,
  // returning the number and optionally registering the line as
  // changed.
  function changeLine(doc, handle, changeType, op) {
    let no = handle, line = handle;
    if (typeof handle == "number") line = getLine(doc, clipLine(doc, handle));
    else no = lineNo(handle);
    if (no == null) return null
    if (op(line, no) && doc.cm) regLineChange(doc.cm, no, changeType);
    return line
  }

  // The document is represented as a BTree consisting of leaves, with
  // chunk of lines in them, and branches, with up to ten leaves or
  // other branch nodes below them. The top node is always a branch
  // node, and is the document object itself (meaning it has
  // additional methods and properties).
  //
  // All nodes have parent links. The tree is used both to go from
  // line numbers to line objects, and to go from objects to numbers.
  // It also indexes by height, and is used to convert between height
  // and line object, and to find the total height of the document.
  //
  // See also http://marijnhaverbeke.nl/blog/codemirror-line-tree.html

  function LeafChunk(lines) {
    this.lines = lines;
    this.parent = null;
    let height = 0;
    for (let i = 0; i < lines.length; ++i) {
      lines[i].parent = this;
      height += lines[i].height;
    }
    this.height = height;
  }

  LeafChunk.prototype = {
    chunkSize() { return this.lines.length },

    // Remove the n lines at offset 'at'.
    removeInner(at, n) {
      for (let i = at, e = at + n; i < e; ++i) {
        let line = this.lines[i];
        this.height -= line.height;
        cleanUpLine(line);
        signalLater(line, "delete");
      }
      this.lines.splice(at, n);
    },

    // Helper used to collapse a small branch into a single leaf.
    collapse(lines) {
      lines.push.apply(lines, this.lines);
    },

    // Insert the given array of lines at offset 'at', count them as
    // having the given height.
    insertInner(at, lines, height) {
      this.height += height;
      this.lines = this.lines.slice(0, at).concat(lines).concat(this.lines.slice(at));
      for (let i = 0; i < lines.length; ++i) lines[i].parent = this;
    },

    // Used to iterate over a part of the tree.
    iterN(at, n, op) {
      for (let e = at + n; at < e; ++at)
        if (op(this.lines[at])) return true
    }
  };

  function BranchChunk(children) {
    this.children = children;
    let size = 0, height = 0;
    for (let i = 0; i < children.length; ++i) {
      let ch = children[i];
      size += ch.chunkSize(); height += ch.height;
      ch.parent = this;
    }
    this.size = size;
    this.height = height;
    this.parent = null;
  }

  BranchChunk.prototype = {
    chunkSize() { return this.size },

    removeInner(at, n) {
      this.size -= n;
      for (let i = 0; i < this.children.length; ++i) {
        let child = this.children[i], sz = child.chunkSize();
        if (at < sz) {
          let rm = Math.min(n, sz - at), oldHeight = child.height;
          child.removeInner(at, rm);
          this.height -= oldHeight - child.height;
          if (sz == rm) { this.children.splice(i--, 1); child.parent = null; }
          if ((n -= rm) == 0) break
          at = 0;
        } else at -= sz;
      }
      // If the result is smaller than 25 lines, ensure that it is a
      // single leaf node.
      if (this.size - n < 25 &&
          (this.children.length > 1 || !(this.children[0] instanceof LeafChunk))) {
        let lines = [];
        this.collapse(lines);
        this.children = [new LeafChunk(lines)];
        this.children[0].parent = this;
      }
    },

    collapse(lines) {
      for (let i = 0; i < this.children.length; ++i) this.children[i].collapse(lines);
    },

    insertInner(at, lines, height) {
      this.size += lines.length;
      this.height += height;
      for (let i = 0; i < this.children.length; ++i) {
        let child = this.children[i], sz = child.chunkSize();
        if (at <= sz) {
          child.insertInner(at, lines, height);
          if (child.lines && child.lines.length > 50) {
            // To avoid memory thrashing when child.lines is huge (e.g. first view of a large file), it's never spliced.
            // Instead, small slices are taken. They're taken in order because sequential memory accesses are fastest.
            let remaining = child.lines.length % 25 + 25;
            for (let pos = remaining; pos < child.lines.length;) {
              let leaf = new LeafChunk(child.lines.slice(pos, pos += 25));
              child.height -= leaf.height;
              this.children.splice(++i, 0, leaf);
              leaf.parent = this;
            }
            child.lines = child.lines.slice(0, remaining);
            this.maybeSpill();
          }
          break
        }
        at -= sz;
      }
    },

    // When a node has grown, check whether it should be split.
    maybeSpill() {
      if (this.children.length <= 10) return
      let me = this;
      do {
        let spilled = me.children.splice(me.children.length - 5, 5);
        let sibling = new BranchChunk(spilled);
        if (!me.parent) { // Become the parent node
          let copy = new BranchChunk(me.children);
          copy.parent = me;
          me.children = [copy, sibling];
          me = copy;
       } else {
          me.size -= sibling.size;
          me.height -= sibling.height;
          let myIndex = indexOf(me.parent.children, me);
          me.parent.children.splice(myIndex + 1, 0, sibling);
        }
        sibling.parent = me.parent;
      } while (me.children.length > 10)
      me.parent.maybeSpill();
    },

    iterN(at, n, op) {
      for (let i = 0; i < this.children.length; ++i) {
        let child = this.children[i], sz = child.chunkSize();
        if (at < sz) {
          let used = Math.min(n, sz - at);
          if (child.iterN(at, used, op)) return true
          if ((n -= used) == 0) break
          at = 0;
        } else at -= sz;
      }
    }
  };

  // Line widgets are block elements displayed above or below a line.

  class LineWidget {
    constructor(doc, node, options) {
      if (options) for (let opt in options) if (options.hasOwnProperty(opt))
        this[opt] = options[opt];
      this.doc = doc;
      this.node = node;
    }

    clear() {
      let cm = this.doc.cm, ws = this.line.widgets, line = this.line, no = lineNo(line);
      if (no == null || !ws) return
      for (let i = 0; i < ws.length; ++i) if (ws[i] == this) ws.splice(i--, 1);
      if (!ws.length) line.widgets = null;
      let height = widgetHeight(this);
      updateLineHeight(line, Math.max(0, line.height - height));
      if (cm) {
        runInOp(cm, () => {
          adjustScrollWhenAboveVisible(cm, line, -height);
          regLineChange(cm, no, "widget");
        });
        signalLater(cm, "lineWidgetCleared", cm, this, no);
      }
    }

    changed() {
      let oldH = this.height, cm = this.doc.cm, line = this.line;
      this.height = null;
      let diff = widgetHeight(this) - oldH;
      if (!diff) return
      if (!lineIsHidden(this.doc, line)) updateLineHeight(line, line.height + diff);
      if (cm) {
        runInOp(cm, () => {
          cm.curOp.forceUpdate = true;
          adjustScrollWhenAboveVisible(cm, line, diff);
          signalLater(cm, "lineWidgetChanged", cm, this, lineNo(line));
        });
      }
    }
  }
  eventMixin(LineWidget);

  function adjustScrollWhenAboveVisible(cm, line, diff) {
    if (heightAtLine(line) < ((cm.curOp && cm.curOp.scrollTop) || cm.doc.scrollTop))
      addToScrollTop(cm, diff);
  }

  function addLineWidget(doc, handle, node, options) {
    let widget = new LineWidget(doc, node, options);
    let cm = doc.cm;
    if (cm && widget.noHScroll) cm.display.alignWidgets = true;
    changeLine(doc, handle, "widget", line => {
      let widgets = line.widgets || (line.widgets = []);
      if (widget.insertAt == null) widgets.push(widget);
      else widgets.splice(Math.min(widgets.length - 1, Math.max(0, widget.insertAt)), 0, widget);
      widget.line = line;
      if (cm && !lineIsHidden(doc, line)) {
        let aboveVisible = heightAtLine(line) < doc.scrollTop;
        updateLineHeight(line, line.height + widgetHeight(widget));
        if (aboveVisible) addToScrollTop(cm, widget.height);
        cm.curOp.forceUpdate = true;
      }
      return true
    });
    if (cm) signalLater(cm, "lineWidgetAdded", cm, widget, typeof handle == "number" ? handle : lineNo(handle));
    return widget
  }

  // TEXTMARKERS

  // Created with markText and setBookmark methods. A TextMarker is a
  // handle that can be used to clear or find a marked position in the
  // document. Line objects hold arrays (markedSpans) containing
  // {from, to, marker} object pointing to such marker objects, and
  // indicating that such a marker is present on that line. Multiple
  // lines may point to the same marker when it spans across lines.
  // The spans will have null for their from/to properties when the
  // marker continues beyond the start/end of the line. Markers have
  // links back to the lines they currently touch.

  // Collapsed markers have unique ids, in order to be able to order
  // them, which is needed for uniquely determining an outer marker
  // when they overlap (they may nest, but not partially overlap).
  let nextMarkerId = 0;

  class TextMarker {
    constructor(doc, type) {
      this.lines = [];
      this.type = type;
      this.doc = doc;
      this.id = ++nextMarkerId;
    }

    // Clear the marker.
    clear() {
      if (this.explicitlyCleared) return
      let cm = this.doc.cm, withOp = cm && !cm.curOp;
      if (withOp) startOperation(cm);
      if (hasHandler(this, "clear")) {
        let found = this.find();
        if (found) signalLater(this, "clear", found.from, found.to);
      }
      let min = null, max = null;
      for (let i = 0; i < this.lines.length; ++i) {
        let line = this.lines[i];
        let span = getMarkedSpanFor(line.markedSpans, this);
        if (cm && !this.collapsed) regLineChange(cm, lineNo(line), "text");
        else if (cm) {
          if (span.to != null) max = lineNo(line);
          if (span.from != null) min = lineNo(line);
        }
        line.markedSpans = removeMarkedSpan(line.markedSpans, span);
        if (span.from == null && this.collapsed && !lineIsHidden(this.doc, line) && cm)
          updateLineHeight(line, textHeight(cm.display));
      }
      if (cm && this.collapsed && !cm.options.lineWrapping) for (let i = 0; i < this.lines.length; ++i) {
        let visual = visualLine(this.lines[i]), len = lineLength(visual);
        if (len > cm.display.maxLineLength) {
          cm.display.maxLine = visual;
          cm.display.maxLineLength = len;
          cm.display.maxLineChanged = true;
        }
      }

      if (min != null && cm && this.collapsed) regChange(cm, min, max + 1);
      this.lines.length = 0;
      this.explicitlyCleared = true;
      if (this.atomic && this.doc.cantEdit) {
        this.doc.cantEdit = false;
        if (cm) reCheckSelection(cm.doc);
      }
      if (cm) signalLater(cm, "markerCleared", cm, this, min, max);
      if (withOp) endOperation(cm);
      if (this.parent) this.parent.clear();
    }

    // Find the position of the marker in the document. Returns a {from,
    // to} object by default. Side can be passed to get a specific side
    // -- 0 (both), -1 (left), or 1 (right). When lineObj is true, the
    // Pos objects returned contain a line object, rather than a line
    // number (used to prevent looking up the same line twice).
    find(side, lineObj) {
      if (side == null && this.type == "bookmark") side = 1;
      let from, to;
      for (let i = 0; i < this.lines.length; ++i) {
        let line = this.lines[i];
        let span = getMarkedSpanFor(line.markedSpans, this);
        if (span.from != null) {
          from = Pos(lineObj ? line : lineNo(line), span.from);
          if (side == -1) return from
        }
        if (span.to != null) {
          to = Pos(lineObj ? line : lineNo(line), span.to);
          if (side == 1) return to
        }
      }
      return from && {from: from, to: to}
    }

    // Signals that the marker's widget changed, and surrounding layout
    // should be recomputed.
    changed() {
      let pos = this.find(-1, true), widget = this, cm = this.doc.cm;
      if (!pos || !cm) return
      runInOp(cm, () => {
        let line = pos.line, lineN = lineNo(pos.line);
        let view = findViewForLine(cm, lineN);
        if (view) {
          clearLineMeasurementCacheFor(view);
          cm.curOp.selectionChanged = cm.curOp.forceUpdate = true;
        }
        cm.curOp.updateMaxLine = true;
        if (!lineIsHidden(widget.doc, line) && widget.height != null) {
          let oldHeight = widget.height;
          widget.height = null;
          let dHeight = widgetHeight(widget) - oldHeight;
          if (dHeight)
            updateLineHeight(line, line.height + dHeight);
        }
        signalLater(cm, "markerChanged", cm, this);
      });
    }

    attachLine(line) {
      if (!this.lines.length && this.doc.cm) {
        let op = this.doc.cm.curOp;
        if (!op.maybeHiddenMarkers || indexOf(op.maybeHiddenMarkers, this) == -1)
          (op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this);
      }
      this.lines.push(line);
    }

    detachLine(line) {
      this.lines.splice(indexOf(this.lines, line), 1);
      if (!this.lines.length && this.doc.cm) {
        let op = this.doc.cm.curOp
        ;(op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this);
      }
    }
  }
  eventMixin(TextMarker);

  // Create a marker, wire it up to the right lines, and
  function markText(doc, from, to, options, type) {
    // Shared markers (across linked documents) are handled separately
    // (markTextShared will call out to this again, once per
    // document).
    if (options && options.shared) return markTextShared(doc, from, to, options, type)
    // Ensure we are in an operation.
    if (doc.cm && !doc.cm.curOp) return operation(doc.cm, markText)(doc, from, to, options, type)

    let marker = new TextMarker(doc, type), diff = cmp(from, to);
    if (options) copyObj(options, marker, false);
    // Don't connect empty markers unless clearWhenEmpty is false
    if (diff > 0 || diff == 0 && marker.clearWhenEmpty !== false)
      return marker
    if (marker.replacedWith) {
      // Showing up as a widget implies collapsed (widget replaces text)
      marker.collapsed = true;
      marker.widgetNode = eltP("span", [marker.replacedWith], "CodeMirror-widget");
      if (!options.handleMouseEvents) marker.widgetNode.setAttribute("cm-ignore-events", "true");
      if (options.insertLeft) marker.widgetNode.insertLeft = true;
    }
    if (marker.collapsed) {
      if (conflictingCollapsedRange(doc, from.line, from, to, marker) ||
          from.line != to.line && conflictingCollapsedRange(doc, to.line, from, to, marker))
        throw new Error("Inserting collapsed marker partially overlapping an existing one")
      seeCollapsedSpans();
    }

    if (marker.addToHistory)
      addChangeToHistory(doc, {from: from, to: to, origin: "markText"}, doc.sel, NaN);

    let curLine = from.line, cm = doc.cm, updateMaxLine;
    doc.iter(curLine, to.line + 1, line => {
      if (cm && marker.collapsed && !cm.options.lineWrapping && visualLine(line) == cm.display.maxLine)
        updateMaxLine = true;
      if (marker.collapsed && curLine != from.line) updateLineHeight(line, 0);
      addMarkedSpan(line, new MarkedSpan(marker,
                                         curLine == from.line ? from.ch : null,
                                         curLine == to.line ? to.ch : null));
      ++curLine;
    });
    // lineIsHidden depends on the presence of the spans, so needs a second pass
    if (marker.collapsed) doc.iter(from.line, to.line + 1, line => {
      if (lineIsHidden(doc, line)) updateLineHeight(line, 0);
    });

    if (marker.clearOnEnter) on(marker, "beforeCursorEnter", () => marker.clear());

    if (marker.readOnly) {
      seeReadOnlySpans();
      if (doc.history.done.length || doc.history.undone.length)
        doc.clearHistory();
    }
    if (marker.collapsed) {
      marker.id = ++nextMarkerId;
      marker.atomic = true;
    }
    if (cm) {
      // Sync editor state
      if (updateMaxLine) cm.curOp.updateMaxLine = true;
      if (marker.collapsed)
        regChange(cm, from.line, to.line + 1);
      else if (marker.className || marker.startStyle || marker.endStyle || marker.css ||
               marker.attributes || marker.title)
        for (let i = from.line; i <= to.line; i++) regLineChange(cm, i, "text");
      if (marker.atomic) reCheckSelection(cm.doc);
      signalLater(cm, "markerAdded", cm, marker);
    }
    return marker
  }

  // SHARED TEXTMARKERS

  // A shared marker spans multiple linked documents. It is
  // implemented as a meta-marker-object controlling multiple normal
  // markers.
  class SharedTextMarker {
    constructor(markers, primary) {
      this.markers = markers;
      this.primary = primary;
      for (let i = 0; i < markers.length; ++i)
        markers[i].parent = this;
    }

    clear() {
      if (this.explicitlyCleared) return
      this.explicitlyCleared = true;
      for (let i = 0; i < this.markers.length; ++i)
        this.markers[i].clear();
      signalLater(this, "clear");
    }

    find(side, lineObj) {
      return this.primary.find(side, lineObj)
    }
  }
  eventMixin(SharedTextMarker);

  function markTextShared(doc, from, to, options, type) {
    options = copyObj(options);
    options.shared = false;
    let markers = [markText(doc, from, to, options, type)], primary = markers[0];
    let widget = options.widgetNode;
    linkedDocs(doc, doc => {
      if (widget) options.widgetNode = widget.cloneNode(true);
      markers.push(markText(doc, clipPos(doc, from), clipPos(doc, to), options, type));
      for (let i = 0; i < doc.linked.length; ++i)
        if (doc.linked[i].isParent) return
      primary = lst(markers);
    });
    return new SharedTextMarker(markers, primary)
  }

  function findSharedMarkers(doc) {
    return doc.findMarks(Pos(doc.first, 0), doc.clipPos(Pos(doc.lastLine())), m => m.parent)
  }

  function copySharedMarkers(doc, markers) {
    for (let i = 0; i < markers.length; i++) {
      let marker = markers[i], pos = marker.find();
      let mFrom = doc.clipPos(pos.from), mTo = doc.clipPos(pos.to);
      if (cmp(mFrom, mTo)) {
        let subMark = markText(doc, mFrom, mTo, marker.primary, marker.primary.type);
        marker.markers.push(subMark);
        subMark.parent = marker;
      }
    }
  }

  function detachSharedMarkers(markers) {
    for (let i = 0; i < markers.length; i++) {
      let marker = markers[i], linked = [marker.primary.doc];
      linkedDocs(marker.primary.doc, d => linked.push(d));
      for (let j = 0; j < marker.markers.length; j++) {
        let subMarker = marker.markers[j];
        if (indexOf(linked, subMarker.doc) == -1) {
          subMarker.parent = null;
          marker.markers.splice(j--, 1);
        }
      }
    }
  }

  let nextDocId = 0;
  let Doc$1 = function(text, mode, firstLine, lineSep, direction) {
    if (!(this instanceof Doc$1)) return new Doc$1(text, mode, firstLine, lineSep, direction)
    if (firstLine == null) firstLine = 0;

    BranchChunk.call(this, [new LeafChunk([new Line("", null)])]);
    this.first = firstLine;
    this.scrollTop = this.scrollLeft = 0;
    this.cantEdit = false;
    this.cleanGeneration = 1;
    this.modeFrontier = this.highlightFrontier = firstLine;
    let start = Pos(firstLine, 0);
    this.sel = simpleSelection(start);
    this.history = new History(null);
    this.id = ++nextDocId;
    this.modeOption = mode;
    this.lineSep = lineSep;
    this.direction = (direction == "rtl") ? "rtl" : "ltr";
    this.extend = false;

    if (typeof text == "string") text = this.splitLines(text);
    updateDoc(this, {from: start, to: start, text: text});
    setSelection(this, simpleSelection(start), sel_dontScroll);
  };

  Doc$1.prototype = createObj(BranchChunk.prototype, {
    constructor: Doc$1,
    // Iterate over the document. Supports two forms -- with only one
    // argument, it calls that for each line in the document. With
    // three, it iterates over the range given by the first two (with
    // the second being non-inclusive).
    iter: function(from, to, op) {
      if (op) this.iterN(from - this.first, to - from, op);
      else this.iterN(this.first, this.first + this.size, from);
    },

    // Non-public interface for adding and removing lines.
    insert: function(at, lines) {
      let height = 0;
      for (let i = 0; i < lines.length; ++i) height += lines[i].height;
      this.insertInner(at - this.first, lines, height);
    },
    remove: function(at, n) { this.removeInner(at - this.first, n); },

    // From here, the methods are part of the public interface. Most
    // are also available from CodeMirror (editor) instances.

    getValue: function(lineSep) {
      let lines = getLines(this, this.first, this.first + this.size);
      if (lineSep === false) return lines
      return lines.join(lineSep || this.lineSeparator())
    },
    setValue: docMethodOp(function(code) {
      let top = Pos(this.first, 0), last = this.first + this.size - 1;
      makeChange(this, {from: top, to: Pos(last, getLine(this, last).text.length),
                        text: this.splitLines(code), origin: "setValue", full: true}, true);
      if (this.cm) scrollToCoords(this.cm, 0, 0);
      setSelection(this, simpleSelection(top), sel_dontScroll);
    }),
    replaceRange: function(code, from, to, origin) {
      from = clipPos(this, from);
      to = to ? clipPos(this, to) : from;
      replaceRange(this, code, from, to, origin);
    },
    getRange: function(from, to, lineSep) {
      let lines = getBetween(this, clipPos(this, from), clipPos(this, to));
      if (lineSep === false) return lines
      return lines.join(lineSep || this.lineSeparator())
    },

    getLine: function(line) {let l = this.getLineHandle(line); return l && l.text},

    getLineHandle: function(line) {if (isLine(this, line)) return getLine(this, line)},
    getLineNumber: function(line) {return lineNo(line)},

    getLineHandleVisualStart: function(line) {
      if (typeof line == "number") line = getLine(this, line);
      return visualLine(line)
    },

    lineCount: function() {return this.size},
    firstLine: function() {return this.first},
    lastLine: function() {return this.first + this.size - 1},

    clipPos: function(pos) {return clipPos(this, pos)},

    getCursor: function(start) {
      let range$$1 = this.sel.primary(), pos;
      if (start == null || start == "head") pos = range$$1.head;
      else if (start == "anchor") pos = range$$1.anchor;
      else if (start == "end" || start == "to" || start === false) pos = range$$1.to();
      else pos = range$$1.from();
      return pos
    },
    listSelections: function() { return this.sel.ranges },
    somethingSelected: function() {return this.sel.somethingSelected()},

    setCursor: docMethodOp(function(line, ch, options) {
      setSimpleSelection(this, clipPos(this, typeof line == "number" ? Pos(line, ch || 0) : line), null, options);
    }),
    setSelection: docMethodOp(function(anchor, head, options) {
      setSimpleSelection(this, clipPos(this, anchor), clipPos(this, head || anchor), options);
    }),
    extendSelection: docMethodOp(function(head, other, options) {
      extendSelection(this, clipPos(this, head), other && clipPos(this, other), options);
    }),
    extendSelections: docMethodOp(function(heads, options) {
      extendSelections(this, clipPosArray(this, heads), options);
    }),
    extendSelectionsBy: docMethodOp(function(f, options) {
      let heads = map(this.sel.ranges, f);
      extendSelections(this, clipPosArray(this, heads), options);
    }),
    setSelections: docMethodOp(function(ranges, primary, options) {
      if (!ranges.length) return
      let out = [];
      for (let i = 0; i < ranges.length; i++)
        out[i] = new Range(clipPos(this, ranges[i].anchor),
                           clipPos(this, ranges[i].head));
      if (primary == null) primary = Math.min(ranges.length - 1, this.sel.primIndex);
      setSelection(this, normalizeSelection(this.cm, out, primary), options);
    }),
    addSelection: docMethodOp(function(anchor, head, options) {
      let ranges = this.sel.ranges.slice(0);
      ranges.push(new Range(clipPos(this, anchor), clipPos(this, head || anchor)));
      setSelection(this, normalizeSelection(this.cm, ranges, ranges.length - 1), options);
    }),

    getSelection: function(lineSep) {
      let ranges = this.sel.ranges, lines;
      for (let i = 0; i < ranges.length; i++) {
        let sel = getBetween(this, ranges[i].from(), ranges[i].to());
        lines = lines ? lines.concat(sel) : sel;
      }
      if (lineSep === false) return lines
      else return lines.join(lineSep || this.lineSeparator())
    },
    getSelections: function(lineSep) {
      let parts = [], ranges = this.sel.ranges;
      for (let i = 0; i < ranges.length; i++) {
        let sel = getBetween(this, ranges[i].from(), ranges[i].to());
        if (lineSep !== false) sel = sel.join(lineSep || this.lineSeparator());
        parts[i] = sel;
      }
      return parts
    },
    replaceSelection: function(code, collapse, origin) {
      let dup = [];
      for (let i = 0; i < this.sel.ranges.length; i++)
        dup[i] = code;
      this.replaceSelections(dup, collapse, origin || "+input");
    },
    replaceSelections: docMethodOp(function(code, collapse, origin) {
      let changes = [], sel = this.sel;
      for (let i = 0; i < sel.ranges.length; i++) {
        let range$$1 = sel.ranges[i];
        changes[i] = {from: range$$1.from(), to: range$$1.to(), text: this.splitLines(code[i]), origin: origin};
      }
      let newSel = collapse && collapse != "end" && computeReplacedSel(this, changes, collapse);
      for (let i = changes.length - 1; i >= 0; i--)
        makeChange(this, changes[i]);
      if (newSel) setSelectionReplaceHistory(this, newSel);
      else if (this.cm) ensureCursorVisible(this.cm);
    }),
    undo: docMethodOp(function() {makeChangeFromHistory(this, "undo");}),
    redo: docMethodOp(function() {makeChangeFromHistory(this, "redo");}),
    undoSelection: docMethodOp(function() {makeChangeFromHistory(this, "undo", true);}),
    redoSelection: docMethodOp(function() {makeChangeFromHistory(this, "redo", true);}),

    setExtending: function(val) {this.extend = val;},
    getExtending: function() {return this.extend},

    historySize: function() {
      let hist = this.history, done = 0, undone = 0;
      for (let i = 0; i < hist.done.length; i++) if (!hist.done[i].ranges) ++done;
      for (let i = 0; i < hist.undone.length; i++) if (!hist.undone[i].ranges) ++undone;
      return {undo: done, redo: undone}
    },
    clearHistory: function() {this.history = new History(this.history.maxGeneration);},

    markClean: function() {
      this.cleanGeneration = this.changeGeneration(true);
    },
    changeGeneration: function(forceSplit) {
      if (forceSplit)
        this.history.lastOp = this.history.lastSelOp = this.history.lastOrigin = null;
      return this.history.generation
    },
    isClean: function (gen) {
      return this.history.generation == (gen || this.cleanGeneration)
    },

    getHistory: function() {
      return {done: copyHistoryArray(this.history.done),
              undone: copyHistoryArray(this.history.undone)}
    },
    setHistory: function(histData) {
      let hist = this.history = new History(this.history.maxGeneration);
      hist.done = copyHistoryArray(histData.done.slice(0), null, true);
      hist.undone = copyHistoryArray(histData.undone.slice(0), null, true);
    },

    setGutterMarker: docMethodOp(function(line, gutterID, value) {
      return changeLine(this, line, "gutter", line => {
        let markers = line.gutterMarkers || (line.gutterMarkers = {});
        markers[gutterID] = value;
        if (!value && isEmpty(markers)) line.gutterMarkers = null;
        return true
      })
    }),

    clearGutter: docMethodOp(function(gutterID) {
      this.iter(line => {
        if (line.gutterMarkers && line.gutterMarkers[gutterID]) {
          changeLine(this, line, "gutter", () => {
            line.gutterMarkers[gutterID] = null;
            if (isEmpty(line.gutterMarkers)) line.gutterMarkers = null;
            return true
          });
        }
      });
    }),

    lineInfo: function(line) {
      let n;
      if (typeof line == "number") {
        if (!isLine(this, line)) return null
        n = line;
        line = getLine(this, line);
        if (!line) return null
      } else {
        n = lineNo(line);
        if (n == null) return null
      }
      return {line: n, handle: line, text: line.text, gutterMarkers: line.gutterMarkers,
              textClass: line.textClass, bgClass: line.bgClass, wrapClass: line.wrapClass,
              widgets: line.widgets}
    },

    addLineClass: docMethodOp(function(handle, where, cls) {
      return changeLine(this, handle, where == "gutter" ? "gutter" : "class", line => {
        let prop = where == "text" ? "textClass"
                 : where == "background" ? "bgClass"
                 : where == "gutter" ? "gutterClass" : "wrapClass";
        if (!line[prop]) line[prop] = cls;
        else if (classTest(cls).test(line[prop])) return false
        else line[prop] += " " + cls;
        return true
      })
    }),
    removeLineClass: docMethodOp(function(handle, where, cls) {
      return changeLine(this, handle, where == "gutter" ? "gutter" : "class", line => {
        let prop = where == "text" ? "textClass"
                 : where == "background" ? "bgClass"
                 : where == "gutter" ? "gutterClass" : "wrapClass";
        let cur = line[prop];
        if (!cur) return false
        else if (cls == null) line[prop] = null;
        else {
          let found = cur.match(classTest(cls));
          if (!found) return false
          let end = found.index + found[0].length;
          line[prop] = cur.slice(0, found.index) + (!found.index || end == cur.length ? "" : " ") + cur.slice(end) || null;
        }
        return true
      })
    }),

    addLineWidget: docMethodOp(function(handle, node, options) {
      return addLineWidget(this, handle, node, options)
    }),
    removeLineWidget: function(widget) { widget.clear(); },

    markText: function(from, to, options) {
      return markText(this, clipPos(this, from), clipPos(this, to), options, options && options.type || "range")
    },
    setBookmark: function(pos, options) {
      let realOpts = {replacedWith: options && (options.nodeType == null ? options.widget : options),
                      insertLeft: options && options.insertLeft,
                      clearWhenEmpty: false, shared: options && options.shared,
                      handleMouseEvents: options && options.handleMouseEvents};
      pos = clipPos(this, pos);
      return markText(this, pos, pos, realOpts, "bookmark")
    },
    findMarksAt: function(pos) {
      pos = clipPos(this, pos);
      let markers = [], spans = getLine(this, pos.line).markedSpans;
      if (spans) for (let i = 0; i < spans.length; ++i) {
        let span = spans[i];
        if ((span.from == null || span.from <= pos.ch) &&
            (span.to == null || span.to >= pos.ch))
          markers.push(span.marker.parent || span.marker);
      }
      return markers
    },
    findMarks: function(from, to, filter) {
      from = clipPos(this, from); to = clipPos(this, to);
      let found = [], lineNo$$1 = from.line;
      this.iter(from.line, to.line + 1, line => {
        let spans = line.markedSpans;
        if (spans) for (let i = 0; i < spans.length; i++) {
          let span = spans[i];
          if (!(span.to != null && lineNo$$1 == from.line && from.ch >= span.to ||
                span.from == null && lineNo$$1 != from.line ||
                span.from != null && lineNo$$1 == to.line && span.from >= to.ch) &&
              (!filter || filter(span.marker)))
            found.push(span.marker.parent || span.marker);
        }
        ++lineNo$$1;
      });
      return found
    },
    getAllMarks: function() {
      let markers = [];
      this.iter(line => {
        let sps = line.markedSpans;
        if (sps) for (let i = 0; i < sps.length; ++i)
          if (sps[i].from != null) markers.push(sps[i].marker);
      });
      return markers
    },

    posFromIndex: function(off) {
      let ch, lineNo$$1 = this.first, sepSize = this.lineSeparator().length;
      this.iter(line => {
        let sz = line.text.length + sepSize;
        if (sz > off) { ch = off; return true }
        off -= sz;
        ++lineNo$$1;
      });
      return clipPos(this, Pos(lineNo$$1, ch))
    },
    indexFromPos: function (coords) {
      coords = clipPos(this, coords);
      let index = coords.ch;
      if (coords.line < this.first || coords.ch < 0) return 0
      let sepSize = this.lineSeparator().length;
      this.iter(this.first, coords.line, line => { // iter aborts when callback returns a truthy value
        index += line.text.length + sepSize;
      });
      return index
    },

    copy: function(copyHistory) {
      let doc = new Doc$1(getLines(this, this.first, this.first + this.size),
                        this.modeOption, this.first, this.lineSep, this.direction);
      doc.scrollTop = this.scrollTop; doc.scrollLeft = this.scrollLeft;
      doc.sel = this.sel;
      doc.extend = false;
      if (copyHistory) {
        doc.history.undoDepth = this.history.undoDepth;
        doc.setHistory(this.getHistory());
      }
      return doc
    },

    linkedDoc: function(options) {
      if (!options) options = {};
      let from = this.first, to = this.first + this.size;
      if (options.from != null && options.from > from) from = options.from;
      if (options.to != null && options.to < to) to = options.to;
      let copy = new Doc$1(getLines(this, from, to), options.mode || this.modeOption, from, this.lineSep, this.direction);
      if (options.sharedHist) copy.history = this.history
      ;(this.linked || (this.linked = [])).push({doc: copy, sharedHist: options.sharedHist});
      copy.linked = [{doc: this, isParent: true, sharedHist: options.sharedHist}];
      copySharedMarkers(copy, findSharedMarkers(this));
      return copy
    },
    unlinkDoc: function(other) {
      if (other instanceof CodeMirror) other = other.doc;
      if (this.linked) for (let i = 0; i < this.linked.length; ++i) {
        let link = this.linked[i];
        if (link.doc != other) continue
        this.linked.splice(i, 1);
        other.unlinkDoc(this);
        detachSharedMarkers(findSharedMarkers(this));
        break
      }
      // If the histories were shared, split them again
      if (other.history == this.history) {
        let splitIds = [other.id];
        linkedDocs(other, doc => splitIds.push(doc.id), true);
        other.history = new History(null);
        other.history.done = copyHistoryArray(this.history.done, splitIds);
        other.history.undone = copyHistoryArray(this.history.undone, splitIds);
      }
    },
    iterLinkedDocs: function(f) {linkedDocs(this, f);},

    getMode: function() {return this.mode},
    getEditor: function() {return this.cm},

    splitLines: function(str) {
      if (this.lineSep) return str.split(this.lineSep)
      return splitLinesAuto(str)
    },
    lineSeparator: function() { return this.lineSep || "\n" },

    setDirection: docMethodOp(function (dir) {
      if (dir != "rtl") dir = "ltr";
      if (dir == this.direction) return
      this.direction = dir;
      this.iter(line => line.order = null);
      if (this.cm) directionChanged(this.cm);
    })
  });

  // Public alias.
  Doc$1.prototype.eachLine = Doc$1.prototype.iter;

  // Kludge to work around strange IE behavior where it'll sometimes
  // re-fire a series of drag-related events right after the drop (#1551)
  let lastDrop = 0;

  function onDrop(e) {
    let cm = this;
    clearDragCursor(cm);
    if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e))
      return
    e_preventDefault(e);
    if (ie) lastDrop = +new Date;
    let pos = posFromMouse(cm, e, true), files = e.dataTransfer.files;
    if (!pos || cm.isReadOnly()) return
    // Might be a file drop, in which case we simply extract the text
    // and insert it.
    if (files && files.length && window.FileReader && window.File) {
      let n = files.length, text = Array(n), read = 0;
      let loadFile = (file, i) => {
        if (cm.options.allowDropFileTypes &&
            indexOf(cm.options.allowDropFileTypes, file.type) == -1)
          return

        let reader = new FileReader;
        reader.onload = operation(cm, () => {
          let content = reader.result;
          if (/[\x00-\x08\x0e-\x1f]{2}/.test(content)) content = "";
          text[i] = content;
          if (++read == n) {
            pos = clipPos(cm.doc, pos);
            let change = {from: pos, to: pos,
                          text: cm.doc.splitLines(text.join(cm.doc.lineSeparator())),
                          origin: "paste"};
            makeChange(cm.doc, change);
            setSelectionReplaceHistory(cm.doc, simpleSelection(pos, changeEnd(change)));
          }
        });
        reader.readAsText(file);
      };
      for (let i = 0; i < n; ++i) loadFile(files[i], i);
    } else { // Normal drop
      // Don't do a replace if the drop happened inside of the selected text.
      if (cm.state.draggingText && cm.doc.sel.contains(pos) > -1) {
        cm.state.draggingText(e);
        // Ensure the editor is re-focused
        setTimeout(() => cm.display.input.focus(), 20);
        return
      }
      try {
        let text = e.dataTransfer.getData("Text");
        if (text) {
          let selected;
          if (cm.state.draggingText && !cm.state.draggingText.copy)
            selected = cm.listSelections();
          setSelectionNoUndo(cm.doc, simpleSelection(pos, pos));
          if (selected) for (let i = 0; i < selected.length; ++i)
            replaceRange(cm.doc, "", selected[i].anchor, selected[i].head, "drag");
          cm.replaceSelection(text, "around", "paste");
          cm.display.input.focus();
        }
      }
      catch(e){}
    }
  }

  function onDragStart(cm, e) {
    if (ie && (!cm.state.draggingText || +new Date - lastDrop < 100)) { e_stop(e); return }
    if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e)) return

    e.dataTransfer.setData("Text", cm.getSelection());
    e.dataTransfer.effectAllowed = "copyMove";

    // Use dummy image instead of default browsers image.
    // Recent Safari (~6.0.2) have a tendency to segfault when this happens, so we don't do it there.
    if (e.dataTransfer.setDragImage && !safari) {
      let img = elt("img", null, null, "position: fixed; left: 0; top: 0;");
      img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
      if (presto) {
        img.width = img.height = 1;
        cm.display.wrapper.appendChild(img);
        // Force a relayout, or Opera won't use our image for some obscure reason
        img._top = img.offsetTop;
      }
      e.dataTransfer.setDragImage(img, 0, 0);
      if (presto) img.parentNode.removeChild(img);
    }
  }

  function onDragOver(cm, e) {
    let pos = posFromMouse(cm, e);
    if (!pos) return
    let frag = document.createDocumentFragment();
    drawSelectionCursor(cm, pos, frag);
    if (!cm.display.dragCursor) {
      cm.display.dragCursor = elt("div", null, "CodeMirror-cursors CodeMirror-dragcursors");
      cm.display.lineSpace.insertBefore(cm.display.dragCursor, cm.display.cursorDiv);
    }
    removeChildrenAndAdd(cm.display.dragCursor, frag);
  }

  function clearDragCursor(cm) {
    if (cm.display.dragCursor) {
      cm.display.lineSpace.removeChild(cm.display.dragCursor);
      cm.display.dragCursor = null;
    }
  }

  // These must be handled carefully, because naively registering a
  // handler for each editor will cause the editors to never be
  // garbage collected.

  function forEachCodeMirror(f) {
    if (!document.getElementsByClassName) return
    let byClass = document.getElementsByClassName("CodeMirror"), editors = [];
    for (let i = 0; i < byClass.length; i++) {
      let cm = byClass[i].CodeMirror;
      if (cm) editors.push(cm);
    }
    if (editors.length) editors[0].operation(() => {
      for (let i = 0; i < editors.length; i++) f(editors[i]);
    });
  }

  let globalsRegistered = false;
  function ensureGlobalHandlers() {
    if (globalsRegistered) return
    registerGlobalHandlers();
    globalsRegistered = true;
  }
  function registerGlobalHandlers() {
    // When the window resizes, we need to refresh active editors.
    let resizeTimer;
    on(window, "resize", () => {
      if (resizeTimer == null) resizeTimer = setTimeout(() => {
        resizeTimer = null;
        forEachCodeMirror(onResize);
      }, 100);
    });
    // When the window loses focus, we want to show the editor as blurred
    on(window, "blur", () => forEachCodeMirror(onBlur));
  }
  // Called when the window resizes
  function onResize(cm) {
    let d = cm.display;
    // Might be a text scaling operation, clear size caches.
    d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;
    d.scrollbarsClipped = false;
    cm.setSize();
  }

  let keyNames = {
    3: "Pause", 8: "Backspace", 9: "Tab", 13: "Enter", 16: "Shift", 17: "Ctrl", 18: "Alt",
    19: "Pause", 20: "CapsLock", 27: "Esc", 32: "Space", 33: "PageUp", 34: "PageDown", 35: "End",
    36: "Home", 37: "Left", 38: "Up", 39: "Right", 40: "Down", 44: "PrintScrn", 45: "Insert",
    46: "Delete", 59: ";", 61: "=", 91: "Mod", 92: "Mod", 93: "Mod",
    106: "*", 107: "=", 109: "-", 110: ".", 111: "/", 145: "ScrollLock",
    173: "-", 186: ";", 187: "=", 188: ",", 189: "-", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\",
    221: "]", 222: "'", 63232: "Up", 63233: "Down", 63234: "Left", 63235: "Right", 63272: "Delete",
    63273: "Home", 63275: "End", 63276: "PageUp", 63277: "PageDown", 63302: "Insert"
  };

  // Number keys
  for (let i = 0; i < 10; i++) keyNames[i + 48] = keyNames[i + 96] = String(i);
  // Alphabetic keys
  for (let i = 65; i <= 90; i++) keyNames[i] = String.fromCharCode(i);
  // Function keys
  for (let i = 1; i <= 12; i++) keyNames[i + 111] = keyNames[i + 63235] = "F" + i;

  let keyMap = {};

  keyMap.basic = {
    "Left": "goCharLeft", "Right": "goCharRight", "Up": "goLineUp", "Down": "goLineDown",
    "End": "goLineEnd", "Home": "goLineStartSmart", "PageUp": "goPageUp", "PageDown": "goPageDown",
    "Delete": "delCharAfter", "Backspace": "delCharBefore", "Shift-Backspace": "delCharBefore",
    "Tab": "defaultTab", "Shift-Tab": "indentAuto",
    "Enter": "newlineAndIndent", "Insert": "toggleOverwrite",
    "Esc": "singleSelection"
  };
  // Note that the save and find-related commands aren't defined by
  // default. User code or addons can define them. Unknown commands
  // are simply ignored.
  keyMap.pcDefault = {
    "Ctrl-A": "selectAll", "Ctrl-D": "deleteLine", "Ctrl-Z": "undo", "Shift-Ctrl-Z": "redo", "Ctrl-Y": "redo",
    "Ctrl-Home": "goDocStart", "Ctrl-End": "goDocEnd", "Ctrl-Up": "goLineUp", "Ctrl-Down": "goLineDown",
    "Ctrl-Left": "goGroupLeft", "Ctrl-Right": "goGroupRight", "Alt-Left": "goLineStart", "Alt-Right": "goLineEnd",
    "Ctrl-Backspace": "delGroupBefore", "Ctrl-Delete": "delGroupAfter", "Ctrl-S": "save", "Ctrl-F": "find",
    "Ctrl-G": "findNext", "Shift-Ctrl-G": "findPrev", "Shift-Ctrl-F": "replace", "Shift-Ctrl-R": "replaceAll",
    "Ctrl-[": "indentLess", "Ctrl-]": "indentMore",
    "Ctrl-U": "undoSelection", "Shift-Ctrl-U": "redoSelection", "Alt-U": "redoSelection",
    "fallthrough": "basic"
  };
  // Very basic readline/emacs-style bindings, which are standard on Mac.
  keyMap.emacsy = {
    "Ctrl-F": "goCharRight", "Ctrl-B": "goCharLeft", "Ctrl-P": "goLineUp", "Ctrl-N": "goLineDown",
    "Alt-F": "goWordRight", "Alt-B": "goWordLeft", "Ctrl-A": "goLineStart", "Ctrl-E": "goLineEnd",
    "Ctrl-V": "goPageDown", "Shift-Ctrl-V": "goPageUp", "Ctrl-D": "delCharAfter", "Ctrl-H": "delCharBefore",
    "Alt-D": "delWordAfter", "Alt-Backspace": "delWordBefore", "Ctrl-K": "killLine", "Ctrl-T": "transposeChars",
    "Ctrl-O": "openLine"
  };
  keyMap.macDefault = {
    "Cmd-A": "selectAll", "Cmd-D": "deleteLine", "Cmd-Z": "undo", "Shift-Cmd-Z": "redo", "Cmd-Y": "redo",
    "Cmd-Home": "goDocStart", "Cmd-Up": "goDocStart", "Cmd-End": "goDocEnd", "Cmd-Down": "goDocEnd", "Alt-Left": "goGroupLeft",
    "Alt-Right": "goGroupRight", "Cmd-Left": "goLineLeft", "Cmd-Right": "goLineRight", "Alt-Backspace": "delGroupBefore",
    "Ctrl-Alt-Backspace": "delGroupAfter", "Alt-Delete": "delGroupAfter", "Cmd-S": "save", "Cmd-F": "find",
    "Cmd-G": "findNext", "Shift-Cmd-G": "findPrev", "Cmd-Alt-F": "replace", "Shift-Cmd-Alt-F": "replaceAll",
    "Cmd-[": "indentLess", "Cmd-]": "indentMore", "Cmd-Backspace": "delWrappedLineLeft", "Cmd-Delete": "delWrappedLineRight",
    "Cmd-U": "undoSelection", "Shift-Cmd-U": "redoSelection", "Ctrl-Up": "goDocStart", "Ctrl-Down": "goDocEnd",
    "fallthrough": ["basic", "emacsy"]
  };
  keyMap["default"] = mac ? keyMap.macDefault : keyMap.pcDefault;

  // KEYMAP DISPATCH

  function normalizeKeyName(name) {
    let parts = name.split(/-(?!$)/);
    name = parts[parts.length - 1];
    let alt, ctrl, shift, cmd;
    for (let i = 0; i < parts.length - 1; i++) {
      let mod = parts[i];
      if (/^(cmd|meta|m)$/i.test(mod)) cmd = true;
      else if (/^a(lt)?$/i.test(mod)) alt = true;
      else if (/^(c|ctrl|control)$/i.test(mod)) ctrl = true;
      else if (/^s(hift)?$/i.test(mod)) shift = true;
      else throw new Error("Unrecognized modifier name: " + mod)
    }
    if (alt) name = "Alt-" + name;
    if (ctrl) name = "Ctrl-" + name;
    if (cmd) name = "Cmd-" + name;
    if (shift) name = "Shift-" + name;
    return name
  }

  // This is a kludge to keep keymaps mostly working as raw objects
  // (backwards compatibility) while at the same time support features
  // like normalization and multi-stroke key bindings. It compiles a
  // new normalized keymap, and then updates the old object to reflect
  // this.
  function normalizeKeyMap(keymap) {
    let copy = {};
    for (let keyname in keymap) if (keymap.hasOwnProperty(keyname)) {
      let value = keymap[keyname];
      if (/^(name|fallthrough|(de|at)tach)$/.test(keyname)) continue
      if (value == "...") { delete keymap[keyname]; continue }

      let keys = map(keyname.split(" "), normalizeKeyName);
      for (let i = 0; i < keys.length; i++) {
        let val, name;
        if (i == keys.length - 1) {
          name = keys.join(" ");
          val = value;
        } else {
          name = keys.slice(0, i + 1).join(" ");
          val = "...";
        }
        let prev = copy[name];
        if (!prev) copy[name] = val;
        else if (prev != val) throw new Error("Inconsistent bindings for " + name)
      }
      delete keymap[keyname];
    }
    for (let prop in copy) keymap[prop] = copy[prop];
    return keymap
  }

  function lookupKey(key, map$$1, handle, context) {
    map$$1 = getKeyMap(map$$1);
    let found = map$$1.call ? map$$1.call(key, context) : map$$1[key];
    if (found === false) return "nothing"
    if (found === "...") return "multi"
    if (found != null && handle(found)) return "handled"

    if (map$$1.fallthrough) {
      if (Object.prototype.toString.call(map$$1.fallthrough) != "[object Array]")
        return lookupKey(key, map$$1.fallthrough, handle, context)
      for (let i = 0; i < map$$1.fallthrough.length; i++) {
        let result = lookupKey(key, map$$1.fallthrough[i], handle, context);
        if (result) return result
      }
    }
  }

  // Modifier key presses don't count as 'real' key presses for the
  // purpose of keymap fallthrough.
  function isModifierKey(value) {
    let name = typeof value == "string" ? value : keyNames[value.keyCode];
    return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod"
  }

  function addModifierNames(name, event, noShift) {
    let base = name;
    if (event.altKey && base != "Alt") name = "Alt-" + name;
    if ((flipCtrlCmd ? event.metaKey : event.ctrlKey) && base != "Ctrl") name = "Ctrl-" + name;
    if ((flipCtrlCmd ? event.ctrlKey : event.metaKey) && base != "Cmd") name = "Cmd-" + name;
    if (!noShift && event.shiftKey && base != "Shift") name = "Shift-" + name;
    return name
  }

  // Look up the name of a key as indicated by an event object.
  function keyName(event, noShift) {
    if (presto && event.keyCode == 34 && event["char"]) return false
    let name = keyNames[event.keyCode];
    if (name == null || event.altGraphKey) return false
    // Ctrl-ScrollLock has keyCode 3, same as Ctrl-Pause,
    // so we'll use event.code when available (Chrome 48+, FF 38+, Safari 10.1+)
    if (event.keyCode == 3 && event.code) name = event.code;
    return addModifierNames(name, event, noShift)
  }

  function getKeyMap(val) {
    return typeof val == "string" ? keyMap[val] : val
  }

  // Helper for deleting text near the selection(s), used to implement
  // backspace, delete, and similar functionality.
  function deleteNearSelection(cm, compute) {
    let ranges = cm.doc.sel.ranges, kill = [];
    // Build up a set of ranges to kill first, merging overlapping
    // ranges.
    for (let i = 0; i < ranges.length; i++) {
      let toKill = compute(ranges[i]);
      while (kill.length && cmp(toKill.from, lst(kill).to) <= 0) {
        let replaced = kill.pop();
        if (cmp(replaced.from, toKill.from) < 0) {
          toKill.from = replaced.from;
          break
        }
      }
      kill.push(toKill);
    }
    // Next, remove those actual ranges.
    runInOp(cm, () => {
      for (let i = kill.length - 1; i >= 0; i--)
        replaceRange(cm.doc, "", kill[i].from, kill[i].to, "+delete");
      ensureCursorVisible(cm);
    });
  }

  function moveCharLogically(line, ch, dir) {
    let target = skipExtendingChars(line.text, ch + dir, dir);
    return target < 0 || target > line.text.length ? null : target
  }

  function moveLogically(line, start, dir) {
    let ch = moveCharLogically(line, start.ch, dir);
    return ch == null ? null : new Pos(start.line, ch, dir < 0 ? "after" : "before")
  }

  function endOfLine(visually, cm, lineObj, lineNo, dir) {
    if (visually) {
      let order = getOrder(lineObj, cm.doc.direction);
      if (order) {
        let part = dir < 0 ? lst(order) : order[0];
        let moveInStorageOrder = (dir < 0) == (part.level == 1);
        let sticky = moveInStorageOrder ? "after" : "before";
        let ch;
        // With a wrapped rtl chunk (possibly spanning multiple bidi parts),
        // it could be that the last bidi part is not on the last visual line,
        // since visual lines contain content order-consecutive chunks.
        // Thus, in rtl, we are looking for the first (content-order) character
        // in the rtl chunk that is on the last line (that is, the same line
        // as the last (content-order) character).
        if (part.level > 0 || cm.doc.direction == "rtl") {
          let prep = prepareMeasureForLine(cm, lineObj);
          ch = dir < 0 ? lineObj.text.length - 1 : 0;
          let targetTop = measureCharPrepared(cm, prep, ch).top;
          ch = findFirst(ch => measureCharPrepared(cm, prep, ch).top == targetTop, (dir < 0) == (part.level == 1) ? part.from : part.to - 1, ch);
          if (sticky == "before") ch = moveCharLogically(lineObj, ch, 1);
        } else ch = dir < 0 ? part.to : part.from;
        return new Pos(lineNo, ch, sticky)
      }
    }
    return new Pos(lineNo, dir < 0 ? lineObj.text.length : 0, dir < 0 ? "before" : "after")
  }

  function moveVisually(cm, line, start, dir) {
    let bidi = getOrder(line, cm.doc.direction);
    if (!bidi) return moveLogically(line, start, dir)
    if (start.ch >= line.text.length) {
      start.ch = line.text.length;
      start.sticky = "before";
    } else if (start.ch <= 0) {
      start.ch = 0;
      start.sticky = "after";
    }
    let partPos = getBidiPartAt(bidi, start.ch, start.sticky), part = bidi[partPos];
    if (cm.doc.direction == "ltr" && part.level % 2 == 0 && (dir > 0 ? part.to > start.ch : part.from < start.ch)) {
      // Case 1: We move within an ltr part in an ltr editor. Even with wrapped lines,
      // nothing interesting happens.
      return moveLogically(line, start, dir)
    }

    let mv = (pos, dir) => moveCharLogically(line, pos instanceof Pos ? pos.ch : pos, dir);
    let prep;
    let getWrappedLineExtent = ch => {
      if (!cm.options.lineWrapping) return {begin: 0, end: line.text.length}
      prep = prep || prepareMeasureForLine(cm, line);
      return wrappedLineExtentChar(cm, line, prep, ch)
    };
    let wrappedLineExtent = getWrappedLineExtent(start.sticky == "before" ? mv(start, -1) : start.ch);

    if (cm.doc.direction == "rtl" || part.level == 1) {
      let moveInStorageOrder = (part.level == 1) == (dir < 0);
      let ch = mv(start, moveInStorageOrder ? 1 : -1);
      if (ch != null && (!moveInStorageOrder ? ch >= part.from && ch >= wrappedLineExtent.begin : ch <= part.to && ch <= wrappedLineExtent.end)) {
        // Case 2: We move within an rtl part or in an rtl editor on the same visual line
        let sticky = moveInStorageOrder ? "before" : "after";
        return new Pos(start.line, ch, sticky)
      }
    }

    // Case 3: Could not move within this bidi part in this visual line, so leave
    // the current bidi part

    let searchInVisualLine = (partPos, dir, wrappedLineExtent) => {
      let getRes = (ch, moveInStorageOrder) => moveInStorageOrder
        ? new Pos(start.line, mv(ch, 1), "before")
        : new Pos(start.line, ch, "after");

      for (; partPos >= 0 && partPos < bidi.length; partPos += dir) {
        let part = bidi[partPos];
        let moveInStorageOrder = (dir > 0) == (part.level != 1);
        let ch = moveInStorageOrder ? wrappedLineExtent.begin : mv(wrappedLineExtent.end, -1);
        if (part.from <= ch && ch < part.to) return getRes(ch, moveInStorageOrder)
        ch = moveInStorageOrder ? part.from : mv(part.to, -1);
        if (wrappedLineExtent.begin <= ch && ch < wrappedLineExtent.end) return getRes(ch, moveInStorageOrder)
      }
    };

    // Case 3a: Look for other bidi parts on the same visual line
    let res = searchInVisualLine(partPos + dir, dir, wrappedLineExtent);
    if (res) return res

    // Case 3b: Look for other bidi parts on the next visual line
    let nextCh = dir > 0 ? wrappedLineExtent.end : mv(wrappedLineExtent.begin, -1);
    if (nextCh != null && !(dir > 0 && nextCh == line.text.length)) {
      res = searchInVisualLine(dir > 0 ? 0 : bidi.length - 1, dir, getWrappedLineExtent(nextCh));
      if (res) return res
    }

    // Case 4: Nowhere to move
    return null
  }

  // Commands are parameter-less actions that can be performed on an
  // editor, mostly used for keybindings.
  let commands$2 = {
    selectAll: selectAll,
    singleSelection: cm => cm.setSelection(cm.getCursor("anchor"), cm.getCursor("head"), sel_dontScroll),
    killLine: cm => deleteNearSelection(cm, range => {
      if (range.empty()) {
        let len = getLine(cm.doc, range.head.line).text.length;
        if (range.head.ch == len && range.head.line < cm.lastLine())
          return {from: range.head, to: Pos(range.head.line + 1, 0)}
        else
          return {from: range.head, to: Pos(range.head.line, len)}
      } else {
        return {from: range.from(), to: range.to()}
      }
    }),
    deleteLine: cm => deleteNearSelection(cm, range => ({
      from: Pos(range.from().line, 0),
      to: clipPos(cm.doc, Pos(range.to().line + 1, 0))
    })),
    delLineLeft: cm => deleteNearSelection(cm, range => ({
      from: Pos(range.from().line, 0), to: range.from()
    })),
    delWrappedLineLeft: cm => deleteNearSelection(cm, range => {
      let top = cm.charCoords(range.head, "div").top + 5;
      let leftPos = cm.coordsChar({left: 0, top: top}, "div");
      return {from: leftPos, to: range.from()}
    }),
    delWrappedLineRight: cm => deleteNearSelection(cm, range => {
      let top = cm.charCoords(range.head, "div").top + 5;
      let rightPos = cm.coordsChar({left: cm.display.lineDiv.offsetWidth + 100, top: top}, "div");
      return {from: range.from(), to: rightPos }
    }),
    undo: cm => cm.undo(),
    redo: cm => cm.redo(),
    undoSelection: cm => cm.undoSelection(),
    redoSelection: cm => cm.redoSelection(),
    goDocStart: cm => cm.extendSelection(Pos(cm.firstLine(), 0)),
    goDocEnd: cm => cm.extendSelection(Pos(cm.lastLine())),
    goLineStart: cm => cm.extendSelectionsBy(range => lineStart(cm, range.head.line),
      {origin: "+move", bias: 1}
    ),
    goLineStartSmart: cm => cm.extendSelectionsBy(range => lineStartSmart(cm, range.head),
      {origin: "+move", bias: 1}
    ),
    goLineEnd: cm => cm.extendSelectionsBy(range => lineEnd(cm, range.head.line),
      {origin: "+move", bias: -1}
    ),
    goLineRight: cm => cm.extendSelectionsBy(range => {
      let top = cm.cursorCoords(range.head, "div").top + 5;
      return cm.coordsChar({left: cm.display.lineDiv.offsetWidth + 100, top: top}, "div")
    }, sel_move),
    goLineLeft: cm => cm.extendSelectionsBy(range => {
      let top = cm.cursorCoords(range.head, "div").top + 5;
      return cm.coordsChar({left: 0, top: top}, "div")
    }, sel_move),
    goLineLeftSmart: cm => cm.extendSelectionsBy(range => {
      let top = cm.cursorCoords(range.head, "div").top + 5;
      let pos = cm.coordsChar({left: 0, top: top}, "div");
      if (pos.ch < cm.getLine(pos.line).search(/\S/)) return lineStartSmart(cm, range.head)
      return pos
    }, sel_move),
    goLineUp: cm => cm.moveV(-1, "line"),
    goLineDown: cm => cm.moveV(1, "line"),
    goPageUp: cm => cm.moveV(-1, "page"),
    goPageDown: cm => cm.moveV(1, "page"),
    goCharLeft: cm => cm.moveH(-1, "char"),
    goCharRight: cm => cm.moveH(1, "char"),
    goColumnLeft: cm => cm.moveH(-1, "column"),
    goColumnRight: cm => cm.moveH(1, "column"),
    goWordLeft: cm => cm.moveH(-1, "word"),
    goGroupRight: cm => cm.moveH(1, "group"),
    goGroupLeft: cm => cm.moveH(-1, "group"),
    goWordRight: cm => cm.moveH(1, "word"),
    delCharBefore: cm => cm.deleteH(-1, "char"),
    delCharAfter: cm => cm.deleteH(1, "char"),
    delWordBefore: cm => cm.deleteH(-1, "word"),
    delWordAfter: cm => cm.deleteH(1, "word"),
    delGroupBefore: cm => cm.deleteH(-1, "group"),
    delGroupAfter: cm => cm.deleteH(1, "group"),
    indentAuto: cm => cm.indentSelection("smart"),
    indentMore: cm => cm.indentSelection("add"),
    indentLess: cm => cm.indentSelection("subtract"),
    insertTab: cm => cm.replaceSelection("\t"),
    insertSoftTab: cm => {
      let spaces = [], ranges = cm.listSelections(), tabSize = cm.options.tabSize;
      for (let i = 0; i < ranges.length; i++) {
        let pos = ranges[i].from();
        let col = countColumn(cm.getLine(pos.line), pos.ch, tabSize);
        spaces.push(spaceStr(tabSize - col % tabSize));
      }
      cm.replaceSelections(spaces);
    },
    defaultTab: cm => {
      if (cm.somethingSelected()) cm.indentSelection("add");
      else cm.execCommand("insertTab");
    },
    // Swap the two chars left and right of each selection's head.
    // Move cursor behind the two swapped characters afterwards.
    //
    // Doesn't consider line feeds a character.
    // Doesn't scan more than one line above to find a character.
    // Doesn't do anything on an empty line.
    // Doesn't do anything with non-empty selections.
    transposeChars: cm => runInOp(cm, () => {
      let ranges = cm.listSelections(), newSel = [];
      for (let i = 0; i < ranges.length; i++) {
        if (!ranges[i].empty()) continue
        let cur = ranges[i].head, line = getLine(cm.doc, cur.line).text;
        if (line) {
          if (cur.ch == line.length) cur = new Pos(cur.line, cur.ch - 1);
          if (cur.ch > 0) {
            cur = new Pos(cur.line, cur.ch + 1);
            cm.replaceRange(line.charAt(cur.ch - 1) + line.charAt(cur.ch - 2),
                            Pos(cur.line, cur.ch - 2), cur, "+transpose");
          } else if (cur.line > cm.doc.first) {
            let prev = getLine(cm.doc, cur.line - 1).text;
            if (prev) {
              cur = new Pos(cur.line, 1);
              cm.replaceRange(line.charAt(0) + cm.doc.lineSeparator() +
                              prev.charAt(prev.length - 1),
                              Pos(cur.line - 1, prev.length - 1), cur, "+transpose");
            }
          }
        }
        newSel.push(new Range(cur, cur));
      }
      cm.setSelections(newSel);
    }),
    newlineAndIndent: cm => runInOp(cm, () => {
      let sels = cm.listSelections();
      for (let i = sels.length - 1; i >= 0; i--)
        cm.replaceRange(cm.doc.lineSeparator(), sels[i].anchor, sels[i].head, "+input");
      sels = cm.listSelections();
      for (let i = 0; i < sels.length; i++)
        cm.indentLine(sels[i].from().line, null, true);
      ensureCursorVisible(cm);
    }),
    openLine: cm => cm.replaceSelection("\n", "start"),
    toggleOverwrite: cm => cm.toggleOverwrite()
  };


  function lineStart(cm, lineN) {
    let line = getLine(cm.doc, lineN);
    let visual = visualLine(line);
    if (visual != line) lineN = lineNo(visual);
    return endOfLine(true, cm, visual, lineN, 1)
  }
  function lineEnd(cm, lineN) {
    let line = getLine(cm.doc, lineN);
    let visual = visualLineEnd(line);
    if (visual != line) lineN = lineNo(visual);
    return endOfLine(true, cm, line, lineN, -1)
  }
  function lineStartSmart(cm, pos) {
    let start = lineStart(cm, pos.line);
    let line = getLine(cm.doc, start.line);
    let order = getOrder(line, cm.doc.direction);
    if (!order || order[0].level == 0) {
      let firstNonWS = Math.max(0, line.text.search(/\S/));
      let inWS = pos.line == start.line && pos.ch <= firstNonWS && pos.ch;
      return Pos(start.line, inWS ? 0 : firstNonWS, start.sticky)
    }
    return start
  }

  // Run a handler that was bound to a key.
  function doHandleBinding(cm, bound, dropShift) {
    if (typeof bound == "string") {
      bound = commands$2[bound];
      if (!bound) return false
    }
    // Ensure previous input has been read, so that the handler sees a
    // consistent view of the document
    cm.display.input.ensurePolled();
    let prevShift = cm.display.shift, done = false;
    try {
      if (cm.isReadOnly()) cm.state.suppressEdits = true;
      if (dropShift) cm.display.shift = false;
      done = bound(cm) != Pass;
    } finally {
      cm.display.shift = prevShift;
      cm.state.suppressEdits = false;
    }
    return done
  }

  function lookupKeyForEditor(cm, name, handle) {
    for (let i = 0; i < cm.state.keyMaps.length; i++) {
      let result = lookupKey(name, cm.state.keyMaps[i], handle, cm);
      if (result) return result
    }
    return (cm.options.extraKeys && lookupKey(name, cm.options.extraKeys, handle, cm))
      || lookupKey(name, cm.options.keyMap, handle, cm)
  }

  // Note that, despite the name, this function is also used to check
  // for bound mouse clicks.

  let stopSeq = new Delayed;

  function dispatchKey(cm, name, e, handle) {
    let seq = cm.state.keySeq;
    if (seq) {
      if (isModifierKey(name)) return "handled"
      if (/\'$/.test(name))
        cm.state.keySeq = null;
      else
        stopSeq.set(50, () => {
          if (cm.state.keySeq == seq) {
            cm.state.keySeq = null;
            cm.display.input.reset();
          }
        });
      if (dispatchKeyInner(cm, seq + " " + name, e, handle)) return true
    }
    return dispatchKeyInner(cm, name, e, handle)
  }

  function dispatchKeyInner(cm, name, e, handle) {
    let result = lookupKeyForEditor(cm, name, handle);

    if (result == "multi")
      cm.state.keySeq = name;
    if (result == "handled")
      signalLater(cm, "keyHandled", cm, name, e);

    if (result == "handled" || result == "multi") {
      e_preventDefault(e);
      restartBlink(cm);
    }

    return !!result
  }

  // Handle a key from the keydown event.
  function handleKeyBinding(cm, e) {
    let name = keyName(e, true);
    if (!name) return false

    if (e.shiftKey && !cm.state.keySeq) {
      // First try to resolve full name (including 'Shift-'). Failing
      // that, see if there is a cursor-motion command (starting with
      // 'go') bound to the keyname without 'Shift-'.
      return dispatchKey(cm, "Shift-" + name, e, b => doHandleBinding(cm, b, true))
          || dispatchKey(cm, name, e, b => {
               if (typeof b == "string" ? /^go[A-Z]/.test(b) : b.motion)
                 return doHandleBinding(cm, b)
             })
    } else {
      return dispatchKey(cm, name, e, b => doHandleBinding(cm, b))
    }
  }

  // Handle a key from the keypress event
  function handleCharBinding(cm, e, ch) {
    return dispatchKey(cm, "'" + ch + "'", e, b => doHandleBinding(cm, b, true))
  }

  let lastStoppedKey = null;
  function onKeyDown(e) {
    let cm = this;
    cm.curOp.focus = activeElt();
    if (signalDOMEvent(cm, e)) return
    // IE does strange things with escape.
    if (ie && ie_version < 11 && e.keyCode == 27) e.returnValue = false;
    let code = e.keyCode;
    cm.display.shift = code == 16 || e.shiftKey;
    let handled = handleKeyBinding(cm, e);
    if (presto) {
      lastStoppedKey = handled ? code : null;
      // Opera has no cut event... we try to at least catch the key combo
      if (!handled && code == 88 && !hasCopyEvent && (mac ? e.metaKey : e.ctrlKey))
        cm.replaceSelection("", null, "cut");
    }

    // Turn mouse into crosshair when Alt is held on Mac.
    if (code == 18 && !/\bCodeMirror-crosshair\b/.test(cm.display.lineDiv.className))
      showCrossHair(cm);
  }

  function showCrossHair(cm) {
    let lineDiv = cm.display.lineDiv;
    addClass(lineDiv, "CodeMirror-crosshair");

    function up(e) {
      if (e.keyCode == 18 || !e.altKey) {
        rmClass(lineDiv, "CodeMirror-crosshair");
        off(document, "keyup", up);
        off(document, "mouseover", up);
      }
    }
    on(document, "keyup", up);
    on(document, "mouseover", up);
  }

  function onKeyUp(e) {
    if (e.keyCode == 16) this.doc.sel.shift = false;
    signalDOMEvent(this, e);
  }

  function onKeyPress(e) {
    let cm = this;
    if (eventInWidget(cm.display, e) || signalDOMEvent(cm, e) || e.ctrlKey && !e.altKey || mac && e.metaKey) return
    let keyCode = e.keyCode, charCode = e.charCode;
    if (presto && keyCode == lastStoppedKey) {lastStoppedKey = null; e_preventDefault(e); return}
    if ((presto && (!e.which || e.which < 10)) && handleKeyBinding(cm, e)) return
    let ch = String.fromCharCode(charCode == null ? keyCode : charCode);
    // Some browsers fire keypress events for backspace
    if (ch == "\x08") return
    if (handleCharBinding(cm, e, ch)) return
    cm.display.input.onKeyPress(e);
  }

  const DOUBLECLICK_DELAY = 400;

  class PastClick {
    constructor(time, pos, button) {
      this.time = time;
      this.pos = pos;
      this.button = button;
    }

    compare(time, pos, button) {
      return this.time + DOUBLECLICK_DELAY > time &&
        cmp(pos, this.pos) == 0 && button == this.button
    }
  }

  let lastClick, lastDoubleClick;
  function clickRepeat(pos, button) {
    let now = +new Date;
    if (lastDoubleClick && lastDoubleClick.compare(now, pos, button)) {
      lastClick = lastDoubleClick = null;
      return "triple"
    } else if (lastClick && lastClick.compare(now, pos, button)) {
      lastDoubleClick = new PastClick(now, pos, button);
      lastClick = null;
      return "double"
    } else {
      lastClick = new PastClick(now, pos, button);
      lastDoubleClick = null;
      return "single"
    }
  }

  // A mouse down can be a single click, double click, triple click,
  // start of selection drag, start of text drag, new cursor
  // (ctrl-click), rectangle drag (alt-drag), or xwin
  // middle-click-paste. Or it might be a click on something we should
  // not interfere with, such as a scrollbar or widget.
  function onMouseDown(e) {
    let cm = this, display = cm.display;
    if (signalDOMEvent(cm, e) || display.activeTouch && display.input.supportsTouch()) return
    display.input.ensurePolled();
    display.shift = e.shiftKey;

    if (eventInWidget(display, e)) {
      if (!webkit) {
        // Briefly turn off draggability, to allow widgets to do
        // normal dragging things.
        display.scroller.draggable = false;
        setTimeout(() => display.scroller.draggable = true, 100);
      }
      return
    }
    if (clickInGutter(cm, e)) return
    let pos = posFromMouse(cm, e), button = e_button(e), repeat = pos ? clickRepeat(pos, button) : "single";
    window.focus();

    // #3261: make sure, that we're not starting a second selection
    if (button == 1 && cm.state.selectingText)
      cm.state.selectingText(e);

    if (pos && handleMappedButton(cm, button, pos, repeat, e)) return

    if (button == 1) {
      if (pos) leftButtonDown(cm, pos, repeat, e);
      else if (e_target(e) == display.scroller) e_preventDefault(e);
    } else if (button == 2) {
      if (pos) extendSelection(cm.doc, pos);
      setTimeout(() => display.input.focus(), 20);
    } else if (button == 3) {
      if (captureRightClick) cm.display.input.onContextMenu(e);
      else delayBlurEvent(cm);
    }
  }

  function handleMappedButton(cm, button, pos, repeat, event) {
    let name = "Click";
    if (repeat == "double") name = "Double" + name;
    else if (repeat == "triple") name = "Triple" + name;
    name = (button == 1 ? "Left" : button == 2 ? "Middle" : "Right") + name;

    return dispatchKey(cm,  addModifierNames(name, event), event, bound => {
      if (typeof bound == "string") bound = commands$2[bound];
      if (!bound) return false
      let done = false;
      try {
        if (cm.isReadOnly()) cm.state.suppressEdits = true;
        done = bound(cm, pos) != Pass;
      } finally {
        cm.state.suppressEdits = false;
      }
      return done
    })
  }

  function configureMouse(cm, repeat, event) {
    let option = cm.getOption("configureMouse");
    let value = option ? option(cm, repeat, event) : {};
    if (value.unit == null) {
      let rect = chromeOS ? event.shiftKey && event.metaKey : event.altKey;
      value.unit = rect ? "rectangle" : repeat == "single" ? "char" : repeat == "double" ? "word" : "line";
    }
    if (value.extend == null || cm.doc.extend) value.extend = cm.doc.extend || event.shiftKey;
    if (value.addNew == null) value.addNew = mac ? event.metaKey : event.ctrlKey;
    if (value.moveOnDrag == null) value.moveOnDrag = !(mac ? event.altKey : event.ctrlKey);
    return value
  }

  function leftButtonDown(cm, pos, repeat, event) {
    if (ie) setTimeout(bind(ensureFocus, cm), 0);
    else cm.curOp.focus = activeElt();

    let behavior = configureMouse(cm, repeat, event);

    let sel = cm.doc.sel, contained;
    if (cm.options.dragDrop && dragAndDrop && !cm.isReadOnly() &&
        repeat == "single" && (contained = sel.contains(pos)) > -1 &&
        (cmp((contained = sel.ranges[contained]).from(), pos) < 0 || pos.xRel > 0) &&
        (cmp(contained.to(), pos) > 0 || pos.xRel < 0))
      leftButtonStartDrag(cm, event, pos, behavior);
    else
      leftButtonSelect(cm, event, pos, behavior);
  }

  // Start a text drag. When it ends, see if any dragging actually
  // happen, and treat as a click if it didn't.
  function leftButtonStartDrag(cm, event, pos, behavior) {
    let display = cm.display, moved = false;
    let dragEnd = operation(cm, e => {
      if (webkit) display.scroller.draggable = false;
      cm.state.draggingText = false;
      off(display.wrapper.ownerDocument, "mouseup", dragEnd);
      off(display.wrapper.ownerDocument, "mousemove", mouseMove);
      off(display.scroller, "dragstart", dragStart);
      off(display.scroller, "drop", dragEnd);
      if (!moved) {
        e_preventDefault(e);
        if (!behavior.addNew)
          extendSelection(cm.doc, pos, null, null, behavior.extend);
        // Work around unexplainable focus problem in IE9 (#2127) and Chrome (#3081)
        if (webkit || ie && ie_version == 9)
          setTimeout(() => {display.wrapper.ownerDocument.body.focus(); display.input.focus();}, 20);
        else
          display.input.focus();
      }
    });
    let mouseMove = function(e2) {
      moved = moved || Math.abs(event.clientX - e2.clientX) + Math.abs(event.clientY - e2.clientY) >= 10;
    };
    let dragStart = () => moved = true;
    // Let the drag handler handle this.
    if (webkit) display.scroller.draggable = true;
    cm.state.draggingText = dragEnd;
    dragEnd.copy = !behavior.moveOnDrag;
    // IE's approach to draggable
    if (display.scroller.dragDrop) display.scroller.dragDrop();
    on(display.wrapper.ownerDocument, "mouseup", dragEnd);
    on(display.wrapper.ownerDocument, "mousemove", mouseMove);
    on(display.scroller, "dragstart", dragStart);
    on(display.scroller, "drop", dragEnd);

    delayBlurEvent(cm);
    setTimeout(() => display.input.focus(), 20);
  }

  function rangeForUnit(cm, pos, unit) {
    if (unit == "char") return new Range(pos, pos)
    if (unit == "word") return cm.findWordAt(pos)
    if (unit == "line") return new Range(Pos(pos.line, 0), clipPos(cm.doc, Pos(pos.line + 1, 0)))
    let result = unit(cm, pos);
    return new Range(result.from, result.to)
  }

  // Normal selection, as opposed to text dragging.
  function leftButtonSelect(cm, event, start, behavior) {
    let display = cm.display, doc = cm.doc;
    e_preventDefault(event);

    let ourRange, ourIndex, startSel = doc.sel, ranges = startSel.ranges;
    if (behavior.addNew && !behavior.extend) {
      ourIndex = doc.sel.contains(start);
      if (ourIndex > -1)
        ourRange = ranges[ourIndex];
      else
        ourRange = new Range(start, start);
    } else {
      ourRange = doc.sel.primary();
      ourIndex = doc.sel.primIndex;
    }

    if (behavior.unit == "rectangle") {
      if (!behavior.addNew) ourRange = new Range(start, start);
      start = posFromMouse(cm, event, true, true);
      ourIndex = -1;
    } else {
      let range$$1 = rangeForUnit(cm, start, behavior.unit);
      if (behavior.extend)
        ourRange = extendRange(ourRange, range$$1.anchor, range$$1.head, behavior.extend);
      else
        ourRange = range$$1;
    }

    if (!behavior.addNew) {
      ourIndex = 0;
      setSelection(doc, new Selection([ourRange], 0), sel_mouse);
      startSel = doc.sel;
    } else if (ourIndex == -1) {
      ourIndex = ranges.length;
      setSelection(doc, normalizeSelection(cm, ranges.concat([ourRange]), ourIndex),
                   {scroll: false, origin: "*mouse"});
    } else if (ranges.length > 1 && ranges[ourIndex].empty() && behavior.unit == "char" && !behavior.extend) {
      setSelection(doc, normalizeSelection(cm, ranges.slice(0, ourIndex).concat(ranges.slice(ourIndex + 1)), 0),
                   {scroll: false, origin: "*mouse"});
      startSel = doc.sel;
    } else {
      replaceOneSelection(doc, ourIndex, ourRange, sel_mouse);
    }

    let lastPos = start;
    function extendTo(pos) {
      if (cmp(lastPos, pos) == 0) return
      lastPos = pos;

      if (behavior.unit == "rectangle") {
        let ranges = [], tabSize = cm.options.tabSize;
        let startCol = countColumn(getLine(doc, start.line).text, start.ch, tabSize);
        let posCol = countColumn(getLine(doc, pos.line).text, pos.ch, tabSize);
        let left = Math.min(startCol, posCol), right = Math.max(startCol, posCol);
        for (let line = Math.min(start.line, pos.line), end = Math.min(cm.lastLine(), Math.max(start.line, pos.line));
             line <= end; line++) {
          let text = getLine(doc, line).text, leftPos = findColumn(text, left, tabSize);
          if (left == right)
            ranges.push(new Range(Pos(line, leftPos), Pos(line, leftPos)));
          else if (text.length > leftPos)
            ranges.push(new Range(Pos(line, leftPos), Pos(line, findColumn(text, right, tabSize))));
        }
        if (!ranges.length) ranges.push(new Range(start, start));
        setSelection(doc, normalizeSelection(cm, startSel.ranges.slice(0, ourIndex).concat(ranges), ourIndex),
                     {origin: "*mouse", scroll: false});
        cm.scrollIntoView(pos);
      } else {
        let oldRange = ourRange;
        let range$$1 = rangeForUnit(cm, pos, behavior.unit);
        let anchor = oldRange.anchor, head;
        if (cmp(range$$1.anchor, anchor) > 0) {
          head = range$$1.head;
          anchor = minPos(oldRange.from(), range$$1.anchor);
        } else {
          head = range$$1.anchor;
          anchor = maxPos(oldRange.to(), range$$1.head);
        }
        let ranges = startSel.ranges.slice(0);
        ranges[ourIndex] = bidiSimplify(cm, new Range(clipPos(doc, anchor), head));
        setSelection(doc, normalizeSelection(cm, ranges, ourIndex), sel_mouse);
      }
    }

    let editorSize = display.wrapper.getBoundingClientRect();
    // Used to ensure timeout re-tries don't fire when another extend
    // happened in the meantime (clearTimeout isn't reliable -- at
    // least on Chrome, the timeouts still happen even when cleared,
    // if the clear happens after their scheduled firing time).
    let counter = 0;

    function extend(e) {
      let curCount = ++counter;
      let cur = posFromMouse(cm, e, true, behavior.unit == "rectangle");
      if (!cur) return
      if (cmp(cur, lastPos) != 0) {
        cm.curOp.focus = activeElt();
        extendTo(cur);
        let visible = visibleLines(display, doc);
        if (cur.line >= visible.to || cur.line < visible.from)
          setTimeout(operation(cm, () => {if (counter == curCount) extend(e);}), 150);
      } else {
        let outside = e.clientY < editorSize.top ? -20 : e.clientY > editorSize.bottom ? 20 : 0;
        if (outside) setTimeout(operation(cm, () => {
          if (counter != curCount) return
          display.scroller.scrollTop += outside;
          extend(e);
        }), 50);
      }
    }

    function done(e) {
      cm.state.selectingText = false;
      counter = Infinity;
      // If e is null or undefined we interpret this as someone trying
      // to explicitly cancel the selection rather than the user
      // letting go of the mouse button.
      if (e) {
        e_preventDefault(e);
        display.input.focus();
      }
      off(display.wrapper.ownerDocument, "mousemove", move);
      off(display.wrapper.ownerDocument, "mouseup", up);
      doc.history.lastSelOrigin = null;
    }

    let move = operation(cm, e => {
      if (e.buttons === 0 || !e_button(e)) done(e);
      else extend(e);
    });
    let up = operation(cm, done);
    cm.state.selectingText = up;
    on(display.wrapper.ownerDocument, "mousemove", move);
    on(display.wrapper.ownerDocument, "mouseup", up);
  }

  // Used when mouse-selecting to adjust the anchor to the proper side
  // of a bidi jump depending on the visual position of the head.
  function bidiSimplify(cm, range$$1) {
    let {anchor, head} = range$$1, anchorLine = getLine(cm.doc, anchor.line);
    if (cmp(anchor, head) == 0 && anchor.sticky == head.sticky) return range$$1
    let order = getOrder(anchorLine);
    if (!order) return range$$1
    let index = getBidiPartAt(order, anchor.ch, anchor.sticky), part = order[index];
    if (part.from != anchor.ch && part.to != anchor.ch) return range$$1
    let boundary = index + ((part.from == anchor.ch) == (part.level != 1) ? 0 : 1);
    if (boundary == 0 || boundary == order.length) return range$$1

    // Compute the relative visual position of the head compared to the
    // anchor (<0 is to the left, >0 to the right)
    let leftSide;
    if (head.line != anchor.line) {
      leftSide = (head.line - anchor.line) * (cm.doc.direction == "ltr" ? 1 : -1) > 0;
    } else {
      let headIndex = getBidiPartAt(order, head.ch, head.sticky);
      let dir = headIndex - index || (head.ch - anchor.ch) * (part.level == 1 ? -1 : 1);
      if (headIndex == boundary - 1 || headIndex == boundary)
        leftSide = dir < 0;
      else
        leftSide = dir > 0;
    }

    let usePart = order[boundary + (leftSide ? -1 : 0)];
    let from = leftSide == (usePart.level == 1);
    let ch = from ? usePart.from : usePart.to, sticky = from ? "after" : "before";
    return anchor.ch == ch && anchor.sticky == sticky ? range$$1 : new Range(new Pos(anchor.line, ch, sticky), head)
  }


  // Determines whether an event happened in the gutter, and fires the
  // handlers for the corresponding event.
  function gutterEvent(cm, e, type, prevent) {
    let mX, mY;
    if (e.touches) {
      mX = e.touches[0].clientX;
      mY = e.touches[0].clientY;
    } else {
      try { mX = e.clientX; mY = e.clientY; }
      catch(e) { return false }
    }
    if (mX >= Math.floor(cm.display.gutters.getBoundingClientRect().right)) return false
    if (prevent) e_preventDefault(e);

    let display = cm.display;
    let lineBox = display.lineDiv.getBoundingClientRect();

    if (mY > lineBox.bottom || !hasHandler(cm, type)) return e_defaultPrevented(e)
    mY -= lineBox.top - display.viewOffset;

    for (let i = 0; i < cm.display.gutterSpecs.length; ++i) {
      let g = display.gutters.childNodes[i];
      if (g && g.getBoundingClientRect().right >= mX) {
        let line = lineAtHeight(cm.doc, mY);
        let gutter = cm.display.gutterSpecs[i];
        signal(cm, type, cm, line, gutter.className, e);
        return e_defaultPrevented(e)
      }
    }
  }

  function clickInGutter(cm, e) {
    return gutterEvent(cm, e, "gutterClick", true)
  }

  // CONTEXT MENU HANDLING

  // To make the context menu work, we need to briefly unhide the
  // textarea (making it as unobtrusive as possible) to let the
  // right-click take effect on it.
  function onContextMenu(cm, e) {
    if (eventInWidget(cm.display, e) || contextMenuInGutter(cm, e)) return
    if (signalDOMEvent(cm, e, "contextmenu")) return
    if (!captureRightClick) cm.display.input.onContextMenu(e);
  }

  function contextMenuInGutter(cm, e) {
    if (!hasHandler(cm, "gutterContextMenu")) return false
    return gutterEvent(cm, e, "gutterContextMenu", false)
  }

  function themeChanged(cm) {
    cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-s-\S+/g, "") +
      cm.options.theme.replace(/(^|\s)\s*/g, " cm-s-");
    clearCaches(cm);
  }

  let Init = {toString: function(){return "CodeMirror.Init"}};

  let defaults = {};
  let optionHandlers = {};

  function defineOptions(CodeMirror) {
    let optionHandlers = CodeMirror.optionHandlers;

    function option(name, deflt, handle, notOnInit) {
      CodeMirror.defaults[name] = deflt;
      if (handle) optionHandlers[name] =
        notOnInit ? (cm, val, old) => {if (old != Init) handle(cm, val, old);} : handle;
    }

    CodeMirror.defineOption = option;

    // Passed to option handlers when there is no old value.
    CodeMirror.Init = Init;

    // These two are, on init, called from the constructor because they
    // have to be initialized before the editor can start at all.
    option("value", "", (cm, val) => cm.setValue(val), true);
    option("mode", null, (cm, val) => {
      cm.doc.modeOption = val;
      loadMode(cm);
    }, true);

    option("indentUnit", 2, loadMode, true);
    option("indentWithTabs", false);
    option("smartIndent", true);
    option("tabSize", 4, cm => {
      resetModeState(cm);
      clearCaches(cm);
      regChange(cm);
    }, true);

    option("lineSeparator", null, (cm, val) => {
      cm.doc.lineSep = val;
      if (!val) return
      let newBreaks = [], lineNo = cm.doc.first;
      cm.doc.iter(line => {
        for (let pos = 0;;) {
          let found = line.text.indexOf(val, pos);
          if (found == -1) break
          pos = found + val.length;
          newBreaks.push(Pos(lineNo, found));
        }
        lineNo++;
      });
      for (let i = newBreaks.length - 1; i >= 0; i--)
        replaceRange(cm.doc, val, newBreaks[i], Pos(newBreaks[i].line, newBreaks[i].ch + val.length));
    });
    option("specialChars", /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g, (cm, val, old) => {
      cm.state.specialChars = new RegExp(val.source + (val.test("\t") ? "" : "|\t"), "g");
      if (old != Init) cm.refresh();
    });
    option("specialCharPlaceholder", defaultSpecialCharPlaceholder, cm => cm.refresh(), true);
    option("electricChars", true);
    option("inputStyle", mobile ? "contenteditable" : "textarea", () => {
      throw new Error("inputStyle can not (yet) be changed in a running editor") // FIXME
    }, true);
    option("spellcheck", false, (cm, val) => cm.getInputField().spellcheck = val, true);
    option("autocorrect", false, (cm, val) => cm.getInputField().autocorrect = val, true);
    option("autocapitalize", false, (cm, val) => cm.getInputField().autocapitalize = val, true);
    option("rtlMoveVisually", !windows);
    option("wholeLineUpdateBefore", true);

    option("theme", "default", cm => {
      themeChanged(cm);
      updateGutters(cm);
    }, true);
    option("keyMap", "default", (cm, val, old) => {
      let next = getKeyMap(val);
      let prev = old != Init && getKeyMap(old);
      if (prev && prev.detach) prev.detach(cm, next);
      if (next.attach) next.attach(cm, prev || null);
    });
    option("extraKeys", null);
    option("configureMouse", null);

    option("lineWrapping", false, wrappingChanged, true);
    option("gutters", [], (cm, val) => {
      cm.display.gutterSpecs = getGutters(val, cm.options.lineNumbers);
      updateGutters(cm);
    }, true);
    option("fixedGutter", true, (cm, val) => {
      cm.display.gutters.style.left = val ? compensateForHScroll(cm.display) + "px" : "0";
      cm.refresh();
    }, true);
    option("coverGutterNextToScrollbar", false, cm => updateScrollbars(cm), true);
    option("scrollbarStyle", "native", cm => {
      initScrollbars(cm);
      updateScrollbars(cm);
      cm.display.scrollbars.setScrollTop(cm.doc.scrollTop);
      cm.display.scrollbars.setScrollLeft(cm.doc.scrollLeft);
    }, true);
    option("lineNumbers", false, (cm, val) => {
      cm.display.gutterSpecs = getGutters(cm.options.gutters, val);
      updateGutters(cm);
    }, true);
    option("firstLineNumber", 1, updateGutters, true);
    option("lineNumberFormatter", integer => integer, updateGutters, true);
    option("showCursorWhenSelecting", false, updateSelection, true);

    option("resetSelectionOnContextMenu", true);
    option("lineWiseCopyCut", true);
    option("pasteLinesPerSelection", true);
    option("selectionsMayTouch", false);

    option("readOnly", false, (cm, val) => {
      if (val == "nocursor") {
        onBlur(cm);
        cm.display.input.blur();
      }
      cm.display.input.readOnlyChanged(val);
    });
    option("disableInput", false, (cm, val) => {if (!val) cm.display.input.reset();}, true);
    option("dragDrop", true, dragDropChanged);
    option("allowDropFileTypes", null);

    option("cursorBlinkRate", 530);
    option("cursorScrollMargin", 0);
    option("cursorHeight", 1, updateSelection, true);
    option("singleCursorHeightPerLine", true, updateSelection, true);
    option("workTime", 100);
    option("workDelay", 100);
    option("flattenSpans", true, resetModeState, true);
    option("addModeClass", false, resetModeState, true);
    option("pollInterval", 100);
    option("undoDepth", 200, (cm, val) => cm.doc.history.undoDepth = val);
    option("historyEventDelay", 1250);
    option("viewportMargin", 10, cm => cm.refresh(), true);
    option("maxHighlightLength", 10000, resetModeState, true);
    option("moveInputWithCursor", true, (cm, val) => {
      if (!val) cm.display.input.resetPosition();
    });

    option("tabindex", null, (cm, val) => cm.display.input.getField().tabIndex = val || "");
    option("autofocus", null);
    option("direction", "ltr", (cm, val) => cm.doc.setDirection(val), true);
    option("phrases", null);
  }

  function dragDropChanged(cm, value, old) {
    let wasOn = old && old != Init;
    if (!value != !wasOn) {
      let funcs = cm.display.dragFunctions;
      let toggle = value ? on : off;
      toggle(cm.display.scroller, "dragstart", funcs.start);
      toggle(cm.display.scroller, "dragenter", funcs.enter);
      toggle(cm.display.scroller, "dragover", funcs.over);
      toggle(cm.display.scroller, "dragleave", funcs.leave);
      toggle(cm.display.scroller, "drop", funcs.drop);
    }
  }

  function wrappingChanged(cm) {
    if (cm.options.lineWrapping) {
      addClass(cm.display.wrapper, "CodeMirror-wrap");
      cm.display.sizer.style.minWidth = "";
      cm.display.sizerWidth = null;
    } else {
      rmClass(cm.display.wrapper, "CodeMirror-wrap");
      findMaxLine(cm);
    }
    estimateLineHeights(cm);
    regChange(cm);
    clearCaches(cm);
    setTimeout(() => updateScrollbars(cm), 100);
  }

  // A CodeMirror instance represents an editor. This is the object
  // that user code is usually dealing with.

  function CodeMirror(place, options) {
    if (!(this instanceof CodeMirror)) return new CodeMirror(place, options)

    this.options = options = options ? copyObj(options) : {};
    // Determine effective options based on given values and defaults.
    copyObj(defaults, options, false);

    let doc = options.value;
    if (typeof doc == "string") doc = new Doc$1(doc, options.mode, null, options.lineSeparator, options.direction);
    else if (options.mode) doc.modeOption = options.mode;
    this.doc = doc;

    let input = new CodeMirror.inputStyles[options.inputStyle](this);
    let display = this.display = new Display(place, doc, input, options);
    display.wrapper.CodeMirror = this;
    themeChanged(this);
    if (options.lineWrapping)
      this.display.wrapper.className += " CodeMirror-wrap";
    initScrollbars(this);

    this.state = {
      keyMaps: [],  // stores maps added by addKeyMap
      overlays: [], // highlighting overlays, as added by addOverlay
      modeGen: 0,   // bumped when mode/overlay changes, used to invalidate highlighting info
      overwrite: false,
      delayingBlurEvent: false,
      focused: false,
      suppressEdits: false, // used to disable editing during key handlers when in readOnly mode
      pasteIncoming: -1, cutIncoming: -1, // help recognize paste/cut edits in input.poll
      selectingText: false,
      draggingText: false,
      highlight: new Delayed(), // stores highlight worker timeout
      keySeq: null,  // Unfinished key sequence
      specialChars: null
    };

    if (options.autofocus && !mobile) display.input.focus();

    // Override magic textarea content restore that IE sometimes does
    // on our hidden textarea on reload
    if (ie && ie_version < 11) setTimeout(() => this.display.input.reset(true), 20);

    registerEventHandlers(this);
    ensureGlobalHandlers();

    startOperation(this);
    this.curOp.forceUpdate = true;
    attachDoc(this, doc);

    if ((options.autofocus && !mobile) || this.hasFocus())
      setTimeout(bind(onFocus, this), 20);
    else
      onBlur(this);

    for (let opt in optionHandlers) if (optionHandlers.hasOwnProperty(opt))
      optionHandlers[opt](this, options[opt], Init);
    maybeUpdateLineNumberWidth(this);
    if (options.finishInit) options.finishInit(this);
    for (let i = 0; i < initHooks.length; ++i) initHooks[i](this);
    endOperation(this);
    // Suppress optimizelegibility in Webkit, since it breaks text
    // measuring on line wrapping boundaries.
    if (webkit && options.lineWrapping &&
        getComputedStyle(display.lineDiv).textRendering == "optimizelegibility")
      display.lineDiv.style.textRendering = "auto";
  }

  // The default configuration options.
  CodeMirror.defaults = defaults;
  // Functions to run when options are changed.
  CodeMirror.optionHandlers = optionHandlers;

  // Attach the necessary event handlers when initializing the editor
  function registerEventHandlers(cm) {
    let d = cm.display;
    on(d.scroller, "mousedown", operation(cm, onMouseDown));
    // Older IE's will not fire a second mousedown for a double click
    if (ie && ie_version < 11)
      on(d.scroller, "dblclick", operation(cm, e => {
        if (signalDOMEvent(cm, e)) return
        let pos = posFromMouse(cm, e);
        if (!pos || clickInGutter(cm, e) || eventInWidget(cm.display, e)) return
        e_preventDefault(e);
        let word = cm.findWordAt(pos);
        extendSelection(cm.doc, word.anchor, word.head);
      }));
    else
      on(d.scroller, "dblclick", e => signalDOMEvent(cm, e) || e_preventDefault(e));
    // Some browsers fire contextmenu *after* opening the menu, at
    // which point we can't mess with it anymore. Context menu is
    // handled in onMouseDown for these browsers.
    on(d.scroller, "contextmenu", e => onContextMenu(cm, e));

    // Used to suppress mouse event handling when a touch happens
    let touchFinished, prevTouch = {end: 0};
    function finishTouch() {
      if (d.activeTouch) {
        touchFinished = setTimeout(() => d.activeTouch = null, 1000);
        prevTouch = d.activeTouch;
        prevTouch.end = +new Date;
      }
    }
    function isMouseLikeTouchEvent(e) {
      if (e.touches.length != 1) return false
      let touch = e.touches[0];
      return touch.radiusX <= 1 && touch.radiusY <= 1
    }
    function farAway(touch, other) {
      if (other.left == null) return true
      let dx = other.left - touch.left, dy = other.top - touch.top;
      return dx * dx + dy * dy > 20 * 20
    }
    on(d.scroller, "touchstart", e => {
      if (!signalDOMEvent(cm, e) && !isMouseLikeTouchEvent(e) && !clickInGutter(cm, e)) {
        d.input.ensurePolled();
        clearTimeout(touchFinished);
        let now = +new Date;
        d.activeTouch = {start: now, moved: false,
                         prev: now - prevTouch.end <= 300 ? prevTouch : null};
        if (e.touches.length == 1) {
          d.activeTouch.left = e.touches[0].pageX;
          d.activeTouch.top = e.touches[0].pageY;
        }
      }
    });
    on(d.scroller, "touchmove", () => {
      if (d.activeTouch) d.activeTouch.moved = true;
    });
    on(d.scroller, "touchend", e => {
      let touch = d.activeTouch;
      if (touch && !eventInWidget(d, e) && touch.left != null &&
          !touch.moved && new Date - touch.start < 300) {
        let pos = cm.coordsChar(d.activeTouch, "page"), range;
        if (!touch.prev || farAway(touch, touch.prev)) // Single tap
          range = new Range(pos, pos);
        else if (!touch.prev.prev || farAway(touch, touch.prev.prev)) // Double tap
          range = cm.findWordAt(pos);
        else // Triple tap
          range = new Range(Pos(pos.line, 0), clipPos(cm.doc, Pos(pos.line + 1, 0)));
        cm.setSelection(range.anchor, range.head);
        cm.focus();
        e_preventDefault(e);
      }
      finishTouch();
    });
    on(d.scroller, "touchcancel", finishTouch);

    // Sync scrolling between fake scrollbars and real scrollable
    // area, ensure viewport is updated when scrolling.
    on(d.scroller, "scroll", () => {
      if (d.scroller.clientHeight) {
        updateScrollTop(cm, d.scroller.scrollTop);
        setScrollLeft(cm, d.scroller.scrollLeft, true);
        signal(cm, "scroll", cm);
      }
    });

    // Listen to wheel events in order to try and update the viewport on time.
    on(d.scroller, "mousewheel", e => onScrollWheel(cm, e));
    on(d.scroller, "DOMMouseScroll", e => onScrollWheel(cm, e));

    // Prevent wrapper from ever scrolling
    on(d.wrapper, "scroll", () => d.wrapper.scrollTop = d.wrapper.scrollLeft = 0);

    d.dragFunctions = {
      enter: e => {if (!signalDOMEvent(cm, e)) e_stop(e);},
      over: e => {if (!signalDOMEvent(cm, e)) { onDragOver(cm, e); e_stop(e); }},
      start: e => onDragStart(cm, e),
      drop: operation(cm, onDrop),
      leave: e => {if (!signalDOMEvent(cm, e)) { clearDragCursor(cm); }}
    };

    let inp = d.input.getField();
    on(inp, "keyup", e => onKeyUp.call(cm, e));
    on(inp, "keydown", operation(cm, onKeyDown));
    on(inp, "keypress", operation(cm, onKeyPress));
    on(inp, "focus", e => onFocus(cm, e));
    on(inp, "blur", e => onBlur(cm, e));
  }

  let initHooks = [];
  CodeMirror.defineInitHook = f => initHooks.push(f);

  // Indent the given line. The how parameter can be "smart",
  // "add"/null, "subtract", or "prev". When aggressive is false
  // (typically set to true for forced single-line indents), empty
  // lines are not indented, and places where the mode returns Pass
  // are left alone.
  function indentLine(cm, n, how, aggressive) {
    let doc = cm.doc, state;
    if (how == null) how = "add";
    if (how == "smart") {
      // Fall back to "prev" when the mode doesn't have an indentation
      // method.
      if (!doc.mode.indent) how = "prev";
      else state = getContextBefore(cm, n).state;
    }

    let tabSize = cm.options.tabSize;
    let line = getLine(doc, n), curSpace = countColumn(line.text, null, tabSize);
    if (line.stateAfter) line.stateAfter = null;
    let curSpaceString = line.text.match(/^\s*/)[0], indentation;
    if (!aggressive && !/\S/.test(line.text)) {
      indentation = 0;
      how = "not";
    } else if (how == "smart") {
      indentation = doc.mode.indent(state, line.text.slice(curSpaceString.length), line.text);
      if (indentation == Pass || indentation > 150) {
        if (!aggressive) return
        how = "prev";
      }
    }
    if (how == "prev") {
      if (n > doc.first) indentation = countColumn(getLine(doc, n-1).text, null, tabSize);
      else indentation = 0;
    } else if (how == "add") {
      indentation = curSpace + cm.options.indentUnit;
    } else if (how == "subtract") {
      indentation = curSpace - cm.options.indentUnit;
    } else if (typeof how == "number") {
      indentation = curSpace + how;
    }
    indentation = Math.max(0, indentation);

    let indentString = "", pos = 0;
    if (cm.options.indentWithTabs)
      for (let i = Math.floor(indentation / tabSize); i; --i) {pos += tabSize; indentString += "\t";}
    if (pos < indentation) indentString += spaceStr(indentation - pos);

    if (indentString != curSpaceString) {
      replaceRange(doc, indentString, Pos(n, 0), Pos(n, curSpaceString.length), "+input");
      line.stateAfter = null;
      return true
    } else {
      // Ensure that, if the cursor was in the whitespace at the start
      // of the line, it is moved to the end of that space.
      for (let i = 0; i < doc.sel.ranges.length; i++) {
        let range = doc.sel.ranges[i];
        if (range.head.line == n && range.head.ch < curSpaceString.length) {
          let pos = Pos(n, curSpaceString.length);
          replaceOneSelection(doc, i, new Range(pos, pos));
          break
        }
      }
    }
  }

  // This will be set to a {lineWise: bool, text: [string]} object, so
  // that, when pasting, we know what kind of selections the copied
  // text was made out of.
  let lastCopied = null;

  function setLastCopied(newLastCopied) {
    lastCopied = newLastCopied;
  }

  function applyTextInput(cm, inserted, deleted, sel, origin) {
    let doc = cm.doc;
    cm.display.shift = false;
    if (!sel) sel = doc.sel;

    let recent = +new Date - 200;
    let paste = origin == "paste" || cm.state.pasteIncoming > recent;
    let textLines = splitLinesAuto(inserted), multiPaste = null;
    // When pasting N lines into N selections, insert one line per selection
    if (paste && sel.ranges.length > 1) {
      if (lastCopied && lastCopied.text.join("\n") == inserted) {
        if (sel.ranges.length % lastCopied.text.length == 0) {
          multiPaste = [];
          for (let i = 0; i < lastCopied.text.length; i++)
            multiPaste.push(doc.splitLines(lastCopied.text[i]));
        }
      } else if (textLines.length == sel.ranges.length && cm.options.pasteLinesPerSelection) {
        multiPaste = map(textLines, l => [l]);
      }
    }

    let updateInput = cm.curOp.updateInput;
    // Normal behavior is to insert the new text into every selection
    for (let i = sel.ranges.length - 1; i >= 0; i--) {
      let range$$1 = sel.ranges[i];
      let from = range$$1.from(), to = range$$1.to();
      if (range$$1.empty()) {
        if (deleted && deleted > 0) // Handle deletion
          from = Pos(from.line, from.ch - deleted);
        else if (cm.state.overwrite && !paste) // Handle overwrite
          to = Pos(to.line, Math.min(getLine(doc, to.line).text.length, to.ch + lst(textLines).length));
        else if (paste && lastCopied && lastCopied.lineWise && lastCopied.text.join("\n") == inserted)
          from = to = Pos(from.line, 0);
      }
      let changeEvent = {from: from, to: to, text: multiPaste ? multiPaste[i % multiPaste.length] : textLines,
                         origin: origin || (paste ? "paste" : cm.state.cutIncoming > recent ? "cut" : "+input")};
      makeChange(cm.doc, changeEvent);
      signalLater(cm, "inputRead", cm, changeEvent);
    }
    if (inserted && !paste)
      triggerElectric(cm, inserted);

    ensureCursorVisible(cm);
    if (cm.curOp.updateInput < 2) cm.curOp.updateInput = updateInput;
    cm.curOp.typing = true;
    cm.state.pasteIncoming = cm.state.cutIncoming = -1;
  }

  function handlePaste(e, cm) {
    let pasted = e.clipboardData && e.clipboardData.getData("Text");
    if (pasted) {
      e.preventDefault();
      if (!cm.isReadOnly() && !cm.options.disableInput)
        runInOp(cm, () => applyTextInput(cm, pasted, 0, null, "paste"));
      return true
    }
  }

  function triggerElectric(cm, inserted) {
    // When an 'electric' character is inserted, immediately trigger a reindent
    if (!cm.options.electricChars || !cm.options.smartIndent) return
    let sel = cm.doc.sel;

    for (let i = sel.ranges.length - 1; i >= 0; i--) {
      let range$$1 = sel.ranges[i];
      if (range$$1.head.ch > 100 || (i && sel.ranges[i - 1].head.line == range$$1.head.line)) continue
      let mode = cm.getModeAt(range$$1.head);
      let indented = false;
      if (mode.electricChars) {
        for (let j = 0; j < mode.electricChars.length; j++)
          if (inserted.indexOf(mode.electricChars.charAt(j)) > -1) {
            indented = indentLine(cm, range$$1.head.line, "smart");
            break
          }
      } else if (mode.electricInput) {
        if (mode.electricInput.test(getLine(cm.doc, range$$1.head.line).text.slice(0, range$$1.head.ch)))
          indented = indentLine(cm, range$$1.head.line, "smart");
      }
      if (indented) signalLater(cm, "electricInput", cm, range$$1.head.line);
    }
  }

  function copyableRanges(cm) {
    let text = [], ranges = [];
    for (let i = 0; i < cm.doc.sel.ranges.length; i++) {
      let line = cm.doc.sel.ranges[i].head.line;
      let lineRange = {anchor: Pos(line, 0), head: Pos(line + 1, 0)};
      ranges.push(lineRange);
      text.push(cm.getRange(lineRange.anchor, lineRange.head));
    }
    return {text: text, ranges: ranges}
  }

  function disableBrowserMagic(field, spellcheck, autocorrect, autocapitalize) {
    field.setAttribute("autocorrect", autocorrect ? "" : "off");
    field.setAttribute("autocapitalize", autocapitalize ? "" : "off");
    field.setAttribute("spellcheck", !!spellcheck);
  }

  function hiddenTextarea() {
    let te = elt("textarea", null, null, "position: absolute; bottom: -1em; padding: 0; width: 1px; height: 1em; outline: none");
    let div = elt("div", [te], null, "overflow: hidden; position: relative; width: 3px; height: 0px;");
    // The textarea is kept positioned near the cursor to prevent the
    // fact that it'll be scrolled into view on input from scrolling
    // our fake cursor out of view. On webkit, when wrap=off, paste is
    // very slow. So make the area wide instead.
    if (webkit) te.style.width = "1000px";
    else te.setAttribute("wrap", "off");
    // If border: 0; -- iOS fails to open keyboard (issue #1287)
    if (ios) te.style.border = "1px solid black";
    disableBrowserMagic(te);
    return div
  }

  // The publicly visible API. Note that methodOp(f) means
  // 'wrap f in an operation, performed on its `this` parameter'.

  // This is not the complete set of editor methods. Most of the
  // methods defined on the Doc type are also injected into
  // CodeMirror.prototype, for backwards compatibility and
  // convenience.

  function addEditorMethods(CodeMirror) {
    let optionHandlers = CodeMirror.optionHandlers;

    let helpers = CodeMirror.helpers = {};

    CodeMirror.prototype = {
      constructor: CodeMirror,
      focus: function(){window.focus(); this.display.input.focus();},

      setOption: function(option, value) {
        let options = this.options, old = options[option];
        if (options[option] == value && option != "mode") return
        options[option] = value;
        if (optionHandlers.hasOwnProperty(option))
          operation(this, optionHandlers[option])(this, value, old);
        signal(this, "optionChange", this, option);
      },

      getOption: function(option) {return this.options[option]},
      getDoc: function() {return this.doc},

      addKeyMap: function(map$$1, bottom) {
        this.state.keyMaps[bottom ? "push" : "unshift"](getKeyMap(map$$1));
      },
      removeKeyMap: function(map$$1) {
        let maps = this.state.keyMaps;
        for (let i = 0; i < maps.length; ++i)
          if (maps[i] == map$$1 || maps[i].name == map$$1) {
            maps.splice(i, 1);
            return true
          }
      },

      addOverlay: methodOp(function(spec, options) {
        let mode = spec.token ? spec : CodeMirror.getMode(this.options, spec);
        if (mode.startState) throw new Error("Overlays may not be stateful.")
        insertSorted(this.state.overlays,
                     {mode: mode, modeSpec: spec, opaque: options && options.opaque,
                      priority: (options && options.priority) || 0},
                     overlay => overlay.priority);
        this.state.modeGen++;
        regChange(this);
      }),
      removeOverlay: methodOp(function(spec) {
        let overlays = this.state.overlays;
        for (let i = 0; i < overlays.length; ++i) {
          let cur = overlays[i].modeSpec;
          if (cur == spec || typeof spec == "string" && cur.name == spec) {
            overlays.splice(i, 1);
            this.state.modeGen++;
            regChange(this);
            return
          }
        }
      }),

      indentLine: methodOp(function(n, dir, aggressive) {
        if (typeof dir != "string" && typeof dir != "number") {
          if (dir == null) dir = this.options.smartIndent ? "smart" : "prev";
          else dir = dir ? "add" : "subtract";
        }
        if (isLine(this.doc, n)) indentLine(this, n, dir, aggressive);
      }),
      indentSelection: methodOp(function(how) {
        let ranges = this.doc.sel.ranges, end = -1;
        for (let i = 0; i < ranges.length; i++) {
          let range$$1 = ranges[i];
          if (!range$$1.empty()) {
            let from = range$$1.from(), to = range$$1.to();
            let start = Math.max(end, from.line);
            end = Math.min(this.lastLine(), to.line - (to.ch ? 0 : 1)) + 1;
            for (let j = start; j < end; ++j)
              indentLine(this, j, how);
            let newRanges = this.doc.sel.ranges;
            if (from.ch == 0 && ranges.length == newRanges.length && newRanges[i].from().ch > 0)
              replaceOneSelection(this.doc, i, new Range(from, newRanges[i].to()), sel_dontScroll);
          } else if (range$$1.head.line > end) {
            indentLine(this, range$$1.head.line, how, true);
            end = range$$1.head.line;
            if (i == this.doc.sel.primIndex) ensureCursorVisible(this);
          }
        }
      }),

      // Fetch the parser token for a given character. Useful for hacks
      // that want to inspect the mode state (say, for completion).
      getTokenAt: function(pos, precise) {
        return takeToken(this, pos, precise)
      },

      getLineTokens: function(line, precise) {
        return takeToken(this, Pos(line), precise, true)
      },

      getTokenTypeAt: function(pos) {
        pos = clipPos(this.doc, pos);
        let styles = getLineStyles(this, getLine(this.doc, pos.line));
        let before = 0, after = (styles.length - 1) / 2, ch = pos.ch;
        let type;
        if (ch == 0) type = styles[2];
        else for (;;) {
          let mid = (before + after) >> 1;
          if ((mid ? styles[mid * 2 - 1] : 0) >= ch) after = mid;
          else if (styles[mid * 2 + 1] < ch) before = mid + 1;
          else { type = styles[mid * 2 + 2]; break }
        }
        let cut = type ? type.indexOf("overlay ") : -1;
        return cut < 0 ? type : cut == 0 ? null : type.slice(0, cut - 1)
      },

      getModeAt: function(pos) {
        let mode = this.doc.mode;
        if (!mode.innerMode) return mode
        return CodeMirror.innerMode(mode, this.getTokenAt(pos).state).mode
      },

      getHelper: function(pos, type) {
        return this.getHelpers(pos, type)[0]
      },

      getHelpers: function(pos, type) {
        let found = [];
        if (!helpers.hasOwnProperty(type)) return found
        let help = helpers[type], mode = this.getModeAt(pos);
        if (typeof mode[type] == "string") {
          if (help[mode[type]]) found.push(help[mode[type]]);
        } else if (mode[type]) {
          for (let i = 0; i < mode[type].length; i++) {
            let val = help[mode[type][i]];
            if (val) found.push(val);
          }
        } else if (mode.helperType && help[mode.helperType]) {
          found.push(help[mode.helperType]);
        } else if (help[mode.name]) {
          found.push(help[mode.name]);
        }
        for (let i = 0; i < help._global.length; i++) {
          let cur = help._global[i];
          if (cur.pred(mode, this) && indexOf(found, cur.val) == -1)
            found.push(cur.val);
        }
        return found
      },

      getStateAfter: function(line, precise) {
        let doc = this.doc;
        line = clipLine(doc, line == null ? doc.first + doc.size - 1: line);
        return getContextBefore(this, line + 1, precise).state
      },

      cursorCoords: function(start, mode) {
        let pos, range$$1 = this.doc.sel.primary();
        if (start == null) pos = range$$1.head;
        else if (typeof start == "object") pos = clipPos(this.doc, start);
        else pos = start ? range$$1.from() : range$$1.to();
        return cursorCoords(this, pos, mode || "page")
      },

      charCoords: function(pos, mode) {
        return charCoords(this, clipPos(this.doc, pos), mode || "page")
      },

      coordsChar: function(coords, mode) {
        coords = fromCoordSystem(this, coords, mode || "page");
        return coordsChar(this, coords.left, coords.top)
      },

      lineAtHeight: function(height, mode) {
        height = fromCoordSystem(this, {top: height, left: 0}, mode || "page").top;
        return lineAtHeight(this.doc, height + this.display.viewOffset)
      },
      heightAtLine: function(line, mode, includeWidgets) {
        let end = false, lineObj;
        if (typeof line == "number") {
          let last = this.doc.first + this.doc.size - 1;
          if (line < this.doc.first) line = this.doc.first;
          else if (line > last) { line = last; end = true; }
          lineObj = getLine(this.doc, line);
        } else {
          lineObj = line;
        }
        return intoCoordSystem(this, lineObj, {top: 0, left: 0}, mode || "page", includeWidgets || end).top +
          (end ? this.doc.height - heightAtLine(lineObj) : 0)
      },

      defaultTextHeight: function() { return textHeight(this.display) },
      defaultCharWidth: function() { return charWidth(this.display) },

      getViewport: function() { return {from: this.display.viewFrom, to: this.display.viewTo}},

      addWidget: function(pos, node, scroll, vert, horiz) {
        let display = this.display;
        pos = cursorCoords(this, clipPos(this.doc, pos));
        let top = pos.bottom, left = pos.left;
        node.style.position = "absolute";
        node.setAttribute("cm-ignore-events", "true");
        this.display.input.setUneditable(node);
        display.sizer.appendChild(node);
        if (vert == "over") {
          top = pos.top;
        } else if (vert == "above" || vert == "near") {
          let vspace = Math.max(display.wrapper.clientHeight, this.doc.height),
          hspace = Math.max(display.sizer.clientWidth, display.lineSpace.clientWidth);
          // Default to positioning above (if specified and possible); otherwise default to positioning below
          if ((vert == 'above' || pos.bottom + node.offsetHeight > vspace) && pos.top > node.offsetHeight)
            top = pos.top - node.offsetHeight;
          else if (pos.bottom + node.offsetHeight <= vspace)
            top = pos.bottom;
          if (left + node.offsetWidth > hspace)
            left = hspace - node.offsetWidth;
        }
        node.style.top = top + "px";
        node.style.left = node.style.right = "";
        if (horiz == "right") {
          left = display.sizer.clientWidth - node.offsetWidth;
          node.style.right = "0px";
        } else {
          if (horiz == "left") left = 0;
          else if (horiz == "middle") left = (display.sizer.clientWidth - node.offsetWidth) / 2;
          node.style.left = left + "px";
        }
        if (scroll)
          scrollIntoView(this, {left, top, right: left + node.offsetWidth, bottom: top + node.offsetHeight});
      },

      triggerOnKeyDown: methodOp(onKeyDown),
      triggerOnKeyPress: methodOp(onKeyPress),
      triggerOnKeyUp: onKeyUp,
      triggerOnMouseDown: methodOp(onMouseDown),

      execCommand: function(cmd) {
        if (commands$2.hasOwnProperty(cmd))
          return commands$2[cmd].call(null, this)
      },

      triggerElectric: methodOp(function(text) { triggerElectric(this, text); }),

      findPosH: function(from, amount, unit, visually) {
        let dir = 1;
        if (amount < 0) { dir = -1; amount = -amount; }
        let cur = clipPos(this.doc, from);
        for (let i = 0; i < amount; ++i) {
          cur = findPosH(this.doc, cur, dir, unit, visually);
          if (cur.hitSide) break
        }
        return cur
      },

      moveH: methodOp(function(dir, unit) {
        this.extendSelectionsBy(range$$1 => {
          if (this.display.shift || this.doc.extend || range$$1.empty())
            return findPosH(this.doc, range$$1.head, dir, unit, this.options.rtlMoveVisually)
          else
            return dir < 0 ? range$$1.from() : range$$1.to()
        }, sel_move);
      }),

      deleteH: methodOp(function(dir, unit) {
        let sel = this.doc.sel, doc = this.doc;
        if (sel.somethingSelected())
          doc.replaceSelection("", null, "+delete");
        else
          deleteNearSelection(this, range$$1 => {
            let other = findPosH(doc, range$$1.head, dir, unit, false);
            return dir < 0 ? {from: other, to: range$$1.head} : {from: range$$1.head, to: other}
          });
      }),

      findPosV: function(from, amount, unit, goalColumn) {
        let dir = 1, x = goalColumn;
        if (amount < 0) { dir = -1; amount = -amount; }
        let cur = clipPos(this.doc, from);
        for (let i = 0; i < amount; ++i) {
          let coords = cursorCoords(this, cur, "div");
          if (x == null) x = coords.left;
          else coords.left = x;
          cur = findPosV(this, coords, dir, unit);
          if (cur.hitSide) break
        }
        return cur
      },

      moveV: methodOp(function(dir, unit) {
        let doc = this.doc, goals = [];
        let collapse = !this.display.shift && !doc.extend && doc.sel.somethingSelected();
        doc.extendSelectionsBy(range$$1 => {
          if (collapse)
            return dir < 0 ? range$$1.from() : range$$1.to()
          let headPos = cursorCoords(this, range$$1.head, "div");
          if (range$$1.goalColumn != null) headPos.left = range$$1.goalColumn;
          goals.push(headPos.left);
          let pos = findPosV(this, headPos, dir, unit);
          if (unit == "page" && range$$1 == doc.sel.primary())
            addToScrollTop(this, charCoords(this, pos, "div").top - headPos.top);
          return pos
        }, sel_move);
        if (goals.length) for (let i = 0; i < doc.sel.ranges.length; i++)
          doc.sel.ranges[i].goalColumn = goals[i];
      }),

      // Find the word at the given position (as returned by coordsChar).
      findWordAt: function(pos) {
        let doc = this.doc, line = getLine(doc, pos.line).text;
        let start = pos.ch, end = pos.ch;
        if (line) {
          let helper = this.getHelper(pos, "wordChars");
          if ((pos.sticky == "before" || end == line.length) && start) --start; else ++end;
          let startChar = line.charAt(start);
          let check = isWordChar(startChar, helper)
            ? ch => isWordChar(ch, helper)
            : /\s/.test(startChar) ? ch => /\s/.test(ch)
            : ch => (!/\s/.test(ch) && !isWordChar(ch));
          while (start > 0 && check(line.charAt(start - 1))) --start;
          while (end < line.length && check(line.charAt(end))) ++end;
        }
        return new Range(Pos(pos.line, start), Pos(pos.line, end))
      },

      toggleOverwrite: function(value) {
        if (value != null && value == this.state.overwrite) return
        if (this.state.overwrite = !this.state.overwrite)
          addClass(this.display.cursorDiv, "CodeMirror-overwrite");
        else
          rmClass(this.display.cursorDiv, "CodeMirror-overwrite");

        signal(this, "overwriteToggle", this, this.state.overwrite);
      },
      hasFocus: function() { return this.display.input.getField() == activeElt() },
      isReadOnly: function() { return !!(this.options.readOnly || this.doc.cantEdit) },

      scrollTo: methodOp(function (x, y) { scrollToCoords(this, x, y); }),
      getScrollInfo: function() {
        let scroller = this.display.scroller;
        return {left: scroller.scrollLeft, top: scroller.scrollTop,
                height: scroller.scrollHeight - scrollGap(this) - this.display.barHeight,
                width: scroller.scrollWidth - scrollGap(this) - this.display.barWidth,
                clientHeight: displayHeight(this), clientWidth: displayWidth(this)}
      },

      scrollIntoView: methodOp(function(range$$1, margin) {
        if (range$$1 == null) {
          range$$1 = {from: this.doc.sel.primary().head, to: null};
          if (margin == null) margin = this.options.cursorScrollMargin;
        } else if (typeof range$$1 == "number") {
          range$$1 = {from: Pos(range$$1, 0), to: null};
        } else if (range$$1.from == null) {
          range$$1 = {from: range$$1, to: null};
        }
        if (!range$$1.to) range$$1.to = range$$1.from;
        range$$1.margin = margin || 0;

        if (range$$1.from.line != null) {
          scrollToRange(this, range$$1);
        } else {
          scrollToCoordsRange(this, range$$1.from, range$$1.to, range$$1.margin);
        }
      }),

      setSize: methodOp(function(width, height) {
        let interpret = val => typeof val == "number" || /^\d+$/.test(String(val)) ? val + "px" : val;
        if (width != null) this.display.wrapper.style.width = interpret(width);
        if (height != null) this.display.wrapper.style.height = interpret(height);
        if (this.options.lineWrapping) clearLineMeasurementCache(this);
        let lineNo$$1 = this.display.viewFrom;
        this.doc.iter(lineNo$$1, this.display.viewTo, line => {
          if (line.widgets) for (let i = 0; i < line.widgets.length; i++)
            if (line.widgets[i].noHScroll) { regLineChange(this, lineNo$$1, "widget"); break }
          ++lineNo$$1;
        });
        this.curOp.forceUpdate = true;
        signal(this, "refresh", this);
      }),

      operation: function(f){return runInOp(this, f)},
      startOperation: function(){return startOperation(this)},
      endOperation: function(){return endOperation(this)},

      refresh: methodOp(function() {
        let oldHeight = this.display.cachedTextHeight;
        regChange(this);
        this.curOp.forceUpdate = true;
        clearCaches(this);
        scrollToCoords(this, this.doc.scrollLeft, this.doc.scrollTop);
        updateGutterSpace(this.display);
        if (oldHeight == null || Math.abs(oldHeight - textHeight(this.display)) > .5)
          estimateLineHeights(this);
        signal(this, "refresh", this);
      }),

      swapDoc: methodOp(function(doc) {
        let old = this.doc;
        old.cm = null;
        // Cancel the current text selection if any (#5821)
        if (this.state.selectingText) this.state.selectingText();
        attachDoc(this, doc);
        clearCaches(this);
        this.display.input.reset();
        scrollToCoords(this, doc.scrollLeft, doc.scrollTop);
        this.curOp.forceScroll = true;
        signalLater(this, "swapDoc", this, old);
        return old
      }),

      phrase: function(phraseText) {
        let phrases = this.options.phrases;
        return phrases && Object.prototype.hasOwnProperty.call(phrases, phraseText) ? phrases[phraseText] : phraseText
      },

      getInputField: function(){return this.display.input.getField()},
      getWrapperElement: function(){return this.display.wrapper},
      getScrollerElement: function(){return this.display.scroller},
      getGutterElement: function(){return this.display.gutters}
    };
    eventMixin(CodeMirror);

    CodeMirror.registerHelper = function(type, name, value) {
      if (!helpers.hasOwnProperty(type)) helpers[type] = CodeMirror[type] = {_global: []};
      helpers[type][name] = value;
    };
    CodeMirror.registerGlobalHelper = function(type, name, predicate, value) {
      CodeMirror.registerHelper(type, name, value);
      helpers[type]._global.push({pred: predicate, val: value});
    };
  }

  // Used for horizontal relative motion. Dir is -1 or 1 (left or
  // right), unit can be "char", "column" (like char, but doesn't
  // cross line boundaries), "word" (across next word), or "group" (to
  // the start of next group of word or non-word-non-whitespace
  // chars). The visually param controls whether, in right-to-left
  // text, direction 1 means to move towards the next index in the
  // string, or towards the character to the right of the current
  // position. The resulting position will have a hitSide=true
  // property if it reached the end of the document.
  function findPosH(doc, pos, dir, unit, visually) {
    let oldPos = pos;
    let origDir = dir;
    let lineObj = getLine(doc, pos.line);
    function findNextLine() {
      let l = pos.line + dir;
      if (l < doc.first || l >= doc.first + doc.size) return false
      pos = new Pos(l, pos.ch, pos.sticky);
      return lineObj = getLine(doc, l)
    }
    function moveOnce(boundToLine) {
      let next;
      if (visually) {
        next = moveVisually(doc.cm, lineObj, pos, dir);
      } else {
        next = moveLogically(lineObj, pos, dir);
      }
      if (next == null) {
        if (!boundToLine && findNextLine())
          pos = endOfLine(visually, doc.cm, lineObj, pos.line, dir);
        else
          return false
      } else {
        pos = next;
      }
      return true
    }

    if (unit == "char") {
      moveOnce();
    } else if (unit == "column") {
      moveOnce(true);
    } else if (unit == "word" || unit == "group") {
      let sawType = null, group = unit == "group";
      let helper = doc.cm && doc.cm.getHelper(pos, "wordChars");
      for (let first = true;; first = false) {
        if (dir < 0 && !moveOnce(!first)) break
        let cur = lineObj.text.charAt(pos.ch) || "\n";
        let type = isWordChar(cur, helper) ? "w"
          : group && cur == "\n" ? "n"
          : !group || /\s/.test(cur) ? null
          : "p";
        if (group && !first && !type) type = "s";
        if (sawType && sawType != type) {
          if (dir < 0) {dir = 1; moveOnce(); pos.sticky = "after";}
          break
        }

        if (type) sawType = type;
        if (dir > 0 && !moveOnce(!first)) break
      }
    }
    let result = skipAtomic(doc, pos, oldPos, origDir, true);
    if (equalCursorPos(oldPos, result)) result.hitSide = true;
    return result
  }

  // For relative vertical movement. Dir may be -1 or 1. Unit can be
  // "page" or "line". The resulting position will have a hitSide=true
  // property if it reached the end of the document.
  function findPosV(cm, pos, dir, unit) {
    let doc = cm.doc, x = pos.left, y;
    if (unit == "page") {
      let pageSize = Math.min(cm.display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight);
      let moveAmount = Math.max(pageSize - .5 * textHeight(cm.display), 3);
      y = (dir > 0 ? pos.bottom : pos.top) + dir * moveAmount;

    } else if (unit == "line") {
      y = dir > 0 ? pos.bottom + 3 : pos.top - 3;
    }
    let target;
    for (;;) {
      target = coordsChar(cm, x, y);
      if (!target.outside) break
      if (dir < 0 ? y <= 0 : y >= doc.height) { target.hitSide = true; break }
      y += dir * 5;
    }
    return target
  }

  // CONTENTEDITABLE INPUT STYLE

  class ContentEditableInput {
    constructor(cm) {
      this.cm = cm;
      this.lastAnchorNode = this.lastAnchorOffset = this.lastFocusNode = this.lastFocusOffset = null;
      this.polling = new Delayed();
      this.composing = null;
      this.gracePeriod = false;
      this.readDOMTimeout = null;
    }

    init(display) {
      let input = this, cm = input.cm;
      let div = input.div = display.lineDiv;
      disableBrowserMagic(div, cm.options.spellcheck, cm.options.autocorrect, cm.options.autocapitalize);

      on(div, "paste", e => {
        if (signalDOMEvent(cm, e) || handlePaste(e, cm)) return
        // IE doesn't fire input events, so we schedule a read for the pasted content in this way
        if (ie_version <= 11) setTimeout(operation(cm, () => this.updateFromDOM()), 20);
      });

      on(div, "compositionstart", e => {
        this.composing = {data: e.data, done: false};
      });
      on(div, "compositionupdate", e => {
        if (!this.composing) this.composing = {data: e.data, done: false};
      });
      on(div, "compositionend", e => {
        if (this.composing) {
          if (e.data != this.composing.data) this.readFromDOMSoon();
          this.composing.done = true;
        }
      });

      on(div, "touchstart", () => input.forceCompositionEnd());

      on(div, "input", () => {
        if (!this.composing) this.readFromDOMSoon();
      });

      function onCopyCut(e) {
        if (signalDOMEvent(cm, e)) return
        if (cm.somethingSelected()) {
          setLastCopied({lineWise: false, text: cm.getSelections()});
          if (e.type == "cut") cm.replaceSelection("", null, "cut");
        } else if (!cm.options.lineWiseCopyCut) {
          return
        } else {
          let ranges = copyableRanges(cm);
          setLastCopied({lineWise: true, text: ranges.text});
          if (e.type == "cut") {
            cm.operation(() => {
              cm.setSelections(ranges.ranges, 0, sel_dontScroll);
              cm.replaceSelection("", null, "cut");
            });
          }
        }
        if (e.clipboardData) {
          e.clipboardData.clearData();
          let content = lastCopied.text.join("\n");
          // iOS exposes the clipboard API, but seems to discard content inserted into it
          e.clipboardData.setData("Text", content);
          if (e.clipboardData.getData("Text") == content) {
            e.preventDefault();
            return
          }
        }
        // Old-fashioned briefly-focus-a-textarea hack
        let kludge = hiddenTextarea(), te = kludge.firstChild;
        cm.display.lineSpace.insertBefore(kludge, cm.display.lineSpace.firstChild);
        te.value = lastCopied.text.join("\n");
        let hadFocus = document.activeElement;
        selectInput(te);
        setTimeout(() => {
          cm.display.lineSpace.removeChild(kludge);
          hadFocus.focus();
          if (hadFocus == div) input.showPrimarySelection();
        }, 50);
      }
      on(div, "copy", onCopyCut);
      on(div, "cut", onCopyCut);
    }

    prepareSelection() {
      let result = prepareSelection(this.cm, false);
      result.focus = this.cm.state.focused;
      return result
    }

    showSelection(info, takeFocus) {
      if (!info || !this.cm.display.view.length) return
      if (info.focus || takeFocus) this.showPrimarySelection();
      this.showMultipleSelections(info);
    }

    getSelection() {
      return this.cm.display.wrapper.ownerDocument.getSelection()
    }

    showPrimarySelection() {
      let sel = this.getSelection(), cm = this.cm, prim = cm.doc.sel.primary();
      let from = prim.from(), to = prim.to();

      if (cm.display.viewTo == cm.display.viewFrom || from.line >= cm.display.viewTo || to.line < cm.display.viewFrom) {
        sel.removeAllRanges();
        return
      }

      let curAnchor = domToPos(cm, sel.anchorNode, sel.anchorOffset);
      let curFocus = domToPos(cm, sel.focusNode, sel.focusOffset);
      if (curAnchor && !curAnchor.bad && curFocus && !curFocus.bad &&
          cmp(minPos(curAnchor, curFocus), from) == 0 &&
          cmp(maxPos(curAnchor, curFocus), to) == 0)
        return

      let view = cm.display.view;
      let start = (from.line >= cm.display.viewFrom && posToDOM(cm, from)) ||
          {node: view[0].measure.map[2], offset: 0};
      let end = to.line < cm.display.viewTo && posToDOM(cm, to);
      if (!end) {
        let measure = view[view.length - 1].measure;
        let map$$1 = measure.maps ? measure.maps[measure.maps.length - 1] : measure.map;
        end = {node: map$$1[map$$1.length - 1], offset: map$$1[map$$1.length - 2] - map$$1[map$$1.length - 3]};
      }

      if (!start || !end) {
        sel.removeAllRanges();
        return
      }

      let old = sel.rangeCount && sel.getRangeAt(0), rng;
      try { rng = range(start.node, start.offset, end.offset, end.node); }
      catch(e) {} // Our model of the DOM might be outdated, in which case the range we try to set can be impossible
      if (rng) {
        if (!gecko && cm.state.focused) {
          sel.collapse(start.node, start.offset);
          if (!rng.collapsed) {
            sel.removeAllRanges();
            sel.addRange(rng);
          }
        } else {
          sel.removeAllRanges();
          sel.addRange(rng);
        }
        if (old && sel.anchorNode == null) sel.addRange(old);
        else if (gecko) this.startGracePeriod();
      }
      this.rememberSelection();
    }

    startGracePeriod() {
      clearTimeout(this.gracePeriod);
      this.gracePeriod = setTimeout(() => {
        this.gracePeriod = false;
        if (this.selectionChanged())
          this.cm.operation(() => this.cm.curOp.selectionChanged = true);
      }, 20);
    }

    showMultipleSelections(info) {
      removeChildrenAndAdd(this.cm.display.cursorDiv, info.cursors);
      removeChildrenAndAdd(this.cm.display.selectionDiv, info.selection);
    }

    rememberSelection() {
      let sel = this.getSelection();
      this.lastAnchorNode = sel.anchorNode; this.lastAnchorOffset = sel.anchorOffset;
      this.lastFocusNode = sel.focusNode; this.lastFocusOffset = sel.focusOffset;
    }

    selectionInEditor() {
      let sel = this.getSelection();
      if (!sel.rangeCount) return false
      let node = sel.getRangeAt(0).commonAncestorContainer;
      return contains(this.div, node)
    }

    focus() {
      if (this.cm.options.readOnly != "nocursor") {
        if (!this.selectionInEditor())
          this.showSelection(this.prepareSelection(), true);
        this.div.focus();
      }
    }
    blur() { this.div.blur(); }
    getField() { return this.div }

    supportsTouch() { return true }

    receivedFocus() {
      let input = this;
      if (this.selectionInEditor())
        this.pollSelection();
      else
        runInOp(this.cm, () => input.cm.curOp.selectionChanged = true);

      function poll() {
        if (input.cm.state.focused) {
          input.pollSelection();
          input.polling.set(input.cm.options.pollInterval, poll);
        }
      }
      this.polling.set(this.cm.options.pollInterval, poll);
    }

    selectionChanged() {
      let sel = this.getSelection();
      return sel.anchorNode != this.lastAnchorNode || sel.anchorOffset != this.lastAnchorOffset ||
        sel.focusNode != this.lastFocusNode || sel.focusOffset != this.lastFocusOffset
    }

    pollSelection() {
      if (this.readDOMTimeout != null || this.gracePeriod || !this.selectionChanged()) return
      let sel = this.getSelection(), cm = this.cm;
      // On Android Chrome (version 56, at least), backspacing into an
      // uneditable block element will put the cursor in that element,
      // and then, because it's not editable, hide the virtual keyboard.
      // Because Android doesn't allow us to actually detect backspace
      // presses in a sane way, this code checks for when that happens
      // and simulates a backspace press in this case.
      if (android && chrome && this.cm.display.gutterSpecs.length && isInGutter(sel.anchorNode)) {
        this.cm.triggerOnKeyDown({type: "keydown", keyCode: 8, preventDefault: Math.abs});
        this.blur();
        this.focus();
        return
      }
      if (this.composing) return
      this.rememberSelection();
      let anchor = domToPos(cm, sel.anchorNode, sel.anchorOffset);
      let head = domToPos(cm, sel.focusNode, sel.focusOffset);
      if (anchor && head) runInOp(cm, () => {
        setSelection(cm.doc, simpleSelection(anchor, head), sel_dontScroll);
        if (anchor.bad || head.bad) cm.curOp.selectionChanged = true;
      });
    }

    pollContent() {
      if (this.readDOMTimeout != null) {
        clearTimeout(this.readDOMTimeout);
        this.readDOMTimeout = null;
      }

      let cm = this.cm, display = cm.display, sel = cm.doc.sel.primary();
      let from = sel.from(), to = sel.to();
      if (from.ch == 0 && from.line > cm.firstLine())
        from = Pos(from.line - 1, getLine(cm.doc, from.line - 1).length);
      if (to.ch == getLine(cm.doc, to.line).text.length && to.line < cm.lastLine())
        to = Pos(to.line + 1, 0);
      if (from.line < display.viewFrom || to.line > display.viewTo - 1) return false

      let fromIndex, fromLine, fromNode;
      if (from.line == display.viewFrom || (fromIndex = findViewIndex(cm, from.line)) == 0) {
        fromLine = lineNo(display.view[0].line);
        fromNode = display.view[0].node;
      } else {
        fromLine = lineNo(display.view[fromIndex].line);
        fromNode = display.view[fromIndex - 1].node.nextSibling;
      }
      let toIndex = findViewIndex(cm, to.line);
      let toLine, toNode;
      if (toIndex == display.view.length - 1) {
        toLine = display.viewTo - 1;
        toNode = display.lineDiv.lastChild;
      } else {
        toLine = lineNo(display.view[toIndex + 1].line) - 1;
        toNode = display.view[toIndex + 1].node.previousSibling;
      }

      if (!fromNode) return false
      let newText = cm.doc.splitLines(domTextBetween(cm, fromNode, toNode, fromLine, toLine));
      let oldText = getBetween(cm.doc, Pos(fromLine, 0), Pos(toLine, getLine(cm.doc, toLine).text.length));
      while (newText.length > 1 && oldText.length > 1) {
        if (lst(newText) == lst(oldText)) { newText.pop(); oldText.pop(); toLine--; }
        else if (newText[0] == oldText[0]) { newText.shift(); oldText.shift(); fromLine++; }
        else break
      }

      let cutFront = 0, cutEnd = 0;
      let newTop = newText[0], oldTop = oldText[0], maxCutFront = Math.min(newTop.length, oldTop.length);
      while (cutFront < maxCutFront && newTop.charCodeAt(cutFront) == oldTop.charCodeAt(cutFront))
        ++cutFront;
      let newBot = lst(newText), oldBot = lst(oldText);
      let maxCutEnd = Math.min(newBot.length - (newText.length == 1 ? cutFront : 0),
                               oldBot.length - (oldText.length == 1 ? cutFront : 0));
      while (cutEnd < maxCutEnd &&
             newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1))
        ++cutEnd;
      // Try to move start of change to start of selection if ambiguous
      if (newText.length == 1 && oldText.length == 1 && fromLine == from.line) {
        while (cutFront && cutFront > from.ch &&
               newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1)) {
          cutFront--;
          cutEnd++;
        }
      }

      newText[newText.length - 1] = newBot.slice(0, newBot.length - cutEnd).replace(/^\u200b+/, "");
      newText[0] = newText[0].slice(cutFront).replace(/\u200b+$/, "");

      let chFrom = Pos(fromLine, cutFront);
      let chTo = Pos(toLine, oldText.length ? lst(oldText).length - cutEnd : 0);
      if (newText.length > 1 || newText[0] || cmp(chFrom, chTo)) {
        replaceRange(cm.doc, newText, chFrom, chTo, "+input");
        return true
      }
    }

    ensurePolled() {
      this.forceCompositionEnd();
    }
    reset() {
      this.forceCompositionEnd();
    }
    forceCompositionEnd() {
      if (!this.composing) return
      clearTimeout(this.readDOMTimeout);
      this.composing = null;
      this.updateFromDOM();
      this.div.blur();
      this.div.focus();
    }
    readFromDOMSoon() {
      if (this.readDOMTimeout != null) return
      this.readDOMTimeout = setTimeout(() => {
        this.readDOMTimeout = null;
        if (this.composing) {
          if (this.composing.done) this.composing = null;
          else return
        }
        this.updateFromDOM();
      }, 80);
    }

    updateFromDOM() {
      if (this.cm.isReadOnly() || !this.pollContent())
        runInOp(this.cm, () => regChange(this.cm));
    }

    setUneditable(node) {
      node.contentEditable = "false";
    }

    onKeyPress(e) {
      if (e.charCode == 0 || this.composing) return
      e.preventDefault();
      if (!this.cm.isReadOnly())
        operation(this.cm, applyTextInput)(this.cm, String.fromCharCode(e.charCode == null ? e.keyCode : e.charCode), 0);
    }

    readOnlyChanged(val) {
      this.div.contentEditable = String(val != "nocursor");
    }

    onContextMenu() {}
    resetPosition() {}
  }

  ContentEditableInput.prototype.needsContentAttribute = true;

  function posToDOM(cm, pos) {
    let view = findViewForLine(cm, pos.line);
    if (!view || view.hidden) return null
    let line = getLine(cm.doc, pos.line);
    let info = mapFromLineView(view, line, pos.line);

    let order = getOrder(line, cm.doc.direction), side = "left";
    if (order) {
      let partPos = getBidiPartAt(order, pos.ch);
      side = partPos % 2 ? "right" : "left";
    }
    let result = nodeAndOffsetInLineMap(info.map, pos.ch, side);
    result.offset = result.collapse == "right" ? result.end : result.start;
    return result
  }

  function isInGutter(node) {
    for (let scan = node; scan; scan = scan.parentNode)
      if (/CodeMirror-gutter-wrapper/.test(scan.className)) return true
    return false
  }

  function badPos(pos, bad) { if (bad) pos.bad = true; return pos }

  function domTextBetween(cm, from, to, fromLine, toLine) {
    let text = "", closing = false, lineSep = cm.doc.lineSeparator(), extraLinebreak = false;
    function recognizeMarker(id) { return marker => marker.id == id }
    function close() {
      if (closing) {
        text += lineSep;
        if (extraLinebreak) text += lineSep;
        closing = extraLinebreak = false;
      }
    }
    function addText(str) {
      if (str) {
        close();
        text += str;
      }
    }
    function walk(node) {
      if (node.nodeType == 1) {
        let cmText = node.getAttribute("cm-text");
        if (cmText) {
          addText(cmText);
          return
        }
        let markerID = node.getAttribute("cm-marker"), range$$1;
        if (markerID) {
          let found = cm.findMarks(Pos(fromLine, 0), Pos(toLine + 1, 0), recognizeMarker(+markerID));
          if (found.length && (range$$1 = found[0].find(0)))
            addText(getBetween(cm.doc, range$$1.from, range$$1.to).join(lineSep));
          return
        }
        if (node.getAttribute("contenteditable") == "false") return
        let isBlock = /^(pre|div|p|li|table|br)$/i.test(node.nodeName);
        if (!/^br$/i.test(node.nodeName) && node.textContent.length == 0) return

        if (isBlock) close();
        for (let i = 0; i < node.childNodes.length; i++)
          walk(node.childNodes[i]);

        if (/^(pre|p)$/i.test(node.nodeName)) extraLinebreak = true;
        if (isBlock) closing = true;
      } else if (node.nodeType == 3) {
        addText(node.nodeValue.replace(/\u200b/g, "").replace(/\u00a0/g, " "));
      }
    }
    for (;;) {
      walk(from);
      if (from == to) break
      from = from.nextSibling;
      extraLinebreak = false;
    }
    return text
  }

  function domToPos(cm, node, offset) {
    let lineNode;
    if (node == cm.display.lineDiv) {
      lineNode = cm.display.lineDiv.childNodes[offset];
      if (!lineNode) return badPos(cm.clipPos(Pos(cm.display.viewTo - 1)), true)
      node = null; offset = 0;
    } else {
      for (lineNode = node;; lineNode = lineNode.parentNode) {
        if (!lineNode || lineNode == cm.display.lineDiv) return null
        if (lineNode.parentNode && lineNode.parentNode == cm.display.lineDiv) break
      }
    }
    for (let i = 0; i < cm.display.view.length; i++) {
      let lineView = cm.display.view[i];
      if (lineView.node == lineNode)
        return locateNodeInLineView(lineView, node, offset)
    }
  }

  function locateNodeInLineView(lineView, node, offset) {
    let wrapper = lineView.text.firstChild, bad = false;
    if (!node || !contains(wrapper, node)) return badPos(Pos(lineNo(lineView.line), 0), true)
    if (node == wrapper) {
      bad = true;
      node = wrapper.childNodes[offset];
      offset = 0;
      if (!node) {
        let line = lineView.rest ? lst(lineView.rest) : lineView.line;
        return badPos(Pos(lineNo(line), line.text.length), bad)
      }
    }

    let textNode = node.nodeType == 3 ? node : null, topNode = node;
    if (!textNode && node.childNodes.length == 1 && node.firstChild.nodeType == 3) {
      textNode = node.firstChild;
      if (offset) offset = textNode.nodeValue.length;
    }
    while (topNode.parentNode != wrapper) topNode = topNode.parentNode;
    let measure = lineView.measure, maps = measure.maps;

    function find(textNode, topNode, offset) {
      for (let i = -1; i < (maps ? maps.length : 0); i++) {
        let map$$1 = i < 0 ? measure.map : maps[i];
        for (let j = 0; j < map$$1.length; j += 3) {
          let curNode = map$$1[j + 2];
          if (curNode == textNode || curNode == topNode) {
            let line = lineNo(i < 0 ? lineView.line : lineView.rest[i]);
            let ch = map$$1[j] + offset;
            if (offset < 0 || curNode != textNode) ch = map$$1[j + (offset ? 1 : 0)];
            return Pos(line, ch)
          }
        }
      }
    }
    let found = find(textNode, topNode, offset);
    if (found) return badPos(found, bad)

    // FIXME this is all really shaky. might handle the few cases it needs to handle, but likely to cause problems
    for (let after = topNode.nextSibling, dist = textNode ? textNode.nodeValue.length - offset : 0; after; after = after.nextSibling) {
      found = find(after, after.firstChild, 0);
      if (found)
        return badPos(Pos(found.line, found.ch - dist), bad)
      else
        dist += after.textContent.length;
    }
    for (let before = topNode.previousSibling, dist = offset; before; before = before.previousSibling) {
      found = find(before, before.firstChild, -1);
      if (found)
        return badPos(Pos(found.line, found.ch + dist), bad)
      else
        dist += before.textContent.length;
    }
  }

  // TEXTAREA INPUT STYLE

  class TextareaInput {
    constructor(cm) {
      this.cm = cm;
      // See input.poll and input.reset
      this.prevInput = "";

      // Flag that indicates whether we expect input to appear real soon
      // now (after some event like 'keypress' or 'input') and are
      // polling intensively.
      this.pollingFast = false;
      // Self-resetting timeout for the poller
      this.polling = new Delayed();
      // Used to work around IE issue with selection being forgotten when focus moves away from textarea
      this.hasSelection = false;
      this.composing = null;
    }

    init(display) {
      let input = this, cm = this.cm;
      this.createField(display);
      const te = this.textarea;

      display.wrapper.insertBefore(this.wrapper, display.wrapper.firstChild);

      // Needed to hide big blue blinking cursor on Mobile Safari (doesn't seem to work in iOS 8 anymore)
      if (ios) te.style.width = "0px";

      on(te, "input", () => {
        if (ie && ie_version >= 9 && this.hasSelection) this.hasSelection = null;
        input.poll();
      });

      on(te, "paste", e => {
        if (signalDOMEvent(cm, e) || handlePaste(e, cm)) return

        cm.state.pasteIncoming = +new Date;
        input.fastPoll();
      });

      function prepareCopyCut(e) {
        if (signalDOMEvent(cm, e)) return
        if (cm.somethingSelected()) {
          setLastCopied({lineWise: false, text: cm.getSelections()});
        } else if (!cm.options.lineWiseCopyCut) {
          return
        } else {
          let ranges = copyableRanges(cm);
          setLastCopied({lineWise: true, text: ranges.text});
          if (e.type == "cut") {
            cm.setSelections(ranges.ranges, null, sel_dontScroll);
          } else {
            input.prevInput = "";
            te.value = ranges.text.join("\n");
            selectInput(te);
          }
        }
        if (e.type == "cut") cm.state.cutIncoming = +new Date;
      }
      on(te, "cut", prepareCopyCut);
      on(te, "copy", prepareCopyCut);

      on(display.scroller, "paste", e => {
        if (eventInWidget(display, e) || signalDOMEvent(cm, e)) return
        if (!te.dispatchEvent) {
          cm.state.pasteIncoming = +new Date;
          input.focus();
          return
        }

        // Pass the `paste` event to the textarea so it's handled by its event listener.
        const event = new Event("paste");
        event.clipboardData = e.clipboardData;
        te.dispatchEvent(event);
      });

      // Prevent normal selection in the editor (we handle our own)
      on(display.lineSpace, "selectstart", e => {
        if (!eventInWidget(display, e)) e_preventDefault(e);
      });

      on(te, "compositionstart", () => {
        let start = cm.getCursor("from");
        if (input.composing) input.composing.range.clear();
        input.composing = {
          start: start,
          range: cm.markText(start, cm.getCursor("to"), {className: "CodeMirror-composing"})
        };
      });
      on(te, "compositionend", () => {
        if (input.composing) {
          input.poll();
          input.composing.range.clear();
          input.composing = null;
        }
      });
    }

    createField(_display) {
      // Wraps and hides input textarea
      this.wrapper = hiddenTextarea();
      // The semihidden textarea that is focused when the editor is
      // focused, and receives input.
      this.textarea = this.wrapper.firstChild;
    }

    prepareSelection() {
      // Redraw the selection and/or cursor
      let cm = this.cm, display = cm.display, doc = cm.doc;
      let result = prepareSelection(cm);

      // Move the hidden textarea near the cursor to prevent scrolling artifacts
      if (cm.options.moveInputWithCursor) {
        let headPos = cursorCoords(cm, doc.sel.primary().head, "div");
        let wrapOff = display.wrapper.getBoundingClientRect(), lineOff = display.lineDiv.getBoundingClientRect();
        result.teTop = Math.max(0, Math.min(display.wrapper.clientHeight - 10,
                                            headPos.top + lineOff.top - wrapOff.top));
        result.teLeft = Math.max(0, Math.min(display.wrapper.clientWidth - 10,
                                             headPos.left + lineOff.left - wrapOff.left));
      }

      return result
    }

    showSelection(drawn) {
      let cm = this.cm, display = cm.display;
      removeChildrenAndAdd(display.cursorDiv, drawn.cursors);
      removeChildrenAndAdd(display.selectionDiv, drawn.selection);
      if (drawn.teTop != null) {
        this.wrapper.style.top = drawn.teTop + "px";
        this.wrapper.style.left = drawn.teLeft + "px";
      }
    }

    // Reset the input to correspond to the selection (or to be empty,
    // when not typing and nothing is selected)
    reset(typing) {
      if (this.contextMenuPending || this.composing) return
      let cm = this.cm;
      if (cm.somethingSelected()) {
        this.prevInput = "";
        let content = cm.getSelection();
        this.textarea.value = content;
        if (cm.state.focused) selectInput(this.textarea);
        if (ie && ie_version >= 9) this.hasSelection = content;
      } else if (!typing) {
        this.prevInput = this.textarea.value = "";
        if (ie && ie_version >= 9) this.hasSelection = null;
      }
    }

    getField() { return this.textarea }

    supportsTouch() { return false }

    focus() {
      if (this.cm.options.readOnly != "nocursor" && (!mobile || activeElt() != this.textarea)) {
        try { this.textarea.focus(); }
        catch (e) {} // IE8 will throw if the textarea is display: none or not in DOM
      }
    }

    blur() { this.textarea.blur(); }

    resetPosition() {
      this.wrapper.style.top = this.wrapper.style.left = 0;
    }

    receivedFocus() { this.slowPoll(); }

    // Poll for input changes, using the normal rate of polling. This
    // runs as long as the editor is focused.
    slowPoll() {
      if (this.pollingFast) return
      this.polling.set(this.cm.options.pollInterval, () => {
        this.poll();
        if (this.cm.state.focused) this.slowPoll();
      });
    }

    // When an event has just come in that is likely to add or change
    // something in the input textarea, we poll faster, to ensure that
    // the change appears on the screen quickly.
    fastPoll() {
      let missed = false, input = this;
      input.pollingFast = true;
      function p() {
        let changed = input.poll();
        if (!changed && !missed) {missed = true; input.polling.set(60, p);}
        else {input.pollingFast = false; input.slowPoll();}
      }
      input.polling.set(20, p);
    }

    // Read input from the textarea, and update the document to match.
    // When something is selected, it is present in the textarea, and
    // selected (unless it is huge, in which case a placeholder is
    // used). When nothing is selected, the cursor sits after previously
    // seen text (can be empty), which is stored in prevInput (we must
    // not reset the textarea when typing, because that breaks IME).
    poll() {
      let cm = this.cm, input = this.textarea, prevInput = this.prevInput;
      // Since this is called a *lot*, try to bail out as cheaply as
      // possible when it is clear that nothing happened. hasSelection
      // will be the case when there is a lot of text in the textarea,
      // in which case reading its value would be expensive.
      if (this.contextMenuPending || !cm.state.focused ||
          (hasSelection(input) && !prevInput && !this.composing) ||
          cm.isReadOnly() || cm.options.disableInput || cm.state.keySeq)
        return false

      let text = input.value;
      // If nothing changed, bail.
      if (text == prevInput && !cm.somethingSelected()) return false
      // Work around nonsensical selection resetting in IE9/10, and
      // inexplicable appearance of private area unicode characters on
      // some key combos in Mac (#2689).
      if (ie && ie_version >= 9 && this.hasSelection === text ||
          mac && /[\uf700-\uf7ff]/.test(text)) {
        cm.display.input.reset();
        return false
      }

      if (cm.doc.sel == cm.display.selForContextMenu) {
        let first = text.charCodeAt(0);
        if (first == 0x200b && !prevInput) prevInput = "\u200b";
        if (first == 0x21da) { this.reset(); return this.cm.execCommand("undo") }
      }
      // Find the part of the input that is actually new
      let same = 0, l = Math.min(prevInput.length, text.length);
      while (same < l && prevInput.charCodeAt(same) == text.charCodeAt(same)) ++same;

      runInOp(cm, () => {
        applyTextInput(cm, text.slice(same), prevInput.length - same,
                       null, this.composing ? "*compose" : null);

        // Don't leave long text in the textarea, since it makes further polling slow
        if (text.length > 1000 || text.indexOf("\n") > -1) input.value = this.prevInput = "";
        else this.prevInput = text;

        if (this.composing) {
          this.composing.range.clear();
          this.composing.range = cm.markText(this.composing.start, cm.getCursor("to"),
                                             {className: "CodeMirror-composing"});
        }
      });
      return true
    }

    ensurePolled() {
      if (this.pollingFast && this.poll()) this.pollingFast = false;
    }

    onKeyPress() {
      if (ie && ie_version >= 9) this.hasSelection = null;
      this.fastPoll();
    }

    onContextMenu(e) {
      let input = this, cm = input.cm, display = cm.display, te = input.textarea;
      if (input.contextMenuPending) input.contextMenuPending();
      let pos = posFromMouse(cm, e), scrollPos = display.scroller.scrollTop;
      if (!pos || presto) return // Opera is difficult.

      // Reset the current text selection only if the click is done outside of the selection
      // and 'resetSelectionOnContextMenu' option is true.
      let reset = cm.options.resetSelectionOnContextMenu;
      if (reset && cm.doc.sel.contains(pos) == -1)
        operation(cm, setSelection)(cm.doc, simpleSelection(pos), sel_dontScroll);

      let oldCSS = te.style.cssText, oldWrapperCSS = input.wrapper.style.cssText;
      let wrapperBox = input.wrapper.offsetParent.getBoundingClientRect();
      input.wrapper.style.cssText = "position: static";
      te.style.cssText = `position: absolute; width: 30px; height: 30px;
      top: ${e.clientY - wrapperBox.top - 5}px; left: ${e.clientX - wrapperBox.left - 5}px;
      z-index: 1000; background: ${ie ? "rgba(255, 255, 255, .05)" : "transparent"};
      outline: none; border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);`;
      let oldScrollY;
      if (webkit) oldScrollY = window.scrollY; // Work around Chrome issue (#2712)
      display.input.focus();
      if (webkit) window.scrollTo(null, oldScrollY);
      display.input.reset();
      // Adds "Select all" to context menu in FF
      if (!cm.somethingSelected()) te.value = input.prevInput = " ";
      input.contextMenuPending = rehide;
      display.selForContextMenu = cm.doc.sel;
      clearTimeout(display.detectingSelectAll);

      // Select-all will be greyed out if there's nothing to select, so
      // this adds a zero-width space so that we can later check whether
      // it got selected.
      function prepareSelectAllHack() {
        if (te.selectionStart != null) {
          let selected = cm.somethingSelected();
          let extval = "\u200b" + (selected ? te.value : "");
          te.value = "\u21da"; // Used to catch context-menu undo
          te.value = extval;
          input.prevInput = selected ? "" : "\u200b";
          te.selectionStart = 1; te.selectionEnd = extval.length;
          // Re-set this, in case some other handler touched the
          // selection in the meantime.
          display.selForContextMenu = cm.doc.sel;
        }
      }
      function rehide() {
        if (input.contextMenuPending != rehide) return
        input.contextMenuPending = false;
        input.wrapper.style.cssText = oldWrapperCSS;
        te.style.cssText = oldCSS;
        if (ie && ie_version < 9) display.scrollbars.setScrollTop(display.scroller.scrollTop = scrollPos);

        // Try to detect the user choosing select-all
        if (te.selectionStart != null) {
          if (!ie || (ie && ie_version < 9)) prepareSelectAllHack();
          let i = 0, poll = () => {
            if (display.selForContextMenu == cm.doc.sel && te.selectionStart == 0 &&
                te.selectionEnd > 0 && input.prevInput == "\u200b") {
              operation(cm, selectAll)(cm);
            } else if (i++ < 10) {
              display.detectingSelectAll = setTimeout(poll, 500);
            } else {
              display.selForContextMenu = null;
              display.input.reset();
            }
          };
          display.detectingSelectAll = setTimeout(poll, 200);
        }
      }

      if (ie && ie_version >= 9) prepareSelectAllHack();
      if (captureRightClick) {
        e_stop(e);
        let mouseup = () => {
          off(window, "mouseup", mouseup);
          setTimeout(rehide, 20);
        };
        on(window, "mouseup", mouseup);
      } else {
        setTimeout(rehide, 50);
      }
    }

    readOnlyChanged(val) {
      if (!val) this.reset();
      this.textarea.disabled = val == "nocursor";
    }

    setUneditable() {}
  }

  TextareaInput.prototype.needsContentAttribute = false;

  function fromTextArea(textarea, options) {
    options = options ? copyObj(options) : {};
    options.value = textarea.value;
    if (!options.tabindex && textarea.tabIndex)
      options.tabindex = textarea.tabIndex;
    if (!options.placeholder && textarea.placeholder)
      options.placeholder = textarea.placeholder;
    // Set autofocus to true if this textarea is focused, or if it has
    // autofocus and no other element is focused.
    if (options.autofocus == null) {
      let hasFocus = activeElt();
      options.autofocus = hasFocus == textarea ||
        textarea.getAttribute("autofocus") != null && hasFocus == document.body;
    }

    function save() {textarea.value = cm.getValue();}

    let realSubmit;
    if (textarea.form) {
      on(textarea.form, "submit", save);
      // Deplorable hack to make the submit method do the right thing.
      if (!options.leaveSubmitMethodAlone) {
        let form = textarea.form;
        realSubmit = form.submit;
        try {
          let wrappedSubmit = form.submit = () => {
            save();
            form.submit = realSubmit;
            form.submit();
            form.submit = wrappedSubmit;
          };
        } catch(e) {}
      }
    }

    options.finishInit = cm => {
      cm.save = save;
      cm.getTextArea = () => textarea;
      cm.toTextArea = () => {
        cm.toTextArea = isNaN; // Prevent this from being ran twice
        save();
        textarea.parentNode.removeChild(cm.getWrapperElement());
        textarea.style.display = "";
        if (textarea.form) {
          off(textarea.form, "submit", save);
          if (typeof textarea.form.submit == "function")
            textarea.form.submit = realSubmit;
        }
      };
    };

    textarea.style.display = "none";
    let cm = CodeMirror(node => textarea.parentNode.insertBefore(node, textarea.nextSibling),
      options);
    return cm
  }

  function addLegacyProps(CodeMirror) {
    CodeMirror.off = off;
    CodeMirror.on = on;
    CodeMirror.wheelEventPixels = wheelEventPixels;
    CodeMirror.Doc = Doc$1;
    CodeMirror.splitLines = splitLinesAuto;
    CodeMirror.countColumn = countColumn;
    CodeMirror.findColumn = findColumn;
    CodeMirror.isWordChar = isWordCharBasic;
    CodeMirror.Pass = Pass;
    CodeMirror.signal = signal;
    CodeMirror.Line = Line;
    CodeMirror.changeEnd = changeEnd;
    CodeMirror.scrollbarModel = scrollbarModel;
    CodeMirror.Pos = Pos;
    CodeMirror.cmpPos = cmp;
    CodeMirror.modes = modes;
    CodeMirror.mimeModes = mimeModes;
    CodeMirror.resolveMode = resolveMode;
    CodeMirror.getMode = getMode;
    CodeMirror.modeExtensions = modeExtensions;
    CodeMirror.extendMode = extendMode;
    CodeMirror.copyState = copyState;
    CodeMirror.startState = startState;
    CodeMirror.innerMode = innerMode;
    CodeMirror.commands = commands$2;
    CodeMirror.keyMap = keyMap;
    CodeMirror.keyName = keyName;
    CodeMirror.isModifierKey = isModifierKey;
    CodeMirror.lookupKey = lookupKey;
    CodeMirror.normalizeKeyMap = normalizeKeyMap;
    CodeMirror.StringStream = StringStream;
    CodeMirror.SharedTextMarker = SharedTextMarker;
    CodeMirror.TextMarker = TextMarker;
    CodeMirror.LineWidget = LineWidget;
    CodeMirror.e_preventDefault = e_preventDefault;
    CodeMirror.e_stopPropagation = e_stopPropagation;
    CodeMirror.e_stop = e_stop;
    CodeMirror.addClass = addClass;
    CodeMirror.contains = contains;
    CodeMirror.rmClass = rmClass;
    CodeMirror.keyNames = keyNames;
  }

  // EDITOR CONSTRUCTOR

  defineOptions(CodeMirror);

  addEditorMethods(CodeMirror);

  // Set up methods on CodeMirror's prototype to redirect to the editor's document.
  let dontDelegate = "iter insert remove copy getEditor constructor".split(" ");
  for (let prop in Doc$1.prototype) if (Doc$1.prototype.hasOwnProperty(prop) && indexOf(dontDelegate, prop) < 0)
    CodeMirror.prototype[prop] = (function(method) {
      return function() {return method.apply(this.doc, arguments)}
    })(Doc$1.prototype[prop]);

  eventMixin(Doc$1);
  CodeMirror.inputStyles = {"textarea": TextareaInput, "contenteditable": ContentEditableInput};

  // Extra arguments are stored as the mode's dependencies, which is
  // used by (legacy) mechanisms like loadmode.js to automatically
  // load a mode. (Preferred mechanism is the require/define calls.)
  CodeMirror.defineMode = function(name/*, mode, …*/) {
    if (!CodeMirror.defaults.mode && name != "null") CodeMirror.defaults.mode = name;
    defineMode.apply(this, arguments);
  };

  CodeMirror.defineMIME = defineMIME;

  // Minimal default mode.
  CodeMirror.defineMode("null", () => ({token: stream => stream.skipToEnd()}));
  CodeMirror.defineMIME("text/plain", "null");

  // EXTENSIONS

  CodeMirror.defineExtension = (name, func) => {
    CodeMirror.prototype[name] = func;
  };
  CodeMirror.defineDocExtension = (name, func) => {
    Doc$1.prototype[name] = func;
  };

  CodeMirror.fromTextArea = fromTextArea;

  addLegacyProps(CodeMirror);

  CodeMirror.version = "5.48.0";

  // XML Mode (TODO: put it somewhere else!)

  (function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
      mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
      define(["../../lib/codemirror"], mod);
    else // Plain browser env
      mod(CodeMirror);
  })(function(CodeMirror$$1) {

  var htmlConfig = {
    autoSelfClosers: {'area': true, 'base': true, 'br': true, 'col': true, 'command': true,
                      'embed': true, 'frame': true, 'hr': true, 'img': true, 'input': true,
                      'keygen': true, 'link': true, 'meta': true, 'param': true, 'source': true,
                      'track': true, 'wbr': true, 'menuitem': true},
    implicitlyClosed: {'dd': true, 'li': true, 'optgroup': true, 'option': true, 'p': true,
                       'rp': true, 'rt': true, 'tbody': true, 'td': true, 'tfoot': true,
                       'th': true, 'tr': true},
    contextGrabbers: {
      'dd': {'dd': true, 'dt': true},
      'dt': {'dd': true, 'dt': true},
      'li': {'li': true},
      'option': {'option': true, 'optgroup': true},
      'optgroup': {'optgroup': true},
      'p': {'address': true, 'article': true, 'aside': true, 'blockquote': true, 'dir': true,
            'div': true, 'dl': true, 'fieldset': true, 'footer': true, 'form': true,
            'h1': true, 'h2': true, 'h3': true, 'h4': true, 'h5': true, 'h6': true,
            'header': true, 'hgroup': true, 'hr': true, 'menu': true, 'nav': true, 'ol': true,
            'p': true, 'pre': true, 'section': true, 'table': true, 'ul': true},
      'rp': {'rp': true, 'rt': true},
      'rt': {'rp': true, 'rt': true},
      'tbody': {'tbody': true, 'tfoot': true},
      'td': {'td': true, 'th': true},
      'tfoot': {'tbody': true},
      'th': {'td': true, 'th': true},
      'thead': {'tbody': true, 'tfoot': true},
      'tr': {'tr': true}
    },
    doNotIndent: {"pre": true},
    allowUnquoted: true,
    allowMissing: true,
    caseFold: true
  };

  var xmlConfig = {
    autoSelfClosers: {},
    implicitlyClosed: {},
    contextGrabbers: {},
    doNotIndent: {},
    allowUnquoted: false,
    allowMissing: false,
    allowMissingTagName: false,
    caseFold: false
  };

  CodeMirror$$1.defineMode("xml", function(editorConf, config_) {
    var indentUnit = editorConf.indentUnit;
    var config = {};
    var defaults = config_.htmlMode ? htmlConfig : xmlConfig;
    for (var prop in defaults) config[prop] = defaults[prop];
    for (var prop in config_) config[prop] = config_[prop];

    // Return variables for tokenizers
    var type, setStyle;

    function inText(stream, state) {
      function chain(parser) {
        state.tokenize = parser;
        return parser(stream, state);
      }

      var ch = stream.next();
      if (ch == "<") {
        if (stream.eat("!")) {
          if (stream.eat("[")) {
            if (stream.match("CDATA[")) return chain(inBlock("atom", "]]>"));
            else return null;
          } else if (stream.match("--")) {
            return chain(inBlock("comment", "-->"));
          } else if (stream.match("DOCTYPE", true, true)) {
            stream.eatWhile(/[\w\._\-]/);
            return chain(doctype(1));
          } else {
            return null;
          }
        } else if (stream.eat("?")) {
          stream.eatWhile(/[\w\._\-]/);
          state.tokenize = inBlock("meta", "?>");
          return "meta";
        } else {
          type = stream.eat("/") ? "closeTag" : "openTag";
          state.tokenize = inTag;
          return "tag bracket";
        }
      } else if (ch == "&") {
        var ok;
        if (stream.eat("#")) {
          if (stream.eat("x")) {
            ok = stream.eatWhile(/[a-fA-F\d]/) && stream.eat(";");
          } else {
            ok = stream.eatWhile(/[\d]/) && stream.eat(";");
          }
        } else {
          ok = stream.eatWhile(/[\w\.\-:]/) && stream.eat(";");
        }
        return ok ? "atom" : "error";
      } else {
        stream.eatWhile(/[^&<]/);
        return null;
      }
    }
    inText.isInText = true;

    function inTag(stream, state) {
      var ch = stream.next();
      if (ch == ">" || (ch == "/" && stream.eat(">"))) {
        state.tokenize = inText;
        type = ch == ">" ? "endTag" : "selfcloseTag";
        return "tag bracket";
      } else if (ch == "=") {
        type = "equals";
        return null;
      } else if (ch == "<") {
        state.tokenize = inText;
        state.state = baseState;
        state.tagName = state.tagStart = null;
        var next = state.tokenize(stream, state);
        return next ? next + " tag error" : "tag error";
      } else if (/[\'\"]/.test(ch)) {
        state.tokenize = inAttribute(ch);
        state.stringStartCol = stream.column();
        return state.tokenize(stream, state);
      } else {
        stream.match(/^[^\s\u00a0=<>\"\']*[^\s\u00a0=<>\"\'\/]/);
        return "word";
      }
    }

    function inAttribute(quote) {
      var closure = function(stream, state) {
        while (!stream.eol()) {
          if (stream.next() == quote) {
            state.tokenize = inTag;
            break;
          }
        }
        return "string";
      };
      closure.isInAttribute = true;
      return closure;
    }

    function inBlock(style, terminator) {
      return function(stream, state) {
        while (!stream.eol()) {
          if (stream.match(terminator)) {
            state.tokenize = inText;
            break;
          }
          stream.next();
        }
        return style;
      }
    }

    function doctype(depth) {
      return function(stream, state) {
        var ch;
        while ((ch = stream.next()) != null) {
          if (ch == "<") {
            state.tokenize = doctype(depth + 1);
            return state.tokenize(stream, state);
          } else if (ch == ">") {
            if (depth == 1) {
              state.tokenize = inText;
              break;
            } else {
              state.tokenize = doctype(depth - 1);
              return state.tokenize(stream, state);
            }
          }
        }
        return "meta";
      };
    }

    function Context(state, tagName, startOfLine) {
      this.prev = state.context;
      this.tagName = tagName;
      this.indent = state.indented;
      this.startOfLine = startOfLine;
      if (config.doNotIndent.hasOwnProperty(tagName) || (state.context && state.context.noIndent))
        this.noIndent = true;
    }
    function popContext(state) {
      if (state.context) state.context = state.context.prev;
    }
    function maybePopContext(state, nextTagName) {
      var parentTagName;
      while (true) {
        if (!state.context) {
          return;
        }
        parentTagName = state.context.tagName;
        if (!config.contextGrabbers.hasOwnProperty(parentTagName) ||
            !config.contextGrabbers[parentTagName].hasOwnProperty(nextTagName)) {
          return;
        }
        popContext(state);
      }
    }

    function baseState(type, stream, state) {
      if (type == "openTag") {
        state.tagStart = stream.column();
        return tagNameState;
      } else if (type == "closeTag") {
        return closeTagNameState;
      } else {
        return baseState;
      }
    }
    function tagNameState(type, stream, state) {
      if (type == "word") {
        state.tagName = stream.current();
        setStyle = "tag";
        return attrState;
      } else if (config.allowMissingTagName && type == "endTag") {
        setStyle = "tag bracket";
        return attrState(type, stream, state);
      } else {
        setStyle = "error";
        return tagNameState;
      }
    }
    function closeTagNameState(type, stream, state) {
      if (type == "word") {
        var tagName = stream.current();
        if (state.context && state.context.tagName != tagName &&
            config.implicitlyClosed.hasOwnProperty(state.context.tagName))
          popContext(state);
        if ((state.context && state.context.tagName == tagName) || config.matchClosing === false) {
          setStyle = "tag";
          return closeState;
        } else {
          setStyle = "tag error";
          return closeStateErr;
        }
      } else if (config.allowMissingTagName && type == "endTag") {
        setStyle = "tag bracket";
        return closeState(type, stream, state);
      } else {
        setStyle = "error";
        return closeStateErr;
      }
    }

    function closeState(type, _stream, state) {
      if (type != "endTag") {
        setStyle = "error";
        return closeState;
      }
      popContext(state);
      return baseState;
    }
    function closeStateErr(type, stream, state) {
      setStyle = "error";
      return closeState(type, stream, state);
    }

    function attrState(type, _stream, state) {
      if (type == "word") {
        setStyle = "attribute";
        return attrEqState;
      } else if (type == "endTag" || type == "selfcloseTag") {
        var tagName = state.tagName, tagStart = state.tagStart;
        state.tagName = state.tagStart = null;
        if (type == "selfcloseTag" ||
            config.autoSelfClosers.hasOwnProperty(tagName)) {
          maybePopContext(state, tagName);
        } else {
          maybePopContext(state, tagName);
          state.context = new Context(state, tagName, tagStart == state.indented);
        }
        return baseState;
      }
      setStyle = "error";
      return attrState;
    }
    function attrEqState(type, stream, state) {
      if (type == "equals") return attrValueState;
      if (!config.allowMissing) setStyle = "error";
      return attrState(type, stream, state);
    }
    function attrValueState(type, stream, state) {
      if (type == "string") return attrContinuedState;
      if (type == "word" && config.allowUnquoted) {setStyle = "string"; return attrState;}
      setStyle = "error";
      return attrState(type, stream, state);
    }
    function attrContinuedState(type, stream, state) {
      if (type == "string") return attrContinuedState;
      return attrState(type, stream, state);
    }

    return {
      startState: function(baseIndent) {
        var state = {tokenize: inText,
                     state: baseState,
                     indented: baseIndent || 0,
                     tagName: null, tagStart: null,
                     context: null};
        if (baseIndent != null) state.baseIndent = baseIndent;
        return state
      },

      token: function(stream, state) {
        if (!state.tagName && stream.sol())
          state.indented = stream.indentation();

        if (stream.eatSpace()) return null;
        type = null;
        var style = state.tokenize(stream, state);
        if ((style || type) && style != "comment") {
          setStyle = null;
          state.state = state.state(type || style, stream, state);
          if (setStyle)
            style = setStyle == "error" ? style + " error" : setStyle;
        }
        return style;
      },

      indent: function(state, textAfter, fullLine) {
        var context = state.context;
        // Indent multi-line strings (e.g. css).
        if (state.tokenize.isInAttribute) {
          if (state.tagStart == state.indented)
            return state.stringStartCol + 1;
          else
            return state.indented + indentUnit;
        }
        if (context && context.noIndent) return CodeMirror$$1.Pass;
        if (state.tokenize != inTag && state.tokenize != inText)
          return fullLine ? fullLine.match(/^(\s*)/)[0].length : 0;
        // Indent the starts of attribute names.
        if (state.tagName) {
          if (config.multilineTagIndentPastTag !== false)
            return state.tagStart + state.tagName.length + 2;
          else
            return state.tagStart + indentUnit * (config.multilineTagIndentFactor || 1);
        }
        if (config.alignCDATA && /<!\[CDATA\[/.test(textAfter)) return 0;
        var tagAfter = textAfter && /^<(\/)?([\w_:\.-]*)/.exec(textAfter);
        if (tagAfter && tagAfter[1]) { // Closing tag spotted
          while (context) {
            if (context.tagName == tagAfter[2]) {
              context = context.prev;
              break;
            } else if (config.implicitlyClosed.hasOwnProperty(context.tagName)) {
              context = context.prev;
            } else {
              break;
            }
          }
        } else if (tagAfter) { // Opening tag spotted
          while (context) {
            var grabbers = config.contextGrabbers[context.tagName];
            if (grabbers && grabbers.hasOwnProperty(tagAfter[2]))
              context = context.prev;
            else
              break;
          }
        }
        while (context && context.prev && !context.startOfLine)
          context = context.prev;
        if (context) return context.indent + indentUnit;
        else return state.baseIndent || 0;
      },

      electricInput: /<\/[\s\w:]+>$/,
      blockCommentStart: "<!--",
      blockCommentEnd: "-->",

      configuration: config.htmlMode ? "html" : "xml",
      helperType: config.htmlMode ? "html" : "xml",

      skipAttribute: function(state) {
        if (state.state == attrValueState)
          state.state = attrState;
      }
    };
  });

  CodeMirror$$1.defineMIME("text/xml", "xml");
  CodeMirror$$1.defineMIME("application/xml", "xml");
  if (!CodeMirror$$1.mimeModes.hasOwnProperty("text/html"))
    CodeMirror$$1.defineMIME("text/html", {name: "xml", htmlMode: true});

  });

  const editor$1 = {
    init(state) {
      this.name = 'editor';
      this.mountPoint = document.querySelector(`#editor`);
      this.editor = CodeMirror(this.mountPoint, {
        lineNumbers: true,
        lineWrapping: true,
        mode: 'xml',
        value: state.syntaxTree.toMarkup(),
      });
      this.markupDoc = this.editor.getDoc();
      this.previousSyntaxTree = state.syntaxTree;

      return this;
    },

    bindEvents(func) {
      this.bindCodemirrorEvents();
      this.bindCustomEvents(func);
    },

    bindCodemirrorEvents() {
      this.editor.on('change', (instance, changeObj) => {
        if (changeObj.origin !== 'setValue') {
          window.dispatchEvent(new CustomEvent('userChangedMarkup'));
        }
      });

      this.editor.on('beforeSelectionChange', (instance, obj) => {
        if (obj.origin !== undefined) {
          obj.update(obj.ranges);
          const cursorPosition = obj.ranges[0].anchor;
          const index = this.markupDoc.indexFromPos(cursorPosition);
          window.dispatchEvent(
            new CustomEvent('userChangedEditorSelection', { detail: index })
          );
        }
      });
    },

    bindCustomEvents(func) {
      window.addEventListener('userChangedMarkup', event => {
        console.log('user changed markup');

        func({
          source: this.name,
          type: 'userChangedMarkup',
          value: this.editor.getValue(),
        });
      });

      window.addEventListener('userChangedEditorSelection', event => {
        console.log('user changed selection');

        func({
          source: this.name,
          type: 'userChangedEditorSelection',
          index: event.detail,
        });
      });
    },

    react(state) {
      // clear text marker
      if (this.textMarker) {
        this.textMarker.clear();
      }

      // update document value
      if (this.previousSyntaxTree.toMarkup() !== state.syntaxTree.toMarkup()) {
        this.ignoreCursor = true;
        const cursor = this.markupDoc.getCursor();
        this.markupDoc.setValue(state.syntaxTree.toMarkup());
        this.markupDoc.setCursor(cursor);
        this.ignoreCursor = false;
      }

      // set text marker
      const node = state.syntaxTree.findNodeByClassName('selected');
      if (node) {
        const from = this.editor.doc.posFromIndex(node.start);
        const to = this.editor.doc.posFromIndex(node.end + 1);
        const range = [from, to];
        this.textMarker = this.markupDoc.markText(...range, {
          className: 'selected-markup',
        });
      }

      // store syntax tree received
      this.previousSyntaxTree = state.syntaxTree;
    },
  };

  // const anchor = this.markupDoc.getCursor('anchor');
  // const head = this.markupDoc.getCursor('head');
  // this.markupDoc.setSelection(anchor, head);

  const tools$1 = Object.assign(Object.create(UIModule), {
    init(state) {
      this.name = 'tools';
      UIModule.init.bind(this)(state);
      return this;
    },

    bindEvents(func) {
      this.mountPoint.addEventListener('click', event => {
        event.preventDefault();

        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.blur();
        }

        func({
          source: this.name,
          type: event.type,
          target: event.target.dataset.type,
          key: event.target.dataset.key,
        });
      });
    },

    // TODO: custom react function? only need to update documents (Open menu item)
  });

  const message$1 = Object.assign(Object.create(UIModule), {
    init(state) {
      this.name = 'message';
      UIModule.init.bind(this)(state);
      return this;
    },

    bindEvents(func) {
      window.addEventListener('wipeMessage', event => {
        func({
          source: this.name,
          type: 'wipeMessage',
        });
      });
    },

    reconcile(oldVNode, newVNode, $node) {
      // if the message has changed, replace it
      if (oldVNode !== newVNode) {
        $node.textContent = newVNode;
      }

      // if a timer has been set earlier, clear it
      if (this.timer) {
        clearTimeout(this.timer);
      }

      // if the message is non-empty, delete it after one second
      if (newVNode !== '') {
        this.timer = window.setTimeout(this.wipeMessage, 1000);
      }
    },

    wipeMessage() {
      window.dispatchEvent(new Event('wipeMessage'));
    },
  });

  const modules = [canvas$1, editor$1, tools$1, message$1, hist, db];

  const app = {
    init() {
      core.init();

      for (let module of modules) {
        module.init(core.state.export());
        module.bindEvents(core.compute.bind(core));
        core.attach(module.name, module.react.bind(module));
      }

      core.kickoff();
    },
  };

  document.addEventListener('DOMContentLoaded', app.init);

}());
//# sourceMappingURL=bundle.js.map
