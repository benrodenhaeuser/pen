(function () {
  'use strict';

  const transitionMap = [
    [{ stateLabel: 'start', input: 'kickoff' }, { nextLabel: 'idle' }],
    [{ stateLabel: 'idle', input: 'createShape' }, { nextLabel: 'idle' }],
    [{ stateLabel: 'idle', input: 'createProject' }, { nextLabel: 'idle' }],
    [{ stateLabel: 'idle', input: 'projectSaved' }, { nextLabel: 'idle' }],
    [{ stateLabel: 'idle', input: 'startAnimation' }, { nextLabel: 'animating' }],
    [{ stateLabel: 'idle', input: 'getFrameOrigin' }, { nextLabel: 'draggingFrame' }],
    [{ stateLabel: 'idle', input: 'resizeFrame' }, { nextLabel: 'resizingFrame' }],
    [{ stateLabel: 'idle', input: 'setFrameOrigin' }, { nextLabel: 'drawingFrame' }],
    [{ stateLabel: 'idle', input: 'deleteFrame' }, { nextLabel: 'idle' }],
    [{ stateLabel: 'idle', input: 'updateDocList' }, { nextLabel: 'idle' }],
    [{ stateLabel: 'idle', input: 'setDocId' }, { nextLabel: 'loading' }],
    [
      { stateLabel: 'drawingFrame', input: 'changeCoordinates' },
      { action: 'sizeFrame', nextLabel: 'drawingFrame' }
    ],
    [{ stateLabel: 'drawingFrame', input: 'releaseFrame' }, { nextLabel: 'idle' }],
    [
      { stateLabel: 'drawingFrame', input: 'projectSaved' },
      { nextLabel: 'drawingFrame' }
    ],
    [
      { stateLabel: 'draggingFrame', input: 'changeCoordinates' },
      { action: 'moveFrame', nextLabel: 'draggingFrame' }
    ],
    [{ stateLabel: 'draggingFrame', input: 'releaseFrame' }, { nextLabel: 'idle' }],
    [
      { stateLabel: 'draggingFrame', input: 'projectSaved' },
      { nextLabel: 'draggingFrame' }
    ],
    [
      { stateLabel: 'resizingFrame', input: 'changeCoordinates' },
      { action: 'sizeFrame', nextLabel: 'resizingFrame' }
    ],
    [{ stateLabel: 'resizingFrame', input: 'releaseFrame' }, { nextLabel: 'idle' }],
    [
      { stateLabel: 'resizingFrame', input: 'projectSaved' },
      { nextLabel: 'resizingFrame' }
    ],
    [{ stateLabel: 'animating', input: 'startAnimation' }, { nextLabel: 'animating' }],
    [{ stateLabel: 'animating', input: 'toIdle' }, { nextLabel: 'idle' }],
    [{ stateLabel: 'animating', input: 'createProject' }, { nextLabel: 'idle' }],
    [{ stateLabel: 'animating', input: 'createShape' }, { nextLabel: 'idle' }],
    [{ stateLabel: 'loading', input: 'setDoc' }, { nextLabel: 'idle' }],
  ];

  transitionMap.get = function(key) {
    const match = (pair) => {
      return pair[0].stateLabel === key[0] &&
        pair[0].input === key[1];
    };

    const pair = transitionMap.find(match);

    if (pair) {
      return pair[1]; // returns an object
    }
  };

  const createId = () => {
    const randomString = Math.random().toString(36).substring(2);
    const timestamp    = (new Date()).getTime().toString(36);

    return randomString + timestamp;
  };

  const Frame = {
    set(coordinates) {
      this.left   = coordinates.left || this.left;
      this.top    = coordinates.top || this.top;
      this.width  = coordinates.width || this.width;
      this.height = coordinates.height || this.height;
    },

    init(data) {
      this.left   = data.left || 0;
      this.top    = data.top || 0;
      this.width  = data.width || 0;
      this.height = data.height || 0;
      this._id    = data._id || createId();
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
        _id: createId(),
        frames: [],
      };
      this.shapes.push(shape);
      this.selected.shape = shape;
      this.selected.frame = null;
    },

    insertFrameInPlace(coordinates = {}) {
      const frame  = Object.create(Frame).init(coordinates);
      const frames = this.selected.shape.frames;

      if (this.selected.frame) {
        const index = this.findIndexOf(this.selected.frame);
        frames.splice(index + 1, 0, frame);
      } else {
        frames.push(frame);
      }

      this.selected.frame = frame;
    },

    deleteSelectedFrame() {
      const frames = this.selected.shape.frames;
      const index = this.findIndexOf(this.selected.frame);
      frames.splice(index, 1);

      if (frames[index] !== undefined) {
        this.selected.frame = frames[index];
      } else if (frames[index - 1] !== undefined) {
        this.selected.frame = frames[index - 1];
      } else {
        this.selected.frame = null;
      }
    },

    select(frameId) {
      for (let shape of this.shapes) {
        for (let frame of shape.frames) {
          if (frame._id === frameId) {
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

      this._id = docData._id;
      this.shapes = docData.shapes;
      this.selected.shape = this.findShape(docData.selected.shapeID);
      this.selected.frame = this.findFrame(docData.selected.frameID);
    },

    init(docData) {
      if (docData !== undefined) {
        this.initFromDocData(docData);
        return this;
      }

      const docId   = createId();
      const shapeId = createId();
      const shape   = {
        _id: shapeId,
        frames: [],
      };

      this._id = docId;
      this.shapes = [shape];
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

    createProject(state, input) {
      state.doc.init();
    },

    setFrameOrigin(state, input) {
      state.doc.insertFrameInPlace();
      this.aux.originX = input.detail.inputX;
      this.aux.originY = input.detail.inputY;
    },

    resizeFrame(state, input) {
      const frame = state.doc.selected.frame;

      switch (input.detail.target) {
        case 'top-left-corner':
          this.aux.originX = frame.left + frame.width;
          this.aux.originY = frame.top + frame.height;
          break;
        case 'top-right-corner':
          this.aux.originX = frame.left;
          this.aux.originY = frame.top + frame.height;
          break;
        case 'bot-right-corner':
          this.aux.originX = frame.left;
          this.aux.originY = frame.top;
          break;
        case 'bot-left-corner':
          this.aux.originX = frame.left + frame.width;
          this.aux.originY = frame.top;
          break;
      }
    },

    sizeFrame(state, input) {
      state.doc.selected.frame.set({
        top:    Math.min(this.aux.originY, input.detail.inputY),
        left:   Math.min(this.aux.originX, input.detail.inputX),
        width:  Math.abs(this.aux.originX - input.detail.inputX),
        height: Math.abs(this.aux.originY - input.detail.inputY),
      });
    },

    deleteFrame(state, input) {
      state.doc.deleteSelectedFrame();
    },

    getFrameOrigin(state, input) {
      state.doc.select(input.detail.id);
      this.aux.originX = input.detail.inputX;
      this.aux.originY = input.detail.inputY;
    },

    moveFrame(state, input) {
      const frame = state.doc.selected.frame;

      frame.set({
        top:  frame.top  + (input.detail.inputY - this.aux.originY),
        left: frame.left + (input.detail.inputX - this.aux.originX),
      });

      this.aux.originX = input.detail.inputX;
      this.aux.originY = input.detail.inputY;
    },

    updateDocList(state, input) {
      state.docIds = input.detail.docIds;
    },

    setDocId(state, input) {
      state.docId = input.detail.id;
    },

    setDoc(state, input) {
      state.doc.init(input.detail.doc);
    },

    init() {
      this.aux = {};
    }
  };

  const core = {
    attach(component) {
      this.periphery.push(component);
    },

    syncPeriphery() {
      for (let component of this.periphery) {
        component.sync(JSON.parse(JSON.stringify(this.state)));
      }
    },

    controller(input) {
      const transition = transitionMap.get([this.state.label, input.label]);

      if (transition) {
        const action = actions[transition.action] || actions[input.label];
        action && action.bind(actions)(this.state, input);
        this.state.lastInput = input.label;
        this.state.label = transition.nextLabel;
        this.syncPeriphery();
      }
    },

    init() {
      this.state = {
        doc: doc.init(),
        label: 'start',
        docIds: null,
      };

      actions.init();
      this.periphery = [];
      return this;
    },

    kickoff() {
      this.syncPeriphery();
      this.controller({ label: 'kickoff' });
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
      <li class="pure-menu-item doc-list-entry">
        <a href="#" class="pure-menu-link"  data-type="doc-list-entry" data-id="${id}">${id}</a>
      </li>
    `;
      return node;
    },
  };

  // the inputMap determines an input given an event type and target type

  const inputMap = [
    // event type   target type           input
    [['click',     'newShapeButton'   ], 'createShape'       ],
    [['click',     'newProjectButton' ], 'createProject'     ],
    [['click',     'animateButton'    ], 'startAnimation'    ],
    [['click',     'deleteLink'       ], 'deleteFrame'       ],
    [['click',     'doc-list-entry'   ], 'setDocId'           ],
    [['click',     'canvas'           ], 'toIdle'            ],
    [['click',     'canvas'           ], 'toIdle'            ],
    [['mousedown', 'frame'            ], 'getFrameOrigin'    ],
    [['mousedown', 'top-left-corner'  ], 'resizeFrame'       ],
    [['mousedown', 'top-right-corner' ], 'resizeFrame'       ],
    [['mousedown', 'bot-left-corner'  ], 'resizeFrame'       ],
    [['mousedown', 'bot-right-corner' ], 'resizeFrame'       ],
    [['mousedown', 'canvas'           ], 'setFrameOrigin'       ],
    [['mousemove'                     ], 'changeCoordinates' ],
    [['mouseup'                       ], 'releaseFrame'      ],
  ];

  inputMap.get = function(key) {
    const match = (pair) => {
      return pair[0][0] === key[0] &&
        pair[0][1] === key[1];
    };

    const pair = inputMap.find(match);

    if (pair) {
      return pair[1];
    } else {
      console.log('ui: no proper input');
    }
  };

  const ui = {
    bindEvents(controller) {
      this.canvasNode = document.querySelector('#canvas');

      const mouseEventDetails = (event) => {
        return {
          inputX:     event.clientX,
          inputY:     event.clientY,
          target:     event.target.dataset.type,
          id:         event.target.dataset.id,
        };
      };

      this.canvasNode.addEventListener('mousedown', (event) => {
        controller({
          label:  inputMap.get(['mousedown', event.target.dataset.type]),
          detail: mouseEventDetails(event)
        });
      });

      this.canvasNode.addEventListener('mousemove', (event) => {
        controller({
          label:  inputMap.get(['mousemove']),
          detail: mouseEventDetails(event)
        });
      });

      this.canvasNode.addEventListener('mouseup', (event) => {
        controller({
          label:  inputMap.get(['mouseup']),
          detail: mouseEventDetails(event)
        });
      });

      document.addEventListener('click', (event) => {
        controller({
          label: inputMap.get(['click', event.target.dataset.type]),
          detail: mouseEventDetails(event)
        });
      });
    },

    sync(state) {
      if (state.label === 'start') {
        this.start(state);
        return;
      }

      for (let changed of this.changes(state, this.previousState)) {
        this.renderChanges[changed] && this.renderChanges[changed](state);
      }
      this.previousState = state;
    },

    renderChanges: {
      doc(state) {
        ui.canvasNode.innerHTML = '';

        for (let shape of state.doc.shapes) {
          const shapeNode = nodeFactory.makeShapeNode(shape._id);
          if (state.doc.selected.shapeID === shape._id) {
            shapeNode.classList.add('selected');
          }

          for (var i = 0; i < shape.frames.length; i += 1) {
            const frameNode = nodeFactory.makeFrameNode(i, shape.frames[i]._id);
            ui.place(frameNode, shape.frames[i]);
            if (shape.frames[i]._id === state.doc.selected.frameID) {
              frameNode.classList.add('selected');
            }

            shapeNode.appendChild(frameNode);
          }

          ui.canvasNode.appendChild(shapeNode);
        }
      },

      lastInput(state) {
        if (state.lastInput === 'projectSaved') {
          ui.flash('Document saved');
        }

        // TODO: we could perhaps do this.start(state) here? 
        //       if the last input is 'kickoff'
      },

      label(state) {
        if (state.label === 'animating') {
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
                ui.adjust(source),
                ui.adjust(target)
              );
            }

            ui.canvasNode.appendChild(shapeNode);
          }
        }
      },

      docIds(state) {
        const docList = document.querySelector('.doc-list');
        docList.innerHTML = '';

        for (let docId of state.docIds) {
          const node = nodeFactory.makeListNode(docId);
          docList.appendChild(node);
        }
      },
    },

    // helpers 1
    changes(state1, state2) {
      const keys = Object.keys(state1);
      return keys.filter(key => !this.equal(state1[key], state2[key]));
    },

    // helpers 2
    equal(obj1, obj2) {
      return JSON.stringify(obj1) === JSON.stringify(obj2);
    },

    // helpers 3
    flash(message) {
      const flash = document.createElement('p');
      flash.innerHTML = message;
      flash.classList.add('flash');
      window.setTimeout(() => document.body.appendChild(flash), 500);
      window.setTimeout(() => flash.remove(), 1500);
    },

    // helpers 4
    adjust(frame) {
      return {
        top:    frame.top - ui.canvasNode.offsetTop,
        left:   frame.left - ui.canvasNode.offsetLeft,
        width:  frame.width,
        height: frame.height,
      };
    },

    // helpers 5
    place(node, frame) {
      node.style.top    = String(this.adjust(frame).top)  + 'px';
      node.style.left   = String(this.adjust(frame).left) + 'px';
      node.style.width  = String(frame.width)        + 'px';
      node.style.height = String(frame.height)       + 'px';
    },

    start(state) {
      this.previousState = state;
    },

    init(core) {
      this.bindEvents(core.controller.bind(core));
      core.attach(this);
    },
  };

  const db = {
    bindEvents(controller) {
      window.addEventListener('upsert', function(event) {
        const request = new XMLHttpRequest;

        request.addEventListener('load', function() {
          controller({
            label: 'projectSaved',
            detail: {}
          });
        });

        request.open('POST', "/projects/" + event.detail._id);
        request.send(JSON.stringify(event.detail));
      });

      window.addEventListener('read', function(event) {
        const request = new XMLHttpRequest;

        request.addEventListener('load', function() {
          controller({
            label: 'setDoc',
            detail: {
              doc: request.response
            }
          });
        });

        request.open('GET', "/projects/" + event.detail);
        request.responseType = 'json';
        request.send(JSON.stringify(event.detail));
      });

      window.addEventListener('loadProjectIds', function(event) {
        const request = new XMLHttpRequest;

        request.addEventListener('load', function() {
          controller({
            label: 'updateDocList',
            detail: {
              docIds: request.response
            }
          });
        });

        request.open('GET', "/ids");
        request.responseType = 'json';
        request.send();
      });
    },

    sync(state) {
      if (state.label === 'start') {
        this.start(state);
        return;
      }

      for (let changed of this.changes(state, this.previousState)) {
        this.crud[changed] && this.crud[changed](state);
      }
      this.previousState = state;
    },

    crud: {
      doc(state) {
        if (db.hasFrames(state.doc)) {
          // TODO: that's not quite enough, because a doc read from the database has
          // frames, but there's no need to save it rightaway.
          window.dispatchEvent(new CustomEvent('upsert', { detail: state.doc }));
        }
      },

      lastInput(state) {
        if (state.lastInput === 'setDocId') {
          window.dispatchEvent(new CustomEvent('read', { detail: state.docId }));
        }

        // TODO: we could perhaps do this.start(state) here?
        //       if the last input is 'kickoff' ...
      },
    },

    // helpers 0
    hasFrames(doc) {
      return doc.shapes.find((shape) => shape.frames.length !== 0);
    },

    // helpers 1
    changes(state1, state2) {
      const keys = Object.keys(state1);
      return keys.filter(key => !db.equal(state1[key], state2[key]));
    },

    // helpers 2
    equal(obj1, obj2) {
      return JSON.stringify(obj1) === JSON.stringify(obj2);
    },

    // helpers 3
    loadProjectIds() {
      window.dispatchEvent(new Event('loadProjectIds'));
    },

    start(state) {
      db.loadProjectIds();
      this.previousState = state;
    },

    init(core) {
      this.bindEvents(core.controller.bind(core));
      core.attach(this);
    },
  };

  const app = {
    init() {
      core.init();
      ui.init(core);
      db.init(core);

      core.kickoff();
    },
  };

  document.addEventListener('DOMContentLoaded', app.init);

}());
//# sourceMappingURL=bundle.js.map
