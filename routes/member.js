/** 회원정보 처리 API */
const express = require('express');
const router = express.Router();
const memberMngDB = require('../model/memberMng');
const dogMngDB = require('../model/dogMng');
const resCode = require('../util/resCode');
const config = require('../config/config');
const AWS = require('aws-sdk');
let s3 = new AWS.S3();
let message;

// AWS 접근키 설정
AWS.config.update({
  region: config.region,
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey
});

/**
 * 공통에러 핸들링
 */
class MissingParameterError extends Error {}
class ResponseEmptyError extends Error {}
class CommonError extends Error {}


//성공 (200, 304)
//실패 (404, 500) 공통 응답처리

//tests API
router.get('/test', async (req, res) => {
  const sql = `select * from MEMBER WHERE user_email = 'test@gmail.com';`;
  
  //1. 500에러 확인구문
  //throw new Error('member error !!!');
  //2. 다른 오류 정의 
  //throw new MissingParameterError('missing ! member_id is required');
  
  connection.query(sql, (err, rows) => {
    if (err) {
      console.log(err);
    } else {
      message = '회원가입에 성공했습니다.';
    }
    
    res.json({
      'message': message
    });
  })
})

/**
 * 회원탈퇴 정보변경 API
 * @route {POST} api/member/leave
 */
router.post('/leave', async (req, res) => {
  const apiName = '회원탈퇴 정보변경 API';
  console.log('req.body: %o', req.body);

  // 파라미터값 누락 확인
  if (!req.body.email|| !req.body.leaveReasonNum || !req.body.userId) { // POST는 비어있으면 다음과 같이 값을 넣어 반환 { email: 2, leaveReasonNum: 1, userId: 1 }
    return resCode.returnResponseCode(res, 1002, apiName, null);
  }

  // DB에서 회원정보 UPDATE, 강아지정보 DELETE
  const list = await memberMngDB.updateMemberAndDeleteDogForLeave(req.body); // 삭제할 사진이름 알아내기
  console.log('~~list: %o', list); // err -> rows:false
  if (list == 1005) { 
    return resCode.returnResponseCode(res, 1005, apiName, null);
  } else if (list == 9999) {
    return resCode.returnResponseCode(res, 9999, apiName, null);
  }
  
  // S3에서 사진 삭제하기
  console.log('list:', list); 
  const data = await dogMngDB.deleteDogImage(s3, list); 
  console.log('S3에서 사진 삭제하기 data:', data); 
  if (data == 0000) { // 파일 삭제 true OR false
    return resCode.returnResponseCode(res, 0000, apiName, null);
  } else if (data == 9999) {
    return resCode.returnResponseCode(res, 9999, apiName, null);
  }

  console.log('그 외 기타 에러코드'); // 에러코드는 여기로 귀결
  resCode.returnResponseCode(res, 9999, apiName, null);
})

/**
 * 회원정보 조회 API
 * @route {GET} api/member/:email
 * @desc 로그인에 사용
 */
router.get('/:email?', async (req, res) => {
  const apiName = '회원정보 조회 API';
  const email = req.params.email;
  if (!email) {
    return resCode.returnResponseCode(res, 1002, apiName, null);
  }

  const rows = await memberMngDB.selectMemberByEmail(email);
  console.log('rows[0]: %o', rows[0]);
  if (rows == 9999) {
    return resCode.returnResponseCode(res, 9999, apiName, null);
  } else if (rows == 1005) {
    return resCode.returnResponseCode(res, 1005, apiName, null);
  } else {
    return resCode.returnResponseCode(res, 0000, apiName, rows[0]);
    // res.json({'result': rows[0]})  // 수정하기 message에 해당 객체 출력하기
  }
})


/**
 * 회원정보 가입 API 
 * @route {POST} api/member/join
 */
router.post('/join', async (req, res) => {
  const apiName = '회원정보 가입 API';
  console.log('body %o:', req.body);
  if (!req.body.loginSNSType || !req.body.email) {
    console.log('loginSNSType %o:', req.body.loginSNSType);
    console.log('email %o:', req.body.email);
    return resCode.returnResponseCode(res, 1002, apiName, null);
  }

  const rows = await memberMngDB.insertNewMember(req.body);
  console.log(`rows: ${rows}`);
  if (rows == 9999) {
    return resCode.returnResponseCode(res, 9999, apiName, null);
  } else {
    return resCode.returnResponseCode(res, 0000, apiName, null);
  }
})


/**
 * 사용자 정보 등록 API (임시) 
 * @route {POST} api/member/dog
 */
router.post('/dog', async (req, res) => {
  const apiName = '사용자 정보 등록 API (임시)';
  console.log('req.body: %o', req.body);
  
  const rows = await memberMngDB.updateMemberInfo(req.body);
  console.log('rows: %o', rows);
  return resCode.returnResponseCode(res, 0000, apiName, null);
  // 추가예정
})



/**
 * 이용약관
*/



module.exports = router;