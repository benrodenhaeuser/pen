const LENGTHS_IN_PX = {
  cornerSideLength: 8,
  dotDiameter:      18,
  controlDiameter:  6,
};

// TODO: this value is just a placeholder, need to get
// this value dynamically from the ui (see notes).
const DOCUMENT_SCALE = 1;

const h = (tag, props = {}, ...children) => {
  return {
    tag: tag,
    props: props,
    children: children || [],
  };
};

const vdomExporter = {
  renderApp(store) {
    const comps = this.comps(store);

    return h('main', { id: 'app' },
      comps.doc,
      comps.navigate,
      comps.inspect,
      h('div', { id: 'toolbar' },
        comps.buttons,
        comps.message
      ),
    );
  },

  comps(store) {
    return {
      buttons:  this.buttons(store),
      message:  this.message(store),
      navigate: this.navigate(store),
      doc:      this.doc(store),
      inspect:  this.inspect(store),
    };
  },

  docs(store) {
    const vDocs = h('ul', {
      id: 'docs',
      class: 'pure-menu-children doc-list',
    });

    const docs = store.docs;
    for (let identifier of docs.children) {
      vDocs.children.push(
        h('li', {
          'data-key': identifier.key,
          'data-type': 'doc-identifier',
        }, 'document name placeholder') // TODO
      );
    }

    const container = h('div', { class: 'pure-menu pure-menu-horizontal' },
      h('ul', { class: 'pure-menu-list' },
        h('li', { class: 'pure-menu-item pure-menu-has-children pure-menu-allow-hover'},
          h('a', { href: '#', id: 'menuLink1', class: 'pure-menu-link' }, 'Docs'),
          vDocs
        )
      )
    );

    return container;
  },

  buttons(store) {
    return h('ul', { id: 'buttons' },
      h('li', {},
        h('button', {
          id: 'newDocButton',
          class: 'pure-button',
          'data-type': 'newDocButton',
        }, 'New')
      ),
      this.docs(store),
      h('li', {},
        h('button', {
          id: 'pen',
          'data-type': 'pen',
          class: 'pure-button',
        }, 'Pen')
      ),
      h('li', {},
        h('button', {
          id: 'select',
          'data-type': 'select',
          class: 'pure-button',
        }, 'Select')
      )
    );
  },

  message(store) {
    return h('ul', {},
      h('li', {},
        h('button', {
          id: 'message',
        }, 'Message')
      )
    );
  },

  navigate(store) {
    return h('div', {
      id: 'navigator',
    }); // TODO
  },

  inspect(store) {
    return h('div', {
      id: 'inspector',
    }); // TODO
  },

  doc(store) {
    return h('div', {
      'data-type': 'doc',
      id: 'canvas',
      key: store.doc.key,
    }, this.renderScene(store));
  },

  renderScene(store) {
    return this.buildSceneNode(store.scene);
  },

  buildSceneNode(node, vParent = null) {
    const vNode = node.toVDOMNode();

    if (vParent) {
      const vWrapper = this.wrap(vNode, node);
      vParent.children.push(vWrapper);
    }

    for (let child of node.graphicsChildren) {
      this.buildSceneNode(child, vNode);
    }

    return vNode;
  },

  wrap(vNode, node) {
    const vWrapper = h('g', {
      'data-type': 'wrapper',
      'data-key':   node.key,
    });

    vWrapper.children.push(vNode);
    if (node.type === 'shape') { vWrapper.children.push(this.innerUI(node)); }
    vWrapper.children.push(this.outerUI(node));

    return vWrapper;
  },

  outerUI(node) {
    const vOuterUI = h('g', {
      'data-type': 'outerUI',
      'data-key':   node.key,
    });

    const vFrame   = this.frame(node);
    const vDots    = this.dots(node);    // for rotation
    const vCorners = this.corners(node); // for scaling

    vOuterUI.children.push(vFrame);

    for (let vDot of vDots) {
      vOuterUI.children.push(vDot);
    }

    for (let vCorner of vCorners) {
      vOuterUI.children.push(vCorner);
    }

    return vOuterUI;
  },

  corners(node) {
    const vTopLCorner = h('rect');
    const vBotLCorner = h('rect');
    const vTopRCorner = h('rect');
    const vBotRCorner = h('rect');
    const vCorners    = [vTopLCorner, vBotLCorner, vTopRCorner, vBotRCorner];
    const length      = this.scale(node, LENGTHS_IN_PX.cornerSideLength);

    for (let vCorner of vCorners) {
      Object.assign(vCorner.props, {
        'data-type': 'corner',
        'data-key':   node.key,
        transform:   node.transform.toString(),
        width:       length,
        height:      length,
      });
    }

    Object.assign(vTopLCorner.props, {
      x: node.bounds.x - length / 2,
      y: node.bounds.y - length / 2,
    });

    Object.assign(vBotLCorner.props, {
      x: node.bounds.x - length / 2,
      y: node.bounds.y + node.bounds.height - length / 2,
    });

    Object.assign(vTopRCorner.props, {
      x: node.bounds.x + node.bounds.width - length / 2,
      y: node.bounds.y - length / 2,
    });

    Object.assign(vBotRCorner.props, {
      x: node.bounds.x + node.bounds.width - length / 2,
      y: node.bounds.y + node.bounds.height - length / 2,
    });

    return vCorners;
  },

  dots(node) {
    const vTopLDot  = h('circle');
    const vBotLDot  = h('circle');
    const vTopRDot  = h('circle');
    const vBotRDot  = h('circle');
    const vDots     = [vTopLDot, vBotLDot, vTopRDot, vBotRDot];
    const diameter  = this.scale(node, LENGTHS_IN_PX.dotDiameter);
    const radius    = diameter / 2;

    for (let vDot of vDots) {
      Object.assign(vDot.props, {
        'data-type':      'dot',
        'data-key':        node.key,
        transform:        node.transform.toString(),
        r:                radius,
      });
    }

    Object.assign(vTopLDot.props, {
      cx: node.bounds.x - radius / 2,
      cy: node.bounds.y - radius / 2,
    });

    Object.assign(vBotLDot.props, {
      cx: node.bounds.x - radius / 2,
      cy: node.bounds.y + node.bounds.height + radius / 2,
    });

    Object.assign(vTopRDot.props, {
      cx: node.bounds.x + node.bounds.width + radius / 2,
      cy: node.bounds.y - radius / 2,
    });

    Object.assign(vBotRDot.props, {
      cx: node.bounds.x + node.bounds.width + radius / 2,
      cy: node.bounds.y + node.bounds.height + radius / 2,
    });

    return vDots;
  },

  frame(node) {
    return h('rect', {
      'data-type':  'frame',
      x:            node.bounds.x,
      y:            node.bounds.y,
      width:        node.bounds.width,
      height:       node.bounds.height,
      transform:    node.transform.toString(),
      'data-key':    node.key,
    });
  },

  innerUI(node) {
    const vInnerUI = h('g', {
      'data-type': 'innerUI',
      'data-key': node.key,
    });

    const vConnections = this.connections(node);

    for (let vConnection of vConnections) {
      vInnerUI.children.push(vConnection);
    }

    const vControls = this.controls(node);

    for (let vControl of vControls) {
      vInnerUI.children.push(vControl);
    }

    return vInnerUI;
  },

  connections(node) {
    const vConnections = [];

    for (let spline of node.children) {
      for (let segment of spline.children) {
        for (let handle of ['handleIn', 'handleOut']) {
          if (segment[handle]) {
            vConnections.push(this.connection(node, segment.anchor, segment[handle]));
          }
        }
      }
    }

    return vConnections;
  },

  connection(node, anchor, handle) {
    return h('line', {
      x1:        anchor.x,
      y1:        anchor.y,
      x2:        handle.x,
      y2:        handle.y,
      transform: node.transform.toString(),
    });
  },

  controls(node) {
    const vControls = [];
    const diameter  = this.scale(node, LENGTHS_IN_PX.controlDiameter);

    for (let spline of node.children) {
      for (let segment of spline.children) {
        for (let control of segment.children) {
          vControls.push(this.control(node, control, diameter));
        }
        // vControls.push(this.control(node, diameter, segment.anchor));
        //
        // if (segment.handleIn) {
        //   vControls.push(this.control(node, diameter, segment.handleIn));
        // }
        //
        // if (segment.handleOut) {
        //   vControls.push(this.control(node, diameter, segment.handleOut));
        // }
      }
    }

    return vControls;
  },

  control(node, controlNode, diameter) {
    return h('circle', {
      'data-type': 'control',
      'data-key' : controlNode.key,
      transform  : node.transform.toString(),
      r          : diameter / 2,
      cx         : controlNode.vector.x,
      cy         : controlNode.vector.y,
    });
  },

  // control(node, diameter, contr) {
  //   return h('circle', {
  //     'data-type': 'control',
  //     'data-key' : contr.key,
  //     transform  : node.transform.toString(),
  //     r          : diameter / 2,
  //     cx         : contr.x,
  //     cy         : contr.y,
  //   });
  // },

  scale(node, length) {
    return length / (node.globalScaleFactor() * DOCUMENT_SCALE);
  },
};

export { vdomExporter };
