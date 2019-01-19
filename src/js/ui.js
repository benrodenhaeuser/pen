import { nodeFactory } from './nodeFactory.js';
import { inputTable } from './inputTable.js';

const ui = {
  bindEvents(dispatch) {
    this.canvasNode = document.querySelector('#canvas');

    const mouseEventData = (event) => {
      return {
        inputX:     event.clientX,
        inputY:     event.clientY,
        target:     event.target.dataset.type,
        id:         event.target.dataset.id,
      };
    };

    this.canvasNode.addEventListener('mousedown', (event) => {
      dispatch({
        id:  inputTable.get(['mousedown', event.target.dataset.type]),
        data: mouseEventData(event)
      });
    });

    this.canvasNode.addEventListener('mousemove', (event) => {
      dispatch({
        id:  inputTable.get(['mousemove']),
        data: mouseEventData(event)
      });
    });

    this.canvasNode.addEventListener('mouseup', (event) => {
      dispatch({
        id:  inputTable.get(['mouseup']),
        data: mouseEventData(event)
      });
    });

    document.addEventListener('click', (event) => {
      dispatch({
        id: inputTable.get(['click', event.target.dataset.type]),
        data: mouseEventData(event)
      });
    });
  },

  sync(state) {
    if (state.id === 'start') {
      this.start(state);
      return;
    }

    for (let changed of this.changes(state, this.previousState)) {
      this.renderChanges[changed] && this.renderChanges[changed](state);
    }
    this.previousState = state;
  },

  renderChanges: {
    doc(state) {
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

    lastInputID(state) {
      if (state.lastInputID === 'docSaved') {
        ui.flash('Document saved');
      }

      // TODO: we could perhaps do this.start(state) here?
      //       if the last input is 'kickoff'
    },

    id(state) {
      if (state.id === 'animating') {
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
      }
    },

    docIDs(state) {
      const docList = document.querySelector('.doc-list');
      docList.innerHTML = '';

      for (let docID of state.docIDs) {
        const node = nodeFactory.makeListNode(docID);
        docList.appendChild(node);
      }
    },
  },

  // helpers 1
  changes(state1, state2) {
    const keys = Object.keys(state1);
    return keys.filter(key => !this.equal(state1[key], state2[key]));
  },

  // helpers 2
  equal(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  },

  // helpers 3
  flash(message) {
    const flash = document.createElement('p');
    flash.innerHTML = message;
    flash.classList.add('flash');
    window.setTimeout(() => document.body.appendChild(flash), 500);
    window.setTimeout(() => flash.remove(), 1500);
  },

  // helpers 4
  adjust(frame) {
    return {
      top:    frame.top - ui.canvasNode.offsetTop,
      left:   frame.left - ui.canvasNode.offsetLeft,
      width:  frame.width,
      height: frame.height,
    };
  },

  // helpers 5
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
