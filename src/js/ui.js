import { nodeFactory } from './nodeFactory.js';
import { inputMap } from './inputMap.js';

const ui = {
  bindEvents(controller) {
    this.canvasNode = document.querySelector('#canvas');

    const mouseEventDetails = (event) => {
      return {
        inputX:     event.clientX,
        inputY:     event.clientY,
        target:     event.target.dataset.type,
        id:         event.target.dataset.id,
      };
    };

    this.canvasNode.addEventListener('mousedown', (event) => {
      controller({
        label:  inputMap.get(['mousedown', event.target.dataset.type]),
        detail: mouseEventDetails(event)
      });
    });

    this.canvasNode.addEventListener('mousemove', (event) => {
      controller({
        label:  inputMap.get(['mousemove']),
        detail: mouseEventDetails(event)
      });
    });

    this.canvasNode.addEventListener('mouseup', (event) => {
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
  },

  sync(state) {
    if (state.label === 'start') {
      this.start(state);
      this.previousState = state;
      return;
    }

    for (let changed of this.changes(state, this.previousState)) {
      this.render[changed] && this.render[changed].bind(this)(state);
    }
    this.previousState = state;
  },

  changes(state1, state2) {
    const keys = Object.keys(state1);
    const changed = keys.filter(key => !this.equal(state1[key], state2[key]));
    return changed;
  },

  equal(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  },

  // API
  render: {
    doc(state) {
      if (ui.previousState.doc && state.doc._id !== ui.previousState.doc._id) {
        ui.flash('New document saved');
      }

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

    label(state) {
      if (state.label === 'animating') {
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

    docIds(state) {
      console.log("doc ids: " + state.docIds); // fine
      ui.flash('Document list loaded');
      // TODO: implement
      // append a list entry for each project id
      // the list entry needs a data-id
      // Since projects don't have a name, we don't quite know what to write there.
    },
  },

  flash(message) {
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
    return;
  },

  init(core) {
    this.bindEvents(core.controller.bind(core));
    core.attach(this);
  },
};

export { ui };
