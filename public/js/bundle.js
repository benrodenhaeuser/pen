(function () {
  'use strict';

  let id = 0;
  const getNextId = () => {
    return id++;
  };

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
      this.id     = getNextId();
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
        shapes: this.shapes,
        selected: this.selected,
      };
    },

    appendShape() {
      const shape = {
        id: getNextId(),
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
          if (frame.id === id) {
            this.selected.frame = frame;
            this.selected.shape = shape;
            return frame;
          }
        }
      }
    },

    setupShapes(data) {
      this.shapes = [];

      for (let shapeData of data) {
        let frames = [];
        this.shapes.push({
          id: getNextId(),
          frames: frames
        });
        for (let frameData of shapeData) {
          let frame = Object.create(Frame).init(frameData);
          frames.push(frame);
        }
      }

      const lastShape = this.shapes[this.shapes.length - 1];
      const lastFrame = lastShape.frames[lastShape.frames.length - 1];

      this.selected = {
        shape: lastShape,
        frame: lastFrame,
      };
    },

    init(json) {
        // case where we did not get data:

        // const shape = {
        //   id: getNextId(),
        //   frames: [],
        // };
        //
        // this.shapes = [shape];
        //
        // this.selected = {
        //   shape: shape,
        //   frame: null,
        // };

      this.setupShapes(JSON.parse(json));
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
      const id = Number(event.target.dataset.id);
      this.model.selected.frame = this.model.selectFrame(id);

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
  // nodeType:  type of node on which the event was fired (e.g., 'frame')
  // action:    name of model-changing action that should be invoked (e.g.,'skip')
  // message:   message that should be sent to the view (e.g., 'animate')
  // nextState: state that the machine will transition to (e.g., 'idle')

  const blueprint = {
    start: [
      {
        eventType: 'DOMContentLoaded',
        action: 'skip',
        nextState: 'idle',
      }
    ],

    idle: [
      {
        eventType: 'click',
        nodeType: 'newShapeButton',
        action: 'createShape',
        nextState: 'idle',
      },
      {
        eventType: 'click',
        nodeType: 'animateButton',
        action: 'skip',
        message: 'animate',
        nextState: 'animating',
      },
      {
        eventType: 'mousedown',
        nodeType: 'frame',
        action: 'grabFrame',
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
        nextState: 'idle',
      }
    ],

    drawingFrame: [
      {
        eventType: 'mousemove',
        action: 'sizeFrame',
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
        message: 'animate',
        nextState: 'animating',
      },
    ]
  };

  const machine = {
    addObserver(observer) {
      this.observers.push(observer);
    },

    notifyObservers(data, message) {
      for (let observer of this.observers) {
        observer.update(data, message);
      }
    },

    dispatch(event) {
      const eventType = event.type;
      const nodeType  = event.target.dataset && event.target.dataset.type;

      const transition = this.blueprint[this.state].find(t => {
        return t.eventType === eventType &&
          (t.nodeType === nodeType || t.nodeType === undefined);
      });

      if (transition) {
        this.actions[transition.action](event);
        this.state = transition.nextState;
        this.notifyObservers(this.model.data, transition.message);
      }
    },

    init(model, actions, blueprint) {
      this.model     = model;
      this.actions   = actions;
      this.blueprint = blueprint;
      this.observers = [];
      this.state     = 'start';

      return this;
    },
  };

  const bindEvents = function(handler) {
    canvas.canvasNode.addEventListener('mousedown', handler);
    canvas.canvasNode.addEventListener('mousemove', handler);
    canvas.canvasNode.addEventListener('mouseup', handler);
    canvas.canvasNode.addEventListener('click', handler);

    canvas.newShapeButton.addEventListener('click', handler);
    canvas.animateButton.addEventListener('click', handler);
  };

  const renderFrames = function(data) {
    canvas.canvasNode.innerHTML = '';

    for (let shape of data.shapes) {
      const shapeNode = canvas.nodeFactory.makeShapeNode(shape.id);
      if (data.selected.shape === shape) {
        shapeNode.classList.add('selected');
      }

      for (var i = 0; i < shape.frames.length; i += 1) {
        const frameNode = canvas.nodeFactory.makeFrameNode(i, shape.frames[i].id);
        place(frameNode, shape.frames[i].coordinates);
        if (shape.frames[i] === data.selected.frame) {
          frameNode.classList.add('selected');
        }

        shapeNode.appendChild(frameNode);
      }

      canvas.canvasNode.appendChild(shapeNode);
    }
  };

  const animateShapes = function(data) {
    canvas.canvasNode.innerHTML = '';

    for (let shape of data.shapes) {
      const timeline = new TimelineMax();
      const shapeNode = canvas.nodeFactory.makeShapeNode();

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

      canvas.canvasNode.appendChild(shapeNode);
    }
  };

  const adjust = function(coordinates) {
    return {
      top:    coordinates.top - canvas.canvasNode.offsetTop,
      left:   coordinates.left - canvas.canvasNode.offsetLeft,
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

  const canvas = {
    observeChanges(observable) {
      observable.addObserver(this);
    },

    update(data, message) {
      // TODO: what we would like to have here is simply:

      // this[message](data);

      // (in other words, the message should be 'animate' or 'render')
      // the subscribe mechanism should make sure that other messages are already
      // filtered out at this point.

      if (message === 'animate') {
        animateShapes(data);
        return;
      }

      renderFrames(data);
    },

    init(machine, nodeFactory) {
      this.nodeFactory = nodeFactory;

      this.canvasNode     = document.querySelector('#canvas');
      this.newShapeButton = document.querySelector('#new');
      this.animateButton  = document.querySelector('#animate');

      const handler = machine.dispatch.bind(machine);
      bindEvents(handler);
      this.observeChanges(machine);
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

  // sample data - to be read from db
  const json = '[[{"top":200,"left":200,"width":100,"height":100},{"top":320,"left":320,"width":100,"height":100}]]';

  const editor = {
    init(event) {
      model.init(json);
      actions.init(model);
      machine.init(model, actions, blueprint);
      canvas.init(machine, nodeFactory);

      machine.dispatch(event);
    },
  };

  document.addEventListener('DOMContentLoaded', editor.init);

}());
//# sourceMappingURL=bundle.js.map
