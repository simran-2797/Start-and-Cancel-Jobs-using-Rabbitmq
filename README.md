# Worker Queue implementation using RabbitMQ
## Description 
This project demonstrates a worker queue made using RabbitMQ as the messaging broker. In this implementation the user can start (upload) a job and also cancel the ongoing job if required. The calls for starting and cancelling the jobs can be made from the UPLOAD and CANCEL endpoints respectively. JobIds are used to identify the jobs which are to be cancelled. A detailed explanation of the project is provided below with an example. 

## Architecture
For upload calls, the producer creates (if the queue doesn't exist) an upload_queue in a channel and a message to do the job is pushed in the upload_queue. The consumers take one job at a time from the queue, complete it and then start the next one.  
For cancel calls, a publisher subscriber mechanism is used. A fanout exchange is created so that when a cancel message comes, the job Id and the message is broadcasted to all the consumers. If the consumer is processing the job with that jobId then the process is cancelled. If not, it keeps processing it's job.   

## EndPoints
A user can make two POST requests. Upload and Cancel. The code for the same can be found in producer/routes/index.js
* UPLOAD - This is a POST request. It takes two parameters. The first parameter is jobId which specifies the ID of the job which is to be uploaded. The second parameter is any message which you want to send with this job. 
* CANCEL - Similar to UPLOAD, this is a POST request. The first parameter is jobId which specifies the ID of the job which is to be cancelled. The second parameter is any message which you want to send with this cancel request.

## Producer
When any upload or download request is given, a function call is made to "producer.js"
If the request made is "upload", then an upload queue is created (if it doesn't already exist). The message is then pushed to the queue. 
```sh
var q1 = 'upload_queue'; 
ch.assertQueue(q1, {durable: true});
ch.sendToQueue(q1, new Buffer(msg), {persistent: true});
```
If the request made is "cancel", then a fanout exchange is created. The message is published to this exchange for broadcasting to all the consumers. 
```sh
var ex = 'logs'; 
ch.assertExchange(ex, 'fanout', {durable: false});
ch.sendToQueue(q1, new Buffer(msg), {persistent: true});
```

## Consumer
When a consumer is told to do a job, it creates a child process for the job. The reason for the same is that if a cancel request comes, it is easy to terminate the process. When the process is completed, an ack is sent so that the queue starts processing the next job. 
```sh
upload = fork('upload.js');
upload.send('start');
upload.on('message',status=>{
    console.log(` [x] JOB WITH JOBID : ${currentProcessJobId} is successfully Completed`);
    console.log(" [x] Done");
    ch.ack(msg);
});
```
If the cancel request comes, the process is killed if the consumer is processing that job. 
```sh
if(args1[0] === currentProcessJobId) {
    console.log(" [x] KILLING...");
    upload.kill('SIGINT');
    console.log(" [x] %s", msg.content.toString());
}
```

