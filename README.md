# promise-polyphill

**Особенности**

1. Функция `createGlobalVariable()` создает мой промис в глобальной области видимости (`window / global`).

**Что сделано**

Реализована функиция, имитирующая действия промисов для простых случаев.

1. Цепочка промисов, в ходе которой изначальное число удваивается несколько раз

```javascript
const promise = new Promise(function(resolve, reject) {
    setTimeout(function() {

        setTimeout(function() { resolve(2); }, 1000);
        setTimeout(function() { reject('error message'); }, 500);

    }, 1000) 
})

promise
    .then(function(num) { console.log(num); return num * 2; })
    .then(function(num) { console.log(num); return num * 2; })
    .then(function(num) { console.log(num); })
    .catch(function() {console.log('ERROR HAPPEND')})

```

2. Данный случай показывает, что `resolve()` не будет выполняться после того, как выполнился `reject()`. Верно и обратное.

```javascript
const promise = new Promise(function(resolve, reject) {
    setTimeout(function() {

        setTimeout(function() { resolve(2); }, 1000);
        setTimeout(function() { reject('error message'); }, 500);

    }, 1000) 
})

promise
    .then(function(num) { console.log(num); return num + 2; })
    .then(function(num) { console.log(num); return num + 2; })
    .then(function(num) { console.log(num); })
    .catch(function() {console.log('ERROR HAPPEND')})

```

**Что не удалось сделать**

1. Данная реализация не отработает, если в одном из вызовов метода `then()` в колбэке вернуть новый промис вместо примитива.

```javascript
    .then(function(num) { 
        return new Promise(function (resolve, reject) { resolve(5) })
    })
```

В методе `resolve()` я увидел, что могу отловить событие, когда приходит новый промис с помощью `instanseof`. При выявлении такого промиса нужно его выполнить, а затем вернуться к изначальной цепочке.

2. Метод `catch()` не отлавливает ошибки `throw new Error()`

