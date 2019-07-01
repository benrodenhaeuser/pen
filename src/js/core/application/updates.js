import { Scene, Shape, Group     } from './domain/types.js';
import { Spline, Segment, Anchor } from './domain/types.js';
import { HandleIn, HandleOut     } from './domain/types.js';
import { Identifier, Doc         } from './domain/types.js';

import { Vector                  } from './domain/vector.js';
import { Matrix                  } from './domain/matrix.js';
import { Rectangle               } from './domain/rectangle.js';

let aux = {};

const updates = {

  // Select

  select(state, input) {
    const target = state.scene.findDescendantByKey(input.key);
    const node = target && target.findAncestorByClass('frontier');

    if (node) {
      node.select();
      this.initTransform(state, input);
    } else {
      state.scene.deselectAll();
    }
  },

  release(state, input) {
    const current = state.scene.selected || state.scene.editing;

    if (current) {
      for (let ancestor of current.ancestors) {
        ancestor.memoizeBounds();
      }
    }

    this.aux = {};
  },

  deepSelect(state, input) {
    const target = state.scene.findDescendantByKey(input.key);

    if (!target) {
      return;
    }

    if (target.isSelected()) {
      target.edit();
      state.scene.unfocusAll();
      state.label = 'pen'; // TODO: hack! could the update initiate an input?
    } else {
      const toSelect = target.findAncestor((node) => {
        return node.parent && node.parent.class.includes('frontier');
      });

      if (toSelect) {
        toSelect.select();
        state.scene.setFrontier();
        state.scene.unfocusAll();
      }
    }
  },

  focus(state, input) {
    state.scene.unfocusAll(); // TODO: expensive (but effective)

    const target = state.scene.findDescendantByKey(input.key);
    const hit    = Vector.create(input.x, input.y);

    if (target) {
      const toFocus = target.findAncestorByClass('frontier');

      if (toFocus && toFocus.contains(hit)) {
        toFocus.focus();
      }
    }
  },

  deselect(state, event) {
    state.scene.deselectAll();
  },

  // TODO: naming. this is more like "drop pen tool"
  // => it should happen whenever we drop the pen tool
  // => on the other hand, it is what happens when we click the select button!
  deedit(state, event) {
    const current = state.scene.editing;

    if (current) {
      for (let ancestor of current.ancestors) {
        ancestor.memoizeBounds();
      }
    }

    this.aux = {};

    state.scene.deeditAll();
  },

  // Transform

  initTransform(state, input) {
    const node = state.scene.selected;
    aux.from   = Vector.create(input.x, input.y); // global coordinates
    aux.center = node.bounds.center.transform(node.globalTransform());
    // ^ global coordinates (globalTransform transforms local coords to global coords)
  },

  shift(state, input) {
    const node = state.scene.selected;

    if (!node) {
      return;
    }

    const to     = Vector.create(input.x, input.y); // global coordinates
    const from   = aux.from;
    const offset = to.minus(from);

    node.translate(offset);

    aux.from = to;
  },

  rotate(state, input) {
    const node = state.scene.selected;

    if (!node) {
      return;
    }

    const to     = Vector.create(input.x, input.y);
    const from   = aux.from;
    const center = aux.center;
    const angle  = center.angle(from, to);

    node.rotate(angle, center);

    aux.from = to;
  },

  scale(state, input) {
    const node = state.scene.selected;

    if (!node) {
      return;
    }

    const to     = Vector.create(input.x, input.y);
    const from   = aux.from;
    const center = aux.center;
    const factor = to.minus(center).length() / from.minus(center).length();

    node.scale(factor, center);

    aux.from = to;
  },

  // Pen

  placeAnchor(state, input) {
    const shape   = Shape.create();
    const spline  = Spline.create();
    const segment = Segment.create();
    const anchor  = Anchor.create();

    shape.append(spline);
    spline.append(segment);
    segment.append(anchor);
    state.scene.append(shape);

    anchor.payload.vector = Vector.create(input.x, input.y);
    shape.edit();
    shape.payload.bounds = Rectangle.create(); // TODO: hack

    aux.spline  = spline;
    aux.segment = segment;
  },

  addHandles(state, input) {
    const segment     = aux.segment;
    const anchor      = segment.anchor;
    const handleIn    = Vector.create(input.x, input.y);
    const handleOut   = handleIn.rotate(Math.PI, anchor);
    segment.handleIn  = handleIn;
    segment.handleOut = handleOut;
  },

  addSegment(state, input) {
    const spline  = aux.spline;
    const segment = Segment.create();
    const anchor  = Anchor.create();

    anchor.payload.vector = Vector.create(input.x, input.y);
    segment.append(anchor);
    spline.append(segment);

    aux.segment = segment;
    // TODO: bounds
  },

  pickControl(state, input) {
    // initiate edit of control point:
    // identify the control by its id
    // ... store it
  },

  moveControl(state, input) {
    // move control point:
    // retrieve stored control
    // ... move it
    // need to move handles along with anchors
    // and opposite handles together
  },

  insertAnchor(state, input) {
    // insert anchor
    // need to make sure that this update does not
    // affect the existing curve (i.e., it splits the curve,
    // but does not change it)
  },

  // Doc(s)

  // from ui: user has requested fresh document
  createDoc(state, input) {
    state.store.doc.replaceWith(state.buildDoc());
  },

  // from db: doc list has been obtained
  updateDocList(state, input) {
    const identNodes = [];

    for (let id of input.data.docIDs) {
      const identNode = Identifier.create();
      identNode.payload._id = id;
      identNodes.push(identNode);
    }

    state.store.docs.children = identNodes;
  },

  // from db: doc has been retrieved
  setDoc(state, input) {
    state.doc.replaceWith(state.importFromPlain(input.data.doc));
  },

  // Messages

  // from db: doc has just been saved
  setSavedMessage(state, input) {
    state.store.message.payload.text = 'Saved';
  },

  // from ui: message can now be cleaned
  cleanMessage(state, input) {
    state.store.message.payload.text = '';
  },

  // History

  getPrevious(state, input) {
    console.log('calling getPrevious update');
    window.history.back(); // TODO: should we do this inside of hist?
  },

  getNext(state, input) {
    window.history.forward(); // TODO: should we do this inside of hist?
  },

  changeState(state, input) {
    state.store.scene.replaceWith(state.importFromPlain(input.data.doc));
  },

  // Markup

  // from ui: user has changed markup
  changeMarkup(state, input) {
    state.store.markup.payload.text = input.value;
    // TODO: I wonder if we need this at all. I don't think so.

    const newScene = state.importFromSVG(input.value);

    if (newScene !== null) {
      state.store.scene.replaceWith(newScene);
    } else {
      state.store.message.payload.text = 'Invalid markup';
    }
  },

};

export { updates };
