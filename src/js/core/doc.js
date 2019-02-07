const createID = () => {
  const randomString = Math.random().toString(36).substring(2);
  const timestamp    = (new Date()).getTime().toString(36);
  return randomString + timestamp;
};

const Matrix = {
  multiply(other) {
    const thisRows  = this.m.length;
    const thisCols  = this.m[0].length;
    const otherRows = other.m.length;
    const otherCols = other.m[0].length;
    const m         = new Array(thisRows);

    for (let r = 0; r < thisRows; r += 1) {
      m[r] = new Array(otherCols);

      for (let c = 0; c < otherCols; c += 1) {
        m[r][c] = 0;

        for (let i = 0; i < thisCols; i += 1) {
          m[r][c] += this.m[r][i] * other.m[i][c];
        }
      }
    }

    return Object.create(Matrix).init(m);
  },

  identity() {
    const m = JSON.parse(JSON.stringify(
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ]
    ));

    return Object.create(Matrix).init(m);
  },

  rotation(angle, origin) {
    const [originX, originY] = origin;
    const sin                = Math.sin(angle);
    const cos                = Math.cos(angle);

    const m = [
      [cos, -sin, -originX * cos + originY * sin + originX],
      [sin,  cos, -originX * sin - originY * cos + originY],
      [0,    0,    1                                      ]
    ];

    return Object.create(Matrix).init(m);
  },

  translation(vector) {
    const [vectorX, vectorY] = vector;

    const m = [
      [1, 0, vectorX],
      [0, 1, vectorY],
      [0, 0, 1      ]
    ];

    return Object.create(Matrix).init(m);
  },

  scale(factor, origin) {
    const [originX, originY] = origin;

    const m = [
      [factor, 0,      originX - factor * originX],
      [0,      factor, originY - factor * originY],
      [0,      0,      1                         ]
    ];

    return Object.create(Matrix).init(m);
  },

  toVector() {
    return [
      this.m[0][0], this.m[1][0], this.m[0][1],
      this.m[1][1], this.m[0][2], this.m[1][2]
    ];
  },

  fromDOMMatrix($matrix) {
    this.m = [
      [$matrix.a, $matrix.c, $matrix.e],
      [$matrix.b, $matrix.d, $matrix.f],
      [0,         0,         1        ]
    ];

    return this;
  },

  toJSON() {
    return this.toAttributeString();
  },

  toAttributeString() {
    return `matrix(${this.toVector()})`;
  },

  init(m) {
    this.m = m;
    return this;
  },
};

const sceneBuilder = {
  processAttributes($node, node) {
    const $attributes = Array.from($node.attributes);

    for (let $attribute of $attributes) {
      node.props[$attribute.name] = $attribute.value;
    }

    delete node.props.xmlns;

    if ($node.transform && $node.transform.baseVal && $node.transform.baseVal.consolidate()) {
      const $matrix = $node.transform.baseVal.consolidate().matrix;
      node.props.transform = Object.create(Matrix).fromDOMMatrix($matrix);
    }
  },

  copyTagName($node, node) {
    node.tag = $node.tagName;
  },

  copyStyles($node, node) {
    node.styles = Array.from($node.querySelectorAll('style'));
  },

  copyDefs($node, node) {
    node.defs = Array.from($node.querySelectorAll('style'));
  },

  buildTree($node, node) {
    this.copyTagName($node, node);
    this.processAttributes($node, node);

    const $graphics = Array.from($node.children).filter((child) => {
      return child instanceof SVGGElement || child instanceof SVGGeometryElement
    });

    for (let $child of $graphics) {
      const child = Object.create(Scene).init();
      node.append(child);
      this.buildTree($child, child);
    }
  },

  createScene($svg) {
    const svg = Object.create(Scene).init();

    this.copyStyles($svg, svg);
    this.copyDefs($svg, svg);
    this.buildTree($svg, svg);

    return svg;
  },
};

const Scene = {
  closestAncestor(params) {
    let node = this;

    while (node.parent !== null) {
      if (node.satisfies(params)) {
        return node;
      } else {
        node = node.parent;
      }
    }

    return null;
  },

  satisfies(params) {
    const sameValue = key => this[key] === params[key];
    const keys      = Object.keys(params);

    return keys.every(sameValue);
  },

  findNode(params) {
    if (this.satisfies(params)) {
      return this;
    } else {
      for (child of this.children) {
        return child.findNode(params);
      }
    }

    return null;
  },

  append(node) {
    this.children.push(node);
    node.parent = this;
  },

  set(params) {
    const keys = Object.keys(params);

    for (let key of keys) {
      this[key] = params[key] || this[key];
    }
  },

  fromMarkup(markup) {
    const $svg = new DOMParser()
      .parseFromString(markup, "application/xml")
      .documentElement;

    return sceneBuilder.createScene($svg);
  },

  // TODO: the only change is to the `parent` property
  toJSON() {
    return {
      _id:         this._id,
      parent:      this.parent && this.parent._id || null,
      children:    this.children,
      tag:         this.tag,
      props:       this.props,
    };
  },

  defaults() {
    return {                           // for toJSON:
      _id:         createID(),
      parent:      null,               // need to replace with parent id
      children:    [],
      tag:         null,
      props:       {
        transform: Matrix.identity(),  // need to replace matrix with matrix.m
      },
    };
  },

  init(params = {}) {
    this.set(this.defaults());
    this.set(params);

    return this;
  },
};

const doc = {
  insert(scene) {
    // TODO: insert new scene after active scene
  },

  init(markup) {
    this._id = createID();
    this.scene = Object.create(Scene).fromMarkup(markup);

    return this;
  },
};

export { doc };
