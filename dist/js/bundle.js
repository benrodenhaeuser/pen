(function () {
  'use strict';

  const clock = {
    tick() {
      this.time += 1;
    },

    init(time) {
      this.time = time || 0;
      return this;
    },
  };

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

  const transformers = {
    createShape(state, input) {
      state.doc.appendShape();
    },

    createDoc(state, input) {
      state.doc.init();
      state.docs.ids.push(state.doc._id);
      state.docs.selectedID = state.doc._id;
    },

    deleteFrame(state, input) {
      state.doc.deleteSelectedFrame();
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

    setFrameOrigin(state, input) { // don't have it
      state.doc.insertFrameInPlace();
      this.aux.originX = input.pointer.x;
      this.aux.originY = input.pointer.y;
    },

    findOppCorner(state, input) {
      // purpose was to find the fixed point of resizing
      // but we don't do that.
      const frame = state.doc.selected.frame;

      let opp;

      switch (input.pointer.target) {
      case 'top-left-corner':
        opp = [frame.x + frame.width, frame.y + frame.height]; // bottom right
        break;
      case 'top-right-corner':
        opp = [frame.x, frame.y + frame.height];               // bottom left
        break;
      case 'bot-right-corner':
        opp = [frame.x, frame.y];                              // top left
        break;
      case 'bot-left-corner':
        opp = [frame.x + frame.width, frame.y];                // top right
        break;
      }

      // store opposite corner
      [this.aux.oppX, this.aux.oppY] = opp;
      // store centre of frame
      this.aux.center = [frame.x + frame.width / 2, frame.y + frame.height / 2];
    },

    // rotate point around center by angle radians
    rotate(point, center, angle) {
      const [pointX,  pointY ] = point;
      const [centerX, centerY] = center;
      const cos                = Math.cos(angle);
      const sin                = Math.sin(angle);

      return [
        cos * (pointX - centerX) - sin * (pointY - centerY) + centerX,
        sin * (pointX - centerX) + cos * (pointY - centerY) + centerY
      ];
    },

    resizeFrame(state, input) { // becomes scale transform - different!
      const frame = state.doc.selected.frame;
      const shape = state.doc.selected.shape;

      // rotate stored opposite corner
      const angle = frame.angle;
      const opp = [this.aux.oppX, this.aux.oppY];
      const oppRotated = this.rotate(opp, this.aux.center, angle);
      const [oppXr, oppYr] = oppRotated;

      // use rotated opposite corner to unrotate mouse position
      const cornerRotated = [input.pointer.x, input.pointer.y];
      const [cornerXr, cornerYr] = cornerRotated;
      const newCenter = [(cornerXr + oppXr)/2, (cornerYr + oppYr)/2];
      const [newCenterX, newCenterY] = newCenter;
      const corner = this.rotate(cornerRotated, newCenter, -angle);
      const [cornerX, cornerY] = corner;

      // use corner/newCenter to find new opposite corner
      const newOpp = [
        newCenterX + (newCenterX - cornerX),
        newCenterY + (newCenterY - cornerY)
      ];

      // store new opposite corner (unrotated) and new center
      const [newOppX, newOppY] = newOpp;
      [this.aux.oppX, this.aux.oppY] = newOpp;
      this.aux.center = newCenter;

      const newWidth  = Math.abs(newOppX - cornerX);
      const newHeight = newWidth / shape.aspectRatio;

      // mutate frame state
      state.doc.selected.frame.set({
        x:      Math.min(newOppX, cornerX),
        y:      Math.min(newOppY, cornerY),
        width:  newWidth,
        height: newHeight,
      });
    },

    sizeFrame(state, input) { // part of creating a frame: we don't do that
      const shape     = state.doc.selected.shape;
      const newWidth  = Math.abs(this.aux.originX - input.pointer.x);
      const newHeight = newWidth / shape.aspectRatio;

      state.doc.selected.frame.set({
        x:      Math.min(this.aux.originX, input.pointer.x),
        y:      Math.min(this.aux.originY, input.pointer.y),
        width:  newWidth,
        height: newHeight,
      });
    },

    // releaseFrame(state, input) {
    //   const frame = state.doc.selected.frame;
    // },

    clean(state, input) {
      const same = (val1, val2) => {
        const treshold = 1;
        return Math.abs(val1 - val2) <= treshold;
      };

      const sameX = same(this.aux.originX, input.pointer.x);
      const sameY = same(this.aux.originY, input.pointer.y);

      if (sameX && sameY) {
        state.doc.deleteSelectedFrame();
      }
    },

    getFrameOrigin(state, input) {
      state.doc.select(input.pointer.targetID);
      this.aux.originX = input.pointer.x;
      this.aux.originY = input.pointer.y;
    },

    moveFrame(state, input) {
      const frame = state.doc.selected.frame;

      frame.set({
        y: frame.y  + (input.pointer.y - this.aux.originY),
        x: frame.x + (input.pointer.x - this.aux.originX),
      });

      this.aux.originX = input.pointer.x;
      this.aux.originY = input.pointer.y;
    },

    getStartAngle(state, input) {
      const frame              = state.doc.select(input.pointer.targetID);
      this.aux.centerX         = frame.x + frame.width / 2;
      this.aux.centerY         = frame.y + frame.height / 2;
      const startX             = input.pointer.x - this.aux.centerX;
      const startY             = input.pointer.y - this.aux.centerY;
      this.aux.startAngle      = Math.atan2(startY, startX);
      this.aux.frameStartAngle = frame.angle;
    },

    rotateFrame(state, input) { // don't really need that?
      const frame        = state.doc.selected.frame;
      const currentX     = input.pointer.x - this.aux.centerX;
      const currentY     = input.pointer.y - this.aux.centerY;
      const currentAngle = Math.atan2(currentY, currentX);
      const angleToAdd   = currentAngle - this.aux.startAngle;

      frame.set({ angle: this.aux.frameStartAngle + angleToAdd });
    },

    init() {
      this.aux = {};
    },
  };

  const transitionTable = [
    // kickoff
    [{ from: 'start',     input: 'kickoff'        }, { to: 'idle'              }],

    // create and delete
    [{ from: 'idle',      input: 'createShape'    }, {                         }],
    [{ from: 'idle',      input: 'createDoc'      }, {                         }],
    [{ from: 'idle',      input: 'deleteFrame'    }, {                         }],
    [{                    input: 'docSaved'       }, {                         }],
    [{                    input: 'updateDocList'  }, {                         }],
    [{                    input: 'requestDoc'     }, { to: 'busy'              }],
    [{ from: 'busy',      input: 'setDoc'         }, { to: 'idle'              }],

    // draw
    [{ from: 'idle',      input: 'setFrameOrigin' }, { to: 'drawing'           }],
    [{ from: 'drawing',   input: 'changeCoords'   }, { do: 'sizeFrame'         }],
    [{ from: 'drawing',   input: 'releaseFrame'   }, { to: 'idle', do: 'clean' }],

    // rotate
    [{ from: 'idle',      input: 'getStartAngle'  }, { to: 'rotating'          }],
    [{ from: 'rotating',  input: 'changeCoords'   }, { do: 'rotateFrame'       }],
    [{ from: 'rotating',  input: 'releaseFrame'   }, { to: 'idle'              }],

    // move
    [{ from: 'idle',      input: 'getFrameOrigin' }, { to: 'dragging'          }],
    [{ from: 'dragging',  input: 'changeCoords'   }, { do: 'moveFrame'         }],
    [{ from: 'dragging',  input: 'releaseFrame'   }, { to: 'idle'              }],

    // resize
    [{ from: 'idle',      input: 'findOppCorner'     }, { to: 'resizing'          }],
    [{ from: 'resizing',  input: 'changeCoords'   }, { do: 'resizeFrame'       }],
    [{ from: 'resizing',  input: 'releaseFrame'   }, { to: 'idle'              }],

    // animate
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
        console.log(input.id);
        this.transform(input, transition);
        this.syncPeriphery();
      }
    },

    transform(input, transition) {
      const transformer = transformers[transition.do] || transformers[input.id];
      transformer && transformer.bind(transformers)(this.state, input);

      this.state.clock.tick();
      this.state.currentInput = input.id;
      this.state.id = transition.to || this.state.id;
    },

    init() {
      this.state = {
        clock: clock.init(),
        id: 'start',
        doc: doc.init(markup),
      };

      transformers.init();
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
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260.73 100.17">
    <defs>
      <style>.cls-1{fill:#2a2a2a;}</style>
    </defs>

    <title>
      Logo_48_Web_160601
    </title>

    <g id="four">
      <path class="cls-1" d="M69.74,14H35.82S37,54.54,10.37,76.65v7.27H51.27V97.55s-1.51,7.27-12.42,7.27v6.06H87.31v-6.66S74.59,106,74.59,98.46V83.91h13v-7h-13V34.4L51.21,55.31V77H17.34S65.5,32.43,69.74,14" transform="translate(-10.37 -12.38)"/>
      </g>

    <g id="eight">
      <path class="cls-1" d="M142,39.59q0-14.42-3.23-20.89a6.56,6.56,0,0,0-6.32-3.82q-9.71,0-9.71,21.77t10.74,21.62a6.73,6.73,0,0,0,6.62-4.12Q142,50,142,39.59m3.83,49.13q0-15.59-2.87-21.92t-10.08-6.32a10.21,10.21,0,0,0-9.78,5.88q-3,5.88-3,19.12,0,12.94,3.46,18.75T134.63,110q6,0,8.61-4.93t2.58-16.4m24-4.41q0,10.59-8.53,18.39-10.74,9.86-27.51,9.86-16.19,0-26.77-7.65T96.38,85.49q0-13.83,10.88-20.45,5.15-3.09,14.56-5.59l-0.15-.74q-20.89-5.3-20.89-21.77a21.6,21.6,0,0,1,8.68-17.65q8.68-6.91,22.21-6.91,14.56,0,23.39,6.77a21.35,21.35,0,0,1,8.83,17.8q0,15-19,21.92v0.59q24.86,5.44,24.86,24.86" transform="translate(-10.37 -12.38)"/>
    </g>

    <g id="k">
      <path class="cls-1" d="M185.85,53.73V34.82c0-4.55-1.88-6.9-9.41-8.47V20.7L203.67,14h5.49V53.73H185.85Z" transform="translate(-10.37 -12.38)"/>

      <path class="cls-1" d="M232,55.82c0-1.73-.63-2.2-8-2v-6.9h38v6.9c-11.26.45-11.9,1.84-20.68,9.37L236,67.73l18,22.91c8.63,10.83,11,13.71,17.1,14.34v5.9H227.57a37.69,37.69,0,0,1,0-5.9,5,5,0,0,0,5-3.78L218.23,83.54s-8.77,6.94-9.18,12.28c-0.57,7.27,5.19,9.16,11,9.16v5.9H176.69V105S232,56.76,232,55.82Z" transform="translate(-10.37 -12.38)"/>
    </g>
  </svg>
`;

  const log = {
    bindEvents(setState) {
      window.addEventListener('popstate', (event) => {
        setState(event.state);
      });
    },

    sync(state) {
      const ignored = ['docSaved', 'edit', 'createDoc', 'createShape'];
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

  // TODO frameTemplate makes svg node by simply copying svg markup into the template.

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
    [['click',       'newShapeButton'   ], 'createShape'     ],
    [['click',       'newDocButton'     ], 'createDoc'       ],
    [['click',       'animateButton'    ], 'animate'         ],
    [['click',       'deleteLink'       ], 'deleteFrame'     ],
    [['click',       'doc-list-entry'   ], 'requestDoc'      ],
    [['click',       'canvas'           ], 'edit'            ],
    [['mousedown',   'frame'            ], 'getFrameOrigin'  ],
    [['mousedown',   'top-left-corner'  ], 'findOppCorner'   ],
    [['mousedown',   'top-right-corner' ], 'findOppCorner'   ],
    [['mousedown',   'bot-left-corner'  ], 'findOppCorner'   ],
    [['mousedown',   'bot-right-corner' ], 'findOppCorner'   ],
    [['mousedown',   'canvas'           ], 'setFrameOrigin'  ],
    [['mousedown',   'rotate-handle'    ], 'getStartAngle'   ],
    [['mousemove'                       ], 'changeCoords'    ],
    [['mouseup'                         ], 'releaseFrame'    ],
  ];

  inputTable.get = function(key) {
    const match = (pair) => {
      return pair[0][0] === key[0] &&
        (pair[0][1] === key[1] || pair[0][1] === undefined);
    };

    const pair = inputTable.find(match);

    if (pair) {
      // console.log(pair[1]);
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

  //   return this.setAttributeNS.apply(this, [null].concat(args));
  // };
  //
  // const setSVGAttrs = (element, obj) => {
  //
  // };

  // TODO: need to take care of style and defs
  // I think they are eliminated when stringifying the state object

  // TODO: wrap nodes from original svg
  const sceneRenderer = {
    build(scene, $parent) {
      const $node = document.createElementNS(svgns, scene.tag);

      if (scene.tag === 'svg') {
        $node.setAttributeNS(xmlns, 'xmlns', svgns);
      }

      $node.setSVGAttrs(scene.props);
      $parent.appendChild($node);

      for (let child of scene.children) {
        sceneRenderer.build(child, $node);
      }
    },
  };

  const ui = {
    bindEvents(processInput) {
      this.canvasNode = document.querySelector('#canvas');

      const pointerData = (event) => {
        return {
          x:        event.clientX - this.canvasNode.offsetLeft,
          y:        event.clientY - ui.canvasNode.offsetTop,
          target:   event.target.dataset.type,
          targetID: event.target.dataset.id,
        };
      };

      for (let eventType of ['mousedown', 'mousemove', 'mouseup']) {
        this.canvasNode.addEventListener(eventType, (event) => {
          event.preventDefault();
          processInput({
            id:   inputTable.get([eventType, event.target.dataset.type]),
            pointer: pointerData(event)
          });
        });
      }

      document.addEventListener('click', (event) => {
        event.preventDefault();
        processInput({
          id:   inputTable.get(['click', event.target.dataset.type]),
          pointer: pointerData(event)
        });
      });
    },

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

    render: {
      doc(state) {
        ui.renderScene(state);
        ui.renderInspector(state);
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

    renderScene(state) {
      ui.canvasNode.innerHTML = '';

      sceneRenderer.build(state.doc.scene, ui.canvasNode);
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
