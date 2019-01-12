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

  // window.addEventListener('loadProject', function(event) {
  //
  // });

  // window.addEventListener('deleteProject', function(event) {
  //
  // });

  // window.addEventListener('updateProject', function(event) {
  //
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

const convertFromDb = (data) => {
  // TODO
};

const db = {
  subscribeTo(publisher) {
    publisher.addSubscriber(this);
  },

  receive(data, messages) {
    if (messages['db'] === 'saveNewProject') {
      this.saveNewProject(data);
    }
  },

  saveNewProject(data) {
    data = convertToDb(data);
    var event = new CustomEvent(
      'saveNewProject',
      { detail: JSON.stringify(data) }
    );
    window.dispatchEvent(event);
  },

  init(machine) {
    bindEvents(machine.dispatch.bind(machine));
    this.subscribeTo(machine);
  },
};

export { db };
