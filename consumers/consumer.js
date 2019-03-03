var amqp = require('amqplib/callback_api');
/* We will run all the upload jobs on a child process so that when a cancel request comes we can easily delete it*/
const { fork } = require('child_process');
/* UPLOAD will be a child process called from consumer to run the upload task*/
var upload;
/* currentProcessJobId will hold the job id of the current process the consumer is running..*/
var currentProcessJobId;

amqp.connect('amqp://user:password@localhost:5672', function(err, conn) {
  conn.createChannel(function(err, ch) {
      var q = 'upload_queue';
      ch.assertQueue(q, {durable: true});
      ch.prefetch(1);
      console.log(" [*] Waiting for messages in %s.", q);
      ch.consume(q, function(msg) {
        const messageString = msg.content.toString();
        const args = messageString.split(" ");
        currentProcessJobId = args[0];
        console.log(" [x] Received message from the producer %s", msg.content.toString());
        console.log(` [x] UPLOADING JOB: ${currentProcessJobId}`);
        /* Fork the upload process to start the job in a child process*/
        upload = fork('upload.js');
        /* Send start signal to the child process to begin the job*/
        upload.send('start');
        /* When child process completes the job and returns the status as completed, we send an ack*/
        upload.on('message',status=>{
          console.log(` [x] JOB WITH JOBID : ${currentProcessJobId} is successfully Completed`);
          console.log(" [x] Done");
          ch.ack(msg);
        });
        upload.on('exit',()=>{
          console.log('Child exited');
          ch.ack(msg);
        });
      }, {noAck: false});
    });

  conn.createChannel(function(err, ch) {
    var ex = 'logs';
    ch.assertExchange(ex, 'fanout', {durable: false});
    ch.assertQueue('', {exclusive: true}, function(err, q) {
      console.log(" [*] Waiting for messages in %s.", q.queue);
      ch.bindQueue(q.queue, ex, '');
      ch.prefetch(1);
      ch.consume(q.queue, function(msg) {
        const messageString = msg.content.toString();
        const args1 = messageString.split(" ");
        console.log(" [x] RECEIVED A KILL MESSAGE");
        /* Kill the job only if the consumer is running it */
        if(args1[0] === currentProcessJobId) {
          console.log(" [x] KILLING...");
          upload.kill('SIGINT');
          currentProcessJobId = "";
          // ch.ack(msg);
          console.log(" [x] %s", msg.content.toString());
        }else{
          console.log(" [x] NOT MY JOB");
        }
      }, {noAck: true});
    });
  });
});