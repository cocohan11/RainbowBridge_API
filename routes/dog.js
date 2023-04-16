/** 반려견모델생성 처리관련 API */
const express = require('express');
const resCode = require('../util/resCode');
// multipart/form-data 를 다루기 위한 node.js 의 미들웨어
const multer = require('multer'); // 이미지, 동영상 등을 비롯한 여러 가지 파일들을 멀티파트 형식으로 업로드할 때 사용하는 미들웨어
const multerS3  = require('multer-s3')
const router = express.Router();
const dogMngDB = require('../model/dogMng');
const upload = multer({ dest: 'uploads/' })
//파일경로를 읽기 위해 사용
const path = require("path");
//파일 읽기처리를 위해 사용
const fs = require('fs');
// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');

// require('dotenv').config();
const config = require('../config/config');
const { log } = require('console');

/**
 * 공통에러 핸들링
 */
class MissingParameterError extends Error {}
class ResponseEmptyError extends Error {}
class CommonError extends Error {}

// AWS 접근키 설정
AWS.config.update({
  region: config.region,
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey
});

const s3 = new AWS.S3();

//업로드 가능한 포맷설정
const allowedExtensions = ['.png', '.jpg', '.jpeg', '.bmp']


/**
 * 클라이언트에서 받은 이미지를 파일로 저장하기 위해 multer 라이브러리 사용
 * 인자값 설명
  - multer({storage: _storage}) : storage를 설정해, 파일을 저장하게 한다
  - single : 지정된 form 필드와 연결된 단일 파일을 처리하는 미들웨어를 반환 (req.file로 전달되는 명)
 */
const frontImageUploader = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'user-input-photo/front', //생성할 버킷 디렉토리
    key: (req, file, callback) => {
      //업로드할 디렉토리를 설정하기 위한 코드. 없어도 무관
      //const uploadDirectory = req.query.directory ?? ''
      
      //안드로이드에서 파일 확장자가 전달되지 않아 확장자를 임의로 생성함.
      let newFilename = `${file.originalname}.jpeg`
      console.log(`newFilename: ${newFilename}`);
      
      //extname = 경로의 마지막 '.'에서 마지막 부분의 문자열 끝까지의 확장을 반환합니다. 
      // 경로의 마지막 부분에 '.'가 없거나 경로의 첫 번째 문자가 '.'인 경우 빈 문자열을 반환합니다.
      const extenstion  = path.extname(newFilename)
      console.error(`extenstion : ${extenstion}`);

      //extion을 확인하기 위한 코드로 없어도 무관함. 허용되지 않는 확장자면 에러발생됨.
      if (!allowedExtensions.includes(extenstion)) {
        console.error('frontImageUploader error: 파일의 확장자가 없습니다.')
        //23.4.13 위) next함수를 써서 에러핸들링 되도록 시도했지만 실패
        //next란, next(err)는 현재 미들웨어에서 발생한 에러를 다음 미들웨어에 전달하는 역할
        //next 함수를 호출해 인자로 전달되는 에러객체를 app.use에 정의한 에러핸들러의 매개변수로 전달한다

        //@todo) 동작하지 않아서 수정필요
        return callback(new CommonError('파일의 확장자가 없습니다'))
      }

      //원래코드
      //callback(null, `${uploadDirectory}/${Date.now()}_${file.originalname}`) 
      //업로드 기능(null, '업로드경로')
      callback(null, `${Date.now()}_${newFilename}`)
    },
    ContentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read-write' //권한 관련 설정
  })
})


//옆모습 이미지 버킷 업로드 함수
const sideImageUploader = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'user-input-photo/side', //생성한 버킷이름
    key: (req, file, callback) => {
      //const uploadDirectory = req.query.directory ?? '' //업로드할 디렉토리를 설정하기 위한 코드. 없어도 무관
      
      //안드로이드에서 파일 확장자가 전달되지 않아 확장자를 임의로 생성함.
      let newFilename = `${file.originalname}.jpeg`
      
      //extname = 경로의 마지막 '.'에서 마지막 부분의 문자열 끝까지의 확장을 반환합니다. 경로의 마지막 부분에 '.'가 없거나 경로의 첫 번째 문자가 '.'인 경우 빈 문자열을 반환합니다.
      const extenstion  = path.extname(newFilename)
      console.error(`extenstion : ${extenstion}`);

      if (!allowedExtensions.includes(extenstion)) { //extion을 확인하기 위한 코드로 없어도 무관함. 허용되지 않는 확장자면 에러발생됨.
        console.error('파일의 확장자가 없습니다.');
        return callback(new Error('wrong extenstion'))
      }
      //원래코드
      //callback(null, `${uploadDirectory}/${Date.now()}_${file.originalname}`) //업로드 기능(null, '업로드경로')
      //변경코드
      callback(null, `${Date.now()}_${newFilename}`)
    },
    ContentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read-write' //권한 관련 설정
  })
})


/**
 * 반려견 앞모습 인풋사진 저장 API
 *  1) AWS S3에 반려견 인풋사진 업로드
 *  2) DB에 S3 저장경로와 파일명 저장
 * @route {POST} api/dog/confirm/front/photo
 */
router.post('/confirm/front/photo', 
  frontImageUploader.single('facePhoto'), // single()가먼저 실행됨.
                                          // 사용자가 전송한 데이터에 파일이 포함되어 있다면 가공해서 req객체에 file이라는 프로포티를 약속하는 함수 
  async (req, res) => {
    const apiName = '반려견 앞모습 인풋사진 저장 API';
    console.log('req.body: %o', req.body)
    if (!req.file || !req.body.dogId || !req.body.type) {
      resCode.returnResponseCode(res, 1002, apiName, null);
    }
    
    //클라이언트로부터 이미지 파일을 전달받는다.
    const file = req.file;
    console.log('file값 확장자 확인: %o', file.originalname)

    //안드로이드에서 파일 확장자가 전달되지 않아 확장자를 임의로 생성함.
    let newFilename = `${file.originalname}.jpeg`
    
    //DB에 새로운 파일명과 S3 파일 저장경로 저장
    req.body.filename = newFilename
    req.body.path = file.location
    console.log('req.body.path 값 확인 >>> ', req.body.path);

    const rows = await dogMngDB.insertDogPhoto(req.body);
    if (rows == 9999) {
      resCode.returnResponseCode(res, 9999, apiName, null);
    } else {
      resCode.returnResponseCode(res, 0000, apiName, null);
    }
})


/**
 * 반려견 옆모습 인풋사진 저장 API
 *  1) AWS S3에 반려견 인풋사진 업로드
 *  2) DB에 S3 저장경로와 파일명 저장
 * @route {POST} api/dog/confirm/side/photo
 */
router.post('/confirm/side/photo', 
  sideImageUploader.single('bodyPhoto'),
  async (req, res) => {
    const apiName = '반려견 옆모습 인풋사진 저장 API';
  
    if (!req.file || !req.body.dogId || !req.body.type) {
      returnResponseCode(res, 1002, apiName, null);
    }

    //클라이언트로부터 이미지 파일을 전달받는다. 
    const file = req.file;

    console.log('file값 확장자 확인: %o', file.originalname)
    //안드로이드에서 파일 확장자가 전달되지 않아 확장자를 임의로 생성함.
    let newFilename = `${file.originalname}.jpeg`
    
    //DB에 파일명과 S3 파일 저장경로 저장
    req.body.filename = newFilename
    req.body.path = file.location
    console.log('req.body.path 값 확인 >>> ', req.body.path);

    const rows = await dogMngDB.insertDogPhoto(req.body);
    if (rows == 9999) {
      resCode.returnResponseCode(res, 9999, apiName, null);
    } else {
      resCode.returnResponseCode(res, 0000, apiName, null);
    }
})
  

//   router.get('/test2/:userId?', async (req, res) => {
//     console.log('req.params %o:', req.params);
//     const apiName = 'test2 API';
//     if (!req.params.userId) {
//       console.log('userId 값 확인:', req.params.userId);
//       resCode.returnResponseCode(res, 9999, apiName);
//     }
//     return res.send('delete~~~');
// });

  
/**
 * 3D 모델 재성성을 위한 강아지삭제 API - 사용자가 생성한 3D모델 재생성
 * @route {DELETE} api/dog/model/userId
 */
router.delete('/model/:userId?', async (req, res) => {
  const apiName = '3D 모델 재성성을 위한 강아지삭제 API';
  const userId = req.params.userId;
  console.log('userId 값 확인:', userId);
  if (!userId) {
    resCode.returnResponseCode(res, 1002, apiName, null);
  }
  
  // 반려견 재생성을 위해 DB에서 기존 강아지정보 삭제
  const list = await dogMngDB.deleteDogForRemake(userId); // 삭제할 파일 이름들
  console.log('~~list: %o', list); // err -> list:false
  if (!list) { 
    resCode.returnResponseCode(res, 1005, apiName, null);
  } 

  // S3에서 사진 삭제하기
  const data = await dogMngDB.deleteDogImage(s3, list); 
  console.log('S3에서 사진 삭제하기 data:', data); 
  if (data == 0000) { // 파일 삭제 true OR false
    resCode.returnResponseCode(res, 0000, apiName, null);

  } else if (data == 1005) {
    resCode.returnResponseCode(res, 1005, apiName, null);
  } 

  console.log('그 외 기타 에러코드'); // 에러코드는 여기로 귀결
  resCode.returnResponseCode(res, 9999, apiName, null);
})

module.exports = router;