const test = require('tape');
const yaml = require('js-yaml');
const { Cocorita } = require('../lib/cocorita');

const objData = {
  hello: {
    es: 'hola',
    it: 'ciao',
    en: 'hello',
    de: 'hallo',
  },
  world: {
    es: 'mundo',
    it: 'mondo',
    en: 'world',
    de: 'welt',
  },
  'hello\nworld': {
    es: 'hola\nmundo',
  },
};

const yamlData = `
hello:
  de: hallo
  en: hello
  es: hola
  it: ciao
  
world:
  de: welt
  en: world
  es: mundo
  it: mondo

"hello\\nworld":
  es: |-
    hola
    mundo
`;

const jsonData = `
{
  "hello": {
    "es": "hola",
    "it": "ciao",
    "en": "hello",
    "de": "hallo"
  },
  "world": {
    "es": "mundo",
    "it": "mondo",
    "en": "world",
    "de": "welt"
  },
  "hello\\nworld": {
    "es": "hola\\nmundo"
  }
}
`;

test('load()', (t) => {
  let coco = new Cocorita({ language: 'it' });

  t.throws(coco.load, /source parameter is required/, 'source parameter is required');
  t.throws(() => coco.load({ a: 123 }), /invalid translations object/, 'invalid translations object');
  t.throws(() => coco.load(123), /source parameter must be a valid translations object or a file path/, 'source parameter must be a valid translations object or a file path');
  t.throws(() => coco.load(''), /format parameter is required if source is a string/, 'format parameter is required if source is a string');
  t.throws(() => coco.load('', 'foo'), /unsupported format/, 'unsupported format');
  t.throws(() => coco.load('foo', 'json'), /invalid source/, 'invalid source');

  coco.load(objData);
  t.equal(coco.tr('hello'), 'ciao', 'Should be "ciao"');

  coco = new Cocorita({ language: 'it' });
  coco.load(yamlData, 'yaml');
  t.equal(coco.tr('hello'), 'ciao', 'Should be "ciao"');

  coco = new Cocorita({ language: 'it' });
  coco.load(jsonData, 'json');
  t.equal(coco.tr('hello'), 'ciao', 'Should be "ciao"');

  t.end();
});


test('getData()', (t) => {
  const coco = new Cocorita({ language: 'it' });
  coco.load(objData);
  t.deepEqual(objData, coco.getData(), 'Object returned by getData() should be deep equal to objData');
  t.end();
});

test('dump()', (t) => {
  const coco = new Cocorita({ language: 'it' });
  try {
    coco.load(objData);
  } catch (e) {
    t.fail(e);
  }

  t.throws(coco.dump, /format parameter is required/, 'format parameter is required');
  t.throws(() => coco.dump(123), /format parameter must be a string/, 'format parameter must be a string');
  t.throws(() => coco.dump('foo'), /unsupported format/, 'unsupported format');

  let dumpString = coco.dump('yaml');
  let dumpData = yaml.safeLoad(dumpString);
  t.deepEqual(objData, dumpData, 'Dumped YAML data should be deep equal to objData');

  dumpString = coco.dump('json');
  dumpData = JSON.parse(dumpString);
  t.deepEqual(objData, dumpData, 'Dumped JSON data should be deep equal to objData');

  t.end();
});

test('tr()', (t) => {
  const coco = new Cocorita({ language: 'it' });
  coco.load({
    foo: {
      it: 'bar',
    },
    'Page {{ num }}': {
      it: 'Pagina {{ num }}',
    },
  });

  t.throws(() => coco.tr(123), /source parameter must be a string/, 'source parameter must be a string');
  t.throws(() => coco.tr('', 123), /replaces parameter must be a map/, 'replaces parameter must be a map');
  t.throws(() => coco.tr('', { $foo: 'bar' }), /replace parameter key not matching regular expression.*/, 'replace parameter key not matching regular expression');

  t.equal(coco.tr('foo'), 'bar', 'Should be "bar"');
  t.equal(coco.tr('Page {{ num }}', { num: 3 }), 'Pagina 3', 'Should be "Pagina 3"');

  t.end();
});

test('initialization', (t) => {
  const coco = new Cocorita({ language: 'es', initialize: ['en'] });
  coco.load(objData);

  coco.on(Cocorita.EVT_INIT_KEY, () => {
    t.equal(coco.getData()['hello\nworld'].en, 'hello\nworld', 'Should be "hello\nworld"');
    t.end();
  });

  t.equal(coco.tr('hello\nworld'), 'hola\nmundo', 'Should be "hola\nmundo"');
});
