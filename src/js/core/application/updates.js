import { Scene, Shape, Group     } from './domain/types.js';
import { Spline, Segment, Anchor } from './domain/types.js';
import { HandleIn, HandleOut     } from './domain/types.js';
import { Identifier, Doc         } from './domain/types.js';
import { Vector                  } from './domain/vector.js';
import { Matrix                  } from './domain/matrix.js';
import { Rectangle               } from './domain/rectangle.js';

const updates = {
  init() {
    this.aux = {};
  },

  after(state, input) {
    
  },

  // select a target node
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
      state.label = 'penMode'; // TODO: hack! an update that changes the machine state
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

  cleanup(state, event) {
    const current = state.scene.editing;

    if (current) {
      for (let ancestor of current.ancestors) {
        ancestor.memoizeBounds();
      }
    }

    state.scene.deselectAll();
    state.scene.deeditAll();

    this.aux = {};
  },

  // Transform

  initTransform(state, input) {
    const node = state.scene.selected;
    this.aux.from   = Vector.create(input.x, input.y); // global coordinates
    this.aux.center = node.bounds.center.transform(node.globalTransform());
    // ^ global coordinates (globalTransform transforms local coords to global coords)
  },

  shift(state, input) {
    const node = state.scene.selected;

    if (!node) {
      return;
    }

    const to     = Vector.create(input.x, input.y); // global coordinates
    const from   = this.aux.from;
    const offset = to.minus(from);

    node.translate(offset);

    this.aux.from = to;
  },

  rotate(state, input) {
    const node = state.scene.selected;

    if (!node) {
      return;
    }

    const to     = Vector.create(input.x, input.y);
    const from   = this.aux.from;
    const center = this.aux.center;
    const angle  = center.angle(from, to);

    node.rotate(angle, center);

    this.aux.from = to;
  },

  scale(state, input) {
    const node = state.scene.selected;

    if (!node) {
      return;
    }

    const to     = Vector.create(input.x, input.y);
    const from   = this.aux.from;
    const center = this.aux.center;
    const factor = to.minus(center).length() / from.minus(center).length();

    node.scale(factor, center);

    this.aux.from = to;
  },

  // Pen
  addSegment(state, input) {
    if (this.aux.spline) {
      const spline  = this.aux.spline;
      const segment = Segment.create();
      const anchor  = Anchor.create();

      anchor.payload.vector = Vector.create(input.x, input.y);
      segment.append(anchor);
      spline.append(segment);

      this.aux.segment = segment;
    } else {
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

      this.aux.spline  = spline;
      this.aux.segment = segment;
    }
  },

  setHandles(state, input) {
    const segment     = this.aux.segment;
    const anchor      = segment.anchor;
    const handleIn    = Vector.create(input.x, input.y);
    const handleOut   = handleIn.rotate(Math.PI, anchor);
    segment.handleIn  = handleIn;
    segment.handleOut = handleOut;
  },

  // TODO: further pen actions

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

  // Messages

  // from db: doc has just been saved
  setSavedMessage(state, input) {
    state.store.message.payload.text = 'Saved';
  },

  // from ui: message can now be cleaned
  wipeMessage(state, input) {
    state.store.message.payload.text = '';
  },

  // History

  getPrevious(state, input) {
    window.history.back(); // TODO: should we do this inside of hist?
  },

  getNext(state, input) {
    window.history.forward(); // TODO: should we do this inside of hist?
  },

  switchDocument(state, input) {
    state.store.scene.replaceWith(state.importFromPlain(input.data.doc));
    this.cleanup(state, input);
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
