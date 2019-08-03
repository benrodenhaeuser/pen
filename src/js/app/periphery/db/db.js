const db = {
  init(snapshot) {
    this.name = 'db';
    return this;
  },

  bindEvents(func) {
    window.addEventListener('upsertDoc', event => {
      const request = new XMLHttpRequest();

      request.addEventListener('load', () => {
        func({
          source: this.name,
          type: 'docSaved',
          data: {},
        });
      });

      request.open('POST', '/docs/' + event.detail.props._id);
      request.send(JSON.stringify(event.detail));
    });

    window.addEventListener('readDoc', event => {
      const request = new XMLHttpRequest();

      request.addEventListener('load', () => {
        func({
          source: this.name,
          type: 'switchDocument',
          data: {
            doc: request.response,
          },
        });
      });

      request.open('GET', '/docs/' + event.detail);
      request.responseType = 'json';
      request.send();
    });

    window.addEventListener('loadDocIDs', event => {
      const request = new XMLHttpRequest();

      request.addEventListener('load', () => {
        func({
          source: this.name,
          type: 'updateDocList',
          data: {
            docIDs: request.response,
          },
        });
      });

      request.open('GET', '/ids');
      request.responseType = 'json';
      request.send();
    });
  },

  react(snapshot) {
    if (snapshot.update === 'go') {
      window.dispatchEvent(new Event('loadDocIDs'));
    } else if (snapshot.update === 'requestDoc') {
      window.dispatchEvent(
        new CustomEvent('readDoc', { detail: snapshot.input.key })
      );
    } else if (
      ['release', 'releasePen', 'changeMarkup'].includes(snapshot.update)
    ) {
      window.dispatchEvent(
        new CustomEvent('upsertDoc', { detail: snapshot.plain.doc })
      );
    }

    this.previous = snapshot;
  },
};

export { db };
