(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .factory('UploaderService', UploaderService);

  UploaderService.$inject = ['$q', 'File', '$resource'];
  /* @ngInject */
  function UploaderService($q, File, $resource) {

    var uploaderRegistry = {};

    function getUploader(options) {
      if (uploaderRegistry[options.name]) {
        return uploaderRegistry[options.name];
      } else {
        var uploader = new Uploader(options);
        uploaderRegistry[options.name] = uploader;
        return uploader;
      }
    }

    function Uploader(options) {
      options = options || {};

      this.files = [];
      this.uploading = null;
      this.hasError = null;
      this.allowMultiple = options.allowMultiple || false;
      this.allowDuplicates = options.allowDuplicates || false;
      this.$fileResource = $resource(options.fileEndpoint);
      this.$presignResource = $resource(options.urlPresigner);
      this.saveParams = options.saveParams || {};

      if (options.queryUrl) {
        this._populate(options.queryUrl);
      }
    }

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
      for (var i = 0; i < uploader.files.length; i++) {
        if (uploader.files[i].uploading === true) {
          uploader.uploading = true;
          return;
        } else if (uploader.files[i].hasErrors === true) {
          uploader.hasErrors = true;
          return;
        }
      }
      uploader.uploading = false;
      uploader.hasErrors = false;
    };

    Uploader.prototype._add = function(file, options) {
      options = options || {};
      var deferred = $q.defer();
      var uploader = this;

      // TODO: Prompt user to confirm replacing file
      var replace = true;
      var dupePosition = uploader._indexOfFilename(file.name);
      var dupe = dupePosition >= 0;

      if (dupe) {
        if (replace) {
          uploader.files[dupePosition].remove().then(function() {
            uploader.files[dupePosition] = uploader._newFile(file, options);
          });
        } else {
          deferred.reject('DUPE');
        }
      } else {
        if (uploader.allowMultiple) {
          uploader.files.push(uploader._newFile(file, options));
        } else {
          if (uploader.files[0]) {
            uploader.files[0].remove().then(function() {
              uploader.files[0] = uploader._newFile(file, options);
            });
          } else {
            uploader.files[0] = uploader._newFile(file, options);
          }
        }
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
