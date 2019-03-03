var express = require('express');
var router = express.Router();
var {write} = require('../producer.js');

/**
 * @description - To cancel an ongoing job
 * @param {String} jobId - Id of the job which you want to cancel
 * @param {String} message - Message which you want to send while cancelling
 * @returns status true or false 
 */
router.post('/cancel', function(req, res, next) {
  const msg = req.body.jobId + " " + req.body.message;
  var status = write('CANCEL',msg);
    res.send({
      status: true,
    });
});

/**
 * @description - To upload a job
 * @param {String} jobId - Id of the job which you want to upload
 * @param {String} message - Message which you want to send while uploading
 * @returns status true or false 
 */
router.post('/upload', function(req, res, next) {
  const msg = req.body.jobId + " " + req.body.message;
  var status = write('UPLOAD',msg);
    res.send({
      status: true,
    });
});


module.exports = router;
