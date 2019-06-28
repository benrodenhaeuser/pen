// - The Bezier.js library is copyright (c) by Pomax
//   Distributed under an MIT license
//   https://github.com/Pomax/bezierjs
// - CodeMirror is copyright (c) by Marijn Haverbeke and others
//   Distributed under an MIT license
//   https://codemirror.net/LICENSE
// - The SVG PathData library is copyright (c) by Nicolas Froidure
//   Distributed under an MIT license
//   https://github.com/nfroidure/svg-pathdata
    
(function (bezier_js,codemirror_js) {
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
        this.m[0][0].toFixed(3), this.m[1][0].toFixed(3),
        this.m[0][1].toFixed(3), this.m[1][1].toFixed(3),
        this.m[0][2].toFixed(3), this.m[1][2].toFixed(3)
      ];

      return `matrix(${sixValueMatrix.join(', ')})`;
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
        const bbox = new bezier_js.Bezier(...this.coords()).bbox();

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
        node._id = createID(); // NOTE: docs have an _id
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
        key:      createID(), // all nodes have a key
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

    get markup() {
      return this.root.findDescendant(
        node => node.type === 'markup'
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
  const Store      = Object.create(Node);
  const Doc        = Object.create(Node);
  const Docs       = Object.create(Node);
  const Markup     = Object.create(Node);
  const Message    = Object.create(Node);
  const Text       = Object.create(Node);
  const Identifier$1 = Object.create(Node);

  Store.type      = 'store';
  Doc.type        = 'doc';
  Docs.type       = 'docs';
  Markup.type     = 'markup';
  Message.type    = 'message';
  Text.type       = 'text';
  Identifier$1.type = 'identifier';

  // toVDOMNode

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

  // toSVGNode

  Scene.toSVGNode = function() {
    return {
      tag:      'svg',
      children: [],
      props: {
        'viewBox': this.viewBox.toString(),
        xmlns:     'http://www.w3.org/2000/svg',
      },
    };
  };

  Group.toSVGNode = function() {
    const svgNode = {
      tag:      'g',
      children: [],
      props:    {},
    };

    // if (this.payload.transform) {
    svgNode.props.transform = this.transform.toString();
    // }

    return svgNode;
  };

  Shape.toSVGNode = function() {
    const svgNode = {
      tag:      'path',
      children: [],
      props:    { d: this.pathString() },
    };

    // TODO: don't want to set a transform if it's a trivial transform
    // if (this.payload.transform) {
    svgNode.props.transform = this.transform.toString();
    // }

    return svgNode;
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
          d += ` ${prevSeg.handleOut.x.toFixed()} ${prevSeg.handleOut.y.toFixed()}`;
        }

        if (currSeg.handleIn) {
          d += ` ${currSeg.handleIn.x.toFixed()} ${currSeg.handleIn.y.toFixed()}`;
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
        .parseFromString(markup, "image/svg+xml")
        .documentElement;

      if ($svg instanceof SVGElement) {
        const scene = Scene.create();
        this.buildTree($svg, scene);
        scene.setFrontier();
        console.log('done importing svg markup');
        return scene;
      }

      console.log('import from svg markup did not succeed');

      return null;
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

  const svgExporter = {
    build(store) {
      const markup = [];
      const vNode = this.buildSceneNode(store.scene);

      return this.convertToMarkup(markup, vNode, 0);
    },

    buildSceneNode(node, svgParent = null) {
      const svgNode = node.toSVGNode();

      if (svgParent) {
        svgParent.children.push(svgNode);
      }

      for (let child of node.graphicsChildren) {
        this.buildSceneNode(child, svgNode);
      }

      return svgNode;
    },

    convertToMarkup(markup, svgNode, level) {
      this.appendOpenTag(markup, svgNode, level);
      for (let child of svgNode.children) {
        this.convertToMarkup(markup, child, level + 1);
      }
      this.appendCloseTag(markup, svgNode, level);

      return markup.join('');
    },

    appendOpenTag(markup, svgNode, level) {
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
    },

    appendCloseTag(markup, svgNode, level) {
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
    },
  };

  const h = (tag, props = {}, ...children) => {
    return {
      tag: tag,
      props: props,
      children: children || [],
    };
  };

  const tools = (store) => {
    return h('ul', { id: 'buttons' },
      h('li', {},
        h('button', {
          id: 'newDocButton',
          class: 'pure-button',
          'data-type': 'newDocButton',
        }, 'New')
      ),
      docs(store),
      h('li', {},
        h('button', {
          id: 'getPrevious',
          'data-type': 'getPrevious',
          class: 'pure-button',
        }, 'Undo')
      ),
      h('li', {},
        h('button', {
          id: 'getNext',
          'data-type': 'getNext',
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
          id: 'pen',
          'data-type': 'pen',
          class: 'pure-button',
        }, 'Pen')
      )
    );
  };

  const docs = (store) => {
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
          }, identifier.payload._id)
          //  TODO: This is where we would need to put the *name* of the document.
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
  };

  const editor = (state) => {
    return state.exportToSVG();
  };

  const message = (store) => {
    return store.message.payload.text;
  };

  const LENGTHS_IN_PX = {
    cornerSideLength: 8,
    dotDiameter:      18,
    controlDiameter:  6,
  };


  const canvas = (store) => {
    return renderScene(store);
  };

  const renderScene = (store) => {
    if (store.scene === null) {
      return '';
    }

    return buildSceneNode(store.scene);
  };

  const buildSceneNode = (node, vParent = null) => {
    const vNode = node.toVDOMNode();

    if (vParent) {
      const vWrapper = wrap(vNode, node);
      vParent.children.push(vWrapper);
    }

    for (let child of node.graphicsChildren) {
      buildSceneNode(child, vNode);
    }

    return vNode;
  };

  const wrap = (vNode, node) => {
    const vWrapper = h('g', {
      'data-type': 'wrapper',
      'data-key':   node.key,
    });

    vWrapper.children.push(vNode);
    if (node.type === 'shape') { vWrapper.children.push(innerUI(node)); }
    vWrapper.children.push(outerUI(node));

    return vWrapper;
  };

  const outerUI = (node) => {
    const vOuterUI = h('g', {
      'data-type': 'outerUI',
      'data-key':   node.key,
    });

    const vFrame   = frame(node);
    const vDots    = dots(node);    // for rotation
    const vCorners = corners(node); // for scaling

    vOuterUI.children.push(vFrame);

    for (let vDot of vDots) {
      vOuterUI.children.push(vDot);
    }

    for (let vCorner of vCorners) {
      vOuterUI.children.push(vCorner);
    }

    return vOuterUI;
  };

  const corners = (node) => {
    const vTopLCorner = h('rect');
    const vBotLCorner = h('rect');
    const vTopRCorner = h('rect');
    const vBotRCorner = h('rect');
    const vCorners    = [vTopLCorner, vBotLCorner, vTopRCorner, vBotRCorner];
    const length      = scale(node, LENGTHS_IN_PX.cornerSideLength);

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
  };

  const dots = (node) => {
    const vTopLDot  = h('circle');
    const vBotLDot  = h('circle');
    const vTopRDot  = h('circle');
    const vBotRDot  = h('circle');
    const vDots     = [vTopLDot, vBotLDot, vTopRDot, vBotRDot];
    const diameter  = scale(node, LENGTHS_IN_PX.dotDiameter);
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
  };

  const frame = (node) => {
    return h('rect', {
      'data-type':  'frame',
      x:            node.bounds.x,
      y:            node.bounds.y,
      width:        node.bounds.width,
      height:       node.bounds.height,
      transform:    node.transform.toString(),
      'data-key':    node.key,
    });
  };

  const innerUI = (node) => {
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

  const connections = (node) => {
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
      x1:        anchor.x,
      y1:        anchor.y,
      x2:        handle.x,
      y2:        handle.y,
      transform: node.transform.toString(),
    });
  };

  const controls = (pathNode) => {
    const vControls = [];
    const diameter  = scale(pathNode, LENGTHS_IN_PX.controlDiameter);

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
      'data-key' : controlNode.key,
      transform  : pathNode.transform.toString(),
      r          : diameter / 2,
      cx         : controlNode.vector.x,
      cy         : controlNode.vector.y,
    });
  };

  const scale = (node, length) => {
    return length / node.globalScaleFactor();
  };

  const exportToVDOM = (state) => {
    return {
      tools:    tools(state.store),
      editor:   editor(state),
      message:  message(state.store),
      canvas:   canvas(state.store),
    };
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
        case 'markup':
          node = Markup.create();
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
      node.key  = object.key;
      node._id  = object._id;
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
          case 'text':
            node.payload.text = value;
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
        // ^ TODO: I think we don't need `docs`
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
      const doc    = Doc.create();
      const scene  = Scene.create();
      const markup = Markup.create();

      const width = this.width || 0;
      const height = this.height || 0;

      scene.viewBox = Rectangle.createFromDimensions(0, 0, 600, 395);

      markup.payload.text = '';

      doc.append(scene);
      doc.append(markup);

      return doc;
    },

    get scene() {
      return this.store.scene;
    },

    get markup() {
      return this.store.markup;
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

    exportToSVG() {
      return svgExporter.build(this.store);
    },

    // returns a Doc node and a list of ids (for docs)
    exportToVDOM() {
      return exportToVDOM(this);
    },

    // returns a plain representation of Doc node and a list of ids (for docs)
    exportToPlain() {
      return plainExporter.build(this.store);
    },
  };

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

    getPrevious(state, input) {
      console.log('calling getPrevious update');
      window.history.back(); // TODO: should we do this inside of hist?
    },

    getNext(state, input) {
      window.history.forward(); // TODO: should we do this inside of hist?
    },

    changeState(state, input) {
      state.store.scene.replaceWith(state.importFromPlain(input.data.doc));
    },

    // Markup

    // from ui: user has changed markup
    changeMarkup(state, input) {
      state.store.markup.payload.text = input.value;
      // TODO: I wonder if we need this at all. I don't think so.

      const newScene = state.importFromSVG(input.value);

      if (newScene !== null) {
        state.store.scene.replaceWith(newScene);
      } else {
        state.store.message.payload.text = 'Invalid markup';
      }
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

    // VARIOUS
    { type: 'click', target: 'doc-identifier', do: 'requestDoc', to: 'busy' },
    { type: 'click', target: 'newDocButton', do: 'createDoc', to: 'idle' },
    { type: 'click', target: 'getPrevious', do: 'getPrevious', to: 'idle' },
    { type: 'click', target: 'getNext', do: 'getNext', to: 'idle' },
    { type: 'changeState', do: 'changeState' },
    { type: 'docSaved', do: 'setSavedMessage' },
    { type: 'updateDocList', do: 'updateDocList' },
    { type: 'requestDoc', do: 'requestDoc', to: 'busy' }, // TODO: redundant?
    { from: 'busy', type: 'setDoc', do: 'setDoc', to: 'idle' },

    // INPUT
    { type: 'input', do: 'changeMarkup' },
    // { type: 'submit', do: 'submitChanges' }
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
      this.state     = State.create();
      this.periphery = [];
      
      return this;
    },

    attach(name, func) {
      this.periphery[name] = func;
    },

    compute(input) {
      this.state.input = input;

      const transition = transitions.get(this.state, input);

      if (transition) {
        this.state.update = transition.do;
        this.state.label  = transition.to;

        const update = updates[transition.do];
        update && update.bind(updates)(this.state, input);

        this.publish();
      }
    },

    publish() {
      for (let key of Object.keys(this.periphery)) {
        this.periphery[key](this.state.export());
      }
    },

    kickoff() {
      this.compute({ type: 'go' });
      // ^ needed to populate "Open" menu with docs retrieved from backend
    },
  };

  const UI = {
    init(state) {
      this.mountPoint   = document.querySelector(`#${this.name}`);
      this.dom          = this.createElement(state.vDOM[this.name]);
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
  };

  const svgns  = 'http://www.w3.org/2000/svg';
  const xmlns  = 'http://www.w3.org/2000/xmlns/';

  const canvas$1 = Object.assign(Object.create(UI), {
    init(state) {
      this.name = 'canvas';
      UI.init.bind(this)(state);
      return this;
    },

    bindEvents(func) {
      const mouseEvents = ['mousedown', 'mousemove', 'mouseup', 'click', 'dblclick'];

      for (let eventType of mouseEvents) {
        this.mountPoint.addEventListener(eventType, (event) => {
          if (this.clickLike(event) && event.detail > 1) {
            return;
          }

          if (event.type === 'mousedown') {
            document.querySelector('textarea').blur();
          }

          event.preventDefault();

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
    },

    createElement(vNode) {
      if (typeof vNode === 'string') {
        return document.createTextNode(vNode);
      }

      const $node = document.createElementNS(svgns, vNode.tag);

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

    clickLike(event) {
      return event.type === 'click' ||
             event.type === 'mousedown' ||
             event.type === 'mouseup';
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
  });

  const editor$1 = {
    init(state) {
      this.name       = 'editor';
      this.mountPoint = document.querySelector(`#editor`);
      this.editor     = codemirror_js.CodeMirror(this.mountPoint, {
        lineNumbers:  true,
        lineWrapping: true,
        mode:         'xml',
        value:        state.vDOM['editor'],
      });

      this.previousMarkup = state.vDOM['editor'];

      return this;
    },

    bindEvents(func) {
      this.editor.on('focus', () => {
        this.textMarker.clear();
      });

      this.editor.on('change', () => {
        if (this.editor.hasFocus()) {
          func({
            source: this.name,
            type:   'input',
            value:  this.editor.getValue(),
          });
        }
      });
    },

    react(state) {
      const currentMarkup  = state.vDOM['editor'];
      const previousMarkup = this.previousMarkup;

      if (!this.editor.hasFocus() && currentMarkup !== previousMarkup) {
        this.editor.getDoc().setValue(currentMarkup);
        this.markChange(state);
      }

      this.previousMarkup = state.vDOM['editor'];
    },

    markChange(state) {
      this.currentMarkup = state.vDOM['editor'];
      const indices      = this.diffMarkup(state);

      if (indices !== undefined) {
        const stripped  = this.stripWhitespace(indices);
        const range     = this.convertToRange(stripped);
        this.textMarker = this.editor.doc.markText(...range, { className: 'mark' });
      }
    },

    diffMarkup(state) {
      const currentLength  = this.currentMarkup.length;
      const previousLength = this.previousMarkup.length;

      // idea: if markup has been removed, there will be no text to be marked
      if (previousLength > currentLength) {
        return undefined;
      }

      let start = this.findStart();  // beginning of inserted slice of text
      let end = this.findEnd();    // end of inserted slice of text

      for (let i = 0; i < currentLength; i += 1) {
        if (this.currentMarkup[i] !== this.previousMarkup[i]) {
          start = i;
          break;
        }
      }

      let k = previousLength - 1;

      for (let j = currentLength - 1; j >= 0; j -= 1) {
        if (this.currentMarkup[j] !== this.previousMarkup[k]) {
          end = j;
          break;
        }

        k -= 1;
      }

      return [start, end];
    },

    stripWhitespace(indices) {
      // TODO: zoom in on the subinterval of [start, end] such that neither start nor end
      // are whitespace characters

      return indices;
    },

    convertToRange(indices) {
      const from = this.editor.doc.posFromIndex(indices[0]);
      const to   = this.editor.doc.posFromIndex(indices[1] + 2);

      return [from, to];
    },
  };

  const tools$1 = Object.assign(Object.create(UI), {
    init(state) {
      this.name = 'tools';
      UI.init.bind(this)(state);
      return this;
    },

    bindEvents(func) {
      this.mountPoint.addEventListener('click', (event) => {
        event.preventDefault();
        document.querySelector('textarea').blur();

        func({
          source: this.name,
          type:   event.type,
          target: event.target.dataset.type,
          key:    event.target.dataset.key,
        });
      });
    },
  });

  const message$1 = Object.assign(Object.create(UI), {
    init(state) {
      this.name = 'message';
      UI.init.bind(this)(state);
      return this;
    },

    bindEvents(func) {
      window.addEventListener('cleanMessage', (event) => {
        func({
          source: this.name,
          type:   'cleanMessage',
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
        this.timer = window.setTimeout(this.cleanMessage, 1000);
      }
    },

    cleanMessage() {
      window.dispatchEvent(new Event('cleanMessage'));
    },
  });

  const db = {
    init(state) {
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

    react(state) {
      if (state.update === 'go') {
        window.dispatchEvent(
          new Event('loadDocIDs')
        );
      } else if (state.update === 'requestDoc') {
        window.dispatchEvent(
          new CustomEvent('readDoc', { detail: state.input.key })
        );
      } else if (['release', 'releasePen', 'changeMarkup'].includes(state.update)) {
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
            type:   'changeState',
            data:   event.state,
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
      const release      = update === 'release' ;
      const releasePen   = update === "releasePen";
      const go           = update === 'go';
      const changeMarkup = update === "changeMarkup";


      return release || releasePen || go || changeMarkup;
    },
  };

  const components = [canvas$1, editor$1, tools$1, message$1, hist, db];

  const app = {
    init() {
      core.init();

      for (let component of components) {
        component.init(core.state.export());
        component.bindEvents(core.compute.bind(core));
        core.attach(component.name, component.react.bind(component));
      }

      core.kickoff();
    },
  };

  document.addEventListener('DOMContentLoaded', app.init.bind(app));

}(bezier_js,codemirror_js));
//# sourceMappingURL=bundle.js.map
