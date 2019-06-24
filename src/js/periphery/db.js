const db = {
  init() {
    this.name = 'db';
    return this;
  },

  bindEvents(func) {
    window.addEventListener('upsertDoc', (event) => {
      const request = new XMLHttpRequest;

      request.addEventListener('load', () => {
        func({
          source: this.name,
          type:   'docSaved',
          data:   {},
        });
      });

      request.open('POST', "/docs/" + event.detail._id);
      request.send(JSON.stringify(event.detail));
    });

    window.addEventListener('readDoc', (event) => {
      const request = new XMLHttpRequest;

      request.addEventListener('load', () => {
        func({
          source: this.name,
          type:   'setDoc',
          data:   {
            doc: request.response
          },
        });
      });

      request.open('GET', "/docs/" + event.detail);
      request.responseType = 'json';
      request.send();
    });

    window.addEventListener('loadDocIDs', (event) => {
      const request = new XMLHttpRequest;

      request.addEventListener('load', () => {
        func({
          source: this.name,
          type:   'updateDocList',
          data:   {
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
    if (state.update === 'go') {
      window.dispatchEvent(
        new Event('loadDocIDs')
      );
    } else if (state.update === 'requestDoc') {
      window.dispatchEvent(
        new CustomEvent('readDoc', { detail: state.input.key })
      );
    } else if (['release', 'releasePen', 'changeMarkup'].includes(state.update)) {
      window.dispatchEvent(
        new CustomEvent('upsertDoc', { detail: state.plain.doc })
      );
    }

    this.previous = state;
  },
};

export { db };
