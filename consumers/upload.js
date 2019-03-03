var sleep = require('sleep');
const upload =() =>{
    var i;
    for(i=0;i<30;i++){
            console.log(`UPLOAD PRINTED ${i} TIMES`);
            sleep.sleep(1);
    }
    return 'complete';
}

process.on('message',(msg) =>{
        console.log('STARTING THE CHILD PROCESS');
        var status = upload();
        process.send(status);
});
