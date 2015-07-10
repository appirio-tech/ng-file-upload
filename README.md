# Appirio File Uploader

## Developing on the repo

### Install
```
> npm install
> bower install
> gulp build
> gulp serve
```

### Setup

Sign in using a valid Topcoder account in the domain you're testing.

Modify the parameters of the ``ap-uploader`` directive in ``example/index.jade``
. The example code in the repo currently is for attaching files to a specific work item. The work microservice requires a valid work request id and requires that you own that work request.

## API Reference
http://docs.apworkmicroservice.apiary.io/#reference/workrequestfiles
