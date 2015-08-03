(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .factory('UploaderService', UploaderService);

  UploaderService.$inject = ['$q', 'File', '$resource'];
  /* @ngInject */
  function UploaderService($q, File, $resource) {

    var uploaderRegistry = {};

    function getUploader(name) {
      if (uploaderRegistry[name]) {
        return uploaderRegistry[name];
      } else {
        var uploader = new Uploader();
        uploaderRegistry[name] = uploader;
        return uploader;
      }
    }

    function Uploader() {
      this.files = [];
      this.uploading = null;
      this.hasErrors = null;
    }

    Uploader.prototype.config = function(options) {
      options = options || {};

      this.allowMultiple = options.allowMultiple || false;
      this.allowDuplicates = options.allowDuplicates || false;
      this.$fileResource = $resource(options.fileEndpoint);
      this.$presignResource = $resource(options.urlPresigner);
      this.saveParams = options.saveParams || {};
    };

    Uploader.prototype.populate = function(queryUrl) {
      this._populate(queryUrl);
    };

    Uploader.prototype.add = function(files, options) {
      var uploader = this;
      options = options || {};
      files = filelistToArray(files);

      // Fail if we're trying to add multiple files to a single upload
      if (files.length > 1 && uploader.allowMultiple === false) {
        deferred.reject('NOTMULTI');
      }

      return $q.all(files.map(function(file){
        return uploader._add(file, options);
      }));
    };

    Uploader.prototype.onUpdate = function() {
      var uploader = this;
      var uploading = false;
      var hasErrors = false;

      uploader.files.forEach(function(file) {
        if (file.uploading === true) {
          uploading = true;
        } else if (file.hasErrors === true) {
          hasErrors = true;
        }
      });

      uploader.uploading = uploading;
      uploader.hasErrors = hasErrors;
    };

    Uploader.prototype._add = function(file, options) {
      options = options || {};
      var deferred = $q.defer();
      var uploader = this;

      // TODO: Prompt user to confirm replacing file
      var replace = true;
      var dupePosition = uploader._indexOfFilename(file.name);
      var dupe = dupePosition >= 0;

      var file = uploader._newFile(file, options);

      if (dupe) {
        if (replace) {
          uploader.files[dupePosition].remove().then(function() {
            uploader.files[dupePosition] = file;
          });
        } else {
          deferred.reject('DUPE');
        }
      } else {
        if (uploader.allowMultiple) {
          uploader.files.push(file);
        } else {
          if (uploader.files[0]) {
            uploader.files[0].remove().then(function() {
              uploader.files[0] = file;
            });
          } else {
            uploader.files[0] = file;
          }
        }
      }

      if (file.newFile) {
        file.start();
      }

      deferred.resolve();

      return deferred.promise;
    };

    Uploader.prototype._populate = function(queryUrl) {
      var uploader = this;
      var $promise = $resource(queryUrl).get().$promise;

      $promise.then(function(data) {
        var files = data.result.content || [];

        files.forEach(function(file) {
          uploader._add({
            name: file.fileName
          }, {
            newFile: false,
            fileId: file.fileId
          });
        });
      });
    };

    Uploader.prototype._newFile = function(file, options) {
      var uploader = this;

      options.$presignResource = uploader.$presignResource;
      options.$fileResource = uploader.$fileResource;
      options.saveParams = uploader.saveParams;

      file = new File(file, options);

      file.onStart = function(response) {
        uploader.onUpdate();
      };

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
    };

    Uploader.prototype._remove = function(file) {
      var deferred = $q.defer();
      this.files.splice(this._indexOfFilename(file.name), 1);

      deferred.resolve();
      return deferred.promise;
    };

    Uploader.prototype._indexOfFilename = function(name) {
      var uploader = this;

      for (var i = 0; i < uploader.files.length; i++) {
        if (uploader.files[i].name === name) return i;
      }

      return -1;
    };

    function filelistToArray(collection) {
      var array = [];
      for (var i = 0; i < collection.length; i++) {
        array[i] = collection[i];
      }
      return array;
    }

    return {
      get: getUploader
    };

  }
})();
