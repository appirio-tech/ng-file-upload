(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .factory('Uploader', Uploader);

  Uploader.$inject = ['$q', 'File', '$resource'];
  /* @ngInject */
  function Uploader($q, File, $resource) {

    function Uploader(options) {
      options = options || {};

      this.files = [];
      this.multi = options.multi || true;
      this.locked = options.locked || false;
      this.fileEndpoint = options.fileEndpoint || null;
      this.queryUrl = options.queryUrl || null;
      this.urlPresigner = options.urlPresigner || null;
      this.$fileResource = $resource(this.fileEndpoint);
      this.$presignResource = $resource(this.urlPresigner);

      if (this.queryUrl) {
        this._populate();
      }
    }

    Uploader.prototype.add = function(files, options) {
      var uploader = this;
      options = options || {};
      files = filelistToArray(files);

      // Fail if we're trying to add multiple files to a single upload
      if (files.length > 1 && uploader.multi === false) {
        deferred.reject('NOTMULTI');
      }

      return $q.all(files.map(function(file){
        return uploader._add(file, options);
      }));
    }

    Uploader.prototype.onUpdate = function() {}

    Uploader.prototype._add = function(file, options) {
      options = options || {};
      var deferred = $q.defer();
      var uploader = this;
      var replace = options.replace || false;
      var dupePosition = uploader._indexOfFilename(file.name); 
      var dupe = dupePosition >= 0;

      if (dupe) {
        if (replace) {
          uploader.files[dupePosition] = uploader._newFile(file, options);
        } else {
          deferred.reject('DUPE');
        }
      } else {
        if (uploader.multi) {
          uploader.files.push(uploader._newFile(file, options));
        } else {
          uploader.files[0] = uploader._newFile(file, options);
        }
      }

      deferred.resolve();

      return deferred.promise;
    }

    Uploader.prototype._populate = function() {
      var uploader = this;
      var $promise = $resource(uploader.queryUrl).get().$promise;

      $promise.then(function(data) {
        var files = data.result.content || [];

        files.forEach(function(file) {
          uploader._add({
            name: file.fileName
          }, {
            newFile: false,
            fileId: file.fileId
          })
        });
      })
    }

    Uploader.prototype._newFile = function(file, options) {
      var uploader = this;

      options.$presignResource = uploader.$presignResource;
      options.$fileResource = uploader.$fileResource;

      file = new File(file, options);

      file.onProgress = function(response) {
        uploader.onUpdate();
      };

      file.onSuccess = function(response) {
        uploader.onUpdate();
      };

      file.onFailure = function(response) {
        uploader.onUpdate();
      };

      file.onRemove = function(file) {
        uploader._remove(file);
      };

      return file;
    }

    Uploader.prototype._remove = function(file) {
      var deferred = $q.defer();
      this.files.splice(this._indexOfFilename(file.name), 1);

      deferred.resolve();
      return deferred.promise;
    }

    Uploader.prototype._indexOfFilename = function(name) {
      var uploader = this;

      for (var i = 0; i < uploader.files.length; i++) {
        if (uploader.files[i].name === name) return i;
      };

      return -1;
    }

    function filelistToArray(collection) {
      var array = [];
      for (var i = 0; i < collection.length; i++) {
        array[i] = collection[i];
      };
      return array;
    }

    return Uploader;

  }
})();
