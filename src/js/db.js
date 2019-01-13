const bindEvents = (handler) => {
  window.addEventListener('saveNewProject', function(event) {
    const request = new XMLHttpRequest;

    request.addEventListener('load', function() {
      handler(new Event('projectSaved'));
    });

    request.open('POST', "/projects/");
    request.responseType = 'json';
    request.send(event.detail);
  });

  window.addEventListener('loadProjectIds', function(event) {
    const request = new XMLHttpRequest;

    request.addEventListener('load', function() {
      handler(new CustomEvent(
        'projectIdsLoaded',
        request.response
        // ^ pass the array with project ids to the handler
      ));
    });

    request.open('GET', "/projects/ids");
    request.responseType = 'json';
    request.send();
  });

  // window.addEventListener('loadProject', function(event) {
  // // TODO: implement
  // // load an existing project from the db
  // // note: here, the corresponding action needs access to
  // // the response body. so we need to dispatch a custom event
  // // to the handler method:
  // //
  // // assuming the project is stored in `theProject`:
  // // handler(new CustomEvent('projectLoaded', detail: theProject))
  // });

  // window.addEventListener('loadProjectIds', function(event) {
  // // TODO: implement
  // // load the ids of all projects from db
  // });

  // window.addEventListener('deleteProject', function(event) {
  // // TODO: implement
  // // delete a project
  // });

  // window.addEventListener('updateProject', function(event) {
  // // TODO: implement
  // // save a project to the db that has been changed
  // });
};

const convertToDb = (data) => {
  const frameId = data.selected.frame && data.selected.frame._id || null;

  return {
    _id: data._id,
    shapes: data.shapes,
    selected: {
      shape: data.selected.shape._id,
      frame: frameId,
    },
  };
};

// const convertFromDb = (data) => {
//   // TODO: implement
//   // convert data.selected ids into references
// };

const db = {
  subscribeTo(publisher) {
    publisher.addSubscriber(this);
  },

  receive(state) {
    if (state.messages['db'] === 'saveNewProject') {
      this.saveNewProject(state.doc);
    }

    if (state.messages['db'] === 'loadProjectIds') {
      this.loadProjectIds();
    }
  },

  loadProjectIds() {
    const event = new Event('loadProjectIds');
    window.dispatchEvent(event);
  },

  saveNewProject(doc) {
    doc = convertToDb(doc);
    const event = new CustomEvent(
      'saveNewProject',
      { detail: JSON.stringify(doc) }
    );
    window.dispatchEvent(event);
  },

  init(machine) {
    bindEvents(machine.handle.bind(machine));
    this.subscribeTo(machine);
  },
};

export { db };
