const db = {
  bindEvents(dispatch) {
    window.addEventListener('upsert', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        dispatch({
          label: 'docSaved',
          detail: {}
        });
      });

      request.open('POST', "/docs/" + event.detail._id);
      request.send(JSON.stringify(event.detail));
    });

    window.addEventListener('read', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        dispatch({
          label: 'setDoc',
          detail: {
            doc: request.response
          }
        });
      });

      request.open('GET', "/docs/" + event.detail);
      request.responseType = 'json';
      request.send(JSON.stringify(event.detail));
    });

    window.addEventListener('loadDocIds', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        dispatch({
          label: 'updateDocList',
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
      db.loadDocIds();
      this.previousState = state;
      return;
    }

    if (['idle', 'blocked'].includes(state.label)) {
      for (let changed of this.changes(state, this.previousState)) {
        this.crud[changed] && this.crud[changed](state);
      }
      this.previousState = state;
    }
  },

  crud: {
    docId(state) {
      window.dispatchEvent(new CustomEvent(
        'read',
        { detail: state.docId }
      ));
    },

    doc(state) {
      if (state.docId === db.previousState.docId) { // user has edited doc
        window.dispatchEvent(new CustomEvent(
          'upsert',
          { detail: state.doc }
        ));
      }
    },
  },

  // hasFrames(doc) {
  //   return doc.shapes.find((shape) => shape.frames.length !== 0);
  // },

  changes(state1, state2) {
    const keys = Object.keys(state1);
    return keys.filter(key => !db.equal(state1[key], state2[key]));
  },

  equal(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  },

  loadDocIds() {
    window.dispatchEvent(new Event('loadDocIds'));
  },
};

export { db };
