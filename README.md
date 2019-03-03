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

## Example
The following code requires the following node dependencies:
* "amqplib": "^0.3.0",
* "sleep": "^6.0.0"

Start RabbitMQ. Open 3 terminals. We will implement 1 producer and 2 consumers. 
In the first terminal start the producer.
```sh
$ cd producer
$ npm start
```
In the other two terminals start the consumer.js
```sh
$ cd consumer
$ node consumer.js
```
Open Postman and make a POST request using 'localhost:3000/upload' with the following JSON parameters:
```
{
	"jobId" : "5c7b5fd7559f4b0f6f1b6325",
	"message": " UPLOADING JOB: 5c7b5fd7559f4b0f6f1b6325"
}
```
You will notice that in one of the terminal a job has started. You can make one more post request with different jobId and message. You will notice that this job has started in the vacant terminal. If you make another post request, the consumer which finishes a job first will take up the next job in the queue. 

While these jobs are happening, you can try sending a cancel request. Suppose I want to cancel jobId "5c7b5fd7559f4b0f6f1b6325" while it is running. I will make a POST request using 'localhost:3000/cancel' with the following JSON parameters:
```
{
	"jobId" : "5c7b5fd7559f4b0f6f1b6325",
	"message": " CANCELLING JOB: 5c7b5fd7559f4b0f6f1b6325"
}
```
You will notice that the terminal which is executing job with jobId 5c7b5fd7559f4b0f6f1b6325 will terminate the job. You can try uploading a new job. Since the job is cancelled our consumer is free and it will take up the next job it gets in the queue. 

In this way, the project demonstrates a worker queue which can start as well as cancel the jobs. 

