const db = {
  init() {
    this.name = 'db';
  },

  bindEvents(func) {
    window.addEventListener('upsertDoc', function(event) {
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

    window.addEventListener('readDoc', function(event) {
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
      request.send();
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
    if (state.actionLabel === 'go') {
      window.dispatchEvent(new Event('loadDocIDs'));
    } else if (state.actionLabel === 'requestDoc') {
      window.dispatchEvent(new CustomEvent('readDoc', { detail: state.input.key }));
      // ^ uses id. but we don't want to set it like this!
      //   this is why we need to store input in state, I think.
    } else if (state.actionLabel === 'release' || state.actionLabel === 'releasePen') {
      window.dispatchEvent(new CustomEvent('upsertDoc', { detail: state.plain.doc }));
    }

    this.previous = state;
  },
};

export { db };
