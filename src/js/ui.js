import { nodeFactory } from './utils.js';
import { inputMap } from './inputMap.js';

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

const adjust = function(frame) {
  return {
    top:    frame.top - ui.canvasNode.offsetTop,
    left:   frame.left - ui.canvasNode.offsetLeft,
    width:  frame.width,
    height: frame.height,
  };
};

const place = function(node, frame) {
  node.style.top    = String(adjust(frame).top)  + 'px';
  node.style.left   = String(adjust(frame).left) + 'px';
  node.style.width  = String(frame.width)        + 'px';
  node.style.height = String(frame.height)       + 'px';
};

const ui = {
  subscribeTo(publisher) {
    publisher.addSubscriber(this);
  },

  receive(state) {
    state.messages['ui'] && this[state.messages['ui']](state);
    // TODO: this is not so different from carrying out a method call!
    //       the ui should analyze the state and figure out what it needs to do.
  },

  diffs(state) {
    // find out what has changed since the last tick.
  },

  sync(state) {
    // render changes based on the results of `diff`.
  },

  renderFrames(state) {
    this.canvasNode.innerHTML = '';

    for (let shape of state.doc.shapes) {
      const shapeNode = this.nodeFactory.makeShapeNode(shape._id);
      if (state.doc.selected.shapeID === shape._id) {
        shapeNode.classList.add('selected');
      }

      for (var i = 0; i < shape.frames.length; i += 1) {
        const frameNode = this.nodeFactory.makeFrameNode(i, shape.frames[i]._id);
        place(frameNode, shape.frames[i]);
        if (shape.frames[i]._id === state.doc.selected.frameID) {
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
    console.log("doc ids: " + state.docIds); // fine
    this.displayLoadedFlash();
    // append a list entry for each project id
    // the list entry needs a data-id
    // Since projects don't have a name, we don't quite know what to write there.
  },

  // TODO: one method for flash messages.

  displayLoadedFlash() {
    const flash = document.createElement('p');
    flash.innerHTML = 'Document list loaded';
    flash.classList.add('flash');
    window.setTimeout(() => document.body.appendChild(flash), 500);
    window.setTimeout(() => flash.remove(), 1500);
  },

  displaySavedNewFlash() {
    const flash = document.createElement('p');
    flash.innerHTML = 'New document saved';
    flash.classList.add('flash');
    window.setTimeout(() => document.body.appendChild(flash), 500);
    window.setTimeout(() => flash.remove(), 1500);
  },

  init(machine) {
    this.nodeFactory      = nodeFactory;
    this.canvasNode       = document.querySelector('#canvas');
    this.newShapeButton   = document.querySelector('#new-shape');
    this.newProjectButton = document.querySelector('#new-project');
    this.animateButton    = document.querySelector('#animate');

    bindEvents(machine.controller.bind(machine));
    this.subscribeTo(machine);
  },
};

export { ui };
