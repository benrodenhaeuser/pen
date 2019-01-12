(function () {
  'use strict';

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
    const frames = model.selected.shape.frames;
    for (let i = 0; i < frames.length; i += 1) {
      if (frames[i] === selectedFrame) {
        return i;
      }
    }
  };

  const model = {
    get data() {
      return {
        _id: this._id,
        shapes: this.shapes,
        selected: this.selected,
      };
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

    selectFrame(id) {
      for (let shape of this.shapes) {
        for (let frame of shape.frames) {
          if (frame._id === id) {
            console.log('found match');
            this.selected.frame = frame;
            this.selected.shape = shape;
            return frame;
          }
        }
      }
    },

    createProjectSkeleton() {
      const projectId = createId();
      const shapeId = createId();
      const shape = {
        _id: shapeId,
        frames: [],
      };

      return {
        _id: projectId,
        shapes: [shape],
        selected: {
          shape: shape,
          frame: null,
        }
      };
    },

    // in a world of many projects, it seems that it would make sense to have many models (each one representing a project). but let's see about that later.
    init() {
      // TODO: this is awkward, fix.
      const project = this.createProjectSkeleton();
      this._id = project._id;
      this.shapes = project.shapes;
      this.selected = project.selected;

      console.log(this._id);

        // case where we did not get data:

        // const shape = {
        //   id: createId(),
        //   frames: [],
        // };
        //
        // this.shapes = [shape];
        //
        // this.selected = {
        //   shape: shape,
        //   frame: null,
        // };

      // this.setupShapes(JSON.parse(json));
      return this;
    },
  };

  const actions = {
    skip() {
      return;
    },

    clear() {
      this.aux = {};
    },

    createShape(event) {
      this.model.appendShape();
    },

    createProject(event) {
      this.model.init();
    },

    setFrameOrigin(event) {
      this.model.insertFrameInPlace();
      this.aux.originX = event.clientX;
      this.aux.originY = event.clientY;
    },

    grabCorner(event) {
      const frame = this.model.selected.frame;

      // store coordinates of opposite corner
      switch (event.target.dataset.corner) {
        case 'top-left':
          this.aux.originX = frame.left + frame.width;
          this.aux.originY = frame.top + frame.height;
          break;
        case 'top-right':
          this.aux.originX = frame.left;
          this.aux.originY = frame.top + frame.height;
          break;
        case 'bottom-right':
          this.aux.originX = frame.left;
          this.aux.originY = frame.top;
          break;
        case 'bottom-left':
          this.aux.originX = frame.left + frame.width;
          this.aux.originY = frame.top;
          break;
      }
    },

    sizeFrame(event) {
      this.model.selected.frame.set({
        top:    Math.min(this.aux.originY, event.clientY),
        left:   Math.min(this.aux.originX, event.clientX),
        width:  Math.abs(this.aux.originX - event.clientX),
        height: Math.abs(this.aux.originY - event.clientY),
      });
    },

    deleteFrame(event) {
      event.preventDefault(); // => it's an anchor!
      this.model.deleteSelectedFrame();
    },

    grabFrame(event) {
      const id = event.target.dataset.id;
      console.log('id', id);
      this.model.selected.frame = this.model.selectFrame(id);
      console.log('this.model.selected.frame', this.model.selected.frame);

      this.aux.originX = event.clientX;
      this.aux.originY = event.clientY;
    },

    moveFrame(event) {
      const frame = this.model.selected.frame;

      frame.set({
        top:  frame.top  + (event.clientY - this.aux.originY),
        left: frame.left + (event.clientX - this.aux.originX),
      });

      this.aux.originX = event.clientX;
      this.aux.originY = event.clientY;
    },

    init(model) {
      this.model = model;
      this.aux = {};
      return this;
    },
  };

  // eventType: type of event that occured (e.g., 'click')
  // nodeType:  type of node on which the event occured, if any (e.g., 'frame')
  // action:    name of state-changing action that should be invoked (e.g.,'skip')
  // messages:  messages to be sent to machine subscribers
  // nextState: state label that the machine will transition to (e.g., 'idle')

  const blueprint = {
    // start: [
    //   {
    //     eventType: 'DOMContentLoaded',
    //     action: 'skip',
    //     nextState: 'idle',
    //   }
    // ],

    idle: [
      {
        eventType: 'click',
        nodeType: 'newShapeButton',
        action: 'createShape',
        nextState: 'idle',
      },
      {
        eventType: 'click',
        nodeType: 'newProjectButton',
        action: 'createProject',
        messages: {
          db: 'saveNewProject',
          ui: 'renderFrames',
        },
        nextState: 'idle',
      },
      {
        eventType: 'click',
        nodeType: 'animateButton',
        action: 'skip',
        messages: {
          ui: 'animateShapes',
        },
        nextState: 'animating',
      },
      {
        eventType: 'projectSaved',
        action: 'skip',
        messages: {
          ui: 'displaySavedFlash',
        },
        nextState: 'idle',
      },
      {
        eventType: 'mousedown',
        nodeType: 'frame',
        action: 'grabFrame',
        messages: {
          ui: 'renderFrames',
        },
        nextState: 'draggingFrame',
      },
      {
        eventType: 'mousedown',
        nodeType: 'corner',
        action: 'grabCorner',
        nextState: 'resizingFrame',
      },
      {
        eventType: 'mousedown',
        nodeType: 'canvas',
        action: 'setFrameOrigin',
        nextState: 'drawingFrame',
      },
      {
        eventType: 'click',
        nodeType: 'deleteLink',
        action: 'deleteFrame',
        messages: {
          ui: 'renderFrames',
        },
        nextState: 'idle',
      }
    ],

    drawingFrame: [
      {
        eventType: 'mousemove',
        action: 'sizeFrame',
        messages: {
          ui: 'renderFrames',
        },
        nextState: 'drawingFrame',
      },
      {
        eventType: 'mouseup',
        action: 'clear',
        nextState: 'idle',
      }
    ],

    draggingFrame: [
      {
        eventType: 'mousemove',
        action: 'moveFrame',
        messages: {
          ui: 'renderFrames',
        },
        nextState: 'draggingFrame',
      },
      {
        eventType: 'mouseup',
        action: 'clear',
        nextState: 'idle',
      }
    ],

    resizingFrame: [
      {
        eventType: 'mousemove',
        action: 'sizeFrame',
        messages: {
          ui: 'renderFrames',
        },
        nextState: 'resizingFrame',
      },
      {
        eventType: 'mouseup',
        action: 'clear',
        nextState: 'idle',
      }
    ],

    animating: [
      {
        eventType: 'click',
        nodeType: 'canvas',
        action: 'skip',
        nextState: 'idle',
      },
      {
        eventType: 'click',
        nodeType: 'animateButton',
        action: 'skip',
        messages: {
          ui: 'animateShapes',
        },
        nextState: 'animating',
      },
    ]
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

  const machine = {
    addSubscriber(subscriber) {
      this.subscribers.push(subscriber);
    },

    publish(data, messages) {
      for (let subscriber of this.subscribers) {
        subscriber.receive(data, messages);
      }
    },

    make(transition) {
      this.actions[transition.action](event);
      this.state = transition.nextState;
      this.publish(this.model.data, transition.messages || {});
    },

    dispatch(event) {
      const eventType = event.type;
      const nodeType  = event.target && event.target.dataset && event.target.dataset.type;
      const transition = this.blueprint[this.state].find(t => {
          return t.eventType === eventType &&
            (t.nodeType === nodeType || t.nodeType === undefined);
        });

      if (transition) { this.make(transition); }
    },

    init(model, actions, blueprint) {
      this.model     = model;
      this.actions   = actions;
      this.blueprint = blueprint;
      this.subscribers = [];
      this.state     = 'idle';

      return this;
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

  const adjust = function(coordinates) {
    return {
      top:    coordinates.top - ui.canvasNode.offsetTop,
      left:   coordinates.left - ui.canvasNode.offsetLeft,
      width:  coordinates.width,
      height: coordinates.height,
    };
  };

  const place = function(node, coordinates) {
    node.style.top    = String(adjust(coordinates).top) + 'px';
    node.style.left   = String(adjust(coordinates).left) + 'px';
    node.style.width  = String(coordinates.width)  + 'px';
    node.style.height = String(coordinates.height) + 'px';
  };

  const ui = {
    subscribeTo(publisher) {
      publisher.addSubscriber(this);
    },

    receive(data, messages) {
      messages['ui'] && this[messages['ui']](data);
    },

    renderFrames(data) {
      this.canvasNode.innerHTML = '';

      for (let shape of data.shapes) {
        const shapeNode = this.nodeFactory.makeShapeNode(shape._id);
        if (data.selected.shape === shape) {
          shapeNode.classList.add('selected');
        }

        for (var i = 0; i < shape.frames.length; i += 1) {
          const frameNode = this.nodeFactory.makeFrameNode(i, shape.frames[i]._id);
          place(frameNode, shape.frames[i].coordinates);
          if (shape.frames[i] === data.selected.frame) {
            frameNode.classList.add('selected');
          }

          shapeNode.appendChild(frameNode);
        }

        this.canvasNode.appendChild(shapeNode);
      }
    },

    animateShapes(data) {
      this.canvasNode.innerHTML = '';

      for (let shape of data.shapes) {
        const timeline = new TimelineMax();
        const shapeNode = this.nodeFactory.makeShapeNode();

        for (let i = 0; i < shape.frames.length - 1; i += 1) {
          let source = shape.frames[i];
          let target = shape.frames[i + 1];

          timeline.fromTo(
            shapeNode,
            0.3,
            adjust(source.coordinates),
            adjust(target.coordinates)
          );
        }

        this.canvasNode.appendChild(shapeNode);
      }
    },

    displaySavedFlash() {
      const flash = document.createElement('p');
      flash.innerHTML = 'File saved';
      flash.classList.add('flash');
      window.setTimeout(() => document.body.appendChild(flash), 1000);
      window.setTimeout(() => flash.remove(), 2000);
    },

    init(machine, nodeFactory) {
      this.nodeFactory      = nodeFactory;
      this.canvasNode       = document.querySelector('#canvas');
      this.newShapeButton   = document.querySelector('#new-shape');
      this.newProjectButton = document.querySelector('#new-project');
      this.animateButton    = document.querySelector('#animate');

      bindEvents(machine.dispatch.bind(machine));
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

    // window.addEventListener('loadProject', function(event) {
    //
    // });

    // window.addEventListener('deleteProject', function(event) {
    //
    // });

    // window.addEventListener('updateProject', function(event) {
    //
    // });
  };

  const convertToDb = (data) => {
    const frameId = data.selected.frame && data.selected.frame._id || null;

    return {
      _id: data._id,
      shapes: data.shapes,
      selected: {
        shape: data.selected.shape._id,
        frame: frameId,
      },
    };
  };

  const db = {
    subscribeTo(publisher) {
      publisher.addSubscriber(this);
    },

    receive(data, messages) {
      if (messages['db'] === 'saveNewProject') {
        this.saveNewProject(data);
      }
    },

    saveNewProject(data) {
      data = convertToDb(data);
      var event = new CustomEvent(
        'saveNewProject',
        { detail: JSON.stringify(data) }
      );
      window.dispatchEvent(event);
    },

    init(machine) {
      bindEvents$1(machine.dispatch.bind(machine));
      this.subscribeTo(machine);
    },
  };

  const app = {
    init() {
      model.init(); // creates "empty" project
      actions.init(model);
      machine.init(model, actions, blueprint);
      ui.init(machine, nodeFactory);
      db.init(machine);
    },
  };

  document.addEventListener('DOMContentLoaded', app.init);

  // TODO

  // Notes on object structure:

  // machine:
  // - state
  // - actions (transform the state)

  // machine.state:
  // - label ('idle' etc)
  // - project (an instance of the model)
  // - aux (for more temporary data)

  // the ui needs the nodeFactory, but I am not sure we should pass it in here.
  // we can import it in the ui file

}());
//# sourceMappingURL=bundle.js.map
