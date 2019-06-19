const LENGTHS_IN_PX = {
  cornerSideLength: 8,
  dotDiameter:      18,
  controlDiameter:  6,
};

const h = (tag, props = {}, ...children) => {
  return {
    tag: tag,
    props: props,
    children: children || [],
  };
};

// TODO: for development purposes only
const markup = `<g><rect x="260" y="250" width="100" height="100"></rect><g><rect x="400" y="260" width="100" height="100"></rect><rect x="550" y="260" width="100" height="100"></rect></g></g><rect x="600" y="600" width="100" height="100"></rect>`;

const beautify = function(xml) {
        var reg = /(>)\s*(<)(\/*)/g; // updated Mar 30, 2015
        var wsexp = / *(.*) +\n/g;
        var contexp = /(<.+>)(.+\n)/g;
        xml = xml.replace(reg, '$1\n$2$3').replace(wsexp, '$1\n').replace(contexp, '$1\n$2');
        var pad = 0;
        var formatted = '';
        var lines = xml.split('\n');
        var indent = 0;
        var lastType = 'other';
        // 4 types of tags - single, closing, opening, other (text, doctype, comment) - 4*4 = 16 transitions
        var transitions = {
            'single->single': 0,
            'single->closing': -1,
            'single->opening': 0,
            'single->other': 0,
            'closing->single': 0,
            'closing->closing': -1,
            'closing->opening': 0,
            'closing->other': 0,
            'opening->single': 1,
            'opening->closing': 0,
            'opening->opening': 1,
            'opening->other': 1,
            'other->single': 0,
            'other->closing': -1,
            'other->opening': 0,
            'other->other': 0
        };

        for (var i = 0; i < lines.length; i++) {
            var ln = lines[i];

            // Luca Viggiani 2017-07-03: handle optional <?xml ... ?> declaration
            if (ln.match(/\s*<\?xml/)) {
                formatted += ln + "\n";
                continue;
            }
            // ---

            var single = Boolean(ln.match(/<.+\/>/)); // is this line a single tag? ex. <br />
            var closing = Boolean(ln.match(/<\/.+>/)); // is this a closing tag? ex. </a>
            var opening = Boolean(ln.match(/<[^!].*>/)); // is this even a tag (that's not <!something>)
            var type = single ? 'single' : closing ? 'closing' : opening ? 'opening' : 'other';
            var fromTo = lastType + '->' + type;
            lastType = type;
            var padding = '';

            indent += transitions[fromTo];
            for (var j = 0; j < indent; j++) {
                padding += '  ';
            }
            if (fromTo == 'opening->closing')
                formatted = formatted.substr(0, formatted.length - 1) + ln + '\n'; // substr removes line break (\n) from prev loop
            else
                formatted += padding + ln + '\n';
        }

        return formatted;
    };

const vdomExporter = {
  renderApp(store) {
    const comps = this.comps(store);

    return h('main', { id: 'app' },
      comps.canvas,
      comps.editor,
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
      editor:   this.editor(store),
      canvas:   this.canvas(store),
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
          class: 'pure-menu-item',
        },
          h('a', {
            class: 'pure-menu-link',
            'data-key': identifier.payload._id,
            'data-type': 'doc-identifier',
          }, identifier.payload._id)
          //  TODO: This is where we need to put the *name* of the document
      ));
    }

    const container = h('div', { class: 'pure-menu pure-menu-horizontal' },
      h('ul', { class: 'pure-menu-list' },
        h('li', { class: 'pure-menu-item pure-menu-has-children pure-menu-allow-hover'},
          h('a', { href: '#', id: 'menuLink1', class: 'pure-menu-link' }, 'Open'),
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
          id: 'undo',
          'data-type': 'undo',
          class: 'pure-button',
        }, 'Undo')
      ),
      h('li', {},
        h('button', {
          id: 'redo',
          'data-type': 'redo',
          class: 'pure-button',
        }, 'Redo')
      ),
      h('li', {},
        h('button', {
          id: 'select',
          'data-type': 'select',
          class: 'pure-button',
        }, 'Select')
      ),
      h('li', {},
        h('button', {
          id: 'pen',
          'data-type': 'pen',
          class: 'pure-button',
        }, 'Pen')
      )
    );
  },

  message(store) {
    return h('ul', { class: 'message' },
      h('li', {},
        h('button', {
          id: 'message',
        }, store.message.payload.text)
      )
    );
  },

  editor(store) {
    return h('div', {
      id: 'editor',
    }, h('form', {
        id: 'form',
        'data-type': 'form',
      }, h('textarea', {
          form: 'form',
          spellcheck: false,
        }, beautify(markup)
        )
      )
    );
  },

  canvas(store) {
    return h('div', {
      'data-type': 'doc',
      id: 'canvas',
      'data-key': store.doc.key,
    }, this.renderScene(store));
  },

  renderScene(store) {
    // case: nothing to render
    if (store.scene === null) {
      return '';
    }

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
          if (segment[handle] !== null) {
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

  controls(pathNode) {
    const vControls = [];
    const diameter  = this.scale(pathNode, LENGTHS_IN_PX.controlDiameter);

    for (let spline of pathNode.children) {
      for (let segment of spline.children) {
        for (let control of segment.children) {
          vControls.push(this.control(pathNode, control, diameter));
        }
      }
    }

    return vControls;
  },

  control(pathNode, controlNode, diameter) {
    return h('circle', {
      'data-type': 'control',
      'data-key' : controlNode.key,
      transform  : pathNode.transform.toString(),
      r          : diameter / 2,
      cx         : controlNode.vector.x,
      cy         : controlNode.vector.y,
    });
  },

  // TODO: in general, we would need to take into account here
  // the ratio between the svg viewport width and the canvas width
  scale(node, length) {
    return length / node.globalScaleFactor();
  },
};

export { vdomExporter };
