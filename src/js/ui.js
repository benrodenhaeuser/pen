import { nodeFactory } from './nodeFactory.js';
import { inputTable } from './inputTable.js';

const ui = {
  bindEvents(dispatch) {
    this.canvasNode = document.querySelector('#canvas');
    this.stageNode = document.querySelector('#stage');
    this.toolsNode = document.querySelector('#tools');

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
        dispatch({
          id:   inputTable.get([eventType, event.target.dataset.type]),
          data: eventData(event)
        });
      });
    }

    document.addEventListener('click', (event) => {
      dispatch({
        id:   inputTable.get(['click', event.target.dataset.type]),
        data: eventData(event)
      });
    });
  },

  sync(state) {
    const changes = (state1, state2) => {
      const keys = Object.keys(state1);
      return keys.filter(key => !equal(state1[key], state2[key]));
    };

    const equal = (obj1, obj2) => {
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
    // if the doc has been edited, render the frames
    doc(state) {
      ui.renderFrames(state);
    },

    // if doc list/selected doc has changed, render doc list
    docs(state) {
      ui.renderDocList(state);
    },

    currentInput(state) {
      // if doc has been saved, render flash message
      if (state.currentInput === 'docSaved') {
        ui.renderFlash('Saved');
      }

      // if switching to edit mode, render the frames
      if (state.currentInput === 'edit') {
        ui.renderFrames(state);
      }

      // if switching to animation mode, render the frames
      if (state.currentInput === 'animate') {
        ui.renderAnimations(state);
      }
    },
  },

  renderFrames(state) {
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

  renderDocList(state) {
    const docList = document.querySelector('.doc-list');
    docList.innerHTML = '';

    for (let docID of state.docs.ids) {
      const node = nodeFactory.makeListNode(docID);
      docList.appendChild(node);
      if (docID === state.docs.selected) {
        node.classList.add('selected');
      }
    }
  },

  renderAnimations(state) {
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

  start(state) {
    this.previousState = state;
  },
};

export { ui };
