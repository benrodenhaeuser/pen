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

export { ui };
