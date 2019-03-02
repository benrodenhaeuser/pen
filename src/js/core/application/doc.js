import { sceneBuilder } from './sceneBuilder.js';

const createID = () => {
  const randomString = Math.random().toString(36).substring(2);
  const timestamp    = (new Date()).getTime().toString(36);
  return randomString + timestamp;
};

const doc = {
  init(markup) {
    this._id   = createID();
    this.scene = sceneBuilder.createScene(markup);

    return this;
  },

  toJSON() {
    return {
      _id: this._id,
      scene: this.scene,
    }
  }
};

export { doc };
