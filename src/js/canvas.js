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

export { canvas };
