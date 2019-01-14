import { nodeFactory } from './nodeFactory.js';

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

export { ui };
