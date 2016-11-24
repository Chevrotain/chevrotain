(function (exports) {

  var o = null;

  exports.parse_json_oboe = function parse_json_oboe(input, deferred) {
    o.emit('data', input);
    deferred.resolve();
  }

  exports.newOboe = function newOboe() {
    o = oboe();
    o.on('done', function(result) {});
    o.on('fail', function(error) { console.log('oboe error:',error); });
  };

  exports.newOboe();

})(this);
