var sleep = function (time) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve();
        }, time);
    })
};

(async () => {
    console.log('start');
    await sleep(2000);
    console.log('end');
})();
