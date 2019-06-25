import { State        } from './application/state.js';
import { updates      } from './application/updates.js';
import { transitions  } from './application/transitions.js';
import { createID     } from './application/domain/createID';

const core = {
  init() {
    this.state = State.create();
    this.periphery = [];
    return this;
  },

  attach(name, func) {
    this.periphery[name] = func;
  },

  kickoff() {
    // this.state.width = canvasSize.width;   // TODO: stopgap
    // this.state.height = canvasSize.height; // TODO: stopgap
    //
    // this.state.store.scene.viewBox.width  = canvasSize.width;
    // this.state.store.scene.viewBox.height = canvasSize.height;

    this.publish();
    this.compute({ source: 'core', type: 'go' });
  },

  compute(input) {
    this.state.input = input;

    // TODO: do we need this special logic? can't we do it in an update function?
    // (i.e., without any special logic) 
    if (input.type === 'undo') { // TODO: 'undo' really means 'undoOrRedo' so this is confusing naming
      this.state.store.scene.replaceWith(this.state.importFromPlain(input.data.doc));
      this.publish();
    } else {
      const transition = transitions.get(this.state, input);

      if (transition) {
        this.makeTransition(input, transition);
        this.publish();
      }
    }
  },

  makeTransition(input, transition) {
    this.state.update = transition.do;
    this.state.label  = transition.to;

    const update = updates[transition.do];
    update && update.bind(updates)(this.state, input);
  },

  publish() {
    const keys = Object.keys(this.periphery);
    for (let key of keys) {
      this.periphery[key](this.state.export());
    }
  },
};

export { core };
