const db = {
  bindEvents(controller) {
    window.addEventListener('saveNewProject', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        controller({
          label: 'projectSaved',
          detail: {}
        });
      });

      request.open('POST', "/projects/");
      request.responseType = 'json';
      request.send(event.detail);
    });

    window.addEventListener('loadProjectIds', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        controller({
          label: 'projectIdsLoaded',
          detail: {
            docIds: request.response
          }
        });
      });

      request.open('GET', "/ids");
      request.responseType = 'json';
      request.send();
    });
  },

  sync(state) {
    if (state.label === 'start') {
      this.start(state);
      this.previousState = state;
      return;
    }

    for (let changed of this.changes(state, this.previousState)) {
      this.process[changed] && this.process[changed](state);
    }
    this.previousState = state;
  },

  changes(state1, state2) {
    const keys = Object.keys(state1);
    const changed = keys.filter(key => !this.equal(state1[key], state2[key]));
    return changed;
  },

  equal(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  },

  process: {
    doc(state) {
       if (db.previousState.doc && state.doc._id != db.previousState.doc._id) {
         db.saveNewProject(state);
       }
    },

    label(state) {
      // TODO
    },

    docIds(state) {
      // TODO
    },
  },

  // OK
  loadProjectIds() {
    const event = new Event('loadProjectIds');
    window.dispatchEvent(event);
  },

  saveNewProject(state) {
    const event = new CustomEvent(
      'saveNewProject',
      { detail: JSON.stringify(state.doc) }
    );
    window.dispatchEvent(event);
  },

  start(state) {
    this.loadProjectIds();
  },

  init(core) {
    this.bindEvents(core.controller.bind(core));
    core.attach(this);
  },
};

export { db };
