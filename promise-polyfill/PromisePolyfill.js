
(function() {

    function Promise(callback) {

        this.thenChain = [];
        this.caught = null;
        this.isActiveProcess = false;
    
        function resolve(data) {
            console.log('resolve');
            console.log(data);
            console.log(`this.isActiveProcess = ${this.isActiveProcess}`);
    
            if (!this.isActiveProcess) {
                this.isActiveProcess = true;
    
                this.thenChain.forEach(function(callbackItem) {
                    console.log('callbackItem');
                    console.log(data);
                    
                    if (data instanceof Promise) {
                        console.log('IS PROMIS YES');
                        // На этом этапе нужно выполнить текущий промис
                        // ?
                        // data.then(callbackItem);
                        // return;
                    }
                    
                    console.log('-------------------');
                    data = callbackItem(data);
                })
            }
        }
        function reject(error) { 
            if (!this.isActiveProcess && this.caught) {
                this.isActiveProcess = true;
                console.log('[reject]', error);
                this.caught(error);
            }
        }
    
        // check is callback a function
        if (typeof callback != "function") {
            throw new TypeError('Promise callback is not a function');
        }
        // try to run this callback
        try {
            callback(resolve.bind(this), reject.bind(this));
        }
        catch (error) {
            reject(error);
        }
        // -----
        //callback(resolve.bind(this), reject.bind(this));
    

        this.then = function(callbackThen) {
    
            // передача выполнения callbackThen в resolve()
            this.thenChain.push(callbackThen);
    
            // then returns promise
            return this;
        }
        
        this.catch = function(callBackCatch) {
            this.caught = callBackCatch;
        }
    
    }


    function isBrowser() {
        try {
            return window;
        }
        catch {
            return false;
        }
    }
    
    function isNode() {
        try {
            return global
        }
        catch {
            return false;
        }
    }
    
    function createGlobalVariable() {
        if (!!isBrowser()) {
            window.Promise = Promise;
        }
        else if (!!isNode()) {
            global.Promise = Promise;
        }
    }
    createGlobalVariable();
    

})();

