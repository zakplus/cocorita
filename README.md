# Cocorita language translation library

## Install
```npm install --save cocorita```

## Motivation
There are many great localization tools out there, if you need a fully customizable popular/standard solution then you should go for them.  
But if you just need translation then Cocorita can fit your needs, it's small and functional. Give it a try!

## Usage
API documentation is [here](https://zakplus.github.io/cocorita/).

### Quick start (NodeJS)

```javascript
const Cocorita = require('cocorita');

// Initialize and set target language to 'es'
const coco = new Cocorita({ language: 'es' });

// Load a YAML translations database from file
coco.load(fs.readFileSync('translations.yaml', { encoding: 'utf8' }), 'yaml'));

// Use
console.log( coco.tr('Hello Cocorita!') ); // Hola Cocorita!
```

### Quick start (Browser)

Example with database as a object in a script file:

database.js:
```javascript
var translations = {
  hello: {
    en: 'hello',
    es: 'hola',
    it: 'ciao'
  },
  world: {
    en: 'world',
    es: 'mundo',
    it: 'mondo'
  }
}
```

html:
```html
<script type="text/javascript" src="cocorita.js"></script>

<!-- include database -->
<script type="text/javascript" src="database.js"></script>

<script type="text/javascript">
  (function() {
    // Initialize
    var coco = new Cocorita({ language: 'es' });

    // Load translations database
    coco.load(translations);

    // Use
    coco.tr('Hello Cocorita!');
  }) ();
</script>
```
You could get the database in any other way. It could be a object, json or yaml:

```html
<script type="text/javascript" src="cocorita.js"></script>

<script type="text/javascript">
  (function() {
    // Initialize
    var coco = new Cocorita({ language: 'es' });

    // Load translations database
    asyncLoadTranslations(function(err, data) {
      if(err) { // handle error }
      else coco.load(data);
      ready();
    });

    function ready() {
      // Use
      coco.tr('Hello Cocorita!');
    }
  }) ();
</script>
```

## Options
Cocorita constructor will accept a options object with these keys:

``` javascript
{
  language,   // {String}    The target language identifier
  initialize  // {String[]}  Array of languages whose translations will be initialized with the source text if not present.
}
```

## Initialization
**DO NOT USE THIS FEATURE IN PRODUCTION.**  
Cocorita could initialize missing target translations for you.
To do so, you need to pass the 'initialize' languages array in the constructor options parameter:

```javascript
const coco = new Cocorita({ initialize:['en', 'es', 'it', 'de'] });
```

then, any time the tr() function gets called, it will be checked if a translation is available for every of these languages. If a translation is missing, the source text will be added in place and a Cocorita.EVT_INIT_KEY event will be thrown.  
You could listen for the event in order to update the database during development:

```javascript
const coco = new Cocorita({ initialize:['en', 'es', 'it', 'de'] });

coco.on(Cocorita.EVT_INIT_KEY, (co, data, source, targets) => {
  // In this example we update the wole database
  fs.writeFileSync('translations.yaml', co.dump('yaml'));
})
```

## Error handling
Cocorita will throw errors if anyting unexpexted happen.  
You should enclose error-throwing functions calls in try-catch blocks:

```javascript
let coco;
try {
  coco = new Cocorita();
  coco.language = 'en';
  coco.load(db);
} catch(e) {
  // Error handling
}

// tr() does not throw errors
coco.tr();
```

## Data formats
Cocorita load function will accept a JavaScript object or a YAML or JSON strings with these formats:

JS Object:
```javascript
{
  hello: {
    de: "hallo",
    en: "hello",
    es: "hola",
    it: "ciao"
  },

  "hello\nworld": {
    es: "hola\nmundo"
  }
}
```

YAML:
```yaml
hello:
  de: hallo
  en: hello
  es: hola
  it: ciao

"hello\nworld":
  es: |-
    hola
    mundo
```

JSON:
```json
{
  "hello": {
    "de": "hallo",
    "en": "hello",
    "es": "hola",
    "it": "ciao"
  },

  "hello\nworld": {
    "es": "hola\nmundo"
  }
}
```