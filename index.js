'use strict';

var fs = require('fs');
var async = require('async');
var cloudinary = require('cloudinary');
var db = module.parent.require('./database');
var admin = {};
var requiredConfig = ['cloud_name', 'api_key', 'api_secret'];
var config = {
  cloud_name: '',
  api_key: '',
  api_secret: '',
  folder: ''
}


function renderAdmin(req, res, next) {

  db.getObject('nodebb-plugin-cloudinary', function (err, dbConfig) {
    if (err) {
      return next(err);
    }

    if (dbConfig) {
      config = dbConfig;
    }

    res.render('admin/plugins/cloudinary', {config: config, csrf: req.csrfToken()});

  });
}

function save(req, res, next) {

  var newConfig = req.body.config;
  var configValid = true;

  for (var i = 0; i < requiredConfig.length; i++) {
    if (!newConfig[requiredConfig[i]]) {
      configValid = false;
      break;
    }
  }

  if (configValid) {
    db.setObject('nodebb-plugin-cloudinary', newConfig, function (err) {
      if (err) {
        return next(err);
      }
      config = newConfig;
      cloudinary.config(config);
      res.status(200).json({message: 'Config saved!'});

    });
  } else {
    res.status(400).json({message: 'Config data missing'});
  }

}


admin.menu = function (menu, callback) {

  menu.plugins.push({
    route: '/plugins/cloudinary',
    icon: 'fa-picture-o',
    name: 'Cloudinary'
  });

  callback(null, menu);

};


module.exports.init = function (params, callback) {

  params.router.get('/admin/plugins/cloudinary', params.middleware.applyCSRF, params.middleware.admin.buildHeader, renderAdmin);
  params.router.get('/api/admin/plugins/cloudinary', params.middleware.applyCSRF, renderAdmin);
  params.router.post('/api/admin/plugins/cloudinary/save', params.middleware.applyCSRF, save);

  db.getObject('nodebb-plugin-cloudinary', function (err, dbConfig) {

    if (err) {
      return next(err);
    }

    if (dbConfig) {
      config = dbConfig;
    }

    cloudinary.config(config);
    callback();

  });

};

module.exports.admin = admin;

module.exports.upload = function (data, callback) {

  var image = data.image;

  if (!image) {
    return callback(new Error('invalid image'));
  }

  var type = image.url ? 'url' : 'file';

  if (type === 'file' && !image.path) {
    return callback(new Error('invalid image path'));
  }

  var uri = type === 'file' ? image.path : image.url;

  uploadToCloudinary(uri, function (data) {
    if (data.error) {
      return callback(data.error);
    }

    callback(null, {
      url: data.url,
      name: image.name || ''
    });

  });

}


function uploadToCloudinary(uri, callback) {

  var options = {};

  if (config.folder.length) {
    options.folder = config.folder;
  }

  cloudinary.uploader.upload(uri, function (result) {
    callback(result)
  }, options);

}
