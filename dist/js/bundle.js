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
        svg: this.svg, // TODO: stringifies the svg property
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

    initFromSVG() {
      // TODO
    },

    init(docData) {
      if (docData !== undefined) {
        this.initFromDocData(docData);
        return this;
      }

      const docID   = createID();
      const shapeID = createID();
      const shape   = {
        _id: shapeID,
        frames: [],
      };
      this._id      = docID;
      this.shapes   = [shape];
      this.selected = {
        shape: shape,
        frame: null,
      };

      // TODO: svg hard-coded here
      this.svg = '<svg viewbox="0 0 150 150"><rect width="150" height="150" style="fill:blue;stroke:pink;stroke-width:5;fill-opacity:0.1;stroke-opacity:0.9" />';

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
      state.docs.selectedID = input.data.id;
    },

    setDoc(state, input) {
      state.doc.init(input.data.doc);
    },

    setFrameOrigin(state, input) {
      state.doc.insertFrameInPlace();
      this.aux.originX = input.data.inputX;
      this.aux.originY = input.data.inputY;
    },

    findOppCorner(state, input) {
      const frame = state.doc.selected.frame;

      let opp;

      switch (input.data.target) {
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

      // rotate stored opposite corner
      const angle = frame.angle;
      const opp = [this.aux.oppX, this.aux.oppY];
      const oppRotated = this.rotate(opp, this.aux.center, angle);
      const [oppXr, oppYr] = oppRotated;

      // use rotated opposite corner to unrotate mouse position
      const cornerRotated = [input.data.inputX, input.data.inputY];
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

      // mutate frame state
      state.doc.selected.frame.set({
        x:      Math.min(newOppX, cornerX),
        y:      Math.min(newOppY, cornerY),
        width: Math.abs(newOppX - cornerX),
        height: Math.abs(newOppY - cornerY)
      });
    },

    sizeFrame(state, input) {
      state.doc.selected.frame.set({
        x:      Math.min(this.aux.originX, input.data.inputX),
        y:      Math.min(this.aux.originY, input.data.inputY),
        width:  Math.abs(this.aux.originX - input.data.inputX),
        height: Math.abs(this.aux.originY - input.data.inputY),
      });
    },

    // releaseFrame(state, input) {
    //   const frame = state.doc.selected.frame;
    //   console.log('x: ' + String(frame.x), 'y: ' + String(frame.y));
    // },

    clean(state, input) {
      const same = (val1, val2) => {
        const treshold = 1;
        return Math.abs(val1 - val2) <= treshold;
      };

      const sameX = same(this.aux.originX, input.data.inputX);
      const sameY = same(this.aux.originY, input.data.inputY);

      if (sameX && sameY) {
        state.doc.deleteSelectedFrame();
      }
    },

    getFrameOrigin(state, input) {
      state.doc.select(input.data.id);
      this.aux.originX = input.data.inputX;
      this.aux.originY = input.data.inputY;
    },

    moveFrame(state, input) {
      const frame = state.doc.selected.frame;

      frame.set({
        y: frame.y  + (input.data.inputY - this.aux.originY),
        x: frame.x + (input.data.inputX - this.aux.originX),
      });

      this.aux.originX = input.data.inputX;
      this.aux.originY = input.data.inputY;
    },

    getStartAngle(state, input) {
      const frame              = state.doc.select(input.data.id);
      this.aux.centerX         = frame.x + frame.width / 2;
      this.aux.centerY         = frame.y + frame.height / 2;
      const startX             = input.data.inputX - this.aux.centerX;
      const startY             = input.data.inputY - this.aux.centerY;
      this.aux.startAngle      = Math.atan2(startY, startX);
      this.aux.frameStartAngle = frame.angle;
    },

    rotateFrame(state, input) {
      const frame        = state.doc.selected.frame;
      const currentX     = input.data.inputX - this.aux.centerX;
      const currentY     = input.data.inputY - this.aux.centerY;
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
        this.periphery[key](this.stateData);
      }
    },

    // TODO: write a proper function to initalize state from stateData
    setState(stateData) {
      this.state = stateData;
      this.state.doc = doc.init(stateData.doc);
      this.state.clock = clock.init(stateData.clock.time);
      this.periphery['ui'](this.stateData); // only UI is synced
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

  const timeline = {
    bindEvents(setState) {
      window.addEventListener('popstate', (event) => {
        setState(event.state);
      });
    },
   
    sync(state) {
      const ignored = ['docSaved', 'edit', 'createDoc', 'createShape'];
      const ignore  = ignored.includes(state.currentInput);
      const idle    = state.id === 'idle';
      if (ignore || !idle) { return; }

      window.history.pushState(state, 'entry');
    },

    init() {
      this.name = 'timeline';
      return this;
    }
  };

  // TODO frameTemplate makes svg node by simply copying svg code into the template.

  const frameTemplate = (state, index, id) => {
    const template = document.createElement('template');
    template.innerHTML = `
    <div class="svg">${state.doc.svg}</div>
    <div class="frame-body" data-type="frame" data-id="${id}"></div>
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

    makeFrameNode(state, index, id) {
      const node = document.createElement('div');
      node.classList.add('frame');
      // node.dataset.type = 'frame';
      node.dataset.id = id;
      node.appendChild(frameTemplate(state, index, id).content.cloneNode(true));

      const handle = node.querySelector('.rotate-handle');
      handle.dataset.id = id;

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
    // event type     target type           input
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

      const eventData = (event) => {
        return {
          inputX: event.clientX,
          inputY: event.clientY,
          target: event.target.dataset.type,
          id:     event.target.dataset.id,
        };
      };

      for (let eventType of ['mousedown', 'mousemove', 'mouseup']) {
        this.canvasNode.addEventListener(eventType, (event) => {
          event.preventDefault();
          processInput({
            id:   inputTable.get([eventType, event.target.dataset.type]),
            data: eventData(event)
          });
        });
      }

      document.addEventListener('click', (event) => {
        event.preventDefault();
        processInput({
          id:   inputTable.get(['click', event.target.dataset.type]),
          data: eventData(event)
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
          const frameNode = nodeFactory.makeFrameNode(state, i, shape.frames[i]._id);
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

    findSelected(doc) {
      for (let shape of doc.shapes) {
        for (let frame of shape.frames) {
          if (frame._id === doc.selected.frameID) {
            return frame;
          }
        }
      }
    },

    renderInspector(state) {
      const inspector = document.querySelector('#inspector');
      inspector.innerHTML = '';

      const node = nodeFactory.makeInspectorNode(this.findSelected(state.doc));
      inspector.appendChild(node);
    },

    renderAnimations(state) {
      ui.canvasNode.innerHTML = '';

      for (let shape of state.doc.shapes) {
        const timeline = new TimelineMax();
        const shapeNode = nodeFactory.makeShapeNode(state);
        shapeNode.innerHTML = state.doc.svg; // TODO: append svg to shape

        for (let i = 0; i < shape.frames.length - 1; i += 1) {
          let source = shape.frames[i];
          let target = shape.frames[i + 1];

          timeline.fromTo(
            shapeNode,
            0.3,
            ui.convertKeys(ui.adjust(source)),
            ui.convertKeys(ui.adjust(target))
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

    adjust(frame) {
      return {
        x: frame.x - ui.canvasNode.offsetLeft,
        y: frame.y - ui.canvasNode.offsetTop,
        width: frame.width,
        height: frame.height,
        angle: frame.angle, // ROTATION
      };
    },

    convertKeys(frame) {
      return {
        x:        frame.x,
        y:        frame.y,
        width:    frame.width,
        height:   frame.height,
        rotation: frame.angle * 57.2958, // ROTATION, convert to degrees
      };
    },

    writeCSS(node, frame) {
      node.style.left      = String(this.adjust(frame).x) + 'px';
      node.style.top       = String(this.adjust(frame).y) + 'px';
      node.style.width     = String(frame.width) + 'px';
      node.style.height    = String(frame.height) + 'px';
      node.style.transform = `rotate(${frame.angle}rad)`; // ROTATION
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

      timeline.init();
      timeline.bindEvents(core.setState.bind(core));
      core.periphery[timeline.name] = timeline.sync.bind(timeline);

      core.kickoff();
    },
  };

  document.addEventListener('DOMContentLoaded', app.init.bind(app));

}());
//# sourceMappingURL=bundle.js.map
