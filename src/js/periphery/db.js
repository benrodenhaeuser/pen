const db = {
  init() {
    this.name = 'db';
  },

  bindEvents(func) {
    window.addEventListener('upsert', function(event) {
      const request = new XMLHttpRequest;

      request.addEventListener('load', function() {
        func({
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
        func({
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
        func({
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

  receive(state) {
    if (state.label === 'start') {
      db.loadDocIDs();

      this.previousPlain = state.plain;
    } else {
      if (state.plain.doc._id !== this.previousPlain.doc._id) {
        window.dispatchEvent(new CustomEvent(
          'read',
          { detail: state.plain.doc._id }
        ));

        this.previousPlain = state.plain;
      } else if (
        ['release', 'releasePen'].includes(state.actionLabel) &&
        this.changed(state.plain.doc, this.previousPlain.doc)
      ) {
        console.log('SAVE: save case applies');

        window.dispatchEvent(new CustomEvent(
          'upsert',
          { detail: state.plain.doc }
        ));

        this.previousPlain = state.plain;
      } else if (state.plain.docs !== this.previousPlain.docs) {
        // TODO: I don't know if we actually need this?
        // should use JSON.stringify
        // this.previousPlain = state.plain;
      }
    }
  },

  changed(doc, previous) {
    return JSON.stringify(doc) !== JSON.stringify(previous);
  },

  loadDocIDs() {
    window.dispatchEvent(new Event('loadDocIDs'));
  },
};

export { db };
