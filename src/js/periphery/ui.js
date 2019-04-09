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
    // TODO: this belongs in an init method:
    // plus we will not have those before the first render
    this.canvasNode  = document.querySelector('#canvas');
    this.toolbarNode = document.querySelector('#toolbar');

    const eventTypes = [
      'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick'
    ];

    const shouldBeIgnored = (event) => {
      return [
        'mousedown', 'mouseup', 'click'
      ].includes(event.type) && event.detail > 1;
    };

    for (let eventType of eventTypes) {
      document.addEventListener(eventType, (event) => {
        event.preventDefault();

        if (shouldBeIgnored(event)) {
          return;
        }

        compute({
          type:   event.type,
          target: event.target.dataset.type,
          x:      coordinates(event).x,
          y:      coordinates(event).y,
          key:    event.target.dataset.key,
        });
      });
    }
  },

  sync(state) {
    if (state.label === 'start') {
      this.mount(this.render(state.vDOM), document.body);
      this.previousState = state;
      return;
    }

    this.mount(this.render(state.vDOM), document.body);

    // this is what we want to happen:

    // $scene = document.querySelector('svg');
    // const patch = diff(previousState.scene, state.scene);
    // $scene = patch($scene);
    // previousState = state;

    // this is old stuff:

    // const changes = (state1, state2) => {
    //   const keys = Object.keys(state1);
    //   return keys.filter(key => !equalData(state1[key], state2[key]));
    // };
    //
    // const equalData = (obj1, obj2) => {
    //   return JSON.stringify(obj1) === JSON.stringify(obj2);
    // };
    //
    // if (state.label === 'start') {
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

  mount($node, $mountPoint) {
    $mountPoint.innerHTML = '';
    $mountPoint.appendChild($node);
  },

  // TODO: possible to merge this method and the next one?
  render(vNode) {
    if (vNode.tag === 'svg') {
      return this.renderSVG(vNode);
    } else {
      const $node = document.createElement(vNode.tag);

      for (let [key, value] of Object.entries(vNode.props)) {
        $node.setAttributeNS(null, key, value);
      }

      for (let vChild of vNode.children) {
        if (typeof vChild === 'string') {
          $node.textContent = vChild; // TODO: do svg nodes have this attribute?
        } else {
          $node.appendChild(this.render(vChild));
        }
      }

      return $node;
    }

  },

  renderSVG(vNode) {
    const svgns = 'http://www.w3.org/2000/svg';
    const xmlns = 'http://www.w3.org/2000/xmlns/';

    const $node = document.createElementNS(svgns, vNode.tag);

    for (let [key, value] of Object.entries(vNode.props)) {
      if (key === 'xmlns') {
        $node.setAttributeNS(xmlns, key, value);
      } else {
        $node.setAttributeNS(null, key, value);
      }
    }

    for (let vChild of vNode.children) {
      if (typeof vChild === 'string') {
        vNode.textContent = vChild; // TODO: does not work for svg I think
      } else {
        $node.appendChild(this.renderSVG(vChild));
      }
    }

    return $node;
  },

  // reconcile

  // render: {
  //   scene(state) {
  //     ui.renderScene(state);
  //     // ui.renderInspector(state); // TODO ==> later
  //   },
  //
  //   docs(state) {
  //     ui.renderDocList(state);
  //   },
  //
  //   currentInput(state) {
  //     if (state.currentInput === 'docSaved') {
  //       ui.renderFlash('Saved');
  //     }
  //
  //     if (state.currentInput === 'edit') {
  //       ui.renderScene(state);
  //     }
  //   },
  //
  //   clock(state) {
  //     if (state.currentInput === 'animate') {
  //       ui.renderAnimations(state);
  //     }
  //   },
  // },
  //
  // // methods performing sync actions in the ui
  // renderScene(state) {
  //   // sceneRenderer.render(state.scene, ui.canvasNode);
  //   mount(render(state.scene), ui.canvasNode);
  // },
  //
  // renderDocList(state) {
  //   const docList = document.querySelector('.doc-list');
  //   docList.innerHTML = '';
  //
  //   for (let docID of state.docs.ids) {
  //     const node = nodeFactory.makeDocListNode(docID);
  //     docList.appendChild(node);
  //     if (docID === state.docs.selectedID) {
  //       node.classList.add('selected');
  //     }
  //   }
  // },
  //
  // renderInspector(state) {
  //   const findSelected = (doc) => {
  //     for (let shape of doc.shapes) {
  //       for (let frame of shape.frames) {
  //         if (frame._id === doc.selected.frameID) {
  //           return frame;
  //         }
  //       }
  //     }
  //   };
  //
  //   const inspector = document.querySelector('#inspector');
  //   inspector.innerHTML = '';
  //
  //   const node = nodeFactory.makeInspectorNode(findSelected(state.doc));
  //   inspector.appendChild(node);
  // },
  //
  // renderFlash(message) {
  //   const flash = document.createElement('p');
  //   flash.innerHTML = message;
  //   flash.class.add('flash');
  //   window.setTimeout(() => document.body.appendChild(flash), 500);
  //   window.setTimeout(() => flash.remove(), 1500);
  // },

  // not sure why we need this:
  start(state) {
    this.previousState = state;
  },

  init() {
    this.name = 'ui';
  }
};

export { ui };
