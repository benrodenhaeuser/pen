import { h } from '../components/_.js'; // TODO

const LENGTHS_IN_PX = {
  cornerSideLength: 8,
  dotDiameter: 18,
  controlDiameter: 5.5,
};

const scale = (node, length) => {
  const canvasScaleFactor = node.doc.canvasWidth / node.canvas.viewBox.size.x;
  const scaledLength = length / node.globalScaleFactor() / canvasScaleFactor;
  return scaledLength;
};

const transform = node => {
  return node.transform && node.transform.toString() || 'matrix(1, 0, 0, 1, 0, 0)';
};

const comps = {
  canvas(node) {
    return {
      tag: 'svg',
      children: [],
      props: {
        'data-key': node.key,
        'data-type': node.type,
        viewBox: node.viewBox.toString(),
        xmlns: node.xmlns,
        class: node.class.toString(),
      },
    };
  },

  group(node) {
    return {
      tag: 'g',
      children: [],
      props: {
        'data-key': node.key,
        'data-type': node.type,
        transform: transform(node),
        class: node.class.toString(),
      },
    };
  },

  wrapper(node) {
    return h('g', {
      'data-type': `${node.type}-wrapper`,
      'data-key': node.key,
    });
  },

  outerUI(node) {
    const vOuterUI = h('g', {
      'data-type': 'outerUI',
      'data-key': node.key,
    });

    const vFrame = this.frame(node);
    const vDots = this.dots(node); // for rotation UI
    const vCorners = this.corners(node); // for scaling UI

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
    const vTopLCorner = h('rect', { 'data-type': 'nw-corner' });
    const vBotLCorner = h('rect', { 'data-type': 'sw-corner' });
    const vTopRCorner = h('rect', { 'data-type': 'ne-corner' });
    const vBotRCorner = h('rect', { 'data-type': 'se-corner' });
    const vCorners = [vTopLCorner, vBotLCorner, vTopRCorner, vBotRCorner];
    const length = scale(node, LENGTHS_IN_PX.cornerSideLength);

    for (let vCorner of vCorners) {
      Object.assign(vCorner.props, {
        'data-key': node.key,
        transform: transform(node),
        width: length,
        height: length,
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
    const vTopLDot = h('circle');
    const vBotLDot = h('circle');
    const vTopRDot = h('circle');
    const vBotRDot = h('circle');
    const vDots = [vTopLDot, vBotLDot, vTopRDot, vBotRDot];
    const diameter = scale(node, LENGTHS_IN_PX.dotDiameter);
    const radius = diameter / 2;

    for (let vDot of vDots) {
      Object.assign(vDot.props, {
        'data-type': 'dot',
        'data-key': node.key,
        transform: transform(node),
        r: radius,
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
      'data-type': 'frame',
      x: node.bounds.x,
      y: node.bounds.y,
      width: node.bounds.width,
      height: node.bounds.height,
      transform: transform(node),
      'data-key': node.key,
    });
  },

  curves(node) {
    const diameter = scale(node, LENGTHS_IN_PX.controlDiameter);
    const radius = diameter / 2;

    const vParts = this.curveParts(node);
    const splitter = h('circle', {
      'data-type': 'splitter',
      r: radius,
      cx: node.splitter.x,
      cy: node.splitter.y,
      transform: transform(node),
    });

    return h(
      'g',
      {
        'data-type': 'shape',
        'data-key': node.key,
        class: node.class.toString(),
      },
      this.shapeFill(node),
      ...vParts,
      splitter
    );
  },

  // will display the shape fill
  shapeFill(node) {
    const theShape = {
      tag: 'path',
      children: [],
      props: {
        'data-type': node.type,
        'data-key': node.key,
        d: node.toPathString(),
        transform: transform(node),
        fill: node.fill,
      },
    };

    return theShape;
  },

  curveParts(node) {
    const nodes = [];
    const splines = node.children;

    for (let spline of splines) {
      const segments = spline.children;
      const curves = spline.curves();

      for (let i = 0; i < curves.length; i += 1) {
        // the "hit target" for the curve:
        nodes.push({
          tag: 'path',
          children: [],
          props: {
            'data-type': 'curve',
            'data-key': segments[i].key,
            d: curves[i].toPathString(),
            transform: transform(node),
          },
        });

        // will display the curve stroke:
        nodes.push({
          tag: 'path',
          children: [],
          props: {
            'data-type': 'curve-stroke',
            d: curves[i].toPathString(),
            transform: transform(node),
            stroke: node.stroke,
          },
        });
      }
    }

    return nodes;
  },

  segments(node) {
    const spline = node.children[0];

    const vSegments = h('g', {
      'data-type': 'segments',
      'data-key': node.key,
    });

    for (let segment of spline.children) {
      vSegments.children.push(this.segmentUI(node, segment));
    }

    return vSegments;
  },

  segmentUI(node, segment) {
    const vSegmentUI = h('g', {
      'data-type': 'segment',
      class: segment.class.toString(),
      'data-key': node.key,
    });

    const diameter = scale(node, LENGTHS_IN_PX.controlDiameter);

    for (let handle of ['handleIn', 'handleOut']) {
      if (segment[handle]) {
        vSegmentUI.children.push(
          this.connection(node, segment.anchor, segment[handle])
        );
      }
    }

    for (let controlNode of segment.children) {
      vSegmentUI.children.push(this.control(node, controlNode, diameter));
    }

    return vSegmentUI;
  },

  connection(node, anchor, handle) {
    return h('line', {
      'data-type': 'connection',
      x1: anchor.vector.x,
      y1: anchor.vector.y,
      x2: handle.vector.x,
      y2: handle.vector.y,
      transform: transform(node),
    });
  },

  control(pathNode, controlNode, diameter) {
    return h('circle', {
      'data-type': controlNode.type,
      'data-key': controlNode.key,
      transform: transform(pathNode),
      r: diameter / 2,
      cx: controlNode.vector.x,
      cy: controlNode.vector.y,
      class: controlNode.class.toString(),
    });
  },

  // tools

  tools(toolsNode) {
    const buttons = h('ul', { id: 'buttons' });

    for (let toolNode of toolsNode.children) {
      buttons.children.push(this.button(toolNode));
    }

    return buttons;
  },

  button(toolNode) {
    return h(
      'li',
      {
        class: toolNode.class.toString(),
      },
      h(
        'a',
        {},
        h('object', {
          type: 'image/svg+xml',
          data: toolNode.iconPath,
        }),
        h('p', {}, toolNode.name),
        h('div', {
          id: toolNode.toolType,
          'data-type': toolNode.toolType,
          class: 'buttonTarget',
        })
      )
    );
  },

  menu(docs) {
    const items = h('ul', {
      class: docs.class.toString(),
    });

    for (let identifier of docs.children) {
      items.children.push(
        h(
          'li',
          {
            'data-key': identifier._id,
            'data-type': 'doc-identifier',
            class: identifier.class.toString(),
          },
          identifier._id
        )
      );
    }

    const header = h('h1', {}, 'Documents');

    return h('div', {}, header, items);
  },
};

export { comps };
