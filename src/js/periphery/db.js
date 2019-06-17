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
        console.log('received document');

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
      //   this looks like a mistake
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

  // TODO: clean up this method
  receive(state) {
    if (state.label === 'start') {
      // if the label is start, we load the doc ids
      db.loadDocIDs();

      this.previousPlain = state.plain;
    } else {
      if (state.plain.doc._id !== this.previousPlain.doc._id) {
        // the doc id has changed – should load corresponding doc
        // TODO: we should replace this with a different condition that captures the
        // user's desire to load a document -- but how?
        window.dispatchEvent(new CustomEvent(
          'read',
          { detail: state.plain.doc._id }
        ));

        this.previousPlain = state.plain;
      } else if (
        // the document "itself" has changed, and the state is relevant, i.e., should save
        this.isRelevant(state) &&
        this.changed(state.plain.doc, this.previousPlain.doc)
      ) {
        window.dispatchEvent(new CustomEvent(
          'upsert',
          { detail: state.plain.doc }
        ));

        this.previousPlain = state.plain;
      } else if (state.plain.docs !== this.previousPlain.docs) {
      }
    }
  },

  isRelevant(state) {
    const release    = state.actionLabel === 'release' ;
    const releasePen = state.actionLabel === "releasePen";

    return release || releasePen;
  },

  changed(doc, previous) {
    return JSON.stringify(doc) !== JSON.stringify(previous);
  },

  loadDocIDs() {
    window.dispatchEvent(new Event('loadDocIDs'));
  },
};

export { db };
