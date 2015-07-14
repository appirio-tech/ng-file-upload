# Appirio File Uploader


## Using the repo in your app

### Install

- Install the bower component:

```
> bower install --save ap-file-uploader
```

- Include the ``main.js`` file in your app.
- Require the ``ap-file-upload`` module in the parent app.
- Place the ``ap-uploader`` directive where you want it to show up in your app.

### Configure

The ``ap-uploader`` directive takes two parameters passed as attributes to the directive. They are both passed as two-way ("=") bindings:

status (required) - [string]: Gives the parent scope access to the status of the uploader. Useful for external validation (e.g. preventing form submission while uploads are in progress).

config (required) - [object]: Contains all the config information need to run and integrate the directive:

- fileEndpoint (required) - [string]: This should be the endpoint to create/delete records after successful upload to S3. ``:name`` will be replaced with the actual filename at query time.
- urlPresigner (required) - [string]: This is the URL to create/delete records after successful upload to S3. ``:name`` will be replaced with the actual filename at query time.
- multiple - [true|**false**]: Should this instance of the uploader allow multiple files. If not, adding a file will prompt the user to replace. If the user confirms, the previous file will be deleted before the new one is uploaded.
- queryUrl - [string]: If present, the uploader will use this URL to retrieve file meta-data and prepopulate the uploader.
- saveParams - [object]: After uploading the file a call will be made to your fileEndpoint to create a record in your system. The saveParams is a hash of additional parameters you wish to include with this call.

## Developing on the repo

### Install

```
> npm install
> bower install
```

### Using the example app

``gulp serve`` will start a local Browsersync server on ``localhost:9001``

### Comitting changes

The bower component served by this repo only includes the dist folder, which is committed. Make sure to ``gulp build`` before adding your files.


