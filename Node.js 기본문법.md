# Node.js 기본문법

### 1. 변수

```javascript
/*
1. var 키워드 문제점
- 변수 중복 선언 가능하여, 예기치 못한 값을 반환할 수 있다.
- 함수 레벨 스코프로 인해 함수 외부에서 선언한 변수는 모두 전역 변수로 된다.
- 변수 선언문 이전에 변수를 참조하면 언제나 undefined를 반환한다.
*/

//2. let 키워드 : 변수 중복 선언 불가하지만, 재할당 가능 
let name = 'kmj'
console.log(name) // output: kmj

let name = 'howdy' // output: Uncaught SyntaxError: Identifier 'name' has already been declared

name = 'howdy'
console.log(name) // output: howdy

//3. const : let과 다른점 - 반드시 선언과 초기화를 동시에 진행 
// - 재선언, 재할당 불가
```



#### 1-1. javaScript는 변수에 메모리 주소 부여

#### 1-2. if 문

```javascript
if (조건식) {
   // statement1
} else if(조건식) {
   // statement2
} else {
   // statement3
}
```



### 2. 함수 정의되는 방식

```javascript
// 1. 함수 선언문
// 함수 이름 생략 불가능
function add(x, y) {
  return x + y
}

// 2. 함수 표현식
// 함수 이름 생략 가능
var add = function(x, y) {
  return x + y
}
// 함수 이름 작성 시,
// var add = function plus(x, y) {
//   return x + y
// }

// 3. Function 생성자 함수
var add = new Function('x', 'y', 'return x+ y')

// 4. 화살표 함수
var add = (x, y) => x + y
```



### 3. 콜백함수

- 파라미터로 전달되는 함수

```javascript
// 기본 예제
function add(a, b, callback){
  var result = a + b;
  callback(result);
}

add(10, 10, function(result){
  console.log('파라미터로 전달된 콜백 함수 호출');
  console.log('더하기 (10, 10)의 결과 : %d', result);
});
```

```javascript
// 함수 안에서 값을 반환할 때 새로운 함수를 만들어 반환하는 방법 예시 코드
function multiply(a, b, callback){
  var result = a*b;
  callback(result);

  var history = function(){
    return a + '*' + b + '=' + result
  }

  return history
}

var multi_history = multiply(10, 10, function(result){
  console.log(result);
});

console.log('결과 값으로 받은 함수 실행 결과 : ' + multi_history());

// 100
// 결과 값으로 받은 함수 실행 결과 : 10*10=100
```



### 4. async & await 기본 문법

#### 4-1. Promise : 자바스크립트 비동기 처리를 위한 객체

```javascript
async function 함수명() {
  await 비동기_처리_메서드_명();
}
```

