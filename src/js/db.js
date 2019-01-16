const bindEvents = (controller) => {
  window.addEventListener('saveNewProject', function(event) {
    const request = new XMLHttpRequest;

    request.addEventListener('load', function() {
      controller({
        label: 'projectSaved',
        detail: {}
      });
    });

    request.open('POST', "/projects/");
    request.responseType = 'json';
    request.send(event.detail);
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

// const convertFromDb = (data) => {
//   // TODO: implement
//   // convert data.selected ids into references
//   // who is responsible for this? presumably, `doc`.
// };

const db = {
  subscribeTo(publisher) {
    publisher.addSubscriber(this);
  },

  receive(state) {
    state.messages['db'] && this[state.messages['db']](state);
    // TODO: this is not so different from carrying out a method call!
    //       the db should analyze the state and figure out what it needs to do.
  },

  loadProjectIds(state) {
    const event = new Event('loadProjectIds');
    window.dispatchEvent(event);
  },

  saveNewProject(state) {
    const event = new CustomEvent(
      'saveNewProject',
      { detail: JSON.stringify(state.doc) }
    );
    window.dispatchEvent(event);
  },

  init(machine) {
    bindEvents(machine.controller.bind(machine));
    this.subscribeTo(machine);
  },
};

export { db };
