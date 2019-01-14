(function () {
  'use strict';

  // eventType: type of event that occured (e.g., 'click')
  // nodeType:  type of node on which the event occured, if any (e.g., 'frame')
  // action:    name of state-changing action that should be invoked (e.g.,'skip')
  // messages:  messages to be sent to machine subscribers
  // nextLabel: state label that the machine will transition to (e.g., 'idle')

  const blueprint = {
    start: [
      {
        eventType: 'kickoff',
        action: 'skip',
        messages: {
          db: 'loadProjectIds',
        },
        nextLabel: 'idle',
      }
    ],

    idle: [
      {
        eventType: 'click',
        nodeType: 'newShapeButton',
        action: 'createShape',
        nextLabel: 'idle',
      },
      {
        eventType: 'click',
        nodeType: 'newProjectButton',
        action: 'createProject',
        messages: {
          db: 'saveNewProject',
          ui: 'renderFrames',
        },
        nextLabel: 'idle',
      },
      {
        eventType: 'click',
        nodeType: 'animateButton',
        action: 'skip',
        messages: {
          ui: 'animateShapes',
        },
        nextLabel: 'animating',
      },
      {
        eventType: 'projectSaved',
        action: 'skip',
        messages: {
          ui: 'displaySavedNewFlash',
        },
        nextLabel: 'idle',
      },
      {
        eventType: 'projectIdsLoaded',
        action: 'processProjectIds',
        messages: {
          ui: 'renderProjectIds',
        },
        nextLabel: 'idle',
      },
      {
        eventType: 'mousedown',
        nodeType: 'frame',
        action: 'grabFrame',
        messages: {
          ui: 'renderFrames',
        },
        nextLabel: 'draggingFrame',
      },
      {
        eventType: 'mousedown',
        nodeType: 'corner',
        action: 'grabCorner',
        nextLabel: 'resizingFrame',
      },
      {
        eventType: 'mousedown',
        nodeType: 'canvas',
        action: 'setFrameOrigin',
        nextLabel: 'drawingFrame',
      },
      {
        eventType: 'click',
        nodeType: 'deleteLink',
        action: 'deleteFrame',
        messages: {
          ui: 'renderFrames',
        },
        nextLabel: 'idle',
      }
    ],

    drawingFrame: [
      {
        eventType: 'mousemove',
        action: 'sizeFrame',
        messages: {
          ui: 'renderFrames',
        },
        nextLabel: 'drawingFrame',
      },
      {
        eventType: 'mouseup',
        action: 'clear',
        nextLabel: 'idle',
      }
    ],

    draggingFrame: [
      {
        eventType: 'mousemove',
        action: 'moveFrame',
        messages: {
          ui: 'renderFrames',
        },
        nextLabel: 'draggingFrame',
      },
      {
        eventType: 'mouseup',
        action: 'clear',
        nextLabel: 'idle',
      }
    ],

    resizingFrame: [
      {
        eventType: 'mousemove',
        action: 'sizeFrame',
        messages: {
          ui: 'renderFrames',
        },
        nextLabel: 'resizingFrame',
      },
      {
        eventType: 'mouseup',
        action: 'clear',
        nextLabel: 'idle',
      }
    ],

    animating: [
      {
        eventType: 'click',
        nodeType: 'canvas',
        action: 'skip',
        messages: {
          ui: 'renderFrames',
        },
        nextLabel: 'idle',
      },
      {
        eventType: 'click',
        nodeType: 'animateButton',
        action: 'skip',
        messages: {
          ui: 'animateShapes',
        },
        nextLabel: 'animating',
      },
    ]
  };

  const createId = () => {
    const randomString = Math.random().toString(36).substring(2);
    const timestamp    = (new Date()).getTime().toString(36);

    return randomString + timestamp;
  };

  // need globally unique ids across sessions.
  // solution: instead of incrementing, generate
  // something that is more or less guaranteed to be unique:

  // let uniqueId = Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);

  const Frame = {
    get coordinates() {
      return {
        top:    this.top,
        left:   this.left,
        width:  this.width,
        height: this.height,
      };
    },

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

  const findIndexOf = function(selectedFrame) {
    const frames = doc.selected.shape.frames;
    for (let i = 0; i < frames.length; i += 1) {
      if (frames[i] === selectedFrame) {
        return i;
      }
    }
  };

  const doc = {
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
        const index = findIndexOf(this.selected.frame);
        frames.splice(index + 1, 0, frame);
      } else {
        frames.push(frame);
      }

      this.selected.frame = frame;
    },

    deleteSelectedFrame() {
      const frames = this.selected.shape.frames;
      const index = findIndexOf(this.selected.frame);
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

    empty() {
      const docId = createId();
      const shapeId = createId();
      const shape = {
        _id: shapeId,
        frames: [],
      };

      this._id = docId;
      this.shapes = [shape];
      this.selected = {
        shape: shape,
        frame: null,
      };
    },

    import(docData) {
      // TODO
    },

    init(docData) {
      if (docData === undefined) {
        this.empty();
      } else {
        this.import(docData);
      }

      return this;
    },
  };

  const actions = {
    skip() {
      return;
    },

    clear(state, event) {
      state.aux = {};
    },

    createShape(state, event) {
      state.doc.appendShape();
    },

    createProject(state, event) {
      state.doc.init();
    },

    setFrameOrigin(state, event) {
      state.doc.insertFrameInPlace();
      state.aux.originX = event.clientX;
      state.aux.originY = event.clientY;
    },

    grabCorner(state, event) {
      const frame = state.doc.selected.frame;

      // store coordinates of opposite corner
      // to the one that was clicked:
      switch (event.target.dataset.corner) {
        case 'top-left':
          state.aux.originX = frame.left + frame.width;
          state.aux.originY = frame.top + frame.height;
          break;
        case 'top-right':
          state.aux.originX = frame.left;
          state.aux.originY = frame.top + frame.height;
          break;
        case 'bottom-right':
          state.aux.originX = frame.left;
          state.aux.originY = frame.top;
          break;
        case 'bottom-left':
          state.aux.originX = frame.left + frame.width;
          state.aux.originY = frame.top;
          break;
      }
    },

    sizeFrame(state, event) {
      state.doc.selected.frame.set({
        top:    Math.min(state.aux.originY, event.clientY),
        left:   Math.min(state.aux.originX, event.clientX),
        width:  Math.abs(state.aux.originX - event.clientX),
        height: Math.abs(state.aux.originY - event.clientY),
      });
    },

    deleteFrame(state, event) {
      event.preventDefault();
      state.doc.deleteSelectedFrame();
    },

    grabFrame(state, event) {
      const id = event.target.dataset.id;
      state.doc.selected.frame = state.doc.selectFrameAndShape(id);

      state.aux.originX = event.clientX;
      state.aux.originY = event.clientY;
    },

    moveFrame(state, event) {
      const frame = state.doc.selected.frame;

      frame.set({
        top:  frame.top  + (event.clientY - state.aux.originY),
        left: frame.left + (event.clientX - state.aux.originX),
      });

      state.aux.originX = event.clientX;
      state.aux.originY = event.clientY;
    },

    processProjectIds(state, event) {
      // TODO: implement
      // event.detail holds the response.
      // need to add the array with project ids to state
    },
  };

  const machine = {
    addSubscriber(subscriber) {
      this.subscribers.push(subscriber);
    },

    publishState() {
      for (let subscriber of this.subscribers) {
        subscriber.receive(this.state);
      }
    },

    handle(event) {
      const eventType = event.type;
      const nodeType  = event.target && event.target.dataset && event.target.dataset.type;

      const match = (t) => {
        return t.eventType === eventType &&
          (t.nodeType === nodeType ||
            t.nodeType === undefined);
      };

      const transition = this.blueprint[this.state.label].find(match);

      if (transition) {
        this.actions[transition.action](this.state, event);
        this.state.label = transition.nextLabel;
        this.state.messages = transition.messages || {};
        this.publishState();
      }
    },

    init() {
      this.state = {
        doc: doc.init(),
        label: 'start',
        docIds: null,
        aux: {},
      };

      this.actions     = actions;
      this.blueprint   = blueprint;
      this.subscribers = [];

      return this;
    },
  };

  const frameTemplate = (index) => {
    const template = document.createElement('template');
    template.innerHTML = `
    <div class="corner top-left" data-type="corner" data-corner="top-left">
      <div class="center"></div>
    </div>
    <div class="corner top-right" data-type="corner" data-corner="top-right">
      <div class="center"></div>
    </div>
    <div class="corner bottom-left" data-type="corner" data-corner="bottom-left">
      <div class="center"></div>
    </div>
    <div class="corner bottom-right" data-type="corner" data-corner="bottom-right">
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

  const bindEvents = function(handler) {
    ui.canvasNode.addEventListener('mousedown', handler);
    ui.canvasNode.addEventListener('mousemove', handler);
    ui.canvasNode.addEventListener('mouseup', handler);
    ui.canvasNode.addEventListener('click', handler);
    ui.newShapeButton.addEventListener('click', handler);
    ui.newProjectButton.addEventListener('click', handler);
    ui.animateButton.addEventListener('click', handler);
  };

  const adjust = function(frame) {
    return {
      top:    frame.top - ui.canvasNode.offsetTop,
      left:   frame.left - ui.canvasNode.offsetLeft,
      width:  frame.width,
      height: frame.height,
    };
  };

  const place = function(node, frame) {
    node.style.top    = String(adjust(frame).top) + 'px';
    node.style.left   = String(adjust(frame).left) + 'px';
    node.style.width  = String(frame.width)  + 'px';
    node.style.height = String(frame.height) + 'px';
  };

  const ui = {
    subscribeTo(publisher) {
      publisher.addSubscriber(this);
    },

    receive(state) {
      state.messages['ui'] && this[state.messages['ui']](state);
    },

    renderFrames(state) {
      this.canvasNode.innerHTML = '';

      for (let shape of state.doc.shapes) {
        const shapeNode = this.nodeFactory.makeShapeNode(shape._id);
        if (state.doc.selected.shape === shape) {
          shapeNode.classList.add('selected');
        }

        for (var i = 0; i < shape.frames.length; i += 1) {
          const frameNode = this.nodeFactory.makeFrameNode(i, shape.frames[i]._id);
          place(frameNode, shape.frames[i]);
          if (shape.frames[i] === state.doc.selected.frame) {
            frameNode.classList.add('selected');
          }

          shapeNode.appendChild(frameNode);
        }

        this.canvasNode.appendChild(shapeNode);
      }
    },

    animateShapes(state) {
      this.canvasNode.innerHTML = '';

      for (let shape of state.doc.shapes) {
        const timeline = new TimelineMax();
        const shapeNode = this.nodeFactory.makeShapeNode();

        for (let i = 0; i < shape.frames.length - 1; i += 1) {
          let source = shape.frames[i];
          let target = shape.frames[i + 1];

          timeline.fromTo(
            shapeNode,
            0.3,
            adjust(source),
            adjust(target)
          );
        }

        this.canvasNode.appendChild(shapeNode);
      }
    },

    renderProjectIds(state) {
      // TODO: implement
      // need to access state.docIds here (or whatever it's called).
      this.displayLoadedFlash();
    },

    displayLoadedFlash() {
      const flash = document.createElement('p');
      flash.innerHTML = 'Document list loaded';
      flash.classList.add('flash');
      window.setTimeout(() => document.body.appendChild(flash), 1000);
      window.setTimeout(() => flash.remove(), 2000);
    },

    displaySavedNewFlash() {
      const flash = document.createElement('p');
      flash.innerHTML = 'New document saved';
      flash.classList.add('flash');
      window.setTimeout(() => document.body.appendChild(flash), 1000);
      window.setTimeout(() => flash.remove(), 2000);
    },

    init(machine) {
      this.nodeFactory      = nodeFactory;
      this.canvasNode       = document.querySelector('#canvas');
      this.newShapeButton   = document.querySelector('#new-shape');
      this.newProjectButton = document.querySelector('#new-project');
      this.animateButton    = document.querySelector('#animate');

      bindEvents(machine.handle.bind(machine));
      this.subscribeTo(machine);
    },
  };

  const bindEvents$1 = (handler) => {
    window.addEventListener('saveNewProject', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        handler(new Event('projectSaved'));
      });

      request.open('POST', "/projects/");
      request.responseType = 'json';
      request.send(event.detail);
    });

    window.addEventListener('loadProjectIds', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        handler(new CustomEvent(
          'projectIdsLoaded',
          request.response
          // ^ pass the array with project ids to the handler
          //   maybe we should do the json conversion ourselves?
        ));
      });

      request.open('GET', "/projects/ids");
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

  const serializable = (doc) => {
    const shapeId = doc.selected.shape && doc.selected.shape._id || null;
    const frameId = doc.selected.frame && doc.selected.frame._id || null;

    return {
      _id: doc._id,
      shapes: doc.shapes,
      selected: {
        shape: shapeId,
        frame: frameId,
      },
    };
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
      if (state.messages['db'] === 'saveNewProject') {
        this.saveNewProject(state.doc);
      }

      if (state.messages['db'] === 'loadProjectIds') {
        this.loadProjectIds();
      }
    },

    loadProjectIds() {
      const event = new Event('loadProjectIds');
      window.dispatchEvent(event);
    },

    saveNewProject(doc) {
      const event = new CustomEvent(
        'saveNewProject',
        { detail: JSON.stringify(serializable(doc)) }
      );
      window.dispatchEvent(event);
    },

    init(machine) {
      bindEvents$1(machine.handle.bind(machine));
      this.subscribeTo(machine);
    },
  };

  const app = {
    init() {
      machine.init();
      ui.init(machine);
      db.init(machine);

      machine.handle(new Event('kickoff'));
    },
  };

  document.addEventListener('DOMContentLoaded', app.init);

}());
//# sourceMappingURL=bundle.js.map
