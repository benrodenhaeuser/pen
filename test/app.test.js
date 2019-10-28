const app = require('./dist/bundle.js').app;

app.init.bind(app)();

test('it tests stuff', () => {
  const list = ['a'];
  expect(list).toContain('a');
})
