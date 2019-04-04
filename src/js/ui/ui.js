import { nodeFactory   } from './nodeFactory.js';
import { sceneRenderer } from './sceneRenderer.js';
import { render        } from './render.js';
import { mount         } from './mount.js';

const coordinates = (event) => {
  const svg = document.querySelector('svg');
  let point = svg.createSVGPoint();
  point.x   = event.clientX;
  point.y   = event.clientY;
  point     = point.matrixTransform(svg.getScreenCTM().inverse());

  return {
    x: point.x,
    y: point.y,
  };
};

const ui = {
  bindEvents(compute) {
    this.canvasNode  = document.querySelector('#canvas');
    this.toolbarNode = document.querySelector('#toolbar');

    const eventTypes = [
      'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick'
    ];

    const toSuppress = (event) => {
      return [
        'mousedown', 'mouseup', 'click'
      ].includes(event.type) && event.detail > 1;
    };

    for (let eventType of eventTypes) {
      document.addEventListener(eventType, (event) => {
        event.preventDefault();

        if (toSuppress(event)) {
          return;
        }

        compute({
          type:     event.type,
          target:   event.target.dataset.type,
          x:        coordinates(event).x,
          y:        coordinates(event).y,
          targetID: event.target.dataset.id,
        });
      });
    }
  },

  sync(state) {
    mount(render(state.scene), ui.canvasNode);

    // const changes = (state1, state2) => {
    //   const keys = Object.keys(state1);
    //   return keys.filter(key => !equalData(state1[key], state2[key]));
    // };
    //
    // const equalData = (obj1, obj2) => {
    //   return JSON.stringify(obj1) === JSON.stringify(obj2);
    // };
    //
    // if (state.id === 'start') {
    //   this.start(state);
    //   this.renderScene(state); // ?
    //   return;
    // }
    //
    // for (let changed of changes(state, this.previousState)) {
    //   this.render[changed] && this.render[changed](state);
    // }
    //
    // this.previousState = state; // saves the state - we can use that when making an input
  },

  // reconcile

  render: {
    scene(state) {
      ui.renderScene(state);
      // ui.renderInspector(state); // TODO ==> later
    },

    docs(state) {
      ui.renderDocList(state);
    },

    currentInput(state) {
      if (state.currentInput === 'docSaved') {
        ui.renderFlash('Saved');
      }

      if (state.currentInput === 'edit') {
        ui.renderScene(state);
      }
    },

    clock(state) {
      if (state.currentInput === 'animate') {
        ui.renderAnimations(state);
      }
    },
  },

  // methods performing sync actions in the ui
  renderScene(state) {
    // sceneRenderer.render(state.scene, ui.canvasNode);
    mount(render(state.scene), ui.canvasNode);
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

  renderInspector(state) {
    const findSelected = (doc) => {
      for (let shape of doc.shapes) {
        for (let frame of shape.frames) {
          if (frame._id === doc.selected.frameID) {
            return frame;
          }
        }
      }
    };

    const inspector = document.querySelector('#inspector');
    inspector.innerHTML = '';

    const node = nodeFactory.makeInspectorNode(findSelected(state.doc));
    inspector.appendChild(node);
  },

  renderFlash(message) {
    const flash = document.createElement('p');
    flash.innerHTML = message;
    flash.class.add('flash');
    window.setTimeout(() => document.body.appendChild(flash), 500);
    window.setTimeout(() => flash.remove(), 1500);
  },

  start(state) {
    this.previousState = state;
  },

  init() {
    this.name = 'ui';
  }
};

export { ui };
