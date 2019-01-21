(function () {
  'use strict';

  const clock = {
    tick() {
      this.time += 1;
    },

    init() {
      this.time = 0;
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
      this.x = data.x || this.x;
      this.y = data.y || this.y;
      this.w = data.w || this.w;
      this.h = data.h || this.h;
    },

    init(data) {
      this._id = data._id || createID();
      this.x   = data.x   || 0;
      this.y   = data.y   || 0;
      this.w   = data.w   || 0;
      this.h   = data.h   || 0;

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
            return frame;
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

      return this;
    },
  };

  const actions = {
    createShape(state, input) {
      state.doc.appendShape();
    },

    createDoc(state, input) {
      state.doc.init();
      state.docs.ids.push(state.doc._id);
      state.docs.selectedID = state.doc._id;
    },

    setFrameOrigin(state, input) {
      state.doc.insertFrameInPlace();
      this.aux.originX = input.data.inputX;
      this.aux.originY = input.data.inputY;
    },

    resizeFrame(state, input) {
      const frame = state.doc.selected.frame;

      switch (input.data.target) {
      case 'top-left-corner':
        this.aux.originX = frame.x + frame.w;
        this.aux.originY = frame.y + frame.h;
        break;
      case 'top-right-corner':
        this.aux.originX = frame.x;
        this.aux.originY = frame.y + frame.h;
        break;
      case 'bot-right-corner':
        this.aux.originX = frame.x;
        this.aux.originY = frame.y;
        break;
      case 'bot-left-corner':
        this.aux.originX = frame.x + frame.w;
        this.aux.originY = frame.y;
        break;
      }
    },

    sizeFrame(state, input) {
      state.doc.selected.frame.set({
        y:    Math.min(this.aux.originY, input.data.inputY),
        x:   Math.min(this.aux.originX, input.data.inputX),
        w:  Math.abs(this.aux.originX - input.data.inputX),
        h: Math.abs(this.aux.originY - input.data.inputY),
      });
    },

    clean(state, input) {
      // TODO: not sure if this is needed?
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

    deleteFrame(state, input) {
      state.doc.deleteSelectedFrame();
    },

    getFrameOrigin(state, input) {
      state.doc.select(input.data.id);
      this.aux.originX = input.data.inputX;
      this.aux.originY = input.data.inputY;
    },

    moveFrame(state, input) {
      const frame = state.doc.selected.frame;

      frame.set({
        y:  frame.y  + (input.data.inputY - this.aux.originY),
        x: frame.x + (input.data.inputX - this.aux.originX),
      });

      this.aux.originX = input.data.inputX;
      this.aux.originY = input.data.inputY;
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

    init() {
      this.aux = {};
    },
  };

  const transitionTable = [
    [{                    input: 'docSaved'       }, {                         }],
    [{                    input: 'updateDocList'  }, {                         }],
    [{                    input: 'requestDoc'     }, { to: 'busy'              }],
    [{ from: 'start',     input: 'kickoff'        }, { to: 'idle'              }],
    [{ from: 'idle',      input: 'createShape'    }, {                         }],
    [{ from: 'idle',      input: 'createDoc'      }, {                         }],
    [{ from: 'idle',      input: 'animate'        }, { to: 'animating'         }],
    [{ from: 'idle',      input: 'getFrameOrigin' }, { to: 'dragging'          }],
    [{ from: 'idle',      input: 'resizeFrame'    }, { to: 'resizing'          }],
    [{ from: 'idle',      input: 'setFrameOrigin' }, { to: 'drawing'           }],
    [{ from: 'idle',      input: 'deleteFrame'    }, {                         }],
    [{ from: 'busy',      input: 'setDoc'         }, { to: 'idle'              }],
    [{ from: 'drawing',   input: 'changeCoords'   }, { do: 'sizeFrame'         }],
    [{ from: 'drawing',   input: 'releaseFrame'   }, { to: 'idle', do: 'clean' }],
    [{ from: 'dragging',  input: 'changeCoords'   }, { do: 'moveFrame'         }],
    [{ from: 'dragging',  input: 'releaseFrame'   }, { to: 'idle'              }],
    [{ from: 'resizing',  input: 'changeCoords'   }, { do: 'sizeFrame'         }],
    [{ from: 'resizing',  input: 'releaseFrame'   }, { to: 'idle'              }],
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
    syncPeriphery() {
      for (let func of this.periphery) {
        func(JSON.parse(JSON.stringify(this.state)));
      }
    },

    dispatch(input) {
      const transition = transitionTable.get([this.state.id, input.id]);

      if (transition) {
        this.state.clock.tick();
        const action = actions[transition.do] || actions[input.id];
        action && action.bind(actions)(this.state, input);
        this.state.currentInput = input.id;
        this.state.id = transition.to || this.state.id;
        this.syncPeriphery();
      }
    },

    init() {
      this.state = {
        clock: clock.init(),
        id: 'start',
        doc: doc.init(),
        docs: { ids: [], selectedID: null },
      };

      actions.init();
      this.periphery = [];
      return this;
    },

    kickoff() {
      this.syncPeriphery();
      this.dispatch({ id: 'kickoff' });
      // ^ TODO: this involves two syncs, is that really necessary?
    },
  };

  const frameTemplate = (index) => {
    const template = document.createElement('template');
    template.innerHTML = `
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
    makeShapeNode(id) {
      const node = document.createElement('div');
      node.classList.add('shape');
      node.dataset.id = id;
      node.dataset.type = 'shape';
      return node;
    },

    makeFrameNode(index, id) {
      const node = document.createElement('div');
      node.classList.add('frame');
      node.dataset.type = 'frame';
      node.dataset.id = id;
      node.appendChild(frameTemplate(index).content.cloneNode(true));
      return node;
    },

    makeListNode(id) {
      const node = document.createElement('li');
      node.innerHTML = `
        <a href="#" class="pure-menu-link"  data-type="doc-list-entry" data-id="${id}">${id}</a>
    `;
      node.classList.add('pure-menu-item');

      return node;
    },
  };

  const inputTable = [
    // event type     target type           input
    [['click',       'newShapeButton'   ], 'createShape'       ],
    [['click',       'newDocButton'     ], 'createDoc'         ],
    [['click',       'animateButton'    ], 'animate'    ],
    [['click',       'deleteLink'       ], 'deleteFrame'       ],
    [['click',       'doc-list-entry'   ], 'requestDoc'        ],
    [['click',       'canvas'           ], 'edit'            ],
    [['mousedown',   'frame'            ], 'getFrameOrigin'    ],
    [['mousedown',   'top-left-corner'  ], 'resizeFrame'       ],
    [['mousedown',   'top-right-corner' ], 'resizeFrame'       ],
    [['mousedown',   'bot-left-corner'  ], 'resizeFrame'       ],
    [['mousedown',   'bot-right-corner' ], 'resizeFrame'       ],
    [['mousedown',   'canvas'           ], 'setFrameOrigin'    ],
    [['mousemove'                       ], 'changeCoords'      ],
    [['mouseup'                         ], 'releaseFrame'      ],
  ];

  inputTable.get = function(key) {
    const match = (pair) => {
      return pair[0][0] === key[0] &&
        (pair[0][1] === key[1] || pair[0][1] === undefined);
    };

    const pair = inputTable.find(match);

    if (pair) {
      console.log(pair[1]);
      return pair[1];
    } else {
      console.log(key[0], key[1]);
      console.log('ui: no proper input');
    }
  };

  const ui = {
    bindEvents(dispatch) {
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
          dispatch({
            id:   inputTable.get([eventType, event.target.dataset.type]),
            data: eventData(event)
          });
        });
      }

      document.addEventListener('click', (event) => {
        dispatch({
          id:   inputTable.get(['click', event.target.dataset.type]),
          data: eventData(event)
        });
      });
    },

    sync(state) {
      const changes = (state1, state2) => {
        const keys = Object.keys(state1);
        return keys.filter(key => !equal(state1[key], state2[key]));
      };

      const equal = (obj1, obj2) => {
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
        const shapeNode = nodeFactory.makeShapeNode(shape._id);
        if (state.doc.selected.shapeID === shape._id) {
          shapeNode.classList.add('selected');
        }

        for (var i = 0; i < shape.frames.length; i += 1) {
          const frameNode = nodeFactory.makeFrameNode(i, shape.frames[i]._id);
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
        const node = nodeFactory.makeListNode(docID);
        docList.appendChild(node);
        if (docID === state.docs.selectedID) {
          node.classList.add('selected');
        }
      }
    },

    renderAnimations(state) {
      ui.canvasNode.innerHTML = '';

      for (let shape of state.doc.shapes) {
        const timeline = new TimelineMax();
        const shapeNode = nodeFactory.makeShapeNode();

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
        w: frame.w,
        h: frame.h,
      };
    },

    convertKeys(frame) {
      return {
        x: frame.x,
        y: frame.y,
        width: frame.w,
        height: frame.h,
      };
    },

    writeCSS(node, frame) {
      node.style.left   = String(this.adjust(frame).x) + 'px';
      node.style.top    = String(this.adjust(frame).y)  + 'px';
      node.style.width  = String(frame.w) + 'px';
      node.style.height = String(frame.h) + 'px';
    },

    start(state) {
      this.previousState = state;
    },
  };

  const db = {
    bindEvents(dispatch) {
      window.addEventListener('upsert', function(event) {
        const request = new XMLHttpRequest;

        request.addEventListener('load', function() {
          dispatch({
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
          dispatch({
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
          dispatch({
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
  };

  const app = {
    connect(core$$1, component) {
      component.bindEvents(core$$1.dispatch.bind(core$$1));
      core$$1.periphery.push(component.sync.bind(component));
    },

    init() {
      core.init();

      this.connect(core, ui);
      this.connect(core, db);

      core.kickoff();
    },
  };

  document.addEventListener('DOMContentLoaded', app.init.bind(app));

}());
//# sourceMappingURL=bundle.js.map
