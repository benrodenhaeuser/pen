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

  SVGElement.prototype.getTransformToElement =
    SVGElement.prototype.getTransformToElement || function(element) {
      return element.getScreenCTM().inverse().multiply(this.getScreenCTM());
    };

  const parse = (markup) => {
    const parser = new DOMParser();
    const svgDocument = parser.parseFromString(markup, "image/svg+xml");
    const svg = svgDocument.documentElement;
    return svg;
  };

  const explode = (svg) => {
    document.body.appendChild(svg);

    const isSvgGroup = (element) => element.tagName === 'g';
    const rootGroups = Array.from(svg.children).filter(isSvgGroup);
    const svgs       = rootGroups.map(toSVG);

    svg.remove();
    return svgs;
  };

  const toSVG = (groupElement) => {
    const owner = groupElement.ownerSVGElement;
    const svg   = document.createElementNS(owner.namespaceURI,'svg');
    const css   = Array.from(owner.querySelectorAll('style, defs'));

    for (let element of css) {
      svg.appendChild(element.cloneNode(true));
    }

    svg.appendChild(groupElement.cloneNode(true));

    const bb = globalBoundingBox(groupElement);
    svg.setAttribute('viewBox',[bb.x, bb.y, bb.width, bb.height].join(' '));
    return svg;
  };

  const globalBoundingBox = (element) => {
    let   bb    = element.getBBox();
    const owner = element.ownerSVGElement;
    const m     = element.getTransformToElement(owner);

    const points = [
      owner.createSVGPoint(), owner.createSVGPoint(),
      owner.createSVGPoint(), owner.createSVGPoint()
    ];

    points[0].x = bb.x;            points[0].y = bb.y;
    points[1].x = bb.x + bb.width; points[1].y = bb.y;
    points[2].x = bb.x + bb.width; points[2].y = bb.y + bb.height;
    points[3].x = bb.x;            points[3].y = bb.y + bb.height;

    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;

    points.forEach((point) => {
      point = point.matrixTransform(m);
      xMin  = Math.min(xMin, point.x);
      xMax  = Math.max(xMax, point.x);
      yMin  = Math.min(yMin, point.y);
      yMax  = Math.max(yMax, point.y);
    });

    bb        = {};
    bb.x      = xMin;
    bb.width  = xMax - xMin;
    bb.y      = yMin;
    bb.height = yMax - yMin;

    return bb;
  };

  const getCoordinates = (svg) => {
    const coordinates = svg.getAttribute('viewBox').split(' ');

    return {
        x:      Number(coordinates[0]),
        y:      Number(coordinates[1]),
        width:  Number(coordinates[2]),
        height: Number(coordinates[3])
      };
  };

  const toString = (svg) => {
    return new XMLSerializer().serializeToString(svg);
  };

  const output = (svg) => {
    return Object.assign(getCoordinates(svg), { markup: toString(svg) });
  };

  const svgSplitter = {
    split(markup) {
      return explode(parse(markup)).map(output);
    }
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


  const createID = () => {
    const randomString = Math.random().toString(36).substring(2);
    const timestamp    = (new Date()).getTime().toString(36);
    return randomString + timestamp;
  };

  const Frame = {
    set(data) {
      this.x      = data.x      || this.x;
      this.y      = data.y      || this.y;
      this.width  = data.width  || this.width;
      this.height = data.height || this.height;
      this.angle  = data.angle  || this.angle;
    },

    init(data) {
      this._id    = data._id    || createID();
      this.x      = data.x      || 0;
      this.y      = data.y      || 0;
      this.width  = data.width  || 0;
      this.height = data.height || 0;
      this.angle  = data.angle  || 0;

      return this;
    },
  };

  const doc = {
    findIndexOf(selectedFrame) {
      const frames = doc.selected.shape.frames;
      for (let i = 0; i < frames.length; i += 1) {
        if (frames[i] === selectedFrame) {
          return i;
        }
      }
    },

    appendShape() {
      const shape = {
        _id: createID(),
        frames: [],
      };
      this.shapes.push(shape);
      this.selected.shape = shape;
      this.selected.frame = null;
    },

    insertFrameInPlace(data = {}) {
      const frame  = Object.create(Frame).init(data);
      const frames = this.selected.shape.frames;

      if (this.selected.frame) {
        const index = this.findIndexOf(this.selected.frame);
        frames.splice(index + 1, 0, frame);
      } else {
        frames.push(frame);
      }

      this.selected.frame = frame;
      return frame;
    },

    deleteSelectedFrame() {
      const frames = this.selected.shape.frames;
      const index = this.findIndexOf(this.selected.frame);
      frames.splice(index, 1);

      if (frames[index - 1] !== undefined) {
        this.selected.frame = frames[index - 1];
      } else if (frames[index] !== undefined) {
        this.selected.frame = frames[index];
      } else {
        this.selected.frame = null;
      }
    },

    select(frameID) {
      for (let shape of this.shapes) {
        for (let frame of shape.frames) {
          if (frame._id === frameID) {
            this.selected.frame = frame;
            this.selected.shape = shape;
            return frame; // TODO: aha!
          }
        }
      }
    },

    findFrame(id) {
      for (let shape of this.shapes) {
        for (let frame of shape.frames) {
          if (frame._id === id) {
            return frame;
          }
        }
      }
    },

    findShape(id) {
      for (let shape of this.shapes) {
        if (shape._id === id) {
          return shape;
        }
      }
    },

    toJSON() {
      return {
        _id: this._id,
        shapes: this.shapes,
        selected: {
          frameID: this.selected.frame && this.selected.frame._id || null,
          shapeID: this.selected.shape._id,
        },
      };
    },

    initFromDocData(docData) {
      for (let shape of docData.shapes) {
        shape.frames = shape.frames.map((frame) => {
          return Object.create(Frame).init(frame);
        });
      }

      this._id            = docData._id;
      this.shapes         = docData.shapes;
      this.selected.shape = this.findShape(docData.selected.shapeID);
      this.selected.frame = this.findFrame(docData.selected.frameID);
    },

    initFromSVG(markup) {
      const svgs = svgSplitter.split(markup);

      this._id = createID();
      this.shapes = [];

      for (let svg of svgs) {
        const frame = Object.create(Frame).init({
          x:      svg.x,
          y:      svg.y,
          width:  svg.width,
          height: svg.height,
        });

        const shape = {
          _id:         createID(),
          markup:      svg.markup,
          aspectRatio: svg.width / svg.height,
          frames:      [frame],
          initial:     frame, // TODO needed? wanted?
        };

        this.shapes.push(shape);
      }

      this.selected = {};
      this.selected.shape = this.shapes[this.shapes.length - 1];
      this.selected.frame = this.selected.shape.frames[0];
    },

    init(docData) {
      if (docData !== undefined) {
        this.initFromDocData(docData);
        return this;
      }
      //
      // const docID   = createID();
      // const shapeID = createID();
      // const shape   = {
      //   _id: shapeID,
      //   frames: [],
      // };
      // this._id      = docID;
      // this.shapes   = [shape];
      // this.selected = {
      //   shape: shape,
      //   frame: null,
      // };

      this.initFromSVG(markup);

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

    setFrameOrigin(state, input) {
      state.doc.insertFrameInPlace();
      this.aux.originX = input.pointer.x;
      this.aux.originY = input.pointer.y;
    },

    findOppCorner(state, input) {
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

    resizeFrame(state, input) {
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

    sizeFrame(state, input) {
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

    rotateFrame(state, input) {
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
      this.periphery['ui'](JSON.parse(JSON.stringify(this.state))); // only UI is synced
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
        doc: doc.init(),
        docs: { ids: [], selectedID: null },
      };

      transformers.init();
      this.periphery = [];
      return this;
    },

    kickoff() {
      this.syncPeriphery();
      this.processInput({ id: 'kickoff' });
      // ^ TODO: this involves two syncs, is that really necessary?
    },
  };

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
        this.renderFrames(state); // ?
        return;
      }

      for (let changed of changes(state, this.previousState)) {
        this.render[changed] && this.render[changed](state);
      }
      this.previousState = state;
    },

    render: {
      doc(state) {
        ui.renderFrames(state);
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
          ui.renderFrames(state);
        }
      },

      clock(state) {
        if (state.currentInput === 'animate') {
          ui.renderAnimations(state);
        }
      },
    },

    renderFrames(state) {
      ui.canvasNode.innerHTML = '';

      for (let shape of state.doc.shapes) {
        const shapeNode = nodeFactory.makeShapeNode(state, shape._id);
        if (state.doc.selected.shapeID === shape._id) {
          shapeNode.classList.add('selected');
        }

        for (var i = 0; i < shape.frames.length; i += 1) {
          const frameNode = nodeFactory.makeFrameNode(i, shape, shape.frames[i]);
          ui.writeCSS(frameNode, shape.frames[i]);
          if (shape.frames[i]._id === state.doc.selected.frameID) {
            frameNode.classList.add('selected');
          }

          shapeNode.appendChild(frameNode);
        }

        ui.canvasNode.appendChild(shapeNode);
      }
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

      for (let component of [ui, db]) {
        component.init();
        component.bindEvents(core.processInput.bind(core));
        core.periphery[component.name] = component.sync.bind(component);
      }

      log.init();
      log.bindEvents(core.setState.bind(core));
      core.periphery[log.name] = log.sync.bind(log);

      core.kickoff();
    },
  };

  document.addEventListener('DOMContentLoaded', app.init.bind(app));

}());
//# sourceMappingURL=bundle.js.map
