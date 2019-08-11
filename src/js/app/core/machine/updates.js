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
    const target = state.canvas.findDescendantByKey(input.key);
    const hit = Vector.create(input.x, input.y);

    if (target) {
      const toFocus = target.findAncestorByClass('frontier');

      if (toFocus && toFocus.contains(hit)) {
        toFocus.focus();
      }
    }
  },

  select(state, input) {
    const node = state.canvas.findFocus();

    if (node) {
      node.select();
      updates.initTransform(state, input);
    } else {
      state.canvas.removeSelection();
    }
  },

  // TODO: try to simplify logic
  deepSelect(state, input) {
    const target = state.canvas.findDescendantByKey(input.key);

    if (!target) {
      return;
    }

    if (target.type === types.SHAPE && target.class.includes('frontier')) {
      // target is a shape frontier: place pen in shape
      target.placePen();
      state.canvas.removeFocus();
      state.label = 'penMode';
      // target is a frontier group: select canvas
    } else if (target.class.includes('frontier')) {
      state.canvas.select();
      state.canvas.removeFocus();
    } else {
      // target not at frontier: select closest ancestor at frontier
      const toSelect = target.findAncestor(node => {
        return node.parent && node.parent.class.includes('frontier');
      });

      if (toSelect) {
        toSelect.select();
        state.canvas.updateFrontier(); // TODO: why do we need to do this?
        state.canvas.removeFocus();
      }
    }
  },

  // TODO: cleanup and release are very similar
  release(state, input) {
    const current = state.canvas.findSelection() || state.canvas.findPen();

    if (current) {
      state.canvas.updateBounds(current);
    }

    state.aux = {};
  },

  cleanup(state, event) {
    const current = state.canvas.findPen();

    if (current) {
      state.canvas.updateBounds(current);
    }

    state.canvas.removeSelection();
    state.canvas.removePen();
    state.aux = {};
  },

  // TODO: weird name
  // triggered by escape key
  exitEdit(state, input) {
    if (state.label === 'penMode') {
      const target = state.canvas.findPen();
      updates.cleanup(state, input);
      target.select();
      state.label = 'selectMode';
    } else if (state.label === 'selectMode') {
      updates.cleanup(state, input);
    }
  },

  deleteNode(state, input) {
    let target = state.canvas.findSelection() || state.canvas.findPenTip();

    if (target) {
      if (target.type === types.ANCHOR) {
        target.parent.remove();
      } else if (
        [types.GROUP, types.SHAPE, types.HANDLEIN, types.HANDLEOUT].includes(
          target.type
        )
      ) {
        target.remove();
      }
    }
  },

  // TRANSFORMS

  initTransform(state, input) {
    const node = state.canvas.findSelection();
    state.aux.from = Vector.create(input.x, input.y);
    state.aux.center = node.bounds.center.transform(node.globalTransform());
    // ^ TODO: can we get rid of this? it looks like we can find the selection within the transform, and derive the center using the result.
  },

  shift(state, input) {
    const node = state.canvas.findSelection();

    if (!node) {
      return;
    }

    const to = Vector.create(input.x, input.y);
    const from = state.aux.from;
    const offset = to.minus(from);

    node.translate(offset);

    state.aux.from = to;
  },

  rotate(state, input) {
    const node = state.canvas.findSelection();

    if (!node) {
      return;
    }

    const to = Vector.create(input.x, input.y);
    const from = state.aux.from;
    const center = state.aux.center;
    const angle = center.angle(from, to);

    node.rotate(angle, center);

    state.aux.from = to;
  },

  scale(state, input) {
    const node = state.canvas.findSelection();

    if (!node) {
      return;
    }

    const to = Vector.create(input.x, input.y);
    const from = state.aux.from;
    const center = state.aux.center;
    const factor = to.minus(center).length() / from.minus(center).length();

    node.scale(factor, center);

    state.aux.from = to;
  },

  // PEN

  addSegment(state, input) {
    const pen = state.canvas.findPen() || state.canvas.appendShape().placePen();
    const spline = pen.lastChild || pen.appendSpline();
    const segment = spline.appendSegment();

    segment
      .appendAnchor(Vector.create(input.x, input.y).transformToLocal(pen))
      .placePenTip();
  },

  setHandles(state, input) {
    const pen = state.canvas.findPen();
    const segment = pen.lastChild.lastChild;
    const handleIn = segment.handleIn || segment.appendHandleIn();
    handleIn.vector = Vector.create(input.x, input.y).transformToLocal(pen);
    const handleOut = segment.handleOut || segment.appendHandleOut();
    handleOut.vector = handleIn.vector.rotate(Math.PI, segment.anchor.vector);
    handleIn.placePenTip();
  },

  initAdjustSegment(state, input) {
    const control = state.canvas.findDescendantByKey(input.key);
    const shape = control.parent.parent.parent;
    const from = Vector.create(input.x, input.y).transformToLocal(shape);
    control.placePenTip();

    state.aux.from = from;
  },

  adjustSegment(state, input) {
    const from = state.aux.from;

    const control = state.canvas.findPenTip();
    const segment = control.parent;
    const shape = segment.parent.parent;
    const to = Vector.create(input.x, input.y).transformToLocal(shape);
    const change = to.minus(from);
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
    const shape = spline.parent;
    const startIndex = spline.children.indexOf(startSegment);
    const endSegment = spline.children[startIndex + 1];
    const curve = Curve.createFromSegments(startSegment, endSegment);
    const bCurve = new Bezier(...curve.coords());

    const from = Vector.create(input.x, input.y).transformToLocal(shape);
    const pointOnCurve = bCurve.project({ x: from.x, y: from.y });
    shape.splitter = Vector.createFromObject(pointOnCurve);

    // TODO: do we really need all this stuff?
    // It looks like we can at least condense it!
    state.aux.spline = spline;
    state.aux.splitter = shape.splitter;
    state.aux.startSegment = startSegment;
    state.aux.endSegment = endSegment;
    state.aux.insertionIndex = startIndex + 1;
    state.aux.bCurve = bCurve;
    state.aux.curveTime = pointOnCurve.t;
    state.aux.from = from;
  },

  // TODO: refactor
  splitCurve(state, input) {
    // TODO: see preceding comment
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
    const anchor = segment.appendAnchor();
    const handleIn = segment.appendHandleIn();
    const handleOut = segment.appendHandleOut();

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
    const shape = segment.parent.parent;
    shape.splitter = Vector.create(-1000, -1000);
  },

  // MARKUP

  userSelectedMarkupNode(state, input) {
    updates.cleanup(state, input);

    const node = state.canvas.findDescendantByKey(input.key);

    if (node) {
      if (node.type === types.SHAPE || node.type === types.GROUP) {
        node.select();
        state.label = 'selectMode';
      } else if (node.type === types.SPLINE) {
        node.parent.placePen();
        state.canvas.removeFocus();
        state.label = 'penMode';
      } else if (
        [types.ANCHOR, types.HANDLEIN, types.HANDLEOUT].includes(node.type)
      ) {
        node.parent.parent.parent.placePen();
        node.placePenTip();
        state.label = 'penMode';
      }
    } else {
      console.log('no scene node selected');
    }
  },

  userChangedMarkup(state, input) {
    const canvas = state.markupToCanvas(input.value);

    if (canvas) {
      state.canvas.replaceWith(canvas);
    } else {
      console.log('cannot parse XML');
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
      state.docs.append(identNode);
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
