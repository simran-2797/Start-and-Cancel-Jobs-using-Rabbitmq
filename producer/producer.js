var amqp = require('amqplib/callback_api');
let connection={};
amqp.connect('amqp://user:password@localhost:5672', function(err, conn) {
  if(err){
    console.log(err);
  }else{
    console.log('Connection established!');
    connection = conn;  
  }
});

function write(key,msg){
  // Creating a channel for the upload job
  connection.createChannel(function(err, ch) {   
    /* All the upload jobs will be pushed into the upload queue*/
    var q1 = 'upload_queue'; 
    ch.assertQueue(q1, {durable: true});
    if(key === 'UPLOAD'){
      ch.sendToQueue(q1, new Buffer(msg), {persistent: true});
      console.log(" [x] Sent '%s'", msg);
      return true;
    }
  });
  connection.createChannel(function(err, ch) {
    /* The cancel job will be broadcasted to all the consumers using a fanout exchange. Whichever consumer has the job will cancel..*/
    var ex = 'logs'; 
    ch.assertExchange(ex, 'fanout', {durable: false});
    if(key === 'CANCEL'){
      ch.publish(ex, '', new Buffer(msg));
    }
    console.log(" [x] Sent %s", msg);
    return true;
  });
}

module.exports = {write};
