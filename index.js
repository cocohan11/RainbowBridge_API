// 개발버전인지 상용버전인지 구분
process.env.NODE_ENV = ( process.env.NODE_ENV && ( process.env.NODE_ENV ).trim().toLowerCase() == 'production' ) ? 'production' : 'development';
console.log(process.env.NODE_ENV);

// express 사용설정
const express = require('express');
// 비동기처리 에러핸들링을 위한 모듈
require('express-async-errors');
const app = express();

// 파일을 읽어나 쓰는 모듈
const fs = require('fs');
// nondejs가 기본적으로 제공하는 path모듈. 
// 파일/폴더/디렉터리 등의 경로를 편리하게 설정할 수 있는 기능 제공함
const path = require('path');

// 서버에서 CORS 허용을 하기 위한 모듈
const cors = require('cors');

// POST요청시 들어오는 BODY를 처리하기 위해 body-parser 설정
const bodyParser = require('body-parser');

//.env라는 파일에 정보를 저장하고, 그 안의 정보를 환경변수로 등록해주는 모듈
const dotenv = require('dotenv');
dotenv.config(); // .env 파일을 읽어온다.


//에러핸들링을 위한 구문. Error로부터 상속된 예외 클래스 선언
class BadRequestError extends Error {}
class MissingParameterError extends Error {}


// Add cors
app.use(cors());
app.options('*', cors());  // enable pre-flight

//body-parser 설정
app.use(bodyParser.urlencoded({extended:true})); // request 객체의 body에 대한 url encoding의 확장을 할 수 있도록 하는 설정
app.use(bodyParser.json()); //request body에 오는 데이터를 json 형식으로 변환

//util경로에 있는 파일들을 읽기위한 처리
app.use('/util', express.static(path.join(__dirname, 'util')));

//서버포트 지정
const port = 3001;


/**
 * 라우터모듈 사용 처리
 *  require로 해당 라우터 모듈을 가져오고, 
 *  app.use('/경로', 라우터)로 라우터 사용설정 
 * '/경로'로 해당하는 작업을 라우터가 실행한다
 *
 *  
 * *라우터(router)란?
 *  -> 한마디로, 클라에서 들어온 요청을 어떻게 핸들링하고, 응답할지 정의하는 것.
 *  - 사전적의미: 노선.루트.도로
 *     1) 한곳에서 다른곳으로 가기 위해 따라가는 길
 *     2) (버스기차 수송품등) 노선 
 *     3) (특정한 루트를 따라 무엇을)보내다(전송하다)
 *  - 개발적의미: 라우팅은 URI 및 특정한 HTTP요청 메소드(GET, POST 등) 요청에 대해 어플에 응답하는 방법을 결정하는 것을 의미.
 *     - express.js에선 라우트는 아래처럼 정의해서 사용한다.
 *     - 라우트는 하나 이상의 핸들러를 갖을 수 있고, 이 함수를 라우트가 일치할때 실행한다.
 *     -> app.METHOD(PATH, HANDLER)
 *     -> 참고: https://expressjs.com/ko/starter/basic-routing.html
 */
fs.readdirSync(__dirname + '/routes/').forEach(function (fileName) {
	let routeName = fileName.substr(0, fileName.lastIndexOf('.'));
	let fileFullPath = __dirname + '/routes/' + fileName;

	console.log(`routeName: ${routeName}`);

	if (fs.statSync(fileFullPath).isFile()) {
		app.use('/api/' + routeName, require(fileFullPath));
	}
});


/**
 * express의 기본적인 공통 에러 핸들링 처리
  error 미들뒈어는 인자를 4개 선언한다.
  비동기요청일 때 발생한 오류의 경우 express가 처리해주지 못한다.
  epresss는 이 경우를 위해 next 함수를 사용할 수 있다.
  
 * 블로그 설명글 - https://teamdable.github.io/techblog/express-error-handling
 * express 에러핸들링 공홈설명 - https://expressjs.com/en/guide/error-handling.html
 */
app.use((err, req, res, next) => {

  if (err instanceof BadRequestError) { // API요청시 발생한 오류가 BadRequestError인 경우 오류처리
    res.status(400);
    res.json({message: err.message});
  } else if (err instanceof MissingParameterError) { 
    console.log('test!!!!');
    res.status(401);
    //'1002
    //필수파라미터 누락 오류
    //res.json({message: err.message});
    res.json({result: {'code': '1002', 'message': '필수파라미터 누락 오류'}});
  } else {
    res.status(500);
    res.json({message: err.message});
  }
});


app.listen(port, () => {
  console.log(`rainbowBridge Dev app listening on port ${port}`)
});


module.exports = app;