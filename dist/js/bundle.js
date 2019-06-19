(function () {
  'use strict';

  const Vector = {
    create(x = 0, y = 0) {
      return Object.create(Vector).init(x, y);
    },

    createFromObject(object) {
      return Object.create(Vector).init(object.x, object.y);
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
      return matrix.transform(this);
    },

    // return value: new Vector instance
    rotate(angle, vector) {
      return this.transform(Matrix.rotation(Math.PI, vector));
    },

    // return value: new Vector instance
    add(other) {
      return Vector.create(this.x + other.x, this.y + other.y);
    },

    // return value: new Vector instance
    minus(other) {
      return Vector.create(this.x - other.x, this.y - other.y);
    },

    // return value: new Vector instance
    abs() {
      return Vector.create(Math.abs(this.x), Math.abs(this.y));
    },

    // return value: boolean
    isWithin(rectangle) {
      return this.x >= rectangle.x &&
             this.x <= rectangle.x + rectangle.width &&
             this.y >= rectangle.y &&
             this.y <= rectangle.y + rectangle.height;
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
  };

  const Matrix = {
    create(m) {
      return Object.create(Matrix).init(m);
    },

    init(m) {
      this.m = m;
      return this;
    },

    createFromDOMMatrix($matrix) {
      const m = [
        [$matrix.a, $matrix.c, $matrix.e],
        [$matrix.b, $matrix.d, $matrix.f],
        [0,         0,         1        ]
      ];

      return Matrix.create(m);
    },

    toJSON() {
      return this.m;
    },

    // return value: string
    toString() {
      const sixValueMatrix = [
        this.m[0][0], this.m[1][0], this.m[0][1],
        this.m[1][1], this.m[0][2], this.m[1][2]
      ];

      return `matrix(${sixValueMatrix})`;
    },

    // return value: new Vector instance
    transform(vector) {
      const column      = Matrix.create([[vector.x], [vector.y], [1]]);
      const transformed = this.multiply(column).toArray();

      return Vector.create(transformed[0][0], transformed[1][0]);
    },

    // return value: Array
    toArray() {
      return this.m;
    },

    // return value: new Matrix instance
    multiply(other) {
      const m = math.multiply(this.m, other.m);
      return Matrix.create(m);
    },

    // return value: new Matrix instance
    invert() {
      const m = JSON.parse(JSON.stringify(this.m));
      return Matrix.create(math.inv(m));
    },

    // return value: new Matrix instance
    identity() {
      const m = JSON.parse(JSON.stringify(
        [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1]
        ]
      ));

      return Matrix.create(m);
    },

    // return value: new Matrix instance
    rotation(angle, origin) {
      const sin                = Math.sin(angle);
      const cos                = Math.cos(angle);

      const m = [
        [cos, -sin, -origin.x * cos + origin.y * sin + origin.x],
        [sin,  cos, -origin.x * sin - origin.y * cos + origin.y],
        [0,    0,    1                                         ]
      ];

      return Matrix.create(m);
    },

    // return value: new Matrix instance
    translation(vector) {
      const m = [
        [1, 0, vector.x],
        [0, 1, vector.y],
        [0, 0, 1       ]
      ];

      return Matrix.create(m);
    },

    // return value: new Matrix instance
    scale(factor, origin = Vector.create(0, 0)) {
      const m = [
        [factor, 0,      origin.x - factor * origin.x],
        [0,      factor, origin.y - factor * origin.y],
        [0,      0,      1                           ]
      ];

      return Matrix.create(m);
    },
  };

  const Rectangle = {
    // => two vectors (origin and size)
    create(origin = Vector.create(), size = Vector.create()) {
      return Object.create(Rectangle).init(origin, size);
    },

    init(origin, size) {
      this.origin = origin;
      this.size = size;

      return this;
    },

    // => 4 integers
    createFromDimensions(x, y, width, height) {
      const origin = Vector.create(x, y);
      const size   = Vector.create(width, height);

      return Rectangle.create(origin, size);
    },

    // => { x: ..., y: ..., width: ..., height: ...}
    createFromObject(object) {
      const origin = Vector.create(object.x, object.y);
      const size   = Vector.create(object.width, object.height);

      return Rectangle.create(origin, size);
    },

    // => two vectors (from and to, or equivalently, min and max)
    createFromMinMax(min, max) {
      const origin = Vector.create(min.x, min.y);
      const size   = Vector.create(max.x - min.x, max.y - min.y);

      return Rectangle.create(origin, size);
    },

    get min() {
      return this.origin;
    },

    get max() {
      return Vector.create(this.origin.x + this.size.x, this.origin.y + this.size.y);
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
        this.min,                                                  // nw
        Vector.create(this.origin.x + this.size.x, this.origin.y), // ne
        Vector.create(this.origin.x, this.origin.y + this.size.y), // sw
        this.max                                                   // se
      ];
    },

    get center() {
      return Vector.create(this.x + this.width / 2, this.y + this.height / 2);
    },

    // smallest rectangle enclosing `this` and `other`
    getBoundingRect(other) {
      let min = Vector.create();
      let max = Vector.create();

      min.x = Math.min(this.min.x, other.min.x);
      min.y = Math.min(this.min.y, other.min.y);
      max.x = Math.max(this.max.x, other.max.x);
      max.y = Math.max(this.max.y, other.max.y);

      return Rectangle.createFromMinMax(min, max);
    },

    transform(matrix) {
      return Rectangle.create(
        this.origin.transform(matrix),
        this.size.transform(matrix)
      );
    },

    toString() {
      return [
        this.origin.x,
        this.origin.y,
        this.size.x,
        this.size.y,
      ].join(' ');
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
    min = Math.min,
    max = Math.max,
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
      var mx = min(line.p1.x, line.p2.x),
        my = min(line.p1.y, line.p2.y),
        MX = max(line.p1.x, line.p2.x),
        MY = max(line.p1.y, line.p2.y),
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

  const Curve = {
    // the params are Vector instances
    create(anchor1, anchor2, handle1, handle2) {
      return Object.create(Curve).init(anchor1, anchor2, handle1, handle2);
    },

    // the params are Segment instances
    createFromSegments(segment1, segment2) {
      return Curve.create(
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
    points() {
      const pts = [this.anchor1, this.handle1, this.handle2, this.anchor2]
        .filter((point) => {
          return (point !== undefined && point !== null);
        });

      return pts;
    },

    coords() {
      const cds = this.points().map(point => point.coords());
      return cds;
    },

    isLine() {
      return (this.handle1 === undefined || this.handle1 === null) && (this.handle2 === undefined || this.handle1 === null);
    },

    isQuadratic() {
      return (this.handle1 !== undefined || this.handle1 === null) && (this.handle2 === undefined || this.handle1 === null);
    },

    isCubic() {
      return (this.handle1 !== undefined || this.handle1 === null) && (this.handle2 !== undefined || this.handle1 === null);
    },

    get bounds() {
      let min, max;

      if (this.isLine()) {
        const minX = Math.min(this.anchor1.x, this.anchor2.x);
        const minY = Math.min(this.anchor1.y, this.anchor2.y);
        const maxX = Math.max(this.anchor1.x, this.anchor2.x);
        const maxY = Math.max(this.anchor1.y, this.anchor2.y);

        min  = Vector.create(minX, minY);
        max  = Vector.create(maxX, maxY);
      } else {
        const bbox = new Bezier(...this.coords()).bbox();

        min = Vector.create(bbox.x.min, bbox.y.min);
        max = Vector.create(bbox.x.max, bbox.y.max);
      }

      return Rectangle.createFromMinMax(min, max);
    },
  };

  const createID = () => {
    const randomString = Math.random().toString(36).substring(2);
    const timestamp    = (new Date()).getTime().toString(36);
    return randomString + timestamp;
  };

  const Node = {
    create(opts = {}) {
      const node = Object.create(this).init(opts);

      if (Object.getPrototypeOf(node) === Doc) {
        node._id = createID();
      }

      return node;
    },

    init(opts) {
      this.set(this.defaults());
      this.set(opts);

      return this;
    },

    defaults() {
      return {
        key:      createID(),
        children: [],
        parent:   null,
        payload: {
          transform: Matrix.identity(),
          class:     Class.create(),
          bounds:    null,
        },
      };
    },

    set(opts) {
      for (let key of Object.keys(opts)) {
        this[key] = opts[key];
      }
    },

    // hierarchy (predicates)

    isLeaf() {
      return this.children.length === 0;
    },

    isRoot() {
      return this.parent === null;
    },

    isSelected() {
      return this.class.includes('selected');
    },

    // hierarchy (getters)
    get root() {
      return this.findAncestor(
        node => node.parent === null
      );
    },

    get store() {
      return this.findAncestor(
        node => node.type === 'store'
      );
    },

    get message() {
      return this.root.findDescendant(
        node => node.type === 'message'
      );
    },

    get scene() {
      return this.root.findDescendant(
        node => node.type === 'scene'
      );
    },

    get docs() {
      return this.root.findDescendant(
        node => node.type === 'docs'
      );
    },

    get doc() {
      return this.root.findDescendant(
        node => node.type === 'doc'
      );
    },

    get leaves() {
      return this.findDescendants(
        node => node.children.length === 0
      );
    },

    get ancestors() {
      return this.findAncestors(
        node => true
      );
    },

    get properAncestors() {
      return this.parent.findAncestors(
        node => true
      );
    },

    get descendants() {
      return this.findDescendants(
        node => true
      );
    },

    get siblings() {
      return this.parent.children.filter(
        node => node !== this
      );
    },

    get graphicsChildren() {
      return this.children.filter(
        node => ['group', 'shape'].includes(node.type)
      );
    },

    get selected() {
      return this.scene.findDescendant((node) => {
        return node.class.includes('selected');
      });
    },

    get editing() {
      return this.scene.findDescendant((node) => {
        return node.class.includes('editing');
      });
    },

    get frontier() {
      return this.scene.findDescendants((node) => {
        return node.class.includes('frontier');
      });
    },

    // payload (getters/setters)

    get transform() {
      return this.payload.transform;
    },

    set transform(value) {
      this.payload.transform = value;
    },

    get class() {
      return this.payload.class;
    },

    set class(value) {
      this.payload.class = value;
    },

    get bounds() {
      if ([
        'segment', 'anchor', 'handleIn', 'handleOut'].includes(this.type)) {
        return null;
      }

      if (this.payload.bounds !== null) {
        return this.payload.bounds;
      }

      return this.memoizeBounds();
    },

    // TODO isnt' this the same as a setter with a different name?
    memoizeBounds() {
      const ignoredTypes = [
        'store',
        'doc',
        'scene',
        'segment',
        'anchor',
        'handleIn',
        'handleOut'
      ];

      if (ignoredTypes.includes(this.type)) { return; }

      const corners = [];
      for (let child of this.children) {
        for (let corner of child.bounds.corners) {
          corners.push(corner.transform(child.transform));
        }
      }

      const xValue  = vector => vector.x;
      const xValues = corners.map(xValue);
      const yValue  = vector => vector.y;
      const yValues = corners.map(yValue);

      const min = Vector.create(Math.min(...xValues), Math.min(...yValues));
      const max = Vector.create(Math.max(...xValues), Math.max(...yValues));

      const bounds = Rectangle.createFromMinMax(min, max);

      this.payload.bounds = bounds;
      return bounds;
    },

    set bounds(value) {
      this.payload.bounds = value;
    },

    get viewBox() {
      return this.payload.viewBox;
    },

    set viewBox(value) {
      this.payload.viewBox = value;
    },

    get vector() {
      return this.payload.vector;
    },

    set vector(value) {
      this.payload.vector = value;
    },

    // traversal

    // NOTE: a node is an ancestor of itself
    findAncestor(predicate) {
      if (predicate(this)) {
        return this;
      } else if (this.parent === null) {
        return null;
      } else {
        return this.parent.findAncestor(predicate);
      }
    },

    // NOTE: a node is an ancestor of itself
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

    // NOTE: a node is a descendant of itself
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

    // NOTE: a node is a descendant of itself
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
      return this.findDescendant((node) => {
        return node.key === key;
      });
    },

    findAncestorByClass(className) {
      return this.findAncestor((node) => {
        return node.class.includes(className);
      })
    },

    // append

    append(node) {
      this.children = this.children.concat([node]);
      node.parent = this;
    },

    replaceWith(node) {
      node.parent = this.parent;
      const index = this.parent.children.indexOf(this);
      this.parent.children.splice(index, 1, node);
    },

     // hit testing

    contains(globalPoint) {
      return globalPoint
        .transform(this.globalTransform().invert())
        .isWithin(this.bounds);
    },

    // classes

    setFrontier() {
      this.removeFrontier();

      if (this.selected) {
        this.selected.class = this.selected.class.add('frontier');

        let node = this.selected;

        do {
          for (let sibling of node.siblings) {
            sibling.class = sibling.class.add('frontier');
          }
          node = node.parent;
        } while (node.parent !== null);
      } else {
        for (let child of this.scene.children) {
          child.class = child.class.add('frontier');
        }
      }
    },

    removeFrontier() {
      const frontier = this.scene.findDescendants((node) => {
        return node.class.includes('frontier');
      });

      for (let node of frontier) {
        node.class.remove('frontier');
      }
    },

    focus() {
      this.class = this.class.add('focus');
    },

    unfocusAll() {
      const focussed = this.scene.findDescendants((node) => {
        return node.class.includes('focus');
      });

      for (let node of focussed) {
        node.class.remove('focus');
      }
    },

    select() {
      this.deselectAll();
      this.class = this.class.add('selected');
      this.setFrontier();
    },

    edit() {
      this.deselectAll();
      this.setFrontier();
      this.class = this.class.add('editing');
    },

    deselectAll() {
      if (this.selected) {
        this.selected.class.remove('selected');
      }
      this.setFrontier();
    },

    deeditAll() {
      if (this.editing) {
        this.editing.class.remove('editing');
      }
    },

    // transforms

    globalTransform() {
      return this.ancestorTransform().multiply(this.transform);
    },

    // NOTE: "ancestorTransform" in the sense of *proper* ancestors!
    ancestorTransform() {
      let matrix = Matrix.identity();

      // we use properAncestors, which does not include the current node:
      for (let ancestor of this.properAncestors.reverse()) {
        matrix = matrix.multiply(ancestor.transform);
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
      this.transform = this
        .ancestorTransform().invert()
        .multiply(Matrix.translation(offset))
        .multiply(this.globalTransform());
    },

    globalScaleFactor() {
      const total  = this.globalTransform();
      const a      = total.m[0][0];
      const b      = total.m[1][0];

      return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
    },

    // string encoding

    toJSON() {
      const plain = {
        key: this.key,
        type: this.type,
        children: this.children,
        payload: this.payload,
      };

      // TODO: awkward
      if (this._id) {
        plain._id = this._id;
      }

      return plain;
    },
  };

  // scene graph nodes
  const Scene     = Object.create(Node);
  const Group     = Object.create(Node);
  const Shape     = Object.create(Node);
  const Spline    = Object.create(Node);
  const Segment   = Object.create(Node);
  const Anchor    = Object.create(Node);
  const HandleIn  = Object.create(Node);
  const HandleOut = Object.create(Node);

  Scene.type     = 'scene';
  Group.type     = 'group';
  Shape.type     = 'shape';
  Spline.type    = 'spline';
  Segment.type   = 'segment';
  Anchor.type    = 'anchor';
  HandleIn.type  = 'handleIn';
  HandleOut.type = 'handleOut';

  // other types of nodes
  const Store      = Object.create(Node); // TODO: State
  const Doc        = Object.create(Node);
  const Docs       = Object.create(Node);
  const Message    = Object.create(Node);
  const Text       = Object.create(Node);
  const Identifier$1 = Object.create(Node);

  Store.type      = 'store'; // TODO: state
  Doc.type        = 'doc';
  Docs.type       = 'docs';
  Message.type    = 'message';
  Text.type       = 'text';
  Identifier$1.type = 'identifier';

  Scene.toVDOMNode = function() {
    return {
      tag:      'svg',
      children: [],
      props: {
        'data-key':   this.key,
        'data-type': 'content',
        'viewBox':    this.viewBox.toString(),
        xmlns:       'http://www.w3.org/2000/svg',
      },
    };
  };

  Group.toVDOMNode = function() {
    return {
      tag:      'g',
      children: [],
      props: {
        'data-key':   this.key,
        'data-type': 'content',
        transform:   this.transform.toString(),
        class:       this.class.toString(),
      },
    };
  };

  Shape.toVDOMNode = function() {
    return {
      tag:      'path',
      children: [],
      props: {
        'data-key':   this.key,
        'data-type': 'content',
        d:           this.pathString(),
        transform:   this.transform.toString(),
        class:       this.class.toString(),
      },
    };
  };

  // SHAPE

  Shape.pathString = function() {
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

  // SPLINE

  Spline.curves = function() {
    const theCurves = [];

    // the children of a Spline node are Segment nodes
    // from n segments, we obtain n - 1 curves
    for (let i = 0; i + 1 < this.children.length; i += 1) {
      const start = this.children[i];
      const end = this.children[i + 1];

      theCurves.push(Curve.createFromSegments(start, end));
    }

    return theCurves;
  };

  Spline.memoizeBounds = function() {
    const curves = this.curves();
    let bounds = curves[0] && curves[0].bounds; // computed by Bezier plugin

    for (let i = 1; i < curves.length; i += 1) {
      const curveBounds = curves[i].bounds;
      bounds = bounds.getBoundingRect(curveBounds);
    }

    this.payload.bounds = bounds;
    return bounds;
  };

  // SEGMENT

  Object.defineProperty(Segment, 'anchor', {
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
        anchorNode = anchorNode.create();
        this.children = this.children.concat([anchorNode]);
      }

      anchorNode.vector = value;
    },
  });

  Object.defineProperty(Segment, 'handleIn', {
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
        handleNode = HandleIn.create();
        this.children = this.children.concat([handleNode]);
      }

      handleNode.vector = value;
    },
  });

  Object.defineProperty(Segment, 'handleOut', {
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
        handleNode = HandleOut.create();
        this.children = this.children.concat([handleNode]);
      }

      handleNode.vector = value;

    },
  });

  var extendStatics=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,a){t.__proto__=a;}||function(t,a){for(var r in a)a.hasOwnProperty(r)&&(t[r]=a[r]);};function __extends(t,a){function r(){this.constructor=t;}extendStatics(t,a),t.prototype=null===a?Object.create(a):(r.prototype=a.prototype,new r);}function rotate(t,a){var r=t[0],e=t[1];return [r*Math.cos(a)-e*Math.sin(a),r*Math.sin(a)+e*Math.cos(a)]}function assertNumbers(){for(var t=[],a=0;a<arguments.length;a++)t[a]=arguments[a];for(var r=0;r<t.length;r++)if("number"!=typeof t[r])throw new Error("assertNumbers arguments["+r+"] is not a number. "+typeof t[r]+" == typeof "+t[r]);return !0}var PI=Math.PI;function annotateArcCommand(t,a,r){t.lArcFlag=0===t.lArcFlag?0:1,t.sweepFlag=0===t.sweepFlag?0:1;var e=t.rX,n=t.rY,i=t.x,o=t.y;e=Math.abs(t.rX),n=Math.abs(t.rY);var s=rotate([(a-i)/2,(r-o)/2],-t.xRot/180*PI),h=s[0],u=s[1],c=Math.pow(h,2)/Math.pow(e,2)+Math.pow(u,2)/Math.pow(n,2);1<c&&(e*=Math.sqrt(c),n*=Math.sqrt(c)),t.rX=e,t.rY=n;var m=Math.pow(e,2)*Math.pow(u,2)+Math.pow(n,2)*Math.pow(h,2),_=(t.lArcFlag!==t.sweepFlag?1:-1)*Math.sqrt(Math.max(0,(Math.pow(e,2)*Math.pow(n,2)-m)/m)),T=e*u/n*_,O=-n*h/e*_,p=rotate([T,O],t.xRot/180*PI);t.cX=p[0]+(a+i)/2,t.cY=p[1]+(r+o)/2,t.phi1=Math.atan2((u-O)/n,(h-T)/e),t.phi2=Math.atan2((-u-O)/n,(-h-T)/e),0===t.sweepFlag&&t.phi2>t.phi1&&(t.phi2-=2*PI),1===t.sweepFlag&&t.phi2<t.phi1&&(t.phi2+=2*PI),t.phi1*=180/PI,t.phi2*=180/PI;}function intersectionUnitCircleLine(t,a,r){assertNumbers(t,a,r);var e=t*t+a*a-r*r;if(0>e)return [];if(0===e)return [[t*r/(t*t+a*a),a*r/(t*t+a*a)]];var n=Math.sqrt(e);return [[(t*r+a*n)/(t*t+a*a),(a*r-t*n)/(t*t+a*a)],[(t*r-a*n)/(t*t+a*a),(a*r+t*n)/(t*t+a*a)]]}var SVGPathDataTransformer,DEG=Math.PI/180;function lerp(t,a,r){return (1-r)*t+r*a}function arcAt(t,a,r,e){return t+Math.cos(e/180*PI)*a+Math.sin(e/180*PI)*r}function bezierRoot(t,a,r,e){var n=a-t,i=r-a,o=3*n+3*(e-r)-6*i,s=6*(i-n),h=3*n;return Math.abs(o)<1e-6?[-h/s]:pqFormula(s/o,h/o,1e-6)}function bezierAt(t,a,r,e,n){var i=1-n;return t*(i*i*i)+a*(3*i*i*n)+r*(3*i*n*n)+e*(n*n*n)}function pqFormula(t,a,r){void 0===r&&(r=1e-6);var e=t*t/4-a;if(e<-r)return [];if(e<=r)return [-t/2];var n=Math.sqrt(e);return [-t/2-n,-t/2+n]}function a2c(t,a,r){var e,n,i,o;t.cX||annotateArcCommand(t,a,r);for(var s=Math.min(t.phi1,t.phi2),h=Math.max(t.phi1,t.phi2)-s,u=Math.ceil(h/90),c=new Array(u),m=a,_=r,T=0;T<u;T++){var O=lerp(t.phi1,t.phi2,T/u),p=lerp(t.phi1,t.phi2,(T+1)/u),y=p-O,S=4/3*Math.tan(y*DEG/4),f=[Math.cos(O*DEG)-S*Math.sin(O*DEG),Math.sin(O*DEG)+S*Math.cos(O*DEG)],V=f[0],N=f[1],D=[Math.cos(p*DEG),Math.sin(p*DEG)],P=D[0],l=D[1],v=[P+S*Math.sin(p*DEG),l-S*Math.cos(p*DEG)],E=v[0],A=v[1];c[T]={relative:t.relative,type:SVGPathData.CURVE_TO};var d=function(a,r){var e=rotate([a*t.rX,r*t.rY],t.xRot),n=e[0],i=e[1];return [t.cX+n,t.cY+i]};e=d(V,N),c[T].x1=e[0],c[T].y1=e[1],n=d(E,A),c[T].x2=n[0],c[T].y2=n[1],i=d(P,l),c[T].x=i[0],c[T].y=i[1],t.relative&&(c[T].x1-=m,c[T].y1-=_,c[T].x2-=m,c[T].y2-=_,c[T].x-=m,c[T].y-=_),m=(o=[c[T].x,c[T].y])[0],_=o[1];}return c}!function(t){function a(){return n(function(t,a,r){return t.relative&&(void 0!==t.x1&&(t.x1+=a),void 0!==t.y1&&(t.y1+=r),void 0!==t.x2&&(t.x2+=a),void 0!==t.y2&&(t.y2+=r),void 0!==t.x&&(t.x+=a),void 0!==t.y&&(t.y+=r),t.relative=!1),t})}function r(){var t=NaN,a=NaN,r=NaN,e=NaN;return n(function(n,i,o){return n.type&SVGPathData.SMOOTH_CURVE_TO&&(n.type=SVGPathData.CURVE_TO,t=isNaN(t)?i:t,a=isNaN(a)?o:a,n.x1=n.relative?i-t:2*i-t,n.y1=n.relative?o-a:2*o-a),n.type&SVGPathData.CURVE_TO?(t=n.relative?i+n.x2:n.x2,a=n.relative?o+n.y2:n.y2):(t=NaN,a=NaN),n.type&SVGPathData.SMOOTH_QUAD_TO&&(n.type=SVGPathData.QUAD_TO,r=isNaN(r)?i:r,e=isNaN(e)?o:e,n.x1=n.relative?i-r:2*i-r,n.y1=n.relative?o-e:2*o-e),n.type&SVGPathData.QUAD_TO?(r=n.relative?i+n.x1:n.x1,e=n.relative?o+n.y1:n.y1):(r=NaN,e=NaN),n})}function e(){var t=NaN,a=NaN;return n(function(r,e,n){if(r.type&SVGPathData.SMOOTH_QUAD_TO&&(r.type=SVGPathData.QUAD_TO,t=isNaN(t)?e:t,a=isNaN(a)?n:a,r.x1=r.relative?e-t:2*e-t,r.y1=r.relative?n-a:2*n-a),r.type&SVGPathData.QUAD_TO){t=r.relative?e+r.x1:r.x1,a=r.relative?n+r.y1:r.y1;var i=r.x1,o=r.y1;r.type=SVGPathData.CURVE_TO,r.x1=((r.relative?0:e)+2*i)/3,r.y1=((r.relative?0:n)+2*o)/3,r.x2=(r.x+2*i)/3,r.y2=(r.y+2*o)/3;}else t=NaN,a=NaN;return r})}function n(t){var a=0,r=0,e=NaN,n=NaN;return function(i){if(isNaN(e)&&!(i.type&SVGPathData.MOVE_TO))throw new Error("path must start with moveto");var o=t(i,a,r,e,n);return i.type&SVGPathData.CLOSE_PATH&&(a=e,r=n),void 0!==i.x&&(a=i.relative?a+i.x:i.x),void 0!==i.y&&(r=i.relative?r+i.y:i.y),i.type&SVGPathData.MOVE_TO&&(e=a,n=r),o}}function i(t,a,r,e,i,o){return assertNumbers(t,a,r,e,i,o),n(function(n,s,h,u){var c=n.x1,m=n.x2,_=n.relative&&!isNaN(u),T=void 0!==n.x?n.x:_?0:s,O=void 0!==n.y?n.y:_?0:h;function p(t){return t*t}n.type&SVGPathData.HORIZ_LINE_TO&&0!==a&&(n.type=SVGPathData.LINE_TO,n.y=n.relative?0:h),n.type&SVGPathData.VERT_LINE_TO&&0!==r&&(n.type=SVGPathData.LINE_TO,n.x=n.relative?0:s),void 0!==n.x&&(n.x=n.x*t+O*r+(_?0:i)),void 0!==n.y&&(n.y=T*a+n.y*e+(_?0:o)),void 0!==n.x1&&(n.x1=n.x1*t+n.y1*r+(_?0:i)),void 0!==n.y1&&(n.y1=c*a+n.y1*e+(_?0:o)),void 0!==n.x2&&(n.x2=n.x2*t+n.y2*r+(_?0:i)),void 0!==n.y2&&(n.y2=m*a+n.y2*e+(_?0:o));var y=t*e-a*r;if(void 0!==n.xRot&&(1!==t||0!==a||0!==r||1!==e))if(0===y)delete n.rX,delete n.rY,delete n.xRot,delete n.lArcFlag,delete n.sweepFlag,n.type=SVGPathData.LINE_TO;else{var S=n.xRot*Math.PI/180,f=Math.sin(S),V=Math.cos(S),N=1/p(n.rX),D=1/p(n.rY),P=p(V)*N+p(f)*D,l=2*f*V*(N-D),v=p(f)*N+p(V)*D,E=P*e*e-l*a*e+v*a*a,A=l*(t*e+a*r)-2*(P*r*e+v*t*a),d=P*r*r-l*t*r+v*t*t,G=(Math.atan2(A,E-d)+Math.PI)%Math.PI/2,C=Math.sin(G),x=Math.cos(G);n.rX=Math.abs(y)/Math.sqrt(E*p(x)+A*C*x+d*p(C)),n.rY=Math.abs(y)/Math.sqrt(E*p(C)-A*C*x+d*p(x)),n.xRot=180*G/Math.PI;}return void 0!==n.sweepFlag&&0>y&&(n.sweepFlag=+!n.sweepFlag),n})}function o(){return function(t){var a={};for(var r in t)a[r]=t[r];return a}}t.ROUND=function(t){function a(a){return Math.round(a*t)/t}return void 0===t&&(t=1e13),assertNumbers(t),function(t){return void 0!==t.x1&&(t.x1=a(t.x1)),void 0!==t.y1&&(t.y1=a(t.y1)),void 0!==t.x2&&(t.x2=a(t.x2)),void 0!==t.y2&&(t.y2=a(t.y2)),void 0!==t.x&&(t.x=a(t.x)),void 0!==t.y&&(t.y=a(t.y)),t}},t.TO_ABS=a,t.TO_REL=function(){return n(function(t,a,r){return t.relative||(void 0!==t.x1&&(t.x1-=a),void 0!==t.y1&&(t.y1-=r),void 0!==t.x2&&(t.x2-=a),void 0!==t.y2&&(t.y2-=r),void 0!==t.x&&(t.x-=a),void 0!==t.y&&(t.y-=r),t.relative=!0),t})},t.NORMALIZE_HVZ=function(t,a,r){return void 0===t&&(t=!0),void 0===a&&(a=!0),void 0===r&&(r=!0),n(function(e,n,i,o,s){if(isNaN(o)&&!(e.type&SVGPathData.MOVE_TO))throw new Error("path must start with moveto");return a&&e.type&SVGPathData.HORIZ_LINE_TO&&(e.type=SVGPathData.LINE_TO,e.y=e.relative?0:i),r&&e.type&SVGPathData.VERT_LINE_TO&&(e.type=SVGPathData.LINE_TO,e.x=e.relative?0:n),t&&e.type&SVGPathData.CLOSE_PATH&&(e.type=SVGPathData.LINE_TO,e.x=e.relative?o-n:o,e.y=e.relative?s-i:s),e.type&SVGPathData.ARC&&(0===e.rX||0===e.rY)&&(e.type=SVGPathData.LINE_TO,delete e.rX,delete e.rY,delete e.xRot,delete e.lArcFlag,delete e.sweepFlag),e})},t.NORMALIZE_ST=r,t.QT_TO_C=e,t.INFO=n,t.SANITIZE=function(t){void 0===t&&(t=0),assertNumbers(t);var a=NaN,r=NaN,e=NaN,i=NaN;return n(function(n,o,s,h,u){var c=Math.abs,m=!1,_=0,T=0;if(n.type&SVGPathData.SMOOTH_CURVE_TO&&(_=isNaN(a)?0:o-a,T=isNaN(r)?0:s-r),n.type&(SVGPathData.CURVE_TO|SVGPathData.SMOOTH_CURVE_TO)?(a=n.relative?o+n.x2:n.x2,r=n.relative?s+n.y2:n.y2):(a=NaN,r=NaN),n.type&SVGPathData.SMOOTH_QUAD_TO?(e=isNaN(e)?o:2*o-e,i=isNaN(i)?s:2*s-i):n.type&SVGPathData.QUAD_TO?(e=n.relative?o+n.x1:n.x1,i=n.relative?s+n.y1:n.y2):(e=NaN,i=NaN),n.type&SVGPathData.LINE_COMMANDS||n.type&SVGPathData.ARC&&(0===n.rX||0===n.rY||!n.lArcFlag)||n.type&SVGPathData.CURVE_TO||n.type&SVGPathData.SMOOTH_CURVE_TO||n.type&SVGPathData.QUAD_TO||n.type&SVGPathData.SMOOTH_QUAD_TO){var O=void 0===n.x?0:n.relative?n.x:n.x-o,p=void 0===n.y?0:n.relative?n.y:n.y-s;_=isNaN(e)?void 0===n.x1?_:n.relative?n.x:n.x1-o:e-o,T=isNaN(i)?void 0===n.y1?T:n.relative?n.y:n.y1-s:i-s;var y=void 0===n.x2?0:n.relative?n.x:n.x2-o,S=void 0===n.y2?0:n.relative?n.y:n.y2-s;c(O)<=t&&c(p)<=t&&c(_)<=t&&c(T)<=t&&c(y)<=t&&c(S)<=t&&(m=!0);}return n.type&SVGPathData.CLOSE_PATH&&c(o-h)<=t&&c(s-u)<=t&&(m=!0),m?[]:n})},t.MATRIX=i,t.ROTATE=function(t,a,r){void 0===a&&(a=0),void 0===r&&(r=0),assertNumbers(t,a,r);var e=Math.sin(t),n=Math.cos(t);return i(n,e,-e,n,a-a*n+r*e,r-a*e-r*n)},t.TRANSLATE=function(t,a){return void 0===a&&(a=0),assertNumbers(t,a),i(1,0,0,1,t,a)},t.SCALE=function(t,a){return void 0===a&&(a=t),assertNumbers(t,a),i(t,0,0,a,0,0)},t.SKEW_X=function(t){return assertNumbers(t),i(1,0,Math.atan(t),1,0,0)},t.SKEW_Y=function(t){return assertNumbers(t),i(1,Math.atan(t),0,1,0,0)},t.X_AXIS_SYMMETRY=function(t){return void 0===t&&(t=0),assertNumbers(t),i(-1,0,0,1,t,0)},t.Y_AXIS_SYMMETRY=function(t){return void 0===t&&(t=0),assertNumbers(t),i(1,0,0,-1,0,t)},t.A_TO_C=function(){return n(function(t,a,r){return SVGPathData.ARC===t.type?a2c(t,t.relative?0:a,t.relative?0:r):t})},t.ANNOTATE_ARCS=function(){return n(function(t,a,r){return t.relative&&(a=0,r=0),SVGPathData.ARC===t.type&&annotateArcCommand(t,a,r),t})},t.CLONE=o,t.CALCULATE_BOUNDS=function(){var t=function(t){var a={};for(var r in t)a[r]=t[r];return a},i=a(),o=e(),s=r(),h=n(function(a,r,e){var n=s(o(i(t(a))));function u(t){t>h.maxX&&(h.maxX=t),t<h.minX&&(h.minX=t);}function c(t){t>h.maxY&&(h.maxY=t),t<h.minY&&(h.minY=t);}if(n.type&SVGPathData.DRAWING_COMMANDS&&(u(r),c(e)),n.type&SVGPathData.HORIZ_LINE_TO&&u(n.x),n.type&SVGPathData.VERT_LINE_TO&&c(n.y),n.type&SVGPathData.LINE_TO&&(u(n.x),c(n.y)),n.type&SVGPathData.CURVE_TO){u(n.x),c(n.y);for(var m=0,_=bezierRoot(r,n.x1,n.x2,n.x);m<_.length;m++)0<(G=_[m])&&1>G&&u(bezierAt(r,n.x1,n.x2,n.x,G));for(var T=0,O=bezierRoot(e,n.y1,n.y2,n.y);T<O.length;T++)0<(G=O[T])&&1>G&&c(bezierAt(e,n.y1,n.y2,n.y,G));}if(n.type&SVGPathData.ARC){u(n.x),c(n.y),annotateArcCommand(n,r,e);for(var p=n.xRot/180*Math.PI,y=Math.cos(p)*n.rX,S=Math.sin(p)*n.rX,f=-Math.sin(p)*n.rY,V=Math.cos(p)*n.rY,N=n.phi1<n.phi2?[n.phi1,n.phi2]:-180>n.phi2?[n.phi2+360,n.phi1+360]:[n.phi2,n.phi1],D=N[0],P=N[1],l=function(t){var a=t[0],r=t[1],e=180*Math.atan2(r,a)/Math.PI;return e<D?e+360:e},v=0,E=intersectionUnitCircleLine(f,-y,0).map(l);v<E.length;v++)(G=E[v])>D&&G<P&&u(arcAt(n.cX,y,f,G));for(var A=0,d=intersectionUnitCircleLine(V,-S,0).map(l);A<d.length;A++){var G;(G=d[A])>D&&G<P&&c(arcAt(n.cY,S,V,G));}}return a});return h.minX=1/0,h.maxX=-1/0,h.minY=1/0,h.maxY=-1/0,h};}(SVGPathDataTransformer||(SVGPathDataTransformer={}));var _a,_a$1,TransformableSVG=function(){function t(){}return t.prototype.round=function(t){return this.transform(SVGPathDataTransformer.ROUND(t))},t.prototype.toAbs=function(){return this.transform(SVGPathDataTransformer.TO_ABS())},t.prototype.toRel=function(){return this.transform(SVGPathDataTransformer.TO_REL())},t.prototype.normalizeHVZ=function(t,a,r){return this.transform(SVGPathDataTransformer.NORMALIZE_HVZ(t,a,r))},t.prototype.normalizeST=function(){return this.transform(SVGPathDataTransformer.NORMALIZE_ST())},t.prototype.qtToC=function(){return this.transform(SVGPathDataTransformer.QT_TO_C())},t.prototype.aToC=function(){return this.transform(SVGPathDataTransformer.A_TO_C())},t.prototype.sanitize=function(t){return this.transform(SVGPathDataTransformer.SANITIZE(t))},t.prototype.translate=function(t,a){return this.transform(SVGPathDataTransformer.TRANSLATE(t,a))},t.prototype.scale=function(t,a){return this.transform(SVGPathDataTransformer.SCALE(t,a))},t.prototype.rotate=function(t,a,r){return this.transform(SVGPathDataTransformer.ROTATE(t,a,r))},t.prototype.matrix=function(t,a,r,e,n,i){return this.transform(SVGPathDataTransformer.MATRIX(t,a,r,e,n,i))},t.prototype.skewX=function(t){return this.transform(SVGPathDataTransformer.SKEW_X(t))},t.prototype.skewY=function(t){return this.transform(SVGPathDataTransformer.SKEW_Y(t))},t.prototype.xSymmetry=function(t){return this.transform(SVGPathDataTransformer.X_AXIS_SYMMETRY(t))},t.prototype.ySymmetry=function(t){return this.transform(SVGPathDataTransformer.Y_AXIS_SYMMETRY(t))},t.prototype.annotateArcs=function(){return this.transform(SVGPathDataTransformer.ANNOTATE_ARCS())},t}(),isWhiteSpace=function(t){return " "===t||"\t"===t||"\r"===t||"\n"===t},isDigit=function(t){return "0".charCodeAt(0)<=t.charCodeAt(0)&&t.charCodeAt(0)<="9".charCodeAt(0)},SVGPathDataParser$$1=function(t){function a(){var a=t.call(this)||this;return a.curNumber="",a.curCommandType=-1,a.curCommandRelative=!1,a.canParseCommandOrComma=!0,a.curNumberHasExp=!1,a.curNumberHasExpDigits=!1,a.curNumberHasDecimal=!1,a.curArgs=[],a}return __extends(a,t),a.prototype.finish=function(t){if(void 0===t&&(t=[]),this.parse(" ",t),0!==this.curArgs.length||!this.canParseCommandOrComma)throw new SyntaxError("Unterminated command at the path end.");return t},a.prototype.parse=function(t,a){var r=this;void 0===a&&(a=[]);for(var e=function(t){a.push(t),r.curArgs.length=0,r.canParseCommandOrComma=!0;},n=0;n<t.length;n++){var i=t[n];if(isDigit(i))this.curNumber+=i,this.curNumberHasExpDigits=this.curNumberHasExp;else if("e"!==i&&"E"!==i)if("-"!==i&&"+"!==i||!this.curNumberHasExp||this.curNumberHasExpDigits)if("."!==i||this.curNumberHasExp||this.curNumberHasDecimal){if(this.curNumber&&-1!==this.curCommandType){var o=Number(this.curNumber);if(isNaN(o))throw new SyntaxError("Invalid number ending at "+n);if(this.curCommandType===SVGPathData.ARC)if(0===this.curArgs.length||1===this.curArgs.length){if(0>o)throw new SyntaxError('Expected positive number, got "'+o+'" at index "'+n+'"')}else if((3===this.curArgs.length||4===this.curArgs.length)&&"0"!==this.curNumber&&"1"!==this.curNumber)throw new SyntaxError('Expected a flag, got "'+this.curNumber+'" at index "'+n+'"');this.curArgs.push(o),this.curArgs.length===COMMAND_ARG_COUNTS[this.curCommandType]&&(SVGPathData.HORIZ_LINE_TO===this.curCommandType?e({type:SVGPathData.HORIZ_LINE_TO,relative:this.curCommandRelative,x:o}):SVGPathData.VERT_LINE_TO===this.curCommandType?e({type:SVGPathData.VERT_LINE_TO,relative:this.curCommandRelative,y:o}):this.curCommandType===SVGPathData.MOVE_TO||this.curCommandType===SVGPathData.LINE_TO||this.curCommandType===SVGPathData.SMOOTH_QUAD_TO?(e({type:this.curCommandType,relative:this.curCommandRelative,x:this.curArgs[0],y:this.curArgs[1]}),SVGPathData.MOVE_TO===this.curCommandType&&(this.curCommandType=SVGPathData.LINE_TO)):this.curCommandType===SVGPathData.CURVE_TO?e({type:SVGPathData.CURVE_TO,relative:this.curCommandRelative,x1:this.curArgs[0],y1:this.curArgs[1],x2:this.curArgs[2],y2:this.curArgs[3],x:this.curArgs[4],y:this.curArgs[5]}):this.curCommandType===SVGPathData.SMOOTH_CURVE_TO?e({type:SVGPathData.SMOOTH_CURVE_TO,relative:this.curCommandRelative,x2:this.curArgs[0],y2:this.curArgs[1],x:this.curArgs[2],y:this.curArgs[3]}):this.curCommandType===SVGPathData.QUAD_TO?e({type:SVGPathData.QUAD_TO,relative:this.curCommandRelative,x1:this.curArgs[0],y1:this.curArgs[1],x:this.curArgs[2],y:this.curArgs[3]}):this.curCommandType===SVGPathData.ARC&&e({type:SVGPathData.ARC,relative:this.curCommandRelative,rX:this.curArgs[0],rY:this.curArgs[1],xRot:this.curArgs[2],lArcFlag:this.curArgs[3],sweepFlag:this.curArgs[4],x:this.curArgs[5],y:this.curArgs[6]})),this.curNumber="",this.curNumberHasExpDigits=!1,this.curNumberHasExp=!1,this.curNumberHasDecimal=!1,this.canParseCommandOrComma=!0;}if(!isWhiteSpace(i))if(","===i&&this.canParseCommandOrComma)this.canParseCommandOrComma=!1;else if("+"!==i&&"-"!==i&&"."!==i){if(0!==this.curArgs.length)throw new SyntaxError("Unterminated command at index "+n+".");if(!this.canParseCommandOrComma)throw new SyntaxError('Unexpected character "'+i+'" at index '+n+". Command cannot follow comma");if(this.canParseCommandOrComma=!1,"z"!==i&&"Z"!==i)if("h"===i||"H"===i)this.curCommandType=SVGPathData.HORIZ_LINE_TO,this.curCommandRelative="h"===i;else if("v"===i||"V"===i)this.curCommandType=SVGPathData.VERT_LINE_TO,this.curCommandRelative="v"===i;else if("m"===i||"M"===i)this.curCommandType=SVGPathData.MOVE_TO,this.curCommandRelative="m"===i;else if("l"===i||"L"===i)this.curCommandType=SVGPathData.LINE_TO,this.curCommandRelative="l"===i;else if("c"===i||"C"===i)this.curCommandType=SVGPathData.CURVE_TO,this.curCommandRelative="c"===i;else if("s"===i||"S"===i)this.curCommandType=SVGPathData.SMOOTH_CURVE_TO,this.curCommandRelative="s"===i;else if("q"===i||"Q"===i)this.curCommandType=SVGPathData.QUAD_TO,this.curCommandRelative="q"===i;else if("t"===i||"T"===i)this.curCommandType=SVGPathData.SMOOTH_QUAD_TO,this.curCommandRelative="t"===i;else{if("a"!==i&&"A"!==i)throw new SyntaxError('Unexpected character "'+i+'" at index '+n+".");this.curCommandType=SVGPathData.ARC,this.curCommandRelative="a"===i;}else a.push({type:SVGPathData.CLOSE_PATH}),this.canParseCommandOrComma=!0,this.curCommandType=-1;}else this.curNumber=i,this.curNumberHasDecimal="."===i;}else this.curNumber+=i,this.curNumberHasDecimal=!0;else this.curNumber+=i;else this.curNumber+=i,this.curNumberHasExp=!0;}return a},a.prototype.transform=function(t){return Object.create(this,{parse:{value:function(a,r){void 0===r&&(r=[]);for(var e=0,n=Object.getPrototypeOf(this).parse.call(this,a);e<n.length;e++){var i=n[e],o=t(i);Array.isArray(o)?r.push.apply(r,o):r.push(o);}return r}}})},a}(TransformableSVG),SVGPathData=function(t){function a(r){var e=t.call(this)||this;return e.commands="string"==typeof r?a.parse(r):r,e}return __extends(a,t),a.prototype.encode=function(){return a.encode(this.commands)},a.prototype.getBounds=function(){var t=SVGPathDataTransformer.CALCULATE_BOUNDS();return this.transform(t),t},a.prototype.transform=function(t){for(var a=[],r=0,e=this.commands;r<e.length;r++){var n=t(e[r]);Array.isArray(n)?a.push.apply(a,n):a.push(n);}return this.commands=a,this},a.encode=function(t){return encodeSVGPath$$1(t)},a.parse=function(t){var a=new SVGPathDataParser$$1,r=[];return a.parse(t,r),a.finish(r),r},a.CLOSE_PATH=1,a.MOVE_TO=2,a.HORIZ_LINE_TO=4,a.VERT_LINE_TO=8,a.LINE_TO=16,a.CURVE_TO=32,a.SMOOTH_CURVE_TO=64,a.QUAD_TO=128,a.SMOOTH_QUAD_TO=256,a.ARC=512,a.LINE_COMMANDS=a.LINE_TO|a.HORIZ_LINE_TO|a.VERT_LINE_TO,a.DRAWING_COMMANDS=a.HORIZ_LINE_TO|a.VERT_LINE_TO|a.LINE_TO|a.CURVE_TO|a.SMOOTH_CURVE_TO|a.QUAD_TO|a.SMOOTH_QUAD_TO|a.ARC,a}(TransformableSVG),COMMAND_ARG_COUNTS=((_a={})[SVGPathData.MOVE_TO]=2,_a[SVGPathData.LINE_TO]=2,_a[SVGPathData.HORIZ_LINE_TO]=1,_a[SVGPathData.VERT_LINE_TO]=1,_a[SVGPathData.CLOSE_PATH]=0,_a[SVGPathData.QUAD_TO]=4,_a[SVGPathData.SMOOTH_QUAD_TO]=2,_a[SVGPathData.CURVE_TO]=6,_a[SVGPathData.SMOOTH_CURVE_TO]=4,_a[SVGPathData.ARC]=7,_a),WSP=" ";function encodeSVGPath$$1(t){var a="";Array.isArray(t)||(t=[t]);for(var r=0;r<t.length;r++){var e=t[r];if(e.type===SVGPathData.CLOSE_PATH)a+="z";else if(e.type===SVGPathData.HORIZ_LINE_TO)a+=(e.relative?"h":"H")+e.x;else if(e.type===SVGPathData.VERT_LINE_TO)a+=(e.relative?"v":"V")+e.y;else if(e.type===SVGPathData.MOVE_TO)a+=(e.relative?"m":"M")+e.x+WSP+e.y;else if(e.type===SVGPathData.LINE_TO)a+=(e.relative?"l":"L")+e.x+WSP+e.y;else if(e.type===SVGPathData.CURVE_TO)a+=(e.relative?"c":"C")+e.x1+WSP+e.y1+WSP+e.x2+WSP+e.y2+WSP+e.x+WSP+e.y;else if(e.type===SVGPathData.SMOOTH_CURVE_TO)a+=(e.relative?"s":"S")+e.x2+WSP+e.y2+WSP+e.x+WSP+e.y;else if(e.type===SVGPathData.QUAD_TO)a+=(e.relative?"q":"Q")+e.x1+WSP+e.y1+WSP+e.x+WSP+e.y;else if(e.type===SVGPathData.SMOOTH_QUAD_TO)a+=(e.relative?"t":"T")+e.x+WSP+e.y;else{if(e.type!==SVGPathData.ARC)throw new Error('Unexpected command type "'+e.type+'" at index '+r+".");a+=(e.relative?"a":"A")+e.rX+WSP+e.rY+WSP+e.xRot+WSP+ +e.lArcFlag+WSP+ +e.sweepFlag+WSP+e.x+WSP+e.y;}}return a}var SVGPathData$1=function(t){function a(r){var e=t.call(this)||this;return e.commands="string"==typeof r?a.parse(r):r,e}return __extends(a,t),a.prototype.encode=function(){return a.encode(this.commands)},a.prototype.getBounds=function(){var t=SVGPathDataTransformer.CALCULATE_BOUNDS();return this.transform(t),t},a.prototype.transform=function(t){for(var a=[],r=0,e=this.commands;r<e.length;r++){var n=t(e[r]);Array.isArray(n)?a.push.apply(a,n):a.push(n);}return this.commands=a,this},a.encode=function(t){return encodeSVGPath$$1(t)},a.parse=function(t){var a=new SVGPathDataParser$$1,r=[];return a.parse(t,r),a.finish(r),r},a.CLOSE_PATH=1,a.MOVE_TO=2,a.HORIZ_LINE_TO=4,a.VERT_LINE_TO=8,a.LINE_TO=16,a.CURVE_TO=32,a.SMOOTH_CURVE_TO=64,a.QUAD_TO=128,a.SMOOTH_QUAD_TO=256,a.ARC=512,a.LINE_COMMANDS=a.LINE_TO|a.HORIZ_LINE_TO|a.VERT_LINE_TO,a.DRAWING_COMMANDS=a.HORIZ_LINE_TO|a.VERT_LINE_TO|a.LINE_TO|a.CURVE_TO|a.SMOOTH_CURVE_TO|a.QUAD_TO|a.SMOOTH_QUAD_TO|a.ARC,a}(TransformableSVG),COMMAND_ARG_COUNTS$1=((_a$1={})[SVGPathData$1.MOVE_TO]=2,_a$1[SVGPathData$1.LINE_TO]=2,_a$1[SVGPathData$1.HORIZ_LINE_TO]=1,_a$1[SVGPathData$1.VERT_LINE_TO]=1,_a$1[SVGPathData$1.CLOSE_PATH]=0,_a$1[SVGPathData$1.QUAD_TO]=4,_a$1[SVGPathData$1.SMOOTH_QUAD_TO]=2,_a$1[SVGPathData$1.CURVE_TO]=6,_a$1[SVGPathData$1.SMOOTH_CURVE_TO]=4,_a$1[SVGPathData$1.ARC]=7,_a$1);

  const svgImporter = {
    build(markup) {
      const $svg = new DOMParser()
        .parseFromString(markup, "application/xml")
        .documentElement;

      const scene = Scene.create();

      this.buildTree($svg, scene);
      scene.setFrontier();

      return scene;
    },

    copyStyles($node, node) {
      node.styles = Array.from($node.querySelectorAll('style'));
    },

    copyDefs($node, node) {
      node.defs = Array.from($node.querySelectorAll('style'));
    },

    buildTree($node, node) {
      this.processAttributes($node, node);

      const $graphicsChildren = Array.from($node.children).filter(($child) => {
        return $child instanceof SVGGElement || $child instanceof SVGGeometryElement
      });

      for (let $child of $graphicsChildren) {
        let child;

        if ($child instanceof SVGGElement) {
          child = Group.create();
          node.append(child);
          this.buildTree($child, child);
        } else {
          child = this.buildShapeTree($child);
          node.append(child);
        }
      }
    },

    processAttributes($node, node) {
      // viewBox
      if ($node.tagName === 'svg') {
        const viewBox = $node.getAttributeNS(null, 'viewBox').split(' ');
        const origin = Vector.create(viewBox[0], viewBox[1]);
        const size = Vector.create(viewBox[2], viewBox[3]);
        node.viewBox = Rectangle.create(origin, size);
      }

      // transform
      if (
        $node.transform &&
        $node.transform.baseVal &&
        $node.transform.baseVal.consolidate()
      ) {
        const $matrix = $node.transform.baseVal.consolidate().matrix;
        node.transform = Matrix.createFromDOMMatrix($matrix);
      }

      // classes
      node.class = Class.create(
        Array.from($node.classList)
      );
    },

    buildShapeTree($geometryNode) {
      const shape = Shape.create();

      this.processAttributes($geometryNode, shape);
      // ^ TODO: we are also calling processAttributes further above, duplication!

      let pathCommands;

      switch ($geometryNode.tagName) {
        case 'rect':
          const x      = Number($geometryNode.getAttributeNS(null, 'x'));
          const y      = Number($geometryNode.getAttributeNS(null, 'y'));
          const width  = Number($geometryNode.getAttributeNS(null, 'width'));
          const height = Number($geometryNode.getAttributeNS(null, 'height'));

          pathCommands = this.commands(`
          M ${x} ${y}
          H ${x + width}
          V ${y + height}
          H ${x}
          Z
        `);
          break;
        case 'path':
          pathCommands = this.commands($geometryNode.getAttributeNS(null, 'd'));
          break;
      }

      const pathSequences = this.sequences(pathCommands);

      for (let sequence of pathSequences) {
        shape.append(this.buildSplineTree(sequence));
      }

      return shape;
    },

    buildSplineTree(sequence) {
      const spline = Spline.create();
      spline.children = this.buildSegmentList(sequence);
      return spline;
    },

    // helpers

    // we want a segment to have children 'handleIn', 'anchor' etc

    buildSegmentList(commands) {
      const segments = [];

      // the first command is ALWAYS an `M` command (no handles)
      segments[0] = Segment.create();
      const child = Anchor.create();
      child.payload.vector = Vector.create(commands[0].x, commands[0].y);
      segments[0].append(child);

      for (let i = 1; i < commands.length; i += 1) {
        const command  = commands[i];
        const prevSeg  = segments[i - 1];
        const currSeg  = Segment.create();

        const anchor = Anchor.create();
        anchor.payload.vector = Vector.create(command.x, command.y);
        currSeg.append(anchor);

        if (command.x1 && command.x2) {
          const handleOut = HandleOut.create();
          handleOut.payload.vector = Vector.create(command.x1, command.y1);
          prevSeg.append(handleOut);

          const handleIn = HandleIn.create();
          handleIn.payload.vector = Vector.create(command.x2, command.y2);
          currSeg.append(handleIn);

        } else if (command.x1) {
          const handleIn = HandleIn.create();
          handleIn.payload.vector = Vector.create(command.x1, command.y1);
          currSeg.append(handleIn);
        }

        segments[i] = currSeg;
      }

      return segments;
    },

    sequences(svgCommands) {
      const MOVE = 2; // NOTE: this constant is introduced by svg-pathdata module
      const theSequences = [];

      for (let command of svgCommands) {
        if (command.type === MOVE) {
          theSequences.push([command]);
        } else {
          theSequences[theSequences.length - 1].push(command);
        }
      }

      return theSequences;
    },

    commands(svgPath) {
      return new SVGPathData$1(svgPath)
        .transform(SVGPathDataTransformer.NORMALIZE_HVZ()) // no H, V or Z shortcuts
        .transform(SVGPathDataTransformer.NORMALIZE_ST())  // no S (smooth multi-Bezier)
        .transform(SVGPathDataTransformer.A_TO_C())        // no A (arcs)
        .toAbs()                                           // no relative commands
        .commands;
    },
  };

  const LENGTHS_IN_PX = {
    cornerSideLength: 8,
    dotDiameter:      18,
    controlDiameter:  6,
  };

  const h = (tag, props = {}, ...children) => {
    return {
      tag: tag,
      props: props,
      children: children || [],
    };
  };

  const vdomExporter = {
    renderApp(store) {
      const comps = this.comps(store);

      return h('main', { id: 'app' },
        comps.doc,
        // comps.navigate, // we don't have a navigator atm
        // comps.inspect,  // we don't have an inspector atm
        h('div', { id: 'toolbar' },
          comps.buttons,
          comps.message
        ),
      );
    },

    comps(store) {
      return {
        buttons:  this.buttons(store),
        message:  this.message(store),
        navigate: this.navigate(store),
        doc:      this.doc(store),
        inspect:  this.inspect(store),
      };
    },

    docs(store) {
      const vDocs = h('ul', {
        id: 'docs',
        class: 'pure-menu-children doc-list',
      });

      const docs = store.docs;

      for (let identifier of docs.children) {
        vDocs.children.push(
          h('li', {
            class: 'pure-menu-item',
          },
            h('a', {
              class: 'pure-menu-link',
              'data-key': identifier.payload._id,
              'data-type': 'doc-identifier',
            }, identifier.key)
            // ^ TODO: what is identifier.key anyway?
            //   This is where we need to put the *name* of the document
        ));
      }

      const container = h('div', { class: 'pure-menu pure-menu-horizontal' },
        h('ul', { class: 'pure-menu-list' },
          h('li', { class: 'pure-menu-item pure-menu-has-children pure-menu-allow-hover'},
            h('a', { href: '#', id: 'menuLink1', class: 'pure-menu-link' }, 'Open'),
            vDocs
          )
        )
      );

      return container;
    },

    buttons(store) {
      return h('ul', { id: 'buttons' },
        h('li', {},
          h('button', {
            id: 'importButton',
            class: 'pure-button grayedout',
            'data-type': 'importButton',
          }, 'Import')
        ),
        h('li', {},
          h('button', {
            id: 'newDocButton',
            class: 'pure-button',
            'data-type': 'newDocButton',
          }, 'New')
        ),
        this.docs(store),
        h('li', {},
          h('button', {
            id: 'undo',
            'data-type': 'undo',
            class: 'pure-button',
          }, 'Undo')
        ),
        h('li', {},
          h('button', {
            id: 'redo',
            'data-type': 'redo',
            class: 'pure-button',
          }, 'Redo')
        ),
        h('li', {},
          h('button', {
            id: 'select',
            'data-type': 'select',
            class: 'pure-button',
          }, 'Select')
        ),
        h('li', {},
          h('button', {
            id: 'group',
            'data-type': 'group',
            class: 'pure-button grayedout',
          }, 'Group')
        ),
        h('li', {},
          h('button', {
            id: 'ungroup',
            'data-type': 'ungroup',
            class: 'pure-button grayedout',
          }, 'Ungroup')
        ),
        h('li', {},
          h('button', {
            id: 'pen',
            'data-type': 'pen',
            class: 'pure-button',
          }, 'Pen')
        )
      );
    },

    message(store) {
      return h('ul', { class: 'message' },
        h('li', {},
          h('button', {
            id: 'message',
          }, store.message.payload.text)
        )
      );
    },

    navigate(store) {
      return h('div', {
        id: 'navigator',
      });
    },

    inspect(store) {
      return h('div', {
        id: 'inspector',
      });
    },

    doc(store) {
      return h('div', {
        'data-type': 'doc',
        id: 'canvas',
        'data-key': store.doc.key,
      }, this.renderScene(store));
    },

    renderScene(store) {
      // case: nothing to render
      if (store.scene === null) {
        return '';
      }

      return this.buildSceneNode(store.scene);
    },

    buildSceneNode(node, vParent = null) {
      const vNode = node.toVDOMNode();

      if (vParent) {
        const vWrapper = this.wrap(vNode, node);
        vParent.children.push(vWrapper);
      }

      for (let child of node.graphicsChildren) {
        this.buildSceneNode(child, vNode);
      }

      return vNode;
    },

    wrap(vNode, node) {
      const vWrapper = h('g', {
        'data-type': 'wrapper',
        'data-key':   node.key,
      });

      vWrapper.children.push(vNode);
      if (node.type === 'shape') { vWrapper.children.push(this.innerUI(node)); }
      vWrapper.children.push(this.outerUI(node));

      return vWrapper;
    },

    outerUI(node) {
      const vOuterUI = h('g', {
        'data-type': 'outerUI',
        'data-key':   node.key,
      });

      const vFrame   = this.frame(node);
      const vDots    = this.dots(node);    // for rotation
      const vCorners = this.corners(node); // for scaling

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
      const vTopLCorner = h('rect');
      const vBotLCorner = h('rect');
      const vTopRCorner = h('rect');
      const vBotRCorner = h('rect');
      const vCorners    = [vTopLCorner, vBotLCorner, vTopRCorner, vBotRCorner];
      const length      = this.scale(node, LENGTHS_IN_PX.cornerSideLength);

      for (let vCorner of vCorners) {
        Object.assign(vCorner.props, {
          'data-type': 'corner',
          'data-key':   node.key,
          transform:   node.transform.toString(),
          width:       length,
          height:      length,
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
      const vTopLDot  = h('circle');
      const vBotLDot  = h('circle');
      const vTopRDot  = h('circle');
      const vBotRDot  = h('circle');
      const vDots     = [vTopLDot, vBotLDot, vTopRDot, vBotRDot];
      const diameter  = this.scale(node, LENGTHS_IN_PX.dotDiameter);
      const radius    = diameter / 2;

      for (let vDot of vDots) {
        Object.assign(vDot.props, {
          'data-type':      'dot',
          'data-key':        node.key,
          transform:        node.transform.toString(),
          r:                radius,
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
        'data-type':  'frame',
        x:            node.bounds.x,
        y:            node.bounds.y,
        width:        node.bounds.width,
        height:       node.bounds.height,
        transform:    node.transform.toString(),
        'data-key':    node.key,
      });
    },

    innerUI(node) {
      const vInnerUI = h('g', {
        'data-type': 'innerUI',
        'data-key': node.key,
      });

      const vConnections = this.connections(node);

      for (let vConnection of vConnections) {
        vInnerUI.children.push(vConnection);
      }

      const vControls = this.controls(node);

      for (let vControl of vControls) {
        vInnerUI.children.push(vControl);
      }

      return vInnerUI;
    },

    connections(node) {
      const vConnections = [];

      for (let spline of node.children) {
        for (let segment of spline.children) {
          for (let handle of ['handleIn', 'handleOut']) {
            if (segment[handle] !== null) {
              vConnections.push(this.connection(node, segment.anchor, segment[handle]));
            }
          }
        }
      }

      return vConnections;
    },

    connection(node, anchor, handle) {
      return h('line', {
        x1:        anchor.x,
        y1:        anchor.y,
        x2:        handle.x,
        y2:        handle.y,
        transform: node.transform.toString(),
      });
    },

    controls(pathNode) {
      const vControls = [];
      const diameter  = this.scale(pathNode, LENGTHS_IN_PX.controlDiameter);

      for (let spline of pathNode.children) {
        for (let segment of spline.children) {
          for (let control of segment.children) {
            vControls.push(this.control(pathNode, control, diameter));
          }
        }
      }

      return vControls;
    },

    control(pathNode, controlNode, diameter) {
      return h('circle', {
        'data-type': 'control',
        'data-key' : controlNode.key,
        transform  : pathNode.transform.toString(),
        r          : diameter / 2,
        cx         : controlNode.vector.x,
        cy         : controlNode.vector.y,
      });
    },

    // TODO: in general, we would need to take into account here
    // the ratio between the svg viewport width and the canvas width
    scale(node, length) {
      return length / node.globalScaleFactor();
    },
  };

  const plainImporter = {
    build(object) {
      let node;

      switch (object.type) {
        case 'store':
          node = Store.create();
          break;
        case 'doc':
          node = Doc.create();
          break;
        case 'docs':
          node = Docs.create();
          break;
        case 'identifier':
          node = Identifier.create();
          break;
        case 'message':
          node = Message.create();
          break;
        case 'scene':
          node = Scene.create();
          break;
        case 'group':
          node = Group.create();
          break;
        case 'shape':
          node = Shape.create();
          break;
        case 'spline':
          node = Spline.create();
          break;
        case 'segment':
          node = Segment.create();
          break;
        case 'anchor':
          node = Anchor.create();
          node.type = 'anchor';
          break;
        case 'handleIn':
          node = HandleIn.create();
          break;
        case 'handleOut':
          node = HandleOut.create();
          break;
      }

      node.type = object.type;
      node.key = object.key;
      this.setPayload(node, object);

      for (let child of object.children) {
        node.append(this.build(child));
      }

      return node;
    },

    setPayload(node, object) {
      for (let [key, value] of Object.entries(object.payload)) {
        switch (key) {
          case 'viewBox':
            node.viewBox = Rectangle.createFromObject(value);
            break;
          case 'transform':
            node.transform = Matrix.create(value);
            break;
          case 'class':
            node.class = Class.create(value);
            break;
          case 'bounds':
            if (value) {
              node.bounds = Rectangle.createFromObject(value);
            }
            break;
          case 'vector':
            node.vector = Vector.createFromObject(value);
            break;
        }
      }
    },
  };

  const plainExporter = {
    build(store) {
      return {
        doc:  JSON.parse(JSON.stringify(store.doc)),
        docs: store.docs.children.map(child => child.payload.id),
        // ^ TODO: note that we don't have the appropriate interface yet
        // and question: why are we doing this?
      };
    },
  };

  const State = {
    create() {
      return Object.create(State).init();
    },

    init() {
      this.label  = 'start';
      this.input  = {};
      this.update = '';
      this.store  = this.buildStore();

      this.store.scene.replaceWith(this.importFromSVG(markup));

      return this;
    },

    buildStore() {
      const store   = Store.create();
      const docs    = Docs.create();
      const message = this.buildMessage();
      const doc     = this.buildDoc();

      store.append(docs);
      store.append(doc);
      store.append(message);

      return store;
    },

    buildMessage() {
      const message = Message.create();
      message.payload.text = 'Welcome!';
      return message;
    },

    buildDoc() {
      const doc   = Doc.create();
      const scene = Scene.create();

      const width = this.width || 0;
      const height = this.height || 0;

      scene.viewBox = Rectangle.createFromDimensions(0, 0, width, height);

      doc.append(scene);

      return doc;
    },

    get scene() {
      return this.store.scene;
    },

    get doc() {
      return this.store.doc;
    },

    get docs() {
      return this.store.docs;
    },

    export() {
      return {
        label:  this.label,
        input:  this.input,
        update: this.update,
        vDOM:   this.exportToVDOM(),
        plain:  this.exportToPlain(),
      };
    },

    // returns a node (node type may vary depending on object)
    importFromPlain(object) {
      return plainImporter.build(object);
    },

    // returns a Scene node
    importFromSVG(markup) {
      return svgImporter.build(markup);
    },

    // returns a Doc node and a list of ids (for docs)
    exportToVDOM() {
      return vdomExporter.renderApp(this.store);
    },

    // returns a plain representation of Doc node and a list of ids (for docs)
    exportToPlain() {
      return plainExporter.build(this.store);
    },
  };

  // hard-coded markup
  //
  const markup = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260.73 100.17"><defs><style>.cls-1{fill:#2a2a2a;}</style></defs><title>Logo_48_Web_160601</title>

    <path class="cls-1" d="M69.74,14H35.82S37,54.54,10.37,76.65v7.27H51.27V97.55s-1.51,7.27-12.42,7.27v6.06H87.31v-6.66S74.59,106,74.59,98.46V83.91h13v-7h-13V34.4L51.21,55.31V77H17.34S65.5,32.43,69.74,14" transform="translate(-10.37 -12.38)"/>

    <path class="cls-1" d="M142,39.59q0-14.42-3.23-20.89a6.56,6.56,0,0,0-6.32-3.82q-9.71,0-9.71,21.77t10.74,21.62a6.73,6.73,0,0,0,6.62-4.12Q142,50,142,39.59m3.83,49.13q0-15.59-2.87-21.92t-10.08-6.32a10.21,10.21,0,0,0-9.78,5.88q-3,5.88-3,19.12,0,12.94,3.46,18.75T134.63,110q6,0,8.61-4.93t2.58-16.4m24-4.41q0,10.59-8.53,18.39-10.74,9.86-27.51,9.86-16.19,0-26.77-7.65T96.38,85.49q0-13.83,10.88-20.45,5.15-3.09,14.56-5.59l-0.15-.74q-20.89-5.3-20.89-21.77a21.6,21.6,0,0,1,8.68-17.65q8.68-6.91,22.21-6.91,14.56,0,23.39,6.77a21.35,21.35,0,0,1,8.83,17.8q0,15-19,21.92v0.59q24.86,5.44,24.86,24.86" transform="translate(-10.37 -12.38)"/>

    <g>
      <path class="cls-1" d="M185.85,53.73V34.82c0-4.55-1.88-6.9-9.41-8.47V20.7L203.67,14h5.49V53.73H185.85Z" transform="translate(-10.37 -12.38)"/>

      <path class="cls-1" d="M232,55.82c0-1.73-.63-2.2-8-2v-6.9h38v6.9c-11.26.45-11.9,1.84-20.68,9.37L236,67.73l18,22.91c8.63,10.83,11,13.71,17.1,14.34v5.9H227.57a37.69,37.69,0,0,1,0-5.9,5,5,0,0,0,5-3.78L218.23,83.54s-8.77,6.94-9.18,12.28c-0.57,7.27,5.19,9.16,11,9.16v5.9H176.69V105S232,56.76,232,55.82Z" transform="translate(-10.37 -12.38)"/>
    </g>
  </svg>
`;

  // const markup = `
  //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260.73 400"><defs><style>.cls-1{fill:#2a2a2a;}</style></defs><title>Logo_48_Web_160601</title>
  //
  //     <path class="cls-1" d="M142,39.59q0-14.42-3.23-20.89a6.56,6.56,0,0,0-6.32-3.82q-9.71,0-9.71,21.77t10.74,21.62a6.73,6.73,0,0,0,6.62-4.12Q142,50,142,39.59m3.83,49.13q0-15.59-2.87-21.92t-10.08-6.32a10.21,10.21,0,0,0-9.78,5.88q-3,5.88-3,19.12,0,12.94,3.46,18.75T134.63,110q6,0,8.61-4.93t2.58-16.4m24-4.41q0,10.59-8.53,18.39-10.74,9.86-27.51,9.86-16.19,0-26.77-7.65T96.38,85.49q0-13.83,10.88-20.45,5.15-3.09,14.56-5.59l-0.15-.74q-20.89-5.3-20.89-21.77a21.6,21.6,0,0,1,8.68-17.65q8.68-6.91,22.21-6.91,14.56,0,23.39,6.77a21.35,21.35,0,0,1,8.83,17.8q0,15-19,21.92v0.59q24.86,5.44,24.86,24.86" transform="translate(-10.37 -12.38)"/>
  //
  //   </svg>
  // `;

  // const markup = `
  //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  //
  //     <g>
  //       <rect x="260" y="250" width="100" height="100" fill="none" stroke="#e3e3e3"></rect>
  //
  //       <g>
  //         <rect x="400" y="260" width="100" height="100" fill="none" stroke="#e3e3e3"></rect>
  //         <rect x="550" y="260" width="100" height="100" fill="none" stroke="#e3e3e3"></rect>
  //       </g>
  //     </g>
  //
  //     <rect x="600" y="600" width="100" height="100" fill="none" stroke="#e3e3e3"></rect>
  //   </svg>
  // `;

  // const markup = `
  //   <svg id="a3dbc277-3d4c-49ea-bad0-b2ae645587b1" data-name="Ebene 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  //     <defs>
  //       <style>
  //         .b6f794bd-c28e-4c2b-862b-87d53a963a38 {
  //           fill: #1d1d1b;
  //           stroke: #1d1d1b;
  //           stroke-miterlimit: 3.86;
  //           stroke-width: 1.35px;
  //         }
  //       </style>
  //     </defs>
  //     <title>Little Bus</title>
  //     <path class="b6f794bd-c28e-4c2b-862b-87d53a963a38" d="M355.24,70.65l-77.31.66L93.69,179l-3.32,40.31L49.4,249l-4.64,62.08s.39,8.81,10.6,3.3C64,309.78,60,302.49,60,302.49l54.13,11.92s11.82,29.72,27.06,5.31l138.06-88.48s4.64,15.8,17.23,9.18,7.95-27.73,7.95-27.73l46.17-36.34ZM65.32,288.3A7.62,7.62,0,1,1,73,280.68,7.62,7.62,0,0,1,65.32,288.3Zm63.05,11.64a7.62,7.62,0,1,1,7.61-7.62A7.62,7.62,0,0,1,128.37,299.94Zm49.81-65.48L102.29,220l1.33-33.69,78.54,8Zm21.87,37-2-78.55L215.85,181l3.31,79.3Zm29.71-52.8-2-39.66,27.06-16.46,2.65,40.22Zm36.34-25.75-2.65-36.33,22.42-15.9,3.32,35Zm29.71-21.86-2-37.66,21.11-15.8,1.32,37.66Zm47.6-33.68L323.54,150l-.66-37L344.07,99.7Z"/>
  //   </svg>
  // `;

  // empty svg with viewBox
  // const markup = `
  //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"></svg>
  // `;

  // const markup = `
  //   <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 405"><g fill="#ff0000" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M50.5869,148.3516c-0.2308,-43.67734 -0.2308,-43.67734 -24.7598,-54.57743c-24.529,-10.90009 -24.529,-10.90009 -24.529,55.34c0,66.2401 0,66.2401 24.7598,54.57743c24.7598,-11.66267 24.7598,-11.66267 24.529,-55.34z"/><path d="M21.62818,330.71352c-20.56368,-15.09293 -20.56368,-15.09293 -20.56368,28.5276c0,43.62053 0,43.62053 19.55435,43.62053c19.55435,0 19.55435,0 20.56368,-28.5276c1.00933,-28.5276 1.00933,-28.5276 -19.55435,-43.62053z"/><path d="M107.96977,0.50937c0.73005,-0.48695 0.73005,-0.48695 -1.01175,-0.48695c-1.7418,0 -1.7418,0 -0.73005,0.48695c1.01175,0.48695 1.01175,0.48695 1.7418,0z"/><path d="M74.97452,87.43121c23.24606,-12.27663 23.24606,-12.27663 26.41619,-48.12571c3.17013,-35.84908 1.14663,-36.82298 -48.78682,-36.82298c-49.93345,0 -49.93345,0 -49.93345,37.71256c0,37.71256 0,37.71256 24.529,48.61266c24.529,10.90009 24.529,10.90009 47.77507,-1.37653z"/><path d="M79.76578,203.77243c24.86172,11.77861 24.86172,11.77861 49.61865,3.24961c24.75693,-8.529 24.75693,-8.529 29.23518,-52.52805c4.47825,-43.99905 4.47825,-43.99905 -26.60339,-59.20358c-31.08164,-15.20453 -31.08164,-15.20453 -54.3277,-2.9279c-23.24606,12.27663 -23.24606,12.27663 -23.01526,55.95397c0.2308,43.67734 0.2308,43.67734 25.09252,55.45595z"/><path d="M70.59973,326.80235c26.89466,-14.35367 26.89466,-14.35367 29.05785,-59.7788c2.16319,-45.42513 2.16319,-45.42513 -22.69853,-57.20374c-24.86172,-11.77861 -24.86172,-11.77861 -49.62152,-0.11595c-24.7598,11.66267 -24.7598,11.66267 -24.7598,56.46448c0,44.80181 0,44.80181 20.56368,59.89474c20.56368,15.09293 20.56368,15.09293 47.45834,0.73926z"/><path d="M129.84987,328.44011c-29.97881,-11.37576 -29.97881,-11.37576 -56.87347,2.97791c-26.89466,14.35367 -26.89466,14.35367 -27.90399,42.88126c-1.00933,28.5276 -1.00933,28.5276 34.40359,28.5276c35.41292,0 35.41292,0 57.88279,-31.5055c22.46988,-31.5055 22.46988,-31.5055 -7.50893,-42.88126z"/><path d="M187.06059,96.11957c21.47119,-9.59579 21.47119,-9.59579 22.49175,-51.54056c1.02056,-41.94477 1.02056,-41.94477 -48.65265,-41.94477c-49.67321,0 -51.13331,0.9739 -54.30344,36.82298c-3.17013,35.84908 -3.17013,35.84908 27.91151,51.05361c31.08164,15.20453 31.08164,15.20453 52.55283,5.60874z"/><path d="M245.34605,206.18022c33.14602,-20.86668 33.14602,-20.86668 30.2472,-54.58075c-2.89882,-33.71407 -2.89882,-33.71407 -33.43397,-46.74428c-30.53515,-13.03021 -30.53515,-13.03021 -52.00634,-3.43443c-21.47119,9.59579 -21.47119,9.59579 -25.94945,53.59483c-4.47825,43.99905 -4.47825,43.99905 21.75914,58.01517c26.23739,14.01613 26.23739,14.01613 59.38342,-6.85056z"/><path d="M195.80525,326.19818c21.96942,-10.19253 21.96942,-10.19253 17.69765,-51.84721c-4.27177,-41.65468 -4.27177,-41.65468 -30.50916,-55.67081c-26.23739,-14.01613 -26.23739,-14.01613 -50.99432,-5.48713c-24.75693,8.529 -24.75693,8.529 -26.92012,53.95413c-2.16319,45.42513 -2.16319,45.42513 27.81562,56.80089c29.97881,11.37576 40.9409,12.44265 62.91033,2.25012z"/><path d="M227.51873,402.9056c49.30296,0 49.30296,0 45.96844,-29.33069c-3.33452,-29.33069 -3.33452,-29.33069 -27.86991,-41.16459c-24.53539,-11.83389 -24.53539,-11.83389 -46.50481,-1.64137c-21.96942,10.19253 -21.96942,10.19253 -21.43305,41.16459c0.53637,30.97206 0.53637,30.97206 49.83933,30.97206z"/><path d="M339.22874,3.60137c9.5027,-3.44282 9.5027,-3.44282 -4.69103,-3.44282c-14.19373,0 -14.19373,0 -9.5027,3.44282c4.69103,3.44282 4.69103,3.44282 14.19373,0z"/><path d="M297.32885,95.81776c22.09241,-16.92833 22.09241,-16.92833 25.64882,-51.53216c3.5564,-34.60384 -5.82566,-41.48947 -56.29804,-41.48947c-50.47238,0 -50.47238,0 -51.49294,41.94477c-1.02056,41.94477 -1.02056,41.94477 29.51459,54.97498c30.53515,13.03021 30.53515,13.03021 52.62756,-3.89812z"/><path d="M315.52969,202.76801c31.17916,17.74268 31.17916,17.74268 49.30204,10.55348c18.12288,-7.18921 18.12288,-7.18921 24.75761,-50.72443c6.63474,-43.53522 6.63474,-43.53522 -30.10845,-61.19587c-36.74318,-17.66065 -36.74318,-17.66065 -58.8356,-0.73232c-22.09241,16.92833 -22.09241,16.92833 -19.19359,50.64239c2.89882,33.71407 2.89882,33.71407 34.07798,51.45675z"/><path d="M248.25403,327.5441c24.53539,11.83389 24.53539,11.83389 51.87383,-2.72394c27.33844,-14.55783 27.33844,-14.55783 35.51803,-56.61257c8.17959,-42.05474 8.17959,-42.05474 -22.99957,-59.79743c-31.17916,-17.74268 -31.17916,-17.74268 -64.32519,3.124c-33.14602,20.86668 -33.14602,20.86668 -28.87425,62.52137c4.27177,41.65468 4.27177,41.65468 28.80716,53.48857z"/><path d="M334.71096,402.7916c52.47028,0 52.47028,0 55.59477,-27.50337c3.1245,-27.50337 3.1245,-27.50337 -28.46636,-43.88853c-31.59085,-16.38516 -31.59085,-16.38516 -58.9293,-1.82732c-27.33844,14.55783 -27.33844,14.55783 -24.00392,43.88853c3.33452,29.33069 3.33452,29.33069 55.8048,29.33069z"/><path d="M437.28803,1.64447c2.69179,-1.57207 2.69179,-1.57207 -3.64826,-1.57207c-6.34004,0 -6.34004,0 -2.69179,1.57207c3.64826,1.57207 3.64826,1.57207 6.34004,0z"/><path d="M423.47215,101.0203c24.76808,-13.22625 24.76808,-13.22625 16.75607,-54.13524c-8.01201,-40.90899 -15.30852,-44.05313 -52.10041,-44.05313c-36.79189,0 -36.79189,0 -46.29459,3.44282c-9.5027,3.44282 -9.5027,3.44282 -13.05911,38.04665c-3.5564,34.60384 -3.5564,34.60384 33.18678,52.26449c36.74318,17.66065 36.74318,17.66065 61.51126,4.43441z"/><path d="M473.2864,212.58868c30.39492,-14.89085 30.39492,-14.89085 33.55771,-54.98674c3.16279,-40.09589 3.16279,-40.09589 -26.12633,-52.36114c-29.28911,-12.26525 -29.28911,-12.26525 -54.05719,0.961c-24.76808,13.22625 -24.76808,13.22625 -31.40281,56.76146c-6.63474,43.53522 -6.63474,43.53522 20.49948,54.02574c27.13422,10.49052 27.13422,10.49052 57.52914,-4.40033z"/><path d="M423.24411,333.73001c26.92878,-9.8882 26.92878,-9.8882 21.84583,-55.13858c-5.08295,-45.25039 -5.08295,-45.25039 -32.21717,-55.74091c-27.13422,-10.49052 -27.13422,-10.49052 -45.25709,-3.30131c-18.12288,7.18921 -18.12288,7.18921 -26.30247,49.24395c-8.17959,42.05474 -8.17959,42.05474 23.41126,58.4399c31.59085,16.38516 31.59085,16.38516 58.51964,6.49696z"/><path d="M475.05699,339.05927c-22.21507,-10.7426 -22.21507,-10.7426 -49.14385,-0.85441c-26.92878,9.8882 -26.92878,9.8882 -30.05328,37.39157c-3.1245,27.50337 -3.1245,27.50337 47.87861,27.50337c51.00311,0 51.00311,0 52.26835,-26.64896c1.26524,-26.64896 1.26524,-26.64896 -20.94983,-37.39157z"/><path d="M482.61699,100.04921c29.28911,12.26525 29.28911,12.26525 42.03328,5.31362c12.74416,-6.95163 12.74416,-6.95163 12.74416,-54.74631c0,-47.79468 0,-47.79468 -47.3535,-47.79468c-47.3535,0 -52.73707,3.14414 -44.72506,44.05313c8.01201,40.90899 8.01201,40.90899 37.30112,53.17424z"/><path d="M539.2026,162.82026c0,-59.13683 0,-59.13683 -12.74416,-52.18521c-12.74416,6.95163 -12.74416,6.95163 -15.90695,47.04752c-3.16279,40.09589 -3.16279,40.09589 12.74416,52.18521c15.90695,12.08932 15.90695,12.08932 15.90695,-47.04752z"/><path d="M477.40768,334.44837c22.21507,10.7426 22.21507,10.7426 41.21892,2.089c19.00385,-8.6536 19.00385,-8.6536 19.00385,-58.79452c0,-50.14092 0,-50.14092 -15.90695,-62.23023c-15.90695,-12.08932 -15.90695,-12.08932 -46.30187,2.80153c-30.39492,14.89085 -30.39492,14.89085 -25.31197,60.14123c5.08295,45.25039 5.08295,45.25039 27.29802,55.99299z"/><path d="M499.68158,376.59488c-1.26524,26.64896 -1.26524,26.64896 19.00385,26.64896c20.26909,0 20.26909,0 20.26909,-35.30257c0,-35.30257 0,-35.30257 -19.00385,-26.64896c-19.00385,8.6536 -19.00385,8.6536 -20.26909,35.30257z"/><path d="M167.79565,340.87524c-5.48105,-0.53344 -5.48105,-0.53344 -27.95093,30.97206c-22.46988,31.5055 -22.46988,31.5055 6.01742,31.5055c28.4873,0 28.4873,0 27.95093,-30.97206c-0.53637,-30.97206 -0.53637,-30.97206 -6.01742,-31.5055z"/></g></svg>
  // `;

  let aux = {};

  const updates = {

    // Select

    select(state, input) {
      const target = state.scene.findDescendantByKey(input.key);
      const node = target && target.findAncestorByClass('frontier');

      if (node) {
        node.select();
        this.initTransform(state, input);
      } else {
        state.scene.deselectAll();
      }
    },

    release(state, input) {
      const current = state.scene.selected || state.scene.editing;

      if (current) {
        for (let ancestor of current.ancestors) {
          ancestor.memoizeBounds();
        }
      }

      this.aux = {};
    },

    deepSelect(state, input) {
      const target = state.scene.findDescendantByKey(input.key);

      if (!target) {
        return;
      }

      if (target.isSelected()) {
        target.edit();
        state.scene.unfocusAll();
        state.label = 'pen'; // TODO: hack! could the update initiate an input?
      } else {
        const toSelect = target.findAncestor((node) => {
          return node.parent && node.parent.class.includes('frontier');
        });

        if (toSelect) {
          toSelect.select();
          state.scene.setFrontier();
          state.scene.unfocusAll();
        }
      }
    },

    focus(state, input) {
      state.scene.unfocusAll(); // expensive but effective

      const target = state.scene.findDescendantByKey(input.key);
      const hit    = Vector.create(input.x, input.y);

      if (target) {
        const toFocus = target.findAncestorByClass('frontier');

        if (toFocus && toFocus.contains(hit)) {
          toFocus.focus();
        }
      }
    },

    deselect(state, event) {
      state.scene.deselectAll();
    },

    deedit(state, event) {
      state.scene.deeditAll();
    },

    // Transform

    initTransform(state, input) {
      const node = state.scene.selected;
      aux.from   = Vector.create(input.x, input.y); // global coordinates
      aux.center = node.bounds.center.transform(node.globalTransform());
      // ^ global coordinates (globalTransform transforms local coords to global coords)
    },

    shift(state, input) {
      const node = state.scene.selected;

      if (!node) {
        return;
      }

      const to     = Vector.create(input.x, input.y); // global coordinates
      const from   = aux.from;
      const offset = to.minus(from);

      node.translate(offset);

      aux.from = to;
    },

    rotate(state, input) {
      const node = state.scene.selected;

      if (!node) {
        return;
      }

      const to     = Vector.create(input.x, input.y);
      const from   = aux.from;
      const center = aux.center;
      const angle  = center.angle(from, to);

      node.rotate(angle, center);

      aux.from = to;
    },

    scale(state, input) {
      const node = state.scene.selected;

      if (!node) {
        return;
      }

      const to     = Vector.create(input.x, input.y);
      const from   = aux.from;
      const center = aux.center;
      const factor = to.minus(center).length() / from.minus(center).length();

      node.scale(factor, center);

      aux.from = to;
    },

    // Pen

    placeAnchor(state, input) {
      const shape   = Shape.create();
      const spline  = Spline.create();
      const segment = Segment.create();
      const anchor  = Anchor.create();

      shape.append(spline);
      spline.append(segment);
      segment.append(anchor);
      state.scene.append(shape);

      anchor.payload.vector = Vector.create(input.x, input.y);
      shape.edit();
      shape.payload.bounds = Rectangle.create(); // TODO: hack

      aux.spline  = spline;
      aux.segment = segment;
    },

    addHandles(state, input) {
      const segment     = aux.segment;
      const anchor      = segment.anchor;
      const handleIn    = Vector.create(input.x, input.y);
      const handleOut   = handleIn.rotate(Math.PI, anchor);
      segment.handleIn  = handleIn;
      segment.handleOut = handleOut;
    },

    addSegment(state, input) {
      const spline  = aux.spline;
      const segment = Segment.create();
      const anchor  = Anchor.create();

      anchor.payload.vector = Vector.create(input.x, input.y);
      segment.append(anchor);
      spline.append(segment);

      aux.segment = segment;
      // TODO: bounds
    },

    pickControl(state, input) {
      // initiate edit of control point:
      // identify the control by its id
      // ... store it
    },

    moveControl(state, input) {
      // move control point:
      // retrieve stored control
      // ... move it
      // need to move handles along with anchors
      // and opposite handles together
    },

    insertAnchor(state, input) {
      // insert anchor
      // need to make sure that this update does not
      // affect the existing curve (i.e., it splits the curve,
      // but does not change it)
    },

    // Doc(s)

    // from ui: user has requested fresh document
    createDoc(state, input) {
      state.store.doc.replaceWith(state.buildDoc());
    },

    // from db: doc list has been obtained
    updateDocList(state, input) {
      const identNodes = [];

      for (let id of input.data.docIDs) {
        const identNode = Identifier$1.create();
        identNode.payload._id = id;
        identNodes.push(identNode);
      }

      state.store.docs.children = identNodes;
    },

    // from db: doc has been retrieved
    setDoc(state, input) {
      state.doc.replaceWith(state.importFromPlain(input.data.doc));
    },

    // Messages

    // from db: doc has just been saved
    setSavedMessage(state, input) {
      state.store.message.payload.text = 'Saved';
    },

    // from ui: message can now be cleaned
    cleanMessage(state, input) {
      state.store.message.payload.text = '';
    },

    // History

    undo(state, input) {
      window.history.back();
    },

    redo(state, input) {
      window.history.forward();
    },
  };

  // 'type' is mandatory
  // 'from', 'target', 'to' and `do` are optional

  const transitions = [
    { from: 'start', type: 'go', do: 'go', to: 'idle' },
    { from: 'idle', type: 'mousemove', do: 'focus' },
    { type: 'cleanMessage', do: 'cleanMessage' },

    // SELECT
    { type: 'click', target: 'select', do: 'deedit', to: 'idle' },
    { from: 'idle', type: 'dblclick', target: 'content', do: 'deepSelect' },
    { from: 'idle', type: 'mousedown', target: 'content', do: 'select', to: 'shifting' },

    // TRANSFORM
    { from: 'shifting', type: 'mousemove', do: 'shift' },
    { from: 'shifting', type: 'mouseup', do: 'release', to: 'idle' },
    { from: 'idle', type: 'mousedown', target: 'dot', do: 'initTransform', to: 'rotating' },
    { from: 'rotating', type: 'mousemove', do: 'rotate' },
    { from: 'rotating', type: 'mouseup', do: 'release', to: 'idle' },
    { from: 'idle', type: 'mousedown', target: 'corner', do: 'initTransform', to: 'scaling' },
    { from: 'scaling', type: 'mousemove', do: 'scale' },
    { from: 'scaling', type: 'mouseup', do: 'release', to: 'idle' },

    // PEN
    { from: 'idle', type: 'click', target: 'pen', do: 'deselect', to: 'pen' },
    // adding controls
    { from: 'pen', type: 'mousedown', target: 'content', do: 'placeAnchor', to: 'addingHandle' },
    { from: 'addingHandle', type: 'mousemove', do: 'addHandles', to: 'addingHandle' },
    { from: 'addingHandle', type: 'mouseup', do: 'releasePen', to: 'continuePen' },
    { from: 'continuePen', type: 'mousedown', target: 'content', do: 'addSegment', to: 'addingHandle' },
    // editing controls
    { from: 'continuePen', type: 'mousedown', target: 'control', do: 'pickControl', to: 'editingControl' },
    { from: 'pen', type: 'mousedown', target: 'control', do: 'pickControl', to: 'editingControl' },
    { from: 'editingControl', type: 'mousemove', do: 'moveControl', to: 'editingControl' },
    { from: 'editingControl', type: 'mouseup', do: 'releasePen', to: 'pen' },

    // OTHER
    { type: 'click', target: 'doc-identifier', do: 'requestDoc', to: 'busy' },
    { type: 'click', target: 'newDocButton', do: 'createDoc', to: 'idle' },
    { type: 'click', target: 'undo', do: 'undo', to: 'idle' },
    { type: 'click', target: 'redo', do: 'redo', to: 'idle' },
    { type: 'docSaved', do: 'setSavedMessage' },
    { type: 'updateDocList', do: 'updateDocList' },
    { type: 'requestDoc', do: 'requestDoc', to: 'busy' }, // TODO: seems redundant?
    { from: 'busy', type: 'setDoc', do: 'setDoc', to: 'idle' },
  ];

  transitions.get = function(state, input) {
    const isMatch = (row) => {
      const from   = row.from;
      const type   = row.type;
      const target = row.target;

      const stateMatch  = from === state.label || from === undefined;
      const typeMatch   = type === input.type;
      const targetMatch = target === input.target || target === undefined;

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

  const core = {
    init() {
      this.state = State.create();
      this.periphery = [];
      return this;
    },

    attach(name, func) {
      this.periphery[name] = func;
    },

    kickoff(canvasSize) {
      this.state.width = canvasSize.width;   // TODO: stopgap
      this.state.height = canvasSize.height; // TODO: stopgap

      this.state.store.scene.viewBox.width  = canvasSize.width;
      this.state.store.scene.viewBox.height = canvasSize.height;

      this.publish();
      this.compute({ source: 'core', type: 'go' });
    },

    compute(input) {
      this.state.input = input;
      
      if (input.type === 'undo') {
        this.state.store.scene.replaceWith(this.state.importFromPlain(input.data.doc));
        this.publish();
      } else {
        const transition = transitions.get(this.state, input);

        if (transition) {
          this.makeTransition(input, transition);
          this.publish();
        }
      }
    },

    makeTransition(input, transition) {
      this.state.update = transition.do;
      this.state.label  = transition.to;

      const update = updates[transition.do];
      update && update.bind(updates)(this.state, input);
    },

    publish() {
      const keys = Object.keys(this.periphery);
      for (let key of keys) {
        this.periphery[key](this.state.export());
      }
    },
  };

  const svgTags = [
    'svg',
    'g',
    'path',
    'rect',
    'circle',
    'line'
  ];

  const eventTypes = [
    'mousedown',
    'mousemove',
    'mouseup',
    'click',
    'dblclick'
  ];

  const svgns   = 'http://www.w3.org/2000/svg';
  const xmlns   = 'http://www.w3.org/2000/xmlns/';
  const htmlns  = 'http://www.w3.org/1999/xhtml';

  const ui = {
    init() {
      this.name = 'ui';
      return this;
    },

    bindEvents(func) {
      for (let eventType of eventTypes) {
        document.addEventListener(eventType, (event) => {
          event.preventDefault();

          if (event.type !== 'dblclick' && event.detail > 1) {
            return;
          }

          func({
            source: this.name,
            type:   event.type,
            target: event.target.dataset.type,
            key:    event.target.dataset.key,
            x:      this.coordinates(event).x,
            y:      this.coordinates(event).y,
          });
        });
      }

      window.addEventListener('cleanMessage', (event) => {
        func({
          source: this.name,
          type:   'cleanMessage',
        });
      });
    },

    coordinates(event) {
      const coords = {};

      const svg = document.querySelector('svg');

      if (svg) {
        let point   = svg.createSVGPoint();
        point.x     = event.clientX;
        point.y     = event.clientY;
        point       = point.matrixTransform(svg.getScreenCTM().inverse());
        coords.x    = point.x;
        coords.y    = point.y;
      }

      return coords;
    },

    receive(state) {
      this.setMessageTimer();

      if (state.label === 'start') {
        this.dom = this.createElement(state.vDOM);
        this.mount(this.dom, document.body);
      } else {
        this.reconcile(this.previousVDOM, state.vDOM, this.dom);
      }

      this.previousVDOM = state.vDOM;
    },

    mount($node, $mountPoint) {
      $mountPoint.innerHTML = '';
      $mountPoint.appendChild($node);
    },

    createElement(vNode) {
      if (typeof vNode === 'string') {
        return document.createTextNode(vNode);
      }

      let $node;

      if (svgTags.includes(vNode.tag)) {
        $node = document.createElementNS(svgns, vNode.tag);
      } else {
        $node = document.createElementNS(htmlns, vNode.tag);
      }

      for (let [key, value] of Object.entries(vNode.props)) {
        if (key === 'xmlns') {
          $node.setAttributeNS(xmlns, key, value);
        } else {
          $node.setAttributeNS(null, key, value);
        }
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
      }
       else {
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
        const $child    = $node.childNodes[$index];

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

    // TODO: we periodically clean the message every second
    // it would be more elegant to only do cleaning when
    // message changes have occured
    setMessageTimer() {
      const cleanMessage = () => {
        window.dispatchEvent(new Event('cleanMessage'));
      };

      if (this.timer) {
        clearTimeout(this.timer);
      }

      this.timer = window.setTimeout(cleanMessage, 1000);
    },
  };

  const db = {
    init() {
      this.name = 'db';
      return this;
    },

    bindEvents(func) {
      window.addEventListener('upsertDoc', (event) => {
        const request = new XMLHttpRequest;

        request.addEventListener('load', () => {
          func({
            source: this.name,
            type:   'docSaved',
            data:   {},
          });
        });

        request.open('POST', "/docs/" + event.detail._id);
        request.send(JSON.stringify(event.detail));
      });

      window.addEventListener('readDoc', (event) => {
        const request = new XMLHttpRequest;

        request.addEventListener('load', () => {
          func({
            source: this.name,
            type:   'setDoc',
            data:   {
              doc: request.response
            },
          });
        });

        request.open('GET', "/docs/" + event.detail);
        request.responseType = 'json';
        request.send();
      });

      window.addEventListener('loadDocIDs', (event) => {
        const request = new XMLHttpRequest;

        request.addEventListener('load', () => {
          func({
            source: this.name,
            type:   'updateDocList',
            data:   {
              docIDs: request.response
            },
          });
        });

        request.open('GET', "/ids");
        request.responseType = 'json';
        request.send();
      });
    },

    receive(state) {
      if (state.update === 'go') {
        window.dispatchEvent(
          new Event('loadDocIDs')
        );
      } else if (state.update === 'requestDoc') {
        window.dispatchEvent(
          new CustomEvent('readDoc', { detail: state.input.key })
        );
      } else if (['release', 'releasePen'].includes(state.update)) {
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
      window.addEventListener('popstate', (event) => {
        if (event.state) {
          func({
            source: this.name,
            type:   'undo',
            data:   event.state,
          });
        }
      });
    },

    receive(state) {
      if (this.isRelevant(state.update)) {
        window.history.pushState(state.plain, 'entry');
      }
    },

    isRelevant(update) {
      const release    = update === 'release' ;
      const releasePen = update === "releasePen";
      const go         = update === 'go';

      return release || releasePen || go;
    },
  };

  const peripherals = [ui, db, hist];
  const toolbarHeight = 35;

  const app = {
    init() {
      core.init();

      for (let peripheral of peripherals) {
        peripheral.init();
        peripheral.bindEvents(core.compute.bind(core));
        core.attach(peripheral.name, peripheral.receive.bind(peripheral));
      }

      core.kickoff(this.getCanvasSize());
    },

    getCanvasSize() {
      const canvasWidth   = document.documentElement.clientWidth;
      const canvasHeight  = (document.documentElement.clientHeight - toolbarHeight);
      const canvasSize    = { width: canvasWidth, height: canvasHeight };

      return canvasSize;
    }
  };

  document.addEventListener('DOMContentLoaded', app.init.bind(app));

}());
//# sourceMappingURL=bundle.js.map
