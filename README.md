# Cocorita language translation library

## Install
```npm install --save cocorita```

## Motivation
There are many great localization tools out there, if you need a fully customizable popular/standard solution then you should go for them.  
If you just need translation then Cocorita can fit your needs, it's small and functional. Give it a try!

## Migration from 1.x.x version
Starting from version 2.0.0 Cocorita adopted a fully ES6 module structure.  
This implies you have to change your code **only if you are using cocorita in a CommonJS module** (with require) or in a browser.  
No actions required if you are using cocorita in a ES6 module.

If you are using cocorita in a CommonJS module:
```Javascript
// Change this
const Cocorita = require('cocorita');

// To this (using object destructuring)
const { Cocorita } = require('cocorita');

// Or this
const Cocorita = require('cocorita').Cocorita;
```

If you are using cocorita in a browser you have to load the script from the "dist" folder.  
The script expose the library with the global property "CocoLib". Here is an example:
```Javascript
<script type="text/javascript" src="<path to>/dist/cocorita.js"></script>

<script type="text/javascript">
  // Change this
  const coco = new Cocorita(options);

  // To this (using object destructuring)
  const coco = new CocoLib.Cocorita(options);
</script>
```

## Usage
API documentation is [here](https://zakplus.github.io/cocorita/).

### Quick start (NodeJS)

```javascript
const { Cocorita } = require('cocorita');

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
<script type="text/javascript" src="<path to>/dist/cocorita.js"></script>

<!-- include database -->
<script type="text/javascript" src="database.js"></script>

<script type="text/javascript">
  (function() {
    // Initialize
    var coco = new CocoLib.Cocorita({ language: 'es' });

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
    var coco = new CocoLib.Cocorita({ language: 'es' });

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

## Replace in translated string
Sometimes you need to translate a text which contains some dynamic sections you want to set at run time.  
In these cases, you can format your texts as a template (Cocorita support Mustache style tags) and use the replace object parameter:

```javascript
coco.tr('You have {{ msglen }} new messages and {{ reqlen }} new requests!', {
  msglen: messages.length,
  reqlen: requests.length
});
```

translations database (YAML):
```yaml
You have {{ msglen }} new messages and {{ reqlen }} new requests!:
  it: Hai {{ msglen }} nuovi messaggi e {{ reqlen }} nuove richieste!
```

## Database initialization
**THIS FEATURE IS NOT INTENDED TO BE USED IN PRODUCTION ENVIRONMENT**  
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

## license

```
MIT License

Copyright (c) 2018 Valerio Bianchi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```