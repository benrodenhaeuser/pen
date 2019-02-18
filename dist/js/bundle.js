(function () {
  'use strict';

  const clock = {
    init(time = 0) {
      this.time = time;
      return this;
    },

    tick() {
      this.time += 1;
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
      return this.toAttributeString();
    },

    toAttributeString() {
      return `matrix(${this.toVector()})`;
    },

    toVector() {
      return [
        this.m[0][0], this.m[1][0], this.m[0][1],
        this.m[1][1], this.m[0][2], this.m[1][2]
      ];
    },

    toArray() {
      return this.m;
    },

    multiply(other) {
      const m = math.multiply(this.m, other.m);
      return Matrix.create(m);
    },

    invert() {
      const m = JSON.parse(JSON.stringify(this.m));
      return Matrix.create(math.inv(m));
    },

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

    translation(vector) {
      const m = [
        [1, 0, vector.x],
        [0, 1, vector.y],
        [0, 0, 1       ]
      ];

      return Matrix.create(m);
    },

    scale(factor, origin = Vector.create(0, 0)) {
      const m = [
        [factor, 0,      origin.x - factor * origin.x],
        [0,      factor, origin.y - factor * origin.y],
        [0,      0,      1                           ]
      ];

      return Matrix.create(m);
    },
  };

  const Vector = {
    create(x, y) {
      return Object.create(Vector).init(x, y);
    },

    init(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },

    transform(matrix) {
      const column      = Matrix.create([[this.x], [this.y], [1]]);
      const transformed = matrix.multiply(column).toArray();

      return Vector.create(transformed[0][0], transformed[1][0]);
    },

    add(other) {
      return Vector.create(this.x + other.x, this.y + other.y);
    },

    subtract(other) {
      return Vector.create(this.x - other.x, this.y - other.y);
    },

    isWithin(rectangle) {
      return this.x >= rectangle.x &&
             this.x <= rectangle.x + rectangle.width &&
             this.y >= rectangle.y &&
             this.y <= rectangle.y + rectangle.height;
    },
  };

  const ClassList = {
    create(classNames = []) {
      return Object.create(ClassList).init(classNames);
    },

    init(classNames) {
      this.set = new Set(classNames);
      return this;
    },

    toJSON() {
      return Array.from(this.set).join(' ');
    },

    includes(className) {
      return this.set.has(className);
    },

    add(className) {
      this.set.add(className);
    },

    remove(className) {
      this.set.delete(className);
    },
  };

  const createID = () => {
    const randomString = Math.random().toString(36).substring(2);
    const timestamp    = (new Date()).getTime().toString(36);
    return randomString + timestamp;
  };

  const Node = {
    create(opts = {}) {
      return Object.create(Node).init(opts);
    },

    init(opts) {
      this.set(this.defaults());
      this.set(opts);
      return this;
    },

    defaults() {
      return {
        _id:         createID(),
        children:    [],
        parent:      null,
        tag:         null,
        box:         { x: 0, y: 0, width: 0, height: 0 },
        props:    {
          transform: Matrix.identity(),
          class:     ClassList.create(),
        },
      };
    },

    toJSON() {
      return {
        _id:         this._id,
        parent:      this.parent && this.parent._id,
        children:    this.children,
        tag:         this.tag,
        props:       this.props,
        box:         this.box,
        globalScale: this.globalScaleFactor(),
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

    findDescendants(predicate, resultList = []) {
      if (predicate(this)) {
        resultList.push(this);
      }

      for (let child of this.children) {
        child.findDescendants(predicate, resultList);
      }

      return resultList;
    },

    get root() {
      return this.findAncestor((node) => {
        return node.parent === null;
      });
    },

    get ancestors() {
      return this.findAncestors(node => true);
    },

    get descendants() {
      return this.findDescendants(node => true);
    },

    get siblings() {
      return this.parent.children.filter((node) => {
        return node !== this;
      });
    },

    get leaves() {
      // TODO
    },

    get selected() {
      return this.root.findDescendant((node) => {
        return node.classList.includes('selected');
      });
    },

    get frontier() {
      return this.root.findDescendants((node) => {
        return node.classList.includes('frontier');
      });
    },

    get classList() {
      return this.props.class;
    },

    set classList(value) {
      this.props.class = value;
    },

    get transform() {
      return this.props.transform;
    },

    set transform(value) {
      this.props.transform = value;
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
      const factor = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));

      return factor;
    },

    // plot point for debugging
    plot(point) {
      const node = Node.create();
      node.tag = 'circle';
      node.props = Object.assign(node.props, {
        r: 5, cx: point[0], cy: point[1], fill: 'red'
      });
      node.box = { x: point[0], y: point[1], width: 5, height: 5};
      this.root.append(node);
    },

    updateBox() {
      const childrenCorners = [];

      for (let child of this.children) {
        for (let corner of child.corners) {
          childrenCorners.push(corner.transform(child.transform));
        }
      }

      if (childrenCorners.length === 0) {
        return;
      }

      const xValue  = vector => vector.x;
      const xValues = childrenCorners.map(xValue);
      const minX    = Math.min(...xValues);
      const maxX    = Math.max(...xValues);

      const yValue  = vector => vector.y;
      const yValues = childrenCorners.map(yValue);
      const minY    = Math.min(...yValues);
      const maxY    = Math.max(...yValues);

      this.box = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    },

    get corners() {
      return [
        Vector.create(this.box.x, this.box.y),
        Vector.create(this.box.x + this.box.width, this.box.y),
        Vector.create(this.box.x, this.box.y + this.box.height),
        Vector.create(this.box.x + this.box.width, this.box.y + this.box.height)
      ]
    },

    unsetFrontier() {
      const frontier = this.root.findDescendants((node) => {
        return node.classList.includes('frontier');
      });

      for (let node of frontier) {
        node.classList.remove('frontier');
      }
    },

    unfocusAll() {
      const focussed = this.root.findDescendants((node) => {
        return node.classList.includes('focus');
      });

      for (let node of focussed) {
        node.classList.remove('focus');
      }
    },

    setFrontier() {
      this.unsetFrontier();

      if (this.selected) {
        this.selected.classList.add('frontier');

        let node = this.selected;

        do {
          for (let sibling of node.siblings) {
            sibling.classList.add('frontier');
          }
          node = node.parent;
        } while (node.parent !== null);
      } else {
        for (let child of this.root.children) {
          child.classList.add('frontier');
        }
      }
    },

    deselectAll() {
      if (this.selected) {
        this.selected.classList.remove('selected');
      }
      this.setFrontier();
    },

    select() {
      this.deselectAll();
      this.classList.add('selected');
      this.setFrontier();
    },
  };

  const sceneBuilder = {
    createScene(markup) {
      const $svg = new DOMParser()
        .parseFromString(markup, "application/xml")
        .documentElement;
      const svg = Node.create();

      document.body.appendChild($svg);
      this.process($svg, svg);
      $svg.remove();

      return svg;
    },

    process($svg, svg) {
      this.copyStyles($svg, svg);
      this.copyDefs($svg, svg);
      this.buildTree($svg, svg);
      svg.setFrontier();
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
      this.copyBBox($node, node);

      const $graphicsChildren = Array.from($node.children).filter((child) => {
        return child instanceof SVGGElement || child instanceof SVGGeometryElement
      });

      for (let $child of $graphicsChildren) {
        const child = Node.create();
        node.append(child);
        this.buildTree($child, child);
      }
    },

    copyTagName($node, node) {
      node.tag = $node.tagName;
    },

    processAttributes($node, node) {
      const $attributes = Array.from($node.attributes);
      for (let $attribute of $attributes) {
        node.props[$attribute.name] = $attribute.value;
      }
      delete node.props.xmlns;

      // $node might already have a transform applied:
      if (
        $node.transform &&
        $node.transform.baseVal &&
        $node.transform.baseVal.consolidate()
      ) {
        const $matrix = $node.transform.baseVal.consolidate().matrix;
        node.transform = Matrix.createFromDOMMatrix($matrix);
      }

      node.classList = ClassList.create(
        Array.from($node.classList)
      );
    },

    copyBBox($node, node) {
      const box = $node.getBBox();
      node.box = {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      };
    },
  };

  const createID$1 = () => {
    const randomString = Math.random().toString(36).substring(2);
    const timestamp    = (new Date()).getTime().toString(36);
    return randomString + timestamp;
  };

  const doc = {
    init(markup) {
      this._id   = createID$1();
      this.scene = sceneBuilder.createScene(markup);

      return this;
    },

    toJSON() {
      return {
        _id: this._id,
        scene: this.scene,
      }
    }
  };

  let aux = {};

  const actions = {
    select(state, input) {
      const selected = state.doc.scene
        .findDescendant((node) => {
          return node._id === input.pointer.targetID;
        })
        .findAncestor((node) => {
          return node.props.class.includes('frontier');
        });

      if (selected) {
        selected.select();
        this.initShift(state, input);
      } else {
        state.doc.scene.deselectAll();
      }
    },

    initShift(state, input) {
      aux.source = Vector.create(input.pointer.x, input.pointer.y);
    },

    shift(state, input) {
      const selected = state.doc.scene.selected;

      if (!selected) { return; }

      const target      = Vector.create(input.pointer.x, input.pointer.y);
      const translate   = target.subtract(aux.source);
      const translation = Matrix.translation(translate);

      selected.transform = selected
        .ancestorTransform().invert()
        .multiply(translation)
        .multiply(selected.globalTransform());

      aux.source = target;
    },

    initRotate(state, input) {
      const selected = state.doc.scene.selected;
      aux.source     = Vector.create(input.pointer.x, input.pointer.y);
      const box      = selected.box;
      const center   = Vector.create(box.x + box.width/2, box.y + box.height/2);
      aux.center     = center.transform(selected.globalTransform());
    },

    rotate(state, input) {
      const selected          = state.doc.scene.selected;
      const target            = Vector.create(input.pointer.x, input.pointer.y);
      const sourceMinusCenter = aux.source.subtract(aux.center);
      const targetMinusCenter = target.subtract(aux.center);

      const sourceAngle = Math.atan2(sourceMinusCenter.y, sourceMinusCenter.x);
      const targetAngle = Math.atan2(targetMinusCenter.y, targetMinusCenter.x);
      const angle       = targetAngle - sourceAngle;
      const rotation    = Matrix.rotation(angle, aux.center);

      selected.transform = selected
        .ancestorTransform().invert()
        .multiply(rotation)
        .multiply(selected.globalTransform());

      aux.source = target;
    },

    initScale(state, input) {
      const selected = state.doc.scene.selected;
      aux.source     = Vector.create(input.pointer.x, input.pointer.y);
      const box      = selected.box;
      const center   = Vector.create(box.x + box.width/2, box.y + box.height/2);
      aux.center     = center.transform(selected.globalTransform());
    },

    scale(state, input) {
      const selected          = state.doc.scene.selected;
      const target            = Vector.create(input.pointer.x, input.pointer.y);
      const sourceMinusCenter = aux.source.subtract(aux.center);
      const targetMinusCenter = target.subtract(aux.center);

      const sourceDist = Math.sqrt(
        Math.pow(sourceMinusCenter.x, 2) +
        Math.pow(sourceMinusCenter.y, 2)
      );
      const targetDist = Math.sqrt(
        Math.pow(targetMinusCenter.x, 2) +
        Math.pow(targetMinusCenter.y, 2)
      );
      const factor     = targetDist / sourceDist;
      const scaling    = Matrix.scale(factor, aux.center);

      selected.transform = selected
        .ancestorTransform().invert()
        .multiply(scaling)
        .multiply(selected.globalTransform());

      aux.source = target;
    },

    release(state, input) {
      const selected = state.doc.scene.selected;

      for (let ancestor of selected.ancestors) {
        ancestor.updateBox();
      }

      aux = {};
    },

    selectThrough(state, input) {
      const target = state.doc.scene.findDescendant((node) => {
        return node._id === input.pointer.targetID;
      });

      const selection = target.findAncestor((node) => {
        return node.parent && node.parent.props.class.includes('frontier');
      });

      if (selection) {
        selection.select();
        state.doc.scene.setFrontier();
        state.doc.scene.unfocusAll();
      }
    },

    focus(state, input) {
      const target = state.doc.scene.findDescendant((node) => {
        return node._id === input.pointer.targetID;
      });

      if (target) {
        const toFocus = target.findAncestor((node) => {
          return node.classList.includes('frontier');
        });

        if (toFocus) {
          const pointer = Vector
            .create(input.pointer.x, input.pointer.y)
            .transform(toFocus.globalTransform().invert());

          if (pointer.isWithin(toFocus.box)) {
            toFocus.classList.add('focus');
          } else {
            state.doc.scene.unfocusAll();
          }
        }
      }
    },

    // OLD (probably useless):

    createDoc(state, input) {
      state.doc.init();
      state.docs.ids.push(state.doc._id);
      state.docs.selectedID = state.doc._id;
    },

    updateDocList(state, input) {
      state.docs.ids = input.data.docIDs;
    },

    requestDoc(state, input) {
      state.docs.selectedID = input.pointer.targetID;
    },

    setDoc(state, input) {
      state.doc.init(input.data.doc);
    },
  };

  const transitionTable = [
    // kickoff
    [{ from: 'start',     input: 'kickoff'        }, { to: 'idle'              }],

    // NEW
    [{ from: 'idle',      input: 'selectThrough'  }, { to: 'idle'              }],
    [{ from: 'idle',      input: 'movePointer'    }, { to: 'idle', do: 'focus' }],

    // select/shift
    [{ from: 'idle',      input: 'select'         }, { to: 'shifting'          }],
    [{ from: 'shifting',  input: 'movePointer'    }, { do: 'shift'             }],
    [{ from: 'shifting',  input: 'release'        }, { to: 'idle'              }],

    // rotate
    [{ from: 'idle',      input: 'initRotate'     }, { to: 'rotating'          }],
    [{ from: 'rotating',  input: 'movePointer'    }, { do: 'rotate'            }],
    [{ from: 'rotating',  input: 'release'        }, { to: 'idle'              }],

    // scale
    [{ from: 'idle',      input: 'initScale'      }, { to: 'scaling'           }],
    [{ from: 'scaling',   input: 'movePointer'    }, { do: 'scale'             }],
    [{ from: 'scaling',   input: 'release'        }, { to: 'idle'              }],

    // OLD

    // create and delete (part of this might still be relevant)
    [{ from: 'idle',      input: 'createShape'    }, {                         }],
    [{ from: 'idle',      input: 'createDoc'      }, {                         }],
    [{ from: 'idle',      input: 'deleteFrame'    }, {                         }],
    [{                    input: 'docSaved'       }, {                         }],
    [{                    input: 'updateDocList'  }, {                         }],
    [{                    input: 'requestDoc'     }, { to: 'busy'              }],
    [{ from: 'busy',      input: 'setDoc'         }, { to: 'idle'              }],

    // animate (part of this might still be relevant)
    [{ from: 'idle',      input: 'animate'        }, { to: 'animating'         }],
    [{ from: 'animating', input: 'animate'        }, { to: 'animating'         }],
    [{ from: 'animating', input: 'edit'           }, { to: 'idle'              }],
    [{ from: 'animating', input: 'createDoc'      }, { to: 'idle'              }],
    [{ from: 'animating', input: 'createShape'    }, { to: 'idle'              }],
  ];

  transitionTable.get = function(key) {
    const match = (pair) => {
      return (pair[0].from === key[0] || !pair[0].from) &&
        pair[0].input === key[1];
    };

    const pair = transitionTable.find(match);

    if (pair) {
      return pair[1];
    }
  };

  const core = {
    get stateData() {
      return JSON.parse(JSON.stringify(this.state));
    },

    syncPeriphery() {
      const keys = Object.keys(this.periphery);
      for (let key of keys) {
        this.periphery[key](JSON.parse(JSON.stringify(this.state)));
      }
    },

    // TODO: write a proper function to initalize state from stateData
    setState(stateData) {
      this.state = stateData;
      this.state.doc = doc.init(stateData.doc);
      this.state.clock = clock.init(stateData.clock.time);
      this.periphery['ui'] &&
        this.periphery['ui'](JSON.parse(JSON.stringify(this.state)));
      // ^ only UI is synced
      // ^ TODO: call syncPeriphery here, and make that method more flexible
    },

    processInput(input) {
      const transition = transitionTable.get([this.state.id, input.id]);

      if (transition) {
        this.transform(input, transition);
        this.syncPeriphery();
      }
    },

    transform(input, transition) {
      const action = actions[transition.do] || actions[input.id];
      action && action.bind(actions)(this.state, input);

      this.state.clock.tick();
      this.state.currentInput = input.id;
      this.state.id = transition.to || this.state.id;
    },

    init() {
      this.state = {
        clock: clock.init(),
        id: 'start',
        doc: doc.init(markup),
        docs: { ids: [], selectedID: null },
      };

      this.periphery = [];
      return this;
    },

    // TODO: why do we need this function? why can't we just do:
    //   this.processInput({ id: 'kickoff' });
    // ?
    kickoff() {
      this.syncPeriphery();
      this.processInput({ id: 'kickoff' });
      // ^ TODO: this involves two syncs, is that really necessary?
    },
  };

  const markup = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">

    <g>
      <circle cx="200" cy="200" r="50"></circle>
      <g>
        <rect x="260" y="250" width="100" height="100"></rect>
        <rect x="400" y="250" width="100" height="100"></rect>
      </g>
    </g>

    <rect x="400" y="400" width="100" height="100"></rect>
  </svg>
`;

  const log = {
    bindEvents(setState) {
      window.addEventListener('popstate', (event) => {
        setState(event.state);
      });
    },

    sync(state) {
      const ignored = [
        'docSaved', 'edit', 'createDoc', 'createShape', 'movePointer'
      ];
      const ignore  = ignored.includes(state.currentInput);
      const idle    = state.id === 'idle';
      if (ignore || !idle) {
        return;
      }

      window.history.pushState(state, 'entry');
    },

    init() {
      this.name = 'log';
      return this;
    }
  };

  // OLD

  const frameTemplate = (index, shape, frame) => {
    const template = document.createElement('template');
    template.innerHTML = `
    <div class="svg">${shape.markup}</div>
    <div class="frame-body" data-type="frame" data-id="${frame._id}"></div>
    <div class="rotate-handle" data-type="rotate-handle">
    </div>
    <div class="corner top-left" data-type="top-left-corner">
      <div class="center"></div>
    </div>
    <div class="corner top-right" data-type="top-right-corner">
      <div class="center"></div>
    </div>
    <div class="corner bottom-left" data-type="bot-left-corner">
      <div class="center"></div>
    </div>
    <div class="corner bottom-right" data-type="bot-right-corner">
      <div class="center"></div>
    </div>
    <div class="counter" data-type="counter">${index}</div>
    <a class="deleteLink" href="#" data-type="deleteLink">&times;</a>
  `;
    return template;
  };

  const nodeFactory = {
    makeShapeNode(state, id) {
      const node = document.createElement('div');
      node.classList.add('shape');
      node.dataset.id = id;
      node.dataset.type = 'shape';
      return node;
    },

    makeFrameNode(index, shape, frame) {
      const node = document.createElement('div');
      node.classList.add('frame');
      // node.dataset.type = 'frame';
      node.dataset.id = frame._id;
      node.appendChild(frameTemplate(index, shape, frame).content.cloneNode(true));

      const handle = node.querySelector('.rotate-handle');
      handle.dataset.id = frame._id;

      return node;
    },

    makeDocListNode(id) {
      const node = document.createElement('li');
      node.innerHTML = `
      <a href="#" class="pure-menu-link"  data-type="doc-list-entry" data-id="${id}">${id}</a>
    `;
      node.classList.add('pure-menu-item');

      return node;
    },

    makeNavigatorNode(doc) {
      const node = document.createElement('ul');
      node.classList.add('navigator-list');
      // generate innerHTML in a loop
    },

    makeInspectorNode(frame) {
      const node = document.createElement('ul');
      node.classList.add('inspector-list');

      if (frame !== undefined) {
        node.innerHTML = `
        <li>x: ${frame.x}</li>
        <li>y: ${frame.y}</li>
        <li>width: ${frame.width}</li>
        <li>height: ${frame.height}</li>
        <li>angle: ${frame.angle}</li>
      `;
      }

      return node;
    }
  };

  const inputTable = [
    // event type     pointer target        input
    // NEW

    [['mousedown',   'wrapper'          ], 'select'          ],
    [['mousedown',   'dot'              ], 'initRotate'      ],
    [['mousedown',   'corner'           ], 'initScale'       ],
    [['dblclick',    'wrapper'          ], 'selectThrough'   ],
    [['mousemove'                       ], 'movePointer'     ],
    [['mouseup'                         ], 'release'         ],

    // OLD (some still relevant, some not)

    // [['click',       'newShapeButton'   ], 'createShape'     ],
    // [['click',       'newDocButton'     ], 'createDoc'       ],
    // [['click',       'animateButton'    ], 'animate'         ],
    // [['click',       'doc-list-entry'   ], 'requestDoc'      ],
    // [['click',       'deleteLink'       ], 'deleteFrame'     ],
    // [['click',       'canvas'           ], 'edit'            ],
    // [['mousedown',   'frame'            ], 'getFrameOrigin'  ],
    // [['mousedown',   'top-left-corner'  ], 'findOppCorner'   ],
    // [['mousedown',   'top-right-corner' ], 'findOppCorner'   ],
    // [['mousedown',   'bot-left-corner'  ], 'findOppCorner'   ],
    // [['mousedown',   'bot-right-corner' ], 'findOppCorner'   ],
    // [['mousedown',   'canvas'           ], 'setFrameOrigin'  ],
    // [['mousedown',   'rotate-handle'    ], 'getStartAngle'   ],
    // [['mousemove'                       ], 'changeCoords'    ],
    // [['mouseup'                         ], 'releaseFrame'    ],
  ];

  inputTable.get = function(key) {
    const match = (pair) => {
      return pair[0][0] === key[0] &&
        (pair[0][1] === key[1] || pair[0][1] === undefined);
    };

    const pair = inputTable.find(match);

    if (pair) {
      return pair[1];
    }
  };

  const svgns = 'http://www.w3.org/2000/svg';
  const xmlns = 'http://www.w3.org/2000/xmlns/';

  SVGElement.prototype.getSVGAttr = function(...args) {
    return this.getAttributeNS.apply(this, [null].concat(args));
  };

  SVGElement.prototype.setSVGAttr = function(...args) {
    return this.setAttributeNS.apply(this, [null].concat(args));
  };

  SVGElement.prototype.setSVGAttrs = function(obj) {
    for (let key of Object.keys(obj)) {
      this.setSVGAttr(key, obj[key]);
    }
  };

  const wrap = ($node, node) => {
    const wrapper    = document.createElementNS(svgns, 'g');
    const chrome     = document.createElementNS(svgns, 'g');
    const frame      = document.createElementNS(svgns, 'rect');
    const topLCorner = document.createElementNS(svgns, 'rect');
    const botLCorner = document.createElementNS(svgns, 'rect');
    const topRCorner = document.createElementNS(svgns, 'rect');
    const botRCorner = document.createElementNS(svgns, 'rect');
    const topLDot    = document.createElementNS(svgns, 'circle');
    const botLDot    = document.createElementNS(svgns, 'circle');
    const topRDot    = document.createElementNS(svgns, 'circle');
    const botRDot    = document.createElementNS(svgns, 'circle');
    const corners    = [topLCorner, botLCorner, topRCorner, botRCorner];
    const dots       = [topLDot,    botLDot,    topRDot,    botRDot];

    const width       = node.box.width;
    const height      = node.box.height;
    const x           = node.box.x;
    const y           = node.box.y;
    const transform   = node.props.transform;
    const id          = node._id;

    // $node

    $node.setSVGAttrs({
      'data-type': 'content',
      'pointer-events': 'none',
    });

    // $wrapper

    wrapper.setSVGAttrs({
      'data-type':      'wrapper',
      'pointer-events': 'bounding-box',
      'data-id':        id,
    });

    // $chrome

    chrome.setSVGAttrs({
      'data-type': 'chrome',
      'data-id': id,
      'pointer-events': 'visiblePainted',
      'visibility': 'hidden',
    });

    // $frame

    frame.setSVGAttrs({
      'data-type':      'frame',
      x:                 x,
      y:                 y,
      width:             width,
      height:            height,
      stroke:            '#d3d3d3',
      'vector-effect':  'non-scaling-stroke',
      'stroke-width':   '1px',
      transform:         transform,
      fill:             'none',
      'pointer-events': 'none',
      'data-id':        id,
    });

    // $corners and $dots

    const adjust = (value) => {
      return value / (node.globalScale * sceneRenderer.documentScale);
    };

    const baseSideLength = 8;
    const baseDiameter   = 9;
    const sideLength     = adjust(baseSideLength);
    const diameter       = adjust(baseDiameter);
    const radius         = diameter / 2;

    for (let corner of corners) {
      corner.setSVGAttrs({
        'data-type':     'corner',
        'data-id':       id,
        transform:       transform,
        width:           sideLength,
        height:          sideLength,
        stroke:          '#d3d3d3',
        'vector-effect': 'non-scaling-stroke',
        'stroke-width':  '1px',
        fill:            '#FFFFFF',
      });
    }

    topLCorner.setSVGAttrs({
      x: x - sideLength / 2,
      y: y - sideLength / 2,
    });

    botLCorner.setSVGAttrs({
      x: x - sideLength / 2,
      y: y + height - sideLength / 2,
    });

    topRCorner.setSVGAttrs({
      x: x + width - sideLength / 2,
      y: y - sideLength / 2,
    });

    botRCorner.setSVGAttrs({
      x: x + width - sideLength / 2,
      y: y + height - sideLength / 2,
    });

    for (let dot of dots) {
      dot.setSVGAttrs({
        'data-type':      'dot',
        'data-id':        id,
        transform:        transform,
        r:                radius,
        stroke:           '#d3d3d3',
        'vector-effect':  'non-scaling-stroke',
        'stroke-width':   '1px',
        fill:             '#FFFFFF',
        // 'pointer-events': all,
      });
    }

    topLDot.setSVGAttrs({
      cx: x - diameter,
      cy: y - diameter,
    });

    botLDot.setSVGAttrs({
      cx: x - diameter,
      cy: y + height + diameter,
    });

    topRDot.setSVGAttrs({
      cx: x + width + diameter,
      cy: y - diameter,
    });

    botRDot.setSVGAttrs({
      cx: x + width + diameter,
      cy: y + height + diameter,
    });

    // glue it together under $wrapper

    wrapper.appendChild($node);
    wrapper.appendChild(chrome);
    chrome.appendChild(frame);
    for (let corner of corners) {
      chrome.appendChild(corner);
    }
    for (let dot of dots) {
      chrome.appendChild(dot);
    }

    return wrapper;
  };

  // TODO: need to take care of style and defs
  const sceneRenderer = {
    get canvasWidth() {
      const canvasNode = document.querySelector('#canvas');
      return canvasNode.clientWidth;
    },

    render(scene, $canvas) {
      canvas.innerHTML = '';
      this.build(scene, $canvas);
    },

    build(node, $parent) {
      const $node = document.createElementNS(svgns, node.tag);
      $node.setSVGAttrs(node.props);
      $node.setSVGAttr('data-id', node._id);

      if (node.tag === 'svg') {
        $node.setAttributeNS(xmlns, 'xmlns', svgns);
        $node.setAttributeNS(svgns, 'data-type', 'root');
        $parent.appendChild($node);
        const viewBoxWidth = Number(node.props.viewBox.split(' ')[2]);
        this.documentScale = this.canvasWidth / viewBoxWidth;
      } else {
        const $wrapper = wrap($node, node);
        $parent.appendChild($wrapper);
      }

      for (let child of node.children) {
        sceneRenderer.build(child, $node);
      }
    },
  };

  SVGElement.prototype.getTransformToElement = SVGElement.prototype.getTransformToElement || function(element) {
      return element.getScreenCTM().inverse().multiply(this.getScreenCTM());
  };

  const ui = {
    bindEvents(processInput) {
      this.canvasNode = document.querySelector('#canvas');

      const getSVGCoords = (x, y) => {
        const svg = document.querySelector('svg');
        let point = svg.createSVGPoint();
        point.x   = x;
        point.y   = y;
        point     = point.matrixTransform(svg.getScreenCTM().inverse());

        return [point.x, point.y];
      };

      const pointerData = (event) => {
        const [x, y] = getSVGCoords(event.clientX, event.clientY);

        return {
          x:        x,
          y:        y,
          target:   event.target.dataset.type,
          targetID: event.target.dataset.id,
        };
      };

      for (let eventType of ['mousedown', 'mousemove', 'mouseup']) {
        this.canvasNode.addEventListener(eventType, (event) => {
          event.preventDefault();

          processInput({
            id:      inputTable.get([eventType, event.target.dataset.type]),
            pointer: pointerData(event),
          });
        });
      }

      document.addEventListener('click', (event) => {
        event.preventDefault();
        if (event.detail > 1) {
          return;
        }

        processInput({
          id:      inputTable.get(['click', event.target.dataset.type]),
          pointer: pointerData(event)
        });
      });

      document.addEventListener('dblclick', (event) => {
        event.preventDefault();

        processInput({
          id:      inputTable.get(['dblclick', event.target.dataset.type]),
          pointer: pointerData(event)
        });
      });
    },

    // check what has changed
    sync(state) {
      const changes = (state1, state2) => {
        const keys = Object.keys(state1);
        return keys.filter(key => !equalData(state1[key], state2[key]));
      };

      const equalData = (obj1, obj2) => {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
      };

      if (state.id === 'start') {
        this.start(state);
        this.renderScene(state); // ?
        return;
      }

      for (let changed of changes(state, this.previousState)) {
        this.render[changed] && this.render[changed](state);
      }

      this.previousState = state;
    },

    // map changed state keys to method calls
    render: {
      doc(state) {
        ui.renderScene(state);
        // ui.renderInspector(state); // TODO ==> later
      },

      docs(state) {
        ui.renderDocList(state);
      },

      currentInput(state) {
        if (state.currentInput === 'docSaved') {
          ui.renderFlash('Saved');
        }

        if (state.currentInput === 'edit') {
          ui.renderScene(state);
        }
      },

      clock(state) {
        if (state.currentInput === 'animate') {
          ui.renderAnimations(state);
        }
      },
    },

    // methods doing changes
    renderScene(state) {
      sceneRenderer.render(state.doc.scene, ui.canvasNode);
    },

    renderDocList(state) {
      const docList = document.querySelector('.doc-list');
      docList.innerHTML = '';

      for (let docID of state.docs.ids) {
        const node = nodeFactory.makeDocListNode(docID);
        docList.appendChild(node);
        if (docID === state.docs.selectedID) {
          node.classList.add('selected');
        }
      }
    },

    renderInspector(state) {
      const findSelected = (doc) => {
        for (let shape of doc.shapes) {
          for (let frame of shape.frames) {
            if (frame._id === doc.selected.frameID) {
              return frame;
            }
          }
        }
      };

      const inspector = document.querySelector('#inspector');
      inspector.innerHTML = '';

      const node = nodeFactory.makeInspectorNode(findSelected(state.doc));
      inspector.appendChild(node);
    },

    renderAnimations(state) {
      const convertAngleToDegrees = (frame) => {
        return {
          x:        frame.x,
          y:        frame.y,
          width:    frame.width,
          height:   frame.height,
          rotation: frame.angle * 57.2958, // convert to degrees
        };
      };

      ui.canvasNode.innerHTML = '';

      for (let shape of state.doc.shapes) {
        const timeline = new TimelineMax();
        const shapeNode = nodeFactory.makeShapeNode(state);
        shapeNode.innerHTML = shape.markup;

        for (let i = 0; i < shape.frames.length - 1; i += 1) {
          let start = shape.frames[i];
          let end   = shape.frames[i + 1];

          timeline.fromTo(
            shapeNode,
            0.3,
            convertAngleToDegrees(start),
            convertAngleToDegrees(end)
          );
        }

        ui.canvasNode.appendChild(shapeNode);
      }
    },

    renderFlash(message) {
      const flash = document.createElement('p');
      flash.innerHTML = message;
      flash.classList.add('flash');
      window.setTimeout(() => document.body.appendChild(flash), 500);
      window.setTimeout(() => flash.remove(), 1500);
    },

    writeCSS(node, frame) {
      node.style.left      = String(frame.x) + 'px';
      node.style.top       = String(frame.y) + 'px';
      node.style.width     = String(frame.width) + 'px';
      node.style.height    = String(frame.height) + 'px';
      node.style.transform = `rotate(${frame.angle}rad)`;
    },

    start(state) {
      this.previousState = state;
    },

    init() {
      this.name = 'ui';
    }
  };

  const db = {
    bindEvents(processInput) {
      window.addEventListener('upsert', function(event) {
        const request = new XMLHttpRequest;

        request.addEventListener('load', function() {
          processInput({
            id: 'docSaved',
            data: {}
          });
        });

        request.open('POST', "/docs/" + event.detail._id);
        request.send(JSON.stringify(event.detail));
      });

      window.addEventListener('read', function(event) {
        const request = new XMLHttpRequest;

        request.addEventListener('load', function() {
          processInput({
            id: 'setDoc',
            data: {
              doc: request.response
            }
          });
        });

        request.open('GET', "/docs/" + event.detail);
        request.responseType = 'json';
        request.send(JSON.stringify(event.detail));
      });

      window.addEventListener('loadDocIDs', function(event) {
        const request = new XMLHttpRequest;

        request.addEventListener('load', function() {
          processInput({
            id: 'updateDocList',
            data: {
              docIDs: request.response
            }
          });
        });

        request.open('GET', "/ids");
        request.responseType = 'json';
        request.send();
      });
    },

    sync(state) {
      if (state.id === 'start') {
        db.loadDocIDs();
        this.previousState = state;
        return;
      }

      if (['idle', 'busy'].includes(state.id)) {
        for (let changed of this.changes(state, this.previousState)) {
          this.crud[changed] && this.crud[changed](state);
        }
        this.previousState = state;
      }
    },

    crud: {
      docs(state) {
        if (state.docs.selectedID !== db.previousState.docs.selectedID) {
          window.dispatchEvent(new CustomEvent(
            'read',
            { detail: state.docs.selectedID }
          ));
        }
      },

      doc(state) {
        if (state.docs.selectedID === db.previousState.docs.selectedID) {
          window.dispatchEvent(new CustomEvent(
            'upsert',
            { detail: state.doc }
          ));
        }
      },
    },

    changes(state1, state2) {
      const keys = Object.keys(state1);
      return keys.filter(key => !db.equal(state1[key], state2[key]));
    },

    equal(obj1, obj2) {
      return JSON.stringify(obj1) === JSON.stringify(obj2);
    },

    loadDocIDs() {
      window.dispatchEvent(new Event('loadDocIDs'));
    },

    init() {
      this.name = 'db';
    }
  };

  const app = {
    init() {
      core.init();

      // wire up `ui` and `db`
      for (let component of [ui, db]) {
        component.init();
        component.bindEvents(core.processInput.bind(core));
        core.periphery[component.name] = component.sync.bind(component);
      }

      // wire up `log`
      log.init();
      log.bindEvents(core.setState.bind(core));
      core.periphery[log.name] = log.sync.bind(log);

      core.kickoff();
    },
  };

  document.addEventListener('DOMContentLoaded', app.init.bind(app));

}());
//# sourceMappingURL=bundle.js.map
