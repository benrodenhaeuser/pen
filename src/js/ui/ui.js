import { nodeFactory } from './nodeFactory.js';
import { inputTable } from './inputTable.js';

const ui = {
  bindEvents(processInput) {
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
        event.preventDefault();
        processInput({
          id:   inputTable.get([eventType, event.target.dataset.type]),
          data: eventData(event)
        });
      });
    }

    document.addEventListener('click', (event) => {
      event.preventDefault();
      processInput({
        id:   inputTable.get(['click', event.target.dataset.type]),
        data: eventData(event)
      });
    });
  },

  sync(state) {
    const changes = (state1, state2) => {
      const keys = Object.keys(state1);
      return keys.filter(key => !equalData(state1[key], state2[key]));
    };

    const equalData = (obj1, obj2) => {
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
      ui.renderInspector(state);
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
      const shapeNode = nodeFactory.makeShapeNode(state, shape._id);
      if (state.doc.selected.shapeID === shape._id) {
        shapeNode.classList.add('selected');
      }

      for (var i = 0; i < shape.frames.length; i += 1) {
        const frameNode = nodeFactory.makeFrameNode(state, i, shape.frames[i]._id);
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
      const node = nodeFactory.makeDocListNode(docID);
      docList.appendChild(node);
      if (docID === state.docs.selectedID) {
        node.classList.add('selected');
      }
    }
  },

  findSelected(doc) {
    for (let shape of doc.shapes) {
      for (let frame of shape.frames) {
        if (frame._id === doc.selected.frameID) {
          return frame;
        }
      }
    }
  },

  renderInspector(state) {
    const inspector = document.querySelector('#inspector');
    inspector.innerHTML = '';

    const node = nodeFactory.makeInspectorNode(this.findSelected(state.doc));
    inspector.appendChild(node);
  },

  renderAnimations(state) {
    ui.canvasNode.innerHTML = '';

    for (let shape of state.doc.shapes) {
      const timeline = new TimelineMax();
      const shapeNode = nodeFactory.makeShapeNode(state);
      shapeNode.innerHTML = state.doc.svg; // TODO: append svg to shape

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
      width: frame.width,
      height: frame.height,
      angle: frame.angle, // ROTATION
    };
  },

  convertKeys(frame) {
    return {
      x:        frame.x,
      y:        frame.y,
      width:    frame.width,
      height:   frame.height,
      rotation: frame.angle * 57.2958, // ROTATION, convert to degrees
    };
  },

  writeCSS(node, frame) {
    node.style.left      = String(this.adjust(frame).x) + 'px';
    node.style.top       = String(this.adjust(frame).y) + 'px';
    node.style.width     = String(frame.width) + 'px';
    node.style.height    = String(frame.height) + 'px';
    node.style.transform = `rotate(${frame.angle}rad)`; // ROTATION
  },

  start(state) {
    this.previousState = state;
  },

  init() {
    this.name = 'ui';
  }
};

export { ui };
