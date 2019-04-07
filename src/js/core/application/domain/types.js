import { Node      } from './node.js';
import { Rectangle } from './rectangle.js';
import { Curve     } from './curve.js';

const Root      = Object.create(Node);
const Group     = Object.create(Node);
const Shape     = Object.create(Node);
const Spline    = Object.create(Node);
const Segment   = Object.create(Node);
const Anchor    = Object.create(Node);
const HandleIn  = Object.create(Node);
const HandleOut = Object.create(Node);

Root.type      = 'root';
Group.type     = 'group';
Shape.type     = 'shape';
Spline.type    = 'spline';
Segment.type   = 'segment';
Anchor.type    = 'anchor';
HandleIn.type  = 'handleIn';
HandleOut.type = 'handleOut';

Root.toVDOMNode = function() {
  return {
    tag:      'svg',
    children: [],
    props: {
      'data-id':   this._id,
      'data-type': 'content',
      'viewBox':    this.viewBox.toString(),
      xmlns:       'http://www.w3.org/2000/svg',
    },
  };
};

Group.toVDOMNode = function() {
  return {
    tag:      'g',
    children: [],
    props: {
      'data-id':   this._id,
      'data-type': 'content',
      transform:   this.transform.toString(),
      class:       this.class.toString(),
    },
  };
};

Shape.toVDOMNode = function() {
  return {
    tag:      'path',
    children: [],
    props: {
      'data-id':   this._id,
      'data-type': 'content',
      d:           this.pathString(),
      transform:   this.transform.toString(),
      class:       this.class.toString(),
    },
  };
};

Shape.pathString = function() {
  let d = '';

  for (let spline of this.children) {
    const segment = spline.children[0];
    d += `M ${segment.anchor().x} ${segment.anchor().y}`;

    for (let i = 1; i < spline.children.length; i += 1) {
      const currSeg = spline.children[i];
      const prevSeg = spline.children[i - 1];

      if (prevSeg.handleOut() && currSeg.handleIn()) {
        d += ' C';
      } else if (currSeg.handleIn() || prevSeg.handleOut()) {
        d += ' Q';
      } else {
        d += ' L';
      }

      if (prevSeg.handleOut()) {
        d += ` ${prevSeg.handleOut().x} ${prevSeg.handleOut().y}`;
      }

      if (currSeg.handleIn()) {
        d += ` ${currSeg.handleIn().x} ${currSeg.handleIn().y}`;
      }

      d += ` ${currSeg.anchor().x} ${currSeg.anchor().y}`;
    }
  }

  return d;
};

Spline.curves = function() {
  const theCurves = [];

  // the children of a Spline node are Segment nodes
  // from n segments, we obtain n - 1 curves
  for (let i = 0; i + 1 < this.children.length; i += 1) {
    const start = this.children[i];
    const end = this.children[i + 1];

    theCurves.push(Curve.createFromSegments(start, end));
  }

  return theCurves;
};

Spline.memoizeBounds = function() {
  const curves = this.curves();
  let bounds = curves[0] && curves[0].bounds; // computed by Bezier plugin

  for (let i = 1; i < curves.length; i += 1) {
    const curveBounds = curves[i].bounds;
    bounds = bounds.getBoundingRect(curveBounds);
  }

  this.payload.bounds = bounds;
  return bounds;
};

Segment.anchor = function() {
  const theAnchor = this.children.find(child => child.type === 'anchor');

  if (theAnchor) {
    return theAnchor.payload.vector;
  }

  return null;
};

Segment.handleIn = function() {
  const theHandle = this.children.find(child => child.type === 'handleIn');

  if (theHandle) {
    return theHandle.payload.vector;
  }

  return null;
};

Segment.handleOut = function() {
  const theHandle = this.children.find(child => child.type === 'handleOut');

  if (theHandle) {
    return theHandle.payload.vector;
  }

  return null;
};

export {
  Root,
  Group,
  Shape,
  Spline,
  Segment,
  Anchor,
  HandleIn,
  HandleOut
};
