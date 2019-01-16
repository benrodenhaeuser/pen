(function () {
  'use strict';

  const transitionMap = [
    [
      { stateLabel: 'start', input: 'kickoff' },
      { action: 'skip', messages: { db: 'loadProjectIds' }, nextLabel: 'idle' }
    ],
    [
      { stateLabel: 'idle', input: 'createShape' },
      { action: 'createShape', nextLabel: 'idle' }
    ],
    [
      { stateLabel: 'idle', input: 'createProject' },
      {
        action: 'createProject',
        messages: { db: 'saveNewProject' },
        nextLabel: 'idle' }
    ],
    [
      { stateLabel: 'idle', input: 'projectSaved' },
      { action: 'skip', nextLabel: 'idle' }
    ],
    [
      { stateLabel: 'idle', input: 'startAnimation' },
      { action: 'skip', nextLabel: 'animating' }
    ],
    [
      { stateLabel: 'idle', input: 'modifyPosition' },
      { action: 'grabFrame', nextLabel: 'draggingFrame' }
    ],
    [
      { stateLabel: 'idle', input: 'resizeFrame' },
      { action: 'grabCorner', nextLabel: 'resizingFrame' }
    ],
    [
      { stateLabel: 'idle', input: 'createFrame' },
      { action: 'setFrameOrigin', nextLabel: 'drawingFrame' }
    ],
    [
      { stateLabel: 'idle', input: 'deleteFrame' },
      { action: 'deleteFrame', nextLabel: 'idle' }
    ],
    [
      { stateLabel: 'idle', input: 'projecSaved' },
      { action: 'skip', nextLabel: 'idle' }
    ],
    [
      { stateLabel: 'idle', input: 'projectIdsLoaded' },
      { action: 'processProjectIds', nextLabel: 'idle' }
    ],
    [
      { stateLabel: 'drawingFrame', input: 'changeCoordinates' },
      { action: 'sizeFrame', nextLabel: 'drawingFrame' }
    ],
    [
      { stateLabel: 'drawingFrame', input: 'releaseFrame' },
      { action: 'clear', nextLabel: 'idle' }
    ],
    [
      { stateLabel: 'draggingFrame', input: 'changeCoordinates' },
      { action: 'moveFrame', nextLabel: 'draggingFrame' }
    ],
    [
      { stateLabel: 'draggingFrame', input: 'releaseFrame' },
      { action: 'clear', nextLabel: 'idle' }
    ],
    [
      { stateLabel: 'resizingFrame', input: 'changeCoordinates' },
      { action: 'sizeFrame', nextLabel: 'resizingFrame' }
    ],
    [
      { stateLabel: 'resizingFrame', input: 'releaseFrame' },
      { action: 'clear', nextLabel: 'idle' }
    ],
    [
      { stateLabel: 'animating', input: 'startAnimation' },
      { action: 'skip', nextLabel: 'animating' }
    ],
    [
      { stateLabel: 'animating', input: 'toIdle' },
      { action: 'skip', nextLabel: 'idle' }
    ],
    [
      { stateLabel: 'animating', input: 'createProject' },
      {
        action: 'createProject',
        messages: { db: 'saveNewProject' },
        nextLabel: 'idle' }
    ],
    [
      { stateLabel: 'animating', input: 'createShape' },
      { action: 'createShape', nextLabel: 'idle' }
    ]
  ];

  // notice that we "get" an object from the map by passing in an array as the "key".
  // the above format with an object literal as the "key" is meant for readability.
  transitionMap.get = function(key) {
    const match = (pair) => {
      return pair[0].stateLabel === key[0] &&
        pair[0].input === key[1];
    };

    const pair = transitionMap.find(match);

    if (pair) {
      // console.log('action: ' + pair[1].action + ',', 'messages:' + pair[1].messages );
      return pair[1]; // returns an object
    } else {
      console.log('core: no transition');
    }
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

    init(coordinates) {
      this.left   = coordinates.left || 0;
      this.top    = coordinates.top || 0;
      this.width  = coordinates.width || 0;
      this.height = coordinates.height || 0;
      this._id    = createId();
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

    selectFrameAndShape(frameId) {
      for (let shape of this.shapes) {
        for (let frame of shape.frames) {
          if (frame._id === frameId) {
            this.selected.frame = frame;
            this.selected.shape = shape;
            return frame; // TODO: unexpected given method name
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

    init() {
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
    skip() {
      return;
    },

    clear(state, input) {
      state.aux = {};
    },

    createShape(state, input) {
      state.doc.appendShape();
    },

    createProject(state, input) {
      state.doc.init();
    },

    setFrameOrigin(state, input) {
      state.doc.insertFrameInPlace();
      state.aux.originX = input.detail.inputX;
      state.aux.originY = input.detail.inputY;
    },

    grabCorner(state, input) {
      const frame = state.doc.selected.frame;

      // store coordinates of *opposite* corner
      switch (input.detail.target) {
        case 'top-left-corner':
          state.aux.originX = frame.left + frame.width;
          state.aux.originY = frame.top + frame.height;
          break;
        case 'top-right-corner':
          state.aux.originX = frame.left;
          state.aux.originY = frame.top + frame.height;
          break;
        case 'bot-right-corner':
          state.aux.originX = frame.left;
          state.aux.originY = frame.top;
          break;
        case 'bot-left-corner':
          state.aux.originX = frame.left + frame.width;
          state.aux.originY = frame.top;
          break;
      }
    },

    sizeFrame(state, input) {
      state.doc.selected.frame.set({
        top:    Math.min(state.aux.originY, input.detail.inputY),
        left:   Math.min(state.aux.originX, input.detail.inputX),
        width:  Math.abs(state.aux.originX - input.detail.inputX),
        height: Math.abs(state.aux.originY - input.detail.inputY),
      });
    },

    deleteFrame(state, input) {
      state.doc.deleteSelectedFrame();
    },

    grabFrame(state, input) {
      const id = input.detail.id;
      state.doc.selected.frame = state.doc.selectFrameAndShape(id);

      state.aux.originX = input.detail.inputX;
      state.aux.originY = input.detail.inputY;
    },

    moveFrame(state, input) {
      const frame = state.doc.selected.frame;

      frame.set({
        top:  frame.top  + (input.detail.inputY - state.aux.originY),
        left: frame.left + (input.detail.inputX - state.aux.originX),
      });

      state.aux.originX = input.detail.inputX;
      state.aux.originY = input.detail.inputY;
    },

    processProjectIds(state, input) {
      state.docIds = input.detail.docIds;
    },
  };

  const core = {
    addSubscriber(subscriber) {
      this.subscribers.push(subscriber);
    },

    publishState() {
      for (let subscriber of this.subscribers) {
        subscriber.receive(JSON.parse(JSON.stringify(this.state)));
      }
      this.state.messages = {}; // be sure to never send a message twice!
    },

    controller(input) {
      const transition = transitionMap.get([this.state.label, input.label]);

      if (transition) {
        actions[transition.action](this.state, input);
        this.state.label = transition.nextLabel;
        this.state.messages = transition.messages || {};
        this.publishState();

        // console.log("input: " + input.label + ',',"new state: " + this.state.label);
      }
    },

    init() {
      this.state = {
        doc: doc.init(),
        label: 'start',
        docIds: null,
        messages: {}, // TODO: don't want this.
        aux: {}, // TODO: don't want this. maybe store this stuff in actions object?
      };

      this.subscribers = [];

      return this;
    },
  };

  const inputMap = [
    // event type   target type           input
    [['click',     'newShapeButton'   ], 'createShape'       ],
    [['click',     'newProjectButton' ], 'createProject'     ],
    [['click',     'animateButton'    ], 'startAnimation'    ],
    [['click',     'deleteLink'       ], 'deleteFrame'       ],
    [['click',     'canvas'           ], 'toIdle'            ],
    [['click',     'canvas'           ], 'toIdle'            ],
    [['mousedown', 'frame'            ], 'modifyPosition'    ],
    [['mousedown', 'top-left-corner'  ], 'resizeFrame'       ],
    [['mousedown', 'top-right-corner' ], 'resizeFrame'       ],
    [['mousedown', 'bot-left-corner'  ], 'resizeFrame'       ],
    [['mousedown', 'bot-right-corner' ], 'resizeFrame'       ],
    [['mousedown', 'canvas'           ], 'createFrame'       ],
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

  const bindEvents = function(controller) {
    const mouseEventDetails = (event) => {
      return {
        inputX:     event.clientX,
        inputY:     event.clientY,
        target:     event.target.dataset.type,
        id:         event.target.dataset.id,
      };
    };

    ui.canvasNode.addEventListener('mousedown', (event) => {
      controller({
        label:  inputMap.get(['mousedown', event.target.dataset.type]),
        detail: mouseEventDetails(event)
      });
    });

    ui.canvasNode.addEventListener('mousemove', (event) => {
      controller({
        label:  inputMap.get(['mousemove']),
        detail: mouseEventDetails(event)
      });
    });

    ui.canvasNode.addEventListener('mouseup', (event) => {
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
  };

  const ui = {
    subscribeTo(publisher) {
      publisher.addSubscriber(this);
    },

    receive(state) {
      console.log(this.changes(state, this.previousState));
      for (let changed of this.changes(state, this.previousState)) {
        this.sync[changed](state);
      }
      this.previousState = state;
    },

    changes(state1, state2) {
      const keys = Object.keys(state1);
      const changed = keys.filter(key => !this.equal(state1[key], state2[key]));

      if (state2.doc && state1.doc._id !== state2.doc._id) {
        changed.push('docId');
      }
      // ^ TODO: this special case is awkward.

      return changed;
    },

    equal(obj1, obj2) {
      return JSON.stringify(obj1) === JSON.stringify(obj2);
    },

    sync: {
      doc(state) {
        ui.canvasNode.innerHTML = '';

        for (let shape of state.doc.shapes) {
          const shapeNode = ui.nodeFactory.makeShapeNode(shape._id);
          if (state.doc.selected.shapeID === shape._id) {
            shapeNode.classList.add('selected');
          }

          for (var i = 0; i < shape.frames.length; i += 1) {
            const frameNode = ui.nodeFactory.makeFrameNode(i, shape.frames[i]._id);
            ui.place(frameNode, shape.frames[i]);
            if (shape.frames[i]._id === state.doc.selected.frameID) {
              frameNode.classList.add('selected');
            }

            shapeNode.appendChild(frameNode);
          }

          ui.canvasNode.appendChild(shapeNode);
        }
      },

      label(state) {
        if (state.label === 'animating') {
          ui.canvasNode.innerHTML = '';

          for (let shape of state.doc.shapes) {
            const timeline = new TimelineMax();
            const shapeNode = ui.nodeFactory.makeShapeNode();

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
        console.log("doc ids: " + state.docIds); // fine
        ui.flash('Document list loaded');
        // TODO: implement
        // append a list entry for each project id
        // the list entry needs a data-id
        // Since projects don't have a name, we don't quite know what to write there.
      },

      docId(state) {
        ui.flash('New document saved');
      },

      messages(state) {
        // TODO ==> eliminate this
      },

      aux(state) {
        // TODO ==> eliminate this
      },
    },

    flash(message) {
      const flash = document.createElement('p');
      flash.innerHTML = message;
      flash.classList.add('flash');
      window.setTimeout(() => document.body.appendChild(flash), 500);
      window.setTimeout(() => flash.remove(), 1500);
    },

    adjust(frame) {
      return {
        top:    frame.top - ui.canvasNode.offsetTop,
        left:   frame.left - ui.canvasNode.offsetLeft,
        width:  frame.width,
        height: frame.height,
      };
    },

    place(node, frame) {
      node.style.top    = String(this.adjust(frame).top)  + 'px';
      node.style.left   = String(this.adjust(frame).left) + 'px';
      node.style.width  = String(frame.width)        + 'px';
      node.style.height = String(frame.height)       + 'px';
    },

    init(machine) {
      this.nodeFactory      = nodeFactory;
      this.canvasNode       = document.querySelector('#canvas');
      this.newShapeButton   = document.querySelector('#new-shape');
      this.newProjectButton = document.querySelector('#new-project');
      this.animateButton    = document.querySelector('#animate');

      this.previousState = {};

      bindEvents(machine.controller.bind(machine));
      this.subscribeTo(machine);
    },
  };

  const bindEvents$1 = (controller) => {
    window.addEventListener('saveNewProject', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        controller({
          label: 'projectSaved',
          detail: {}
        });
      });

      request.open('POST', "/projects/");
      request.responseType = 'json';
      request.send(event.detail);
    });

    window.addEventListener('loadProjectIds', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        controller({
          label: 'projectIdsLoaded',
          detail: {
            docIds: request.response
          }
        });
      });

      request.open('GET', "/ids");
      request.responseType = 'json';
      request.send();
    });

    // window.addEventListener('loadProject', function(event) {
    // // TODO: implement
    // // load an existing project from the db
    // // note: here, the corresponding action needs access to
    // // the response body. so we need to dispatch a custom event
    // // to the handler method:
    // //
    // // assuming the project is stored in `theProject`:
    // // handler(new CustomEvent('projectLoaded', detail: theProject))
    // });

    // window.addEventListener('loadProjectIds', function(event) {
    // // TODO: implement
    // // load the ids of all projects from db
    // });

    // window.addEventListener('deleteProject', function(event) {
    // // TODO: implement
    // // delete a project
    // });

    // window.addEventListener('updateProject', function(event) {
    // // TODO: implement
    // // save a project to the db that has been changed
    // });
  };

  // const convertFromDb = (data) => {
  //   // TODO: implement
  //   // convert data.selected ids into references
  //   // who is responsible for this? presumably, `doc`.
  // };

  const db = {
    subscribeTo(publisher) {
      publisher.addSubscriber(this);
    },

    receive(state) {
      state.messages['db'] && this[state.messages['db']](state);
      // TODO: this is not so different from carrying out a method call!
      //       the db should analyze the state and figure out what it needs to do.
    },

    loadProjectIds(state) {
      const event = new Event('loadProjectIds');
      window.dispatchEvent(event);
    },

    saveNewProject(state) {
      const event = new CustomEvent(
        'saveNewProject',
        { detail: JSON.stringify(state.doc) }
      );
      window.dispatchEvent(event);
    },

    init(machine) {
      bindEvents$1(machine.controller.bind(machine));
      this.subscribeTo(machine);
    },
  };

  const app = {
    init() {
      core.init();
      ui.init(core);
      db.init(core);

      core.controller({ label: 'kickoff' });
    },
  };

  document.addEventListener('DOMContentLoaded', app.init);

}());
//# sourceMappingURL=bundle.js.map
