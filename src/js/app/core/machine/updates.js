import { Canvas, Shape, Group } from '../domain/_.js';
import { Spline, Segment, Anchor } from '../domain/_.js';
import { HandleIn, HandleOut } from '../domain/_.js';
import { Identifier, Doc } from '../domain/_.js';
import { Vector } from '../domain/_.js';
import { Matrix } from '../domain/_.js';
import { Rectangle } from '../domain/_.js';
import { Curve } from '../domain/_.js';
import { Bezier } from '/vendor/bezier/bezier.js';
import { types } from '../domain/_.js';

const updates = {
  // SELECTION

  focus(state, input) {
    state.canvas.removeFocus();
    const node = state.canvas.findDescendantByKey(input.key);

    if (!node) {
      return;
    }

    const hit = Vector.create(input.x, input.y);
    state.aux.target = node.findAncestorByClass('frontier');

    if (!state.aux.target || !state.aux.target.contains(hit)) {
      return;
    }

    state.aux.target.focus();
  },

  select(state, input) {
    state.aux.target = state.canvas.findFocus(); // TODO: could we avoid finding the focus?

    if (!state.aux.target) {
      state.canvas.removeSelection();
      return;
    }

    state.aux.target.select();
    updates.initTransform(state, input);
  },

  // TODO: try to simplify logic
  deepSelect(state, input) {
    const node = state.canvas.findDescendantByKey(input.key);

    if (!node) {
      return;
    }

    if (node.type === types.SHAPE && node.class.includes('frontier')) {
      // node is a shape frontier: place pen in shape
      state.aux.target = node;
      node.placePen();
      state.canvas.removeFocus();
      state.label = 'penMode';
      // node is a frontier group: select canvas
    } else if (node.class.includes('frontier')) {
      state.aux.target = canvas;
      canvas.select();
      canvas.removeFocus();
    } else {
      // node not at frontier: select closest ancestor at frontier
      state.aux.target = node.findAncestor(node => {
        return node.parent && node.parent.class.includes('frontier');
      });

      if (!state.aux.target) {
        return;
      }

      state.aux.target.select();
      state.canvas.updateFrontier(); // TODO: why do we need to do this?
      state.canvas.removeFocus();
    }
  },

  // release is the 'do' action for various mouseup events
  release(state, input) {
    if (!state.aux.target) {
      return;
    }

    state.canvas.updateBounds(state.aux.target);
    state.aux = {};
  },

  // cleanup is called internally from other updates
  // it is useful to call within some pen-related actions!
  cleanup(state, event) {
    const current = state.canvas.findPen();

    if (current) {
      state.canvas.updateBounds(current);
    }

    state.canvas.removeSelection();
    state.canvas.removePen();

    // we cannot reset aux here, because state.aux.target might still be needed.
  },

  // TODO: weird name
  // triggered by escape key
  exitEdit(state, input) {
    if (state.label === 'penMode') {
      state.aux.target = state.canvas.findPen();
      updates.cleanup(state, input);
      state.aux.target.select();
      state.label = 'selectMode';
    } else if (state.label === 'selectMode') {
      updates.cleanup(state, input);
    }
  },

  deleteNode(state, input) {
    let node = state.canvas.findSelection() || state.canvas.findPenTip();

    if (!node) {
      return;
    }

    if (node.type === types.ANCHOR) {
      node.parent.unmount();
    } else if (
      [types.GROUP, types.SHAPE, types.HANDLEIN, types.HANDLEOUT].includes(
        node.type
      )
    ) {
      node.unmount();
    }
  },

  // TRANSFORMS

  initTransform(state, input) {
    state.aux.from = Vector.create(input.x, input.y);
    state.aux.center = state.aux.target.bounds.center.transform(
      state.aux.target.globalTransform()
    );
  },

  shift(state, input) {
    if (!state.aux.target) {
      return;
    }

    const to = Vector.create(input.x, input.y);
    const from = state.aux.from;
    const offset = to.minus(from);

    state.aux.target.translate(offset);

    // bookkeeping
    state.aux.from = to;
  },

  rotate(state, input) {
    if (!state.aux.target) {
      return;
    }

    const to = Vector.create(input.x, input.y);
    const from = state.aux.from;
    const center = state.aux.center;
    const angle = center.angle(from, to);

    state.aux.target.rotate(angle, center);

    state.aux.from = to;
  },

  scale(state, input) {
    if (!state.aux.target) {
      return;
    }

    const to = Vector.create(input.x, input.y);
    const from = state.aux.from;
    const center = state.aux.center;
    const factor = to.minus(center).length() / from.minus(center).length();

    state.aux.target.scale(factor, center);

    state.aux.from = to;
  },

  // PEN

  addSegment(state, input) {
    state.aux.target =
      state.canvas.findPen() || state.canvas.mountShape().placePen();
    const spline = state.aux.target.lastChild || state.aux.target.mountSpline();
    const segment = spline.mountSegment();

    segment
      .mountAnchor(
        Vector.create(input.x, input.y).transformToLocal(state.aux.target)
      )
      .placePenTip();
  },

  setHandles(state, input) {
    state.aux.target = state.canvas.findPen();
    const segment = state.aux.target.lastChild.lastChild;
    const handleIn = segment.handleIn || segment.mountHandleIn();
    handleIn.vector = Vector.create(input.x, input.y).transformToLocal(
      state.aux.target
    );
    const handleOut = segment.handleOut || segment.mountHandleOut();
    handleOut.vector = handleIn.vector.rotate(Math.PI, segment.anchor.vector);
    handleIn.placePenTip();
  },

  initAdjustSegment(state, input) {
    const control = state.canvas.findDescendantByKey(input.key);
    state.aux.target = control.parent.parent.parent; // TODO: great
    state.aux.from = Vector.create(input.x, input.y).transformToLocal(
      state.aux.target
    );
    control.placePenTip();
  },

  adjustSegment(state, input) {
    const control = state.canvas.findPenTip();
    const segment = control.parent;
    state.aux.target = segment.parent.parent;
    const to = Vector.create(input.x, input.y).transformToLocal(
      state.aux.target
    );
    const change = to.minus(state.aux.from);
    control.vector = control.vector.add(change);

    switch (control.type) {
      case 'anchor':
        if (segment.handleIn) {
          segment.handleIn.vector = segment.handleIn.vector.add(change);
        }
        if (segment.handleOut) {
          segment.handleOut.vector = segment.handleOut.vector.add(change);
        }
        break;
      case 'handleIn':
        segment.handleOut.vector = segment.handleIn.vector.rotate(
          Math.PI,
          segment.anchor.vector
        );
        break;
      case 'handleOut':
        // TODO: bug, segment.handleIn could be undefined
        segment.handleIn.vector = segment.handleOut.vector.rotate(
          Math.PI,
          segment.anchor.vector
        );
        break;
    }

    state.aux.from = to;
  },

  projectInput(state, input) {
    const startSegment = state.canvas.findDescendantByKey(input.key);
    const spline = startSegment.parent;
    const target = spline.parent;
    const startIndex = spline.children.indexOf(startSegment);
    const endSegment = spline.children[startIndex + 1];
    const curve = Curve.createFromSegments(startSegment, endSegment);
    const bCurve = new Bezier(...curve.coords());

    const from = Vector.create(input.x, input.y).transformToLocal(target);
    const pointOnCurve = bCurve.project({ x: from.x, y: from.y });
    target.splitter = Vector.createFromObject(pointOnCurve);

    // BOOKKEEPING
    state.aux.spline = spline;
    state.aux.splitter = target.splitter;
    state.aux.startSegment = startSegment;
    state.aux.endSegment = endSegment;
    state.aux.insertionIndex = startIndex + 1;
    state.aux.bCurve = bCurve;
    state.aux.curveTime = pointOnCurve.t;
    state.aux.from = from;
    state.aux.target = target;
  },

  // TODO: refactor
  splitCurve(state, input) {
    const target = state.aux.target;
    const spline = state.aux.spline;
    const splitter = state.aux.splitter;
    const startSegment = state.aux.startSegment;
    const endSegment = state.aux.endSegment;
    const insertionIndex = state.aux.insertionIndex;
    const bCurve = state.aux.bCurve;
    const curveTime = state.aux.curveTime;

    const splitCurves = bCurve.split(curveTime);
    const left = splitCurves.left;
    const right = splitCurves.right;

    const segment = Segment.create();
    const anchor = segment.mountAnchor();
    const handleIn = segment.mountHandleIn();
    const handleOut = segment.mountHandleOut();

    spline.insertChild(segment, insertionIndex);

    anchor.vector = splitter;
    handleIn.vector = Vector.createFromObject(left.points[2]); // ?
    handleOut.vector = Vector.createFromObject(right.points[1]); // ?
    startSegment.handleOut.vector = Vector.createFromObject(left.points[1]); // ?
    endSegment.handleIn.vector = Vector.createFromObject(right.points[2]); // ?

    anchor.placePenTip();
    updates.hideSplitter(state, input);
    updates.adjustSegment(state, input);
  },

  hideSplitter(state, input) {
    const segment = state.canvas.findDescendantByKey(input.key);
    state.aux.target = segment.parent.parent;
    state.aux.target.splitter = Vector.create(-1000, -1000);
  },

  // MARKUP

  userSelectedMarkupNode(state, input) {
    updates.cleanup(state, input);

    const node = state.canvas.findDescendantByKey(input.key);

    if (!node) {
      return;
    }

    if (node.type === types.SHAPE || node.type === types.GROUP) {
      state.aux.target = node;
      node.select();
      state.label = 'selectMode';
    } else if (node.type === types.SPLINE) {
      state.aux.target = node.parent;
      state.aux.target.placePen();
      state.canvas.removeFocus();
      state.label = 'penMode';
    } else if (
      [types.ANCHOR, types.HANDLEIN, types.HANDLEOUT].includes(node.type)
    ) {
      state.aux.target = node.parent.parent.parent; // TODO: great
      state.aux.target.placePen();
      node.placePenTip();
      state.label = 'penMode';
    }
  },

  userChangedMarkup(state, input) {
    const canvas = state.markupToCanvas(input.value);

    if (canvas) {
      state.canvas.replaceWith(canvas);
    }
  },

  // DOCUMENT MANAGEMENT

  createDoc(state, input) {
    state.doc.replaceWith(state.buildDoc());
  },

  updateDocList(state, input) {
    state.docs.children = [];

    for (let id of input.data.docIDs) {
      const identNode = Identifier.create();
      identNode._id = id;
      state.docs.mount(identNode);
    }
  },

  getPrevious(state, input) {
    window.history.back(); // TODO: shouldn't we do this inside of hist?
  },

  getNext(state, input) {
    window.history.forward(); // TODO: shouldn't we do this inside of hist?
  },

  switchDocument(state, input) {
    state.doc.replaceWith(state.objectToDoc(input.data.doc));
    updates.cleanup(state, input);
  },

  // MESSAGES

  setSavedMessage(state, input) {
    state.message.text = 'Saved';
  },

  wipeMessage(state, input) {
    state.message.text = '';
  },
};

export { updates };
