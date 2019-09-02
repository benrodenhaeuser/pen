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
  after(state, input) {
    if (input.type !== 'mousemove') {
      state.tools.setActiveStatus({
        mode: state.mode,
        layout: state.layout
      });

      state.docs.setActiveStatus({
        _id: state.doc._id
      });
    }

    state.canvas.setCursor({
      mode: state.mode,
      label: state.label,
      input: input,
      update: state.update,
    });
  },

  refresh(state, input) {
    if (input.width > 0) {
      state.doc.canvasWidth = input.width;
    }

    for (let leaf of state.canvas.leaves) {
      leaf.invalidateCache();
    }
  },

  focus(state, input) {
    state.canvas.removeFocus(); // remove focus from other nodes
    const node = state.canvas.findDescendantByKey(input.key);

    if (!node) {
      return;
    }

    const hit = Vector.create(input.x, input.y);
    state.target = node.findAncestorByClass('frontier');

    if (state.target && state.target.contains(hit)) {
      state.target.focus();
    }
  },

  select(state, input) {
    // user can only select what she has focused first:
    state.target = state.canvas.findFocus();

    if (!state.target) {
      state.canvas.removeSelection();
      return;
    }

    state.target.select();

    state.from = Vector.create(input.x, input.y);
    state.temp.center = state.target.bounds.center.transform(
      state.target.globalTransform()
    ); // ^ TODO: temp.center should perhaps be `center` with defined property?
  },

  deepSelect(state, input) {
    const node = state.canvas.findDescendantByKey(input.key);
    const target = node && node.findAncestorByClass('frontier');

    if (!target) {
      return;
    }

    if (target.type === types.SHAPE) {
      target.placePen();
      state.mode = 'pen';
      state.label = 'idle';
      state.canvas.removeFocus();
    } else if (target.type === types.GROUP) {
      if (target === node) {
        state.canvas.select();
        state.canvas.removeFocus();
      } else {
        target.children
          .find(aNode => aNode.descendants.includes(node))
          .select();
        state.canvas.updateFrontier();
        state.canvas.removeFocus();
      }
    }
  },

  // release is the 'do' action for various mouseup events
  release(state, input) {
    if (!state.target) {
      return;
    }

    state.canvas.updateBounds(state.target);
    state.temp = {};
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

    // we cannot reset temp here, because state.target might still be needed.
  },

  // TODO: weird name
  // triggered by escape key
  exitEdit(state, input) {
    if (state.mode === 'pen' && state.label === 'idle') {
      state.target = state.canvas.findPen();
      updates.cleanup(state, input);
      state.target.select();
      state.mode = 'select';
      state.label = 'idle';
    } else if (state.mode === 'select' && state.label === 'idle') {
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
    state.target = state.canvas.findDescendantByKey(input.key);

    // input => dot or corner

    state.from = Vector.create(input.x, input.y);
    state.temp.center = state.target.bounds.center.transform(
      state.target.globalTransform()
    ); // ^ TODO: temp.center should perhaps be `center` with defined property?
  },

  shift(state, input) {
    if (!state.target) {
      return;
    }

    const to = Vector.create(input.x, input.y);
    const from = state.from;
    const offset = to.minus(from);

    state.target.translate(offset);

    // bookkeeping
    state.from = to;
  },

  rotate(state, input) {
    if (!state.target) {
      return;
    }

    const to = Vector.create(input.x, input.y);
    const from = state.from;
    const center = state.temp.center;
    const angle = center.angle(from, to);

    state.target.rotate(angle, center);

    state.from = to;
  },

  scale(state, input) {
    if (!state.target) {
      return;
    }

    const to = Vector.create(input.x, input.y);
    const from = state.from;
    const center = state.temp.center;
    const factor = to.minus(center).length() / from.minus(center).length();

    state.target.scale(factor, center);

    state.from = to;
  },

  addSegment(state, input) {
    state.target =
      state.canvas.findPen() || state.canvas.mountShape().placePen();

    const spline = state.target.lastChild || state.target.mountSpline();

    if (spline.isClosed()) {
      state.mode = 'pen'; // TODO: hack(ish)
      state.label = 'idle';
      return;
    }

    spline
      .mountSegment()
      .mountAnchor(
        Vector.create(input.x, input.y).transformToLocal(state.target)
      )
      .placePenTip();
  },

  setHandles(state, input) {
    state.target = state.canvas.findPen();
    const segment = state.target.lastChild.lastChild;
    const handleIn = segment.handleIn || segment.mountHandleIn();
    handleIn.vector = Vector.create(input.x, input.y).transformToLocal(
      state.target
    );
    const handleOut = segment.handleOut || segment.mountHandleOut();
    handleOut.vector = handleIn.vector.rotate(Math.PI, segment.anchor.vector);
    handleIn.placePenTip();
  },

  initAdjustSegment(state, input) {
    const control = state.canvas.findDescendantByKey(input.key);
    state.target = control.parent.parent.parent; // TODO: great
    state.from = Vector.create(input.x, input.y).transformToLocal(state.target);
    control.placePenTip();
  },

  toggleClosedStatus(state, input) {
    console.log('toggleClosedStatus update');
    const control = state.canvas.findPenTip();
    const spline = control.parent.parent;

    spline.isClosed() ? spline.open() : spline.close();
  },

  adjustSegment(state, input) {
    const control = state.canvas.findPenTip();
    const segment = control.parent;
    state.target = segment.parent.parent;
    const to = Vector.create(input.x, input.y).transformToLocal(state.target);
    const change = to.minus(state.from);
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
        mic;
        break;
    }

    state.from = to;
  },

  projectInput(state, input) {
    // console.log('projectInput');
    const startSegment = state.canvas.findDescendantByKey(input.key);
    const spline = startSegment.parent;
    const target = spline.parent;
    const startIndex = spline.children.indexOf(startSegment);
    const endSegment = spline.children[startIndex + 1] || spline.children[0];
    // ^ second disjunct: wrap around for curve linking last to first segment in spline
    const curve = Curve.createFromSegments(startSegment, endSegment);
    const bCurve = new Bezier(...curve.coords());

    const from = Vector.create(input.x, input.y).transformToLocal(target);
    const pointOnCurve = bCurve.project({ x: from.x, y: from.y });
    target.splitter = Vector.createFromObject(pointOnCurve);

    // BOOKKEEPING
    state.temp.spline = spline;
    state.temp.splitter = target.splitter;
    state.temp.startSegment = startSegment;
    state.temp.endSegment = endSegment;
    state.temp.insertionIndex = startIndex + 1;
    state.temp.bCurve = bCurve;
    state.temp.curveTime = pointOnCurve.t;
    state.from = from;
    state.target = target;
  },

  // TODO: refactor
  splitCurve(state, input) {
    const target = state.target;
    const spline = state.temp.spline;
    const splitter = state.temp.splitter;
    const startSegment = state.temp.startSegment;
    const endSegment = state.temp.endSegment;
    const insertionIndex = state.temp.insertionIndex;
    const bCurve = state.temp.bCurve;
    const curveTime = state.temp.curveTime;

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
    state.target = segment.parent.parent;
    state.target.splitter = Vector.create(-1000, -1000);
  },

  // MARKUP

  userSelectedMarkupNode(state, input) {
    updates.cleanup(state, input);

    const node = state.canvas.findDescendantByKey(input.key);

    if (!node) {
      return;
    }

    if (node.type === types.SHAPE || node.type === types.GROUP) {
      state.target = node;
      node.select();
      state.mode = 'select';
      state.label = 'idle';
    } else if (node.type === types.SPLINE) {
      state.target = node.parent;
      state.target.placePen();
      state.canvas.removeFocus();
      state.mode = 'pen';
      state.label = 'idle';
    } else if (
      [types.ANCHOR, types.HANDLEIN, types.HANDLEOUT].includes(node.type)
    ) {
      state.target = node.parent.parent.parent; // TODO: great
      state.target.placePen();
      node.placePenTip();
      state.mode = 'pen';
      state.label = 'idle';
    }
  },

  userChangedMarkup(state, input) {
    const canvas = state.markupToCanvas(input.value);

    if (canvas) {
      state.canvas.replaceWith(canvas);
    }
  },

  // DOCUMENT MANAGEMENT

  // => 'New' button
  createDoc(state, input) {
    state.doc.replaceWith(state.buildDoc(state.doc.canvasWidth));
  },

  // => choice from menu (or history)
  switchDocument(state, input) {
    state.doc.replaceWith(state.objectToDoc(input.data.doc));
    updates.cleanup(state, input);
  },

  updateDocList(state, input) {
    state.docs.children = [];

    for (let id of input.data.docIDs) {
      const identNode = Identifier.create();
      identNode._id = id;
      state.docs.mount(identNode);
    }
  },

  toggleMenu(state, input) {
    if (state.layout.menuVisible) {
      state.layout.menuVisible = false;
    } else {
      state.layout.menuVisible = true;
    }
  },

  getPrevious(state, input) {
    window.history.back(); // TODO: shouldn't we do this inside of hist?
  },

  getNext(state, input) {
    window.history.forward(); // TODO: shouldn't we do this inside of hist?
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
