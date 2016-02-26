#broccoli-optimage

Runs images in a broccoli node through optimage.

##Installing

```npm install --save-dev broccoli-optimage```

##API

```
var optimage = require('broccoli-optimage');

module.exports = optimage(inputNode: BroccoliNode, options: Object);
```

###Options

- `filter`: A callback to allow custom filtering on what is or is not optimized. Return `false` if you want the file to pass-through as-is.
- `debug`: Display debug information in the console output.

##Example Usage

```
var merge = require('broccoli-merge-trees');
var optimage = require('broccoli-optimage');
var path = require('path');

var tree = merge([ 'images', 'js' ]);
module.exports = optimage(tree, {
  debug: true,
  filter: function(path) {
    // Do not process GIFs
    return path.extname(path) !== '.gif';
  }
});
```