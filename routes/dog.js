/** 반려견모델생성 처리관련 API */
const express = require('express');
// multipart/form-data 를 다루기 위한 node.js 의 미들웨어
const multer = require('multer');
const multerS3  = require('multer-s3')
const router = express.Router();
const dogMngDB = require('../model/dogMng');
const config = require('../config/config');

const upload = multer({ dest: 'uploads/' })
//파일경로를 읽기 위해 사용
const path = require("path");

//파일 읽기처리를 위해 사용
const fs = require('fs');

// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');

// AWS 접근키 설정
AWS.config.update({
  region: config.region,
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey
});

//
const s3 = new AWS.S3();

//업로드 가능한 포맷설정
const allowedExtensions = ['.png', '.jpg', '.jpeg', '.bmp']

//버킷변경테스트
const frontImageUploader = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'user-input-photo/front', //생성할 버킷 디렉토리
    key: (req, file, callback) => {
      //const uploadDirectory = req.query.directory ?? '' //업로드할 디렉토리를 설정하기 위한 코드. 없어도 무관
      
      //안드로이드에서 파일 확장자가 전달되지 않아 확장자를 임의로 생성함.
      let newFilename = `${file.originalname}.jpeg`
      
      //extname = 경로의 마지막 '.'에서 마지막 부분의 문자열 끝까지의 확장을 반환합니다. 
      // 경로의 마지막 부분에 '.'가 없거나 경로의 첫 번째 문자가 '.'인 경우 빈 문자열을 반환합니다.
      const extenstion  = path.extname(newFilename)
      console.error(`extenstion : ${extenstion}`);

      //extion을 확인하기 위한 코드로 없어도 무관함. 허용되지 않는 확장자면 에러발생됨.
      if (!allowedExtensions.includes(extenstion)) {
        console.error('파일의 확장자가 없습니다.');
        return callback(new Error('wrong extenstion'))
      }
      //원래코드
      //callback(null, `${uploadDirectory}/${Date.now()}_${file.originalname}`) 
      //변경코드
      //업로드 기능(null, '업로드경로')
      callback(null, `${Date.now()}_${newFilename}`)
    },
    ContentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read-write' //권한 관련 설정
  })
})




//앞모습 이미지 버킷 업로드 함수
//추후 갤러리뷰 개발이 변경되면, 확장자가 불러오도록 처리가 될 수도 있어서 
//원래 코드는 주석처리해둔 상태로 놔둠.
const frontImageUploader2 = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'input-photo-front', //생성한 버킷이름
    key: (req, file, callback) => {
      const uploadDirectory = req.query.directory ?? '' //업로드할 디렉토리를 설정하기 위한 코드. 없어도 무관
      
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
      callback(null, `${uploadDirectory}/${Date.now()}_${newFilename}`)
    },
    ContentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read-write' //권한 관련 설정
  })
})

//옆모습 이미지 버킷 업로드 함수
//추후 갤러리뷰 개발이 변경되면, 확장자가 불러오도록 처리가 될 수도 있어서 
//원래 코드는 주석처리해둔 상태로 놔둠.
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
 * 
 * 클라이언트에서 받은 이미지를 파일로 저장하기 위해 multer 라이브러리 사용
 * 인자값 설명
  - multer({storage: _storage}) : storage를 설정해, 파일을 저장하게 한다
  - single : 지정된 form 필드와 연결된 단일 파일을 처리하는 미들웨어를 반환 (req.file로 전달되는 명)
 */

/**
 * 반려견 앞모습 인풋사진 저장 API
 *  1) AWS S3에 반려견 인풋사진 업로드
 *  2) DB에 S3 저장경로와 파일명 저장
 * @route {POST} api/dog/confirm/front/photo
 */
router.post('/confirm/front/photo', 
  frontImageUploader.single('photo'),
  async (req, res) => {
  console.log('클라이언트로부터 전달받은 이미지 파일값: %o', req.file);
  console.log('클라이언트로부터 전달받은 바디값: %o', req.body);

  //클라이언트로부터 이미지 파일을 전달받는다. 
  const file = req.file;

  //안드로이드에서 파일 확장자가 전달되지 않아 확장자를 임의로 생성함.
  let newFilename = `${file.originalname}.jpeg`

  let originalName = '';
  let fileName = '';
  let mimeType = '';
  let size = 0;

  if(file){
    originalName = file.originalname;
    fileName = file.filename;
    mimeType = file.mimetype;
    size = file.size;
  } 
  
  //DB에 파일명과 S3 파일 저장경로 저장
  req.body.filename = newFilename
  req.body.path = file.location

  const rows = await dogMngDB.insertDogPhoto(req.body);
  console.log(rows);
  res.json({result: {'message': '이미지 업로드 처리 성공!!'}})
})


/**
 * 반려견 옆모습 인풋사진 저장 API
 *  1) AWS S3에 반려견 인풋사진 업로드
 *  2) DB에 S3 저장경로와 파일명 저장
 * @route {POST} api/dog/confirm/side/photo
 */
router.post('/confirm/side/photo', 
  sideImageUploader.single('photo'),
  async (req, res) => {
  console.log('클라이언트로부터 전달받은 이미지 파일값: %o', req.file);
  console.log('클라이언트로부터 전달받은 바디값: %o', req.body);

  //클라이언트로부터 이미지 파일을 전달받는다. 
  const file = req.file;

  //안드로이드에서 파일 확장자가 전달되지 않아 확장자를 임의로 생성함.
  let newFilename = `${file.originalname}.jpeg`

  let originalName = '';
  let fileName = '';
  let mimeType = '';
  let size = 0;

  if(file){
    originalName = file.originalname;
    fileName = file.filename;
    mimeType = file.mimetype;
    size = file.size;
  } 
  
  //DB에 파일명과 S3 파일 저장경로 저장
  req.body.filename = newFilename
  req.body.path = file.location

  const rows = await dogMngDB.insertDogPhoto(req.body);
  console.log(rows);
  res.json({result: {'message': '이미지 업로드 처리 성공!!'}})
})


/**
 * 3D 모델 생성 API
 *  1) 텍스처를 입힌 3D모델을 생성하기 위한 API
 * @route {POST} /api/dog/model
 */
router.post('/model', async (req, res) => {
  console.log('클라이언트로부터 전달받은 바디값: %o', req.body);

  //@TODO = test로 userid - 3, breedType = 1 조회
  //클라이언트로부터 이미지 파일을 전달받는다. 
  //const file = req.file;
  
  /** 
   * @TODO 인공지능 API 요청로직 (비동기) 후 fbx 모델파일을 응답 받은 뒤, 아래로직 처리
   * 
   *  < 인공지능에서 응답된 3D모델 저장 >
      1. s3에 fbx 파일 업로드 
      2. dB member, dog 테이블에 email. userid, dogid, s3에 업로드된 model URL 업데이트  
      3. 유저에 해당되는 3d 모델 응답처리
  */


  //응답예시
  res.json({result: "https://input-photo-front.s3.ap-northeast-2.amazonaws.com/dogModel/maltise.fbx"})
})



/**
 * 3D 모델 조회 API - 사용자가 생성한 3D모델 응답
 * @route {GET} api/dog/model/email
 */
router.get('/model/:email', async (req, res) => {
  const email = req.params.email;
  console.log('email 값 확인: %o', email);

    /**
     *@TODO - 모델 응답로직 
    */

  //응답예시
  res.json({result: "https://input-photo-front.s3.ap-northeast-2.amazonaws.com/dogModel/maltise.fbx"})
})


/**
 * 3D 모델 재성성 API - 사용자가 생성한 3D모델 재생성
 * @route {DELETE} api/dog/model/email
 */
router.delete('/model/:email', async (req, res) => {
  const email = req.params.email;
  console.log('email 값 확인: %o', email);

  /**
   *@TODO - 모델 삭제로직 
   */

  //응답예시
  res.json({result: "성공적으로 삭제했습니다."})
})




// 버킷업로드 테스트 - 개발완료 될때까지 지우지 않고 유지할 예정
router.post('/test/photo', 
  sideImageUploader.single('photo'),
  async (req, res) => {
  console.log('클라이언트로부터 전달받은 이미지 파일값: %o', req.file);
  console.log('클라이언트로부터 전달받은 바디값: %o', req.body);

  //클라이언트로부터 이미지 파일을 전달받는다. 
  const file = req.file;

  //안드로이드에서 파일 확장자가 전달되지 않아 확장자를 임의로 생성함.
  let newFilename = `${file.originalname}.jpeg`

  let originalName = '';
  let fileName = '';
  let mimeType = '';
  let size = 0;

  if(file){
    originalName = file.originalname;
    fileName = file.filename;
    mimeType = file.mimetype;
    size = file.size;
  } 
  
  //DB에 파일명과 S3 파일 저장경로 저장
  req.body.filename = newFilename
  req.body.path = file.location

  //const rows = await dogMngDB.insertDogPhoto(req.body);
  //console.log(rows);
  res.json({result: {'message': '이미지 업로드 처리 성공!!'}})
})




module.exports = router;