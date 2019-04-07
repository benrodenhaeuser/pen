const db = {
  bindEvents(compute) {
    window.addEventListener('upsert', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        compute({
          type: 'docSaved',
          data: {},
        });
      });

      request.open('POST', "/docs/" + event.detail._id);
      request.send(JSON.stringify(event.detail));
    });

    window.addEventListener('read', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        compute({
          type: 'setDoc',
          data: {
            doc: request.response
          },
        });
      });

      request.open('GET', "/docs/" + event.detail);
      request.responseType = 'json';
      request.send(JSON.stringify(event.detail));
      // ^ TODO why does the GET request have a payload?
    });

    window.addEventListener('loadDocIDs', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        compute({
          type: 'updateDocList',
          data: {
            docIDs: request.response
          },
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

    if (['idle', 'busy'].includes(state.id)) {
      this.crud.doc(state);
      // for (let changed of this.changes(state, this.previousState)) {
      //   this.crud[changed] && this.crud[changed](state);
      // }
      // this.previousState = state;
    }
  },

  crud: {
    docs(state) {
      if (state.docs.selectedID !== db.previousState.docs.selectedID) {
        window.dispatchEvent(new CustomEvent(
          'read',
          { detail: state.docs.selectedID }
        ));
      }
    },

    doc(state) {
      // if (state.docs.selectedID === db.previousState.docs.selectedID) {
        // window.dispatchEvent(new CustomEvent(
        //   'upsert',
        //   { detail: state.vDOM }
        // ));
      // }
    },
  },

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

  init() {
    this.name = 'db';
  }
};

export { db };
