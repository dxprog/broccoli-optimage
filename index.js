const Filter = require('broccoli-filter');
const fs = require('fs');
const optimage = require('optimage');
const path = require('path');
const Promise = require('bluebird');
const temp = require('temp').track();

const DEBUG = false;
const TMP_PREFIX = 'broccoli-optimage';
const IMAGE_EXTENSIONS = [ 'jpg', 'gif', 'png', 'jpeg' ];
const DEFAULT_FILTER = function() {
  return true;
};

BrocOptImage.prototype = Object.create(Filter.prototype);
BrocOptImage.prototype.constructor = BrocOptImage;
BrocOptImage.prototype.extensions = IMAGE_EXTENSIONS;
BrocOptImage.prototype.inputEncoding = null;
BrocOptImage.prototype.outputEncoding = null;

/**
 * Constructor
 *
 * @constructor
 * @param {BroccoliNode} inputNode The node to operate on
 * @param {FilterOptions} options Options for broccoli-optimage
 * @return {BrocOptImage} When called statically, returns a new BrocOptImage object
 */
function BrocOptImage(inputNode, options) {
  if (!(this instanceof BrocOptImage)) {
    return new BrocOptImage(inputNode, options);
  }

  // Verify that only a single node was passed
  if (Array.isArray(inputNode)) {
    throw new Error('broccoli-optimage can only operate on a single node/tree; array was passed');
  }

  options = options || {};

  Filter.call(this, inputNode, {
    annotation: options.annotation
  });

  options.filter = typeof options.filter === 'function' ? options.filter : DEFAULT_FILTER;
  options.debug = options.debug || DEBUG;
  this.options = options;
}

/**
 * Performs the image optimization
 *
 * @method processString
 * @override
 * @protected
 */
BrocOptImage.prototype.processString = function(contents, relativePath) {
  const self = this;

  // Let's play a game of 9000 levels of async!
  return new Promise(function(resolve, reject) {
    // We bolt the extension onto the file otherwise optimage freaks out
    // TODO - Write in header detection and submit pull request to optimage
    const tmpIn = temp.path({ prefix: TMP_PREFIX }) + path.extname(relativePath);
    const tmpOut = temp.path({ prefix: TMP_PREFIX });
    fs.writeFileSync(tmpIn, contents);
    optimage({
      inputFile: tmpIn,
      outputFile: tmpOut
    }, function(err, res) {
      if (err) {
        if (self.options.debug) {
          console.warn('Error optimizing ' + relativePath + '. Using original file instead.');
          console.warn(err);
        }
        resolve(contents);
      } else {
        const originalSize = contents.length;
        const crushedSize = fs.statSync(tmpOut).size;
        const sizeDiff = 100 - Math.round(crushedSize / originalSize * 100);
        const data = fs.readFileSync(tmpOut);
        resolve(data);

        if (self.options.debug) {
          console.log(relativePath + ' optimized with ' + sizeDiff + '% savings');
        }
      }
    });
  });
};

/**
 * Runs filters to determine whether this file should be optimized
 *
 * @method getDestFilePath
 * @override
 * @protected
 */
BrocOptImage.prototype.getDestFilePath = function(path) {
  // Run the super for extension filtering plus the custom filters
  const process = Filter.prototype.getDestFilePath.call(this, path) && this.options.filter(path);
  return process ? path : null;
};

module.exports = BrocOptImage;