import { h } from '../components/_.js'; // TODO

const LENGTHS_IN_PX = {
  cornerSideLength: 8,
  dotDiameter: 18,
  controlDiameter: 5.5,
};

const scale = (node, length) => {
  const canvasScaleFactor = node.doc.canvasWidth / node.canvas.viewBox.size.x;
  const scaledLength = (length / node.globalScaleFactor()) / canvasScaleFactor;
  return scaledLength;
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
        transform: node.transform && node.transform.toString(),
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
    const vTopLCorner = h('rect');
    const vBotLCorner = h('rect');
    const vTopRCorner = h('rect');
    const vBotRCorner = h('rect');
    const vCorners = [vTopLCorner, vBotLCorner, vTopRCorner, vBotRCorner];
    const length = scale(node, LENGTHS_IN_PX.cornerSideLength);

    for (let vCorner of vCorners) {
      Object.assign(vCorner.props, {
        'data-type': 'corner',
        'data-key': node.key,
        transform: node.transform && node.transform.toString(),
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
        transform: node.transform && node.transform.toString(),
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
      transform: node.transform && node.transform.toString(),
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
      transform: node.transform && node.transform.toString(),
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
        transform: node.transform && node.transform.toString(),
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
            transform: node.transform && node.transform.toString(),
          },
        });

        // will display the curve stroke:
        nodes.push({
          tag: 'path',
          children: [],
          props: {
            'data-type': 'curve-stroke',
            d: curves[i].toPathString(),
            transform: node.transform && node.transform.toString(),
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
      transform: node.transform && node.transform.toString(),
    });
  },

  control(pathNode, controlNode, diameter) {
    return h('circle', {
      'data-type': controlNode.type,
      'data-key': controlNode.key,
      transform: pathNode.transform && pathNode.transform.toString(),
      r: diameter / 2,
      cx: controlNode.vector.x,
      cy: controlNode.vector.y,
      class: controlNode.class.toString(),
    });
  },

  // tools

  tools(editor) {
    return h(
      'ul',
      { id: 'buttons' },
      h(
        'li',
        {},
        h(
          'button',
          {
            id: 'newDocButton',
            class: 'pure-button',
            'data-type': 'newDocButton',
          },
          'New'
        )
      ),
      this.docs(editor),
      h(
        'li',
        {},
        h(
          'button',
          {
            id: 'getPrevious',
            'data-type': 'getPrevious',
            class: 'pure-button',
          },
          'Undo'
        )
      ),
      h(
        'li',
        {},
        h(
          'button',
          {
            id: 'getNext',
            'data-type': 'getNext',
            class: 'pure-button',
          },
          'Redo'
        )
      ),
      h(
        'li',
        {},
        h(
          'button',
          {
            id: 'selectButton',
            'data-type': 'selectButton',
            class: 'pure-button',
          },
          'Select'
        )
      ),
      h(
        'li',
        {},
        h(
          'button',
          {
            id: 'penButton',
            'data-type': 'penButton',
            class: 'pure-button',
          },
          'Pen'
        )
      )
    );
  },

  docs(editor) {
    const vDocs = h('ul', {
      id: 'docs',
      class: 'pure-menu-children doc-list',
    });

    const docs = editor.docs;

    for (let identifier of docs.children) {
      vDocs.children.push(
        h(
          'li',
          {
            class: 'pure-menu-item',
          },
          h(
            'a',
            {
              class: 'pure-menu-link',
              'data-key': identifier._id,
              'data-type': 'doc-identifier',
            },
            identifier._id
          )
        )
      );
    }

    const container = h(
      'div',
      { class: 'pure-menu pure-menu-horizontal' },
      h(
        'ul',
        { class: 'pure-menu-list' },
        h(
          'li',
          {
            class:
              'pure-menu-item pure-menu-has-children pure-menu-allow-hover',
          },
          h(
            'a',
            { href: '#', id: 'menuLink1', class: 'pure-menu-link' },
            'Open'
          ),
          vDocs
        )
      )
    );

    return container;
  },
};

export { comps };
