

const promise = new Promise(function(resolve, reject) {
    setTimeout(function() {

        let isSuccess = Math.floor(Math.random() * 10) > 4;
        if (isSuccess) resolve(2);
        else reject('error message in 1-st promise');

        //setTimeout(function() { resolve(2); }, 1000);
        //setTimeout(function() { reject('error message'); }, 500);

    }, 1000) 
})

promise
    .then(function(num) { console.log(num); return num + 2; })
    .then(function(num) { console.log(num); return num + 2; })
    .then(function(num) { console.log(num); })
    .catch(function() {console.log('ERROR HAPPEND')})


// promise
//     .then(function(num) {return num + 2; })
//     .then(function(num) { 
//         //return num + 2;
//         return new Promise(function (resolve, reject) { resolve(137) })
//     })
//     .then(function(num) { return num + 2; })
//     .then(function(num) { console.log('res', num); })