'use strict';

var fs = require('fs');
var async = require('async');
var cloudinary = require('cloudinary');
var db = module.parent.require('./database');

var cloudinarySettings = {
  config: {
    cloud_name: '',
    api_key: '',
    api_secret: '',
  },
  options: {},
  deleteOnPurge: true
};


function renderAdmin(req, res, next) {

  var deleteOnPurge = JSON.parse(cloudinarySettings.deleteOnPurge) ? 'checked' : '';

  res.render('admin/plugins/cloudinary', {
    config: cloudinarySettings.config,
    options: JSON.stringify(cloudinarySettings.options),
    deleteOnPurge: deleteOnPurge,
    csrf: req.csrfToken()
  });

}

function checkConfig(object) {

  var isValid = true;
  for (var i in object) {
    if (!object[i]) {
      isValid = false;
      break;
    }
  }
  return isValid;

}

function save(req, res, next) {

  var configValid = checkConfig(req.body.cloudinarySettings.config);

  if (configValid) {

    var dbSettingsString = JSON.stringify(req.body.cloudinarySettings);

    db.set('nodebb-plugin-cloudinary', dbSettingsString, function (err) {
      if (err) {
        return next(err);
      }
      cloudinarySettings = req.body.cloudinarySettings;
      cloudinarySettings.deleteOnPurge = JSON.parse(cloudinarySettings.deleteOnPurge);
      if (!cloudinarySettings.hasOwnProperty('options')) {
        cloudinarySettings.options = {};
      }
      cloudinary.config(cloudinarySettings.config);
      res.status(200).json({message: 'Config saved!'});

    });
  } else {
    res.status(400).json({message: 'Config data missing'});
  }

}


function uploadToCloudinary(uri, callback) {

  cloudinary.uploader.upload(uri, function (result) {
    callback(result)
  }, cloudinarySettings.options);

}


module.exports.init = function (params, callback) {

  params.router.get('/admin/plugins/cloudinary', params.middleware.applyCSRF, params.middleware.admin.buildHeader, renderAdmin);
  params.router.get('/api/admin/plugins/cloudinary', params.middleware.applyCSRF, renderAdmin);
  params.router.post('/api/admin/plugins/cloudinary/save', params.middleware.applyCSRF, save);

  db.get('nodebb-plugin-cloudinary', function (err, dbSettings) {

    if (err) {
      return next(err);
    }

    if (dbSettings) {
      cloudinarySettings = JSON.parse(dbSettings);
      if (!cloudinarySettings.hasOwnProperty('options')) {
        cloudinarySettings.options = {};
      }
    }

    cloudinary.config(cloudinarySettings.config);
    callback();

  });

};


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


module.exports.admin = {
  menu: function (menu, callback) {

    menu.plugins.push({
      route: '/plugins/cloudinary',
      icon: 'fa-picture-o',
      name: 'Cloudinary'
    });

    callback(null, menu);

  }
}

function getCloudinaryLinks(content) {

  var regex = new RegExp('\\(.*res.cloudinary.com\/' + cloudinarySettings.config.cloud_name + '.*\\)', 'g');
  var found = content.match(regex);

  if (found) {
    found = found.map(function (link) {
      link = link.substring(1, link.length - 1);
      var parts = link.split('/').filter(function (part) {
        return part.length;
      });
      var public_id = '';
      if (cloudinarySettings.options.folder.length) {
        public_id += parts[parts.length - 2] + '/';
      }
      public_id += parts[parts.length - 1].substring(0, parts[parts.length - 1].indexOf('.'));
      return public_id
    });
  }
  return found;

};

module.exports.postPurge = function (pid) {

  if (cloudinarySettings.deleteOnPurge) {

    db.getObject('post:' + pid, function (err, data) {

      if (data.content) {

        var foundPublicIds = getCloudinaryLinks(data.content);

        if (foundPublicIds) {

          cloudinary.api.delete_resources(foundPublicIds);

        }
      }

    });

  }
};





