const db = {
  bindEvents(dispatch) {
    window.addEventListener('upsert', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        dispatch({
          id: 'docSaved',
          data: {}
        });
      });

      request.open('POST', "/docs/" + event.detail._id);
      request.send(JSON.stringify(event.detail));
    });

    window.addEventListener('read', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        dispatch({
          id: 'setDoc',
          data: {
            doc: request.response
          }
        });
      });

      request.open('GET', "/docs/" + event.detail);
      request.responseType = 'json';
      request.send(JSON.stringify(event.detail));
    });

    window.addEventListener('loadDocIDs', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        dispatch({
          id: 'updateDocList',
          data: {
            docIDs: request.response
          }
        });
      });

      request.open('GET', "/ids");
      request.responseType = 'json';
      request.send();
    });
  },

  sync(state) {
    if (state.id === 'start') {
      db.loadDocIDs();
      this.previousState = state;
      return;
    }

    if (['idle', 'blocked'].includes(state.id)) {
      for (let changed of this.changes(state, this.previousState)) {
        this.crud[changed] && this.crud[changed](state);
      }
      this.previousState = state;
    }
  },

  crud: {
    docID(state) {
      window.dispatchEvent(new CustomEvent(
        'read',
        { detail: state.docID }
      ));
    },

    doc(state) {
      if (state.docID === db.previousState.docID) { // user has edited doc
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

  loadDocIDs() {
    window.dispatchEvent(new Event('loadDocIDs'));
  },
};

export { db };
