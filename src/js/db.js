const db = {
  bindEvents(controller) {
    window.addEventListener('upsert', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        controller({
          label: 'projectSaved',
          detail: {}
        });
      });

      request.open('POST', "/projects/" + event.detail._id);
      request.send(JSON.stringify(event.detail));
    });

    window.addEventListener('read', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        controller({
          label: 'docLoaded',
          detail: {
            doc: request.response
          }
        });
      });

      request.open('GET', "/projects/" + event.detail);
      request.responseType = 'json';
      request.send(JSON.stringify(event.detail));
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
      return;
    }

    for (let changed of this.changes(state, this.previousState)) {
      this.crud[changed] && this.crud[changed](state);
    }
    this.previousState = state;
  },

  crud: {
    doc(state) {
      if (db.hasFrames(state.doc)) {
        // TODO: that's not quite enough, because a doc read from the database has
        // frames, but there's no need to save it rightaway.
        window.dispatchEvent(new CustomEvent('upsert', { detail: state.doc }));
      }
    },

    lastInput(state) {
      if (state.lastInput === 'loadDoc') {
        window.dispatchEvent(new CustomEvent('read', { detail: state.docId }));
      }

      // TODO: we could perhaps do this.start(state) here?
      //       if the last input is 'kickoff' ... 
    },
  },

  // helpers 0
  hasFrames(doc) {
    return doc.shapes.find((shape) => shape.frames.length !== 0);
  },

  // helpers 1
  changes(state1, state2) {
    const keys = Object.keys(state1);
    return keys.filter(key => !db.equal(state1[key], state2[key]));
  },

  // helpers 2
  equal(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  },

  // helpers 3
  loadProjectIds() {
    window.dispatchEvent(new Event('loadProjectIds'));
  },

  start(state) {
    db.loadProjectIds();
    this.previousState = state;
  },

  init(core) {
    this.bindEvents(core.controller.bind(core));
    core.attach(this);
  },
};

export { db };
