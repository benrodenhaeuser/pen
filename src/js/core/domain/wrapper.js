const LENGTHS_IN_PX = {
  cornerSideLength: 8,
  dotDiameter:      18,
  controlDiameter:  6,
};

// TODO: this value is just a placeholder, need to get
// this value dynamically from the ui (see notes).
const DOCUMENT_SCALE = 0.5;

const h = (tag, props = {}, ...children) => {
  return {
    tag: tag,
    props: props,
    children: children || [],
  };
};

const scale = (node, length) => {
  return length / (node.globalScaleFactor() * DOCUMENT_SCALE);
};

const wrapper = {
  wrap(vNode, node) {
    const vWrapper = h('g', {
      'data-type': 'wrapper',
      'data-id':   node._id,
    });

    vWrapper.children.push(vNode);
    if (node.path) { vWrapper.children.push(this.innerUI(node)); }
    vWrapper.children.push(this.outerUI(node));

    return vWrapper;
  },

  outerUI(node) {
    const vOuterUI = h('g', {
      'data-type': 'outerUI',
      'data-id':   node._id,
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
    const length      = scale(node, LENGTHS_IN_PX.cornerSideLength);

    for (let vCorner of vCorners) {
      Object.assign(vCorner.props, {
        'data-type': 'corner',
        'data-id':   node._id,
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
    const diameter  = scale(node, LENGTHS_IN_PX.dotDiameter);
    const radius    = diameter / 2;

    for (let vDot of vDots) {
      Object.assign(vDot.props, {
        'data-type':      'dot',
        'data-id':        node._id,
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
      'data-id':    node._id,
    });
  },

  innerUI(node) {
    const vInnerUI = h('g', {
      'data-type': 'innerUI',
      'data-id': node._id,
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

    for (let spline of node.path.splines) {
      for (let segment of spline.segments) {
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
    const diameter  = scale(node, LENGTHS_IN_PX.controlDiameter);

    for (let spline of node.path.splines) {
      for (let segment of spline.segments) {
        vControls.push(this.control(node, diameter, segment.anchor));

        if (segment.handleIn) {
          vControls.push(this.control(node, diameter, segment.handleIn));
        }

        if (segment.handleOut) {
          vControls.push(this.control(node, diameter, segment.handleOut));
        }
      }
    }

    return vControls;
  },

  control(node, diameter, contr) {
    return h('circle', {
      'data-type': 'control',
      'data-id'  : contr._id,
      transform  : node.transform.toString(),
      r          : diameter / 2,
      cx         : contr.x,
      cy         : contr.y,
    });
  },
};

export { wrapper };
