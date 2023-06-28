/** 회원정보 처리 API */
const express = require('express');
const router = express.Router();
const memberMngDB = require('../model/memberMng');
const dogMngDB = require('../model/dogMng');
const resCode = require('../util/resCode');
const AWS = require('aws-sdk');
let s3 = new AWS.S3();
let message;

//winston을 이용해 로그를 남기는 처리
const logger = require('../config/winston');

// AWS 접근키 설정
if( process.env.NODE_ENV == 'production' ) {
	AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESSKEYID,
    secretAccessKey: process.env.AWS_SECRET_ACCESSKEY
  });

} else if( process.env.NODE_ENV == 'development' ) { 
	AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESSKEYID,
    secretAccessKey: process.env.AWS_SECRET_ACCESSKEY
  });
}


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
      logger.error(`샘플 에러: \n${JSON.stringify(err, null, 2)}`);
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
  const apiName = '회원탈퇴';
  logger.info(`${apiName} API`);
  logger.info(`POST 바디: \n${JSON.stringify(req.body, null, 2)}`);

  // 파라미터값 누락 확인
  if (!req.body.email|| !req.body.leaveReasonNum || !req.body.userId) { // POST는 비어있으면 다음과 같이 값을 넣어 반환 { email: 2, leaveReasonNum: 1, userId: 1 }
    return resCode.returnResponseCode(res, 1002, apiName, null, null);
  }

  // DB에서 회원정보 UPDATE, 강아지정보 DELETE
  logger.info(`DB에서 회원정보 UPDATE, 강아지정보 DELETE`); 
  const list = await memberMngDB.updateMemberAndDeleteDogForLeave(req.body); // 삭제할 사진이름 알아내기
  logger.info(`updateMemberAndDeleteDogForLeave() 리턴값(4장의 사진명): \n${JSON.stringify(list, null, 2)}`); // 4장의 사진명
  if (list == 1005) {
    return resCode.returnResponseCode(res, 1005, apiName, null, null);
  } else if (list == 9999) {
    return resCode.returnResponseCode(res, 9999, apiName, null, null);
  } else if (list == 'undefined') { // 반려견등록을 한 번도 등록한 적 없다면 undefined가 뜸 -> 0
    logger.info(`반려견 0마리`); // 4장의 사진명
    return resCode.returnResponseCode(res, 0, apiName, null, null);
  }
  
  // S3에서 강아지사진 삭제하기
  logger.info(`S3에서 강아지사진 삭제하기`); 
  if (list[0] != null || list != undefined) {
    logger.info(`반려견 최소 1마리`); 
    if (list[0].fvFilename != null) {
      return resCode.returnResponseCode(res, 9999, apiName, null, null);
    }
    const data = await dogMngDB.deleteDogImage(s3, list); 
    logger.info(`deleteDogImage() 리턴값: ${data}`); 
    if (data == 0) { 
      return resCode.returnResponseCode(res, 0, apiName, null, null);
    } else if (data == 9999) {
      return resCode.returnResponseCode(res, 9999, apiName, null, null);
    } else if (data == 1005) {
      return resCode.returnResponseCode(res, 1005, apiName, null, null);
    }
  }

  logger.info(`그 외 기타 에러코드는 9999로 귀결`); 
  resCode.returnResponseCode(res, 9999, apiName, null, null);
})

/**
 * 회원정보 조회 API
 * @route {GET} api/member/:email
 * @desc 로그인에 사용
 */
router.get('/:email?', async (req, res) => {
  const apiName = '회원정보 조회';
  const email = req.params.email;
  logger.info(`${apiName} API`);
  logger.info(`파라미터: \n${JSON.stringify(req.params, null, 2)}`);
  if (!email || email==",") { // swagger빈값에러때문에 ","를 조건문에 추가함
    resCode.returnResponseCode(res, 1002, apiName, null, null);
  }

  const rows = await memberMngDB.selectMemberByEmail(s3, email);
  logger.info(`selectMemberByEmail() 리턴값: \n${JSON.stringify(rows, null, 2)}`);

  // console.log('member.js rows[0]: %o', rows[0]); // 중복! 테스트할 때만 임시주석
  if (rows == 9999) {
    resCode.returnResponseCode(res, 9999, apiName, null, null);
  } else if (rows == 1005) {
    resCode.returnResponseCode(res, 1005, apiName, null, null);
  } else {
    resCode.returnResponseCode(res, 0, apiName, 'addToResult', rows);
    // return resCode.returnResponseCode(res, 0, apiName, 'addToResult', rows[0]); // 중복! 테스트할 때만 임시주석
  }
})


/**
 * 회원정보 가입 API 
 * @route {POST} api/member/join
 */
router.post('/join', async (req, res) => {
  const apiName = '회원정보 가입';
  logger.info(`${apiName} API`);
  logger.info(`POST 바디: \n${JSON.stringify(req.body, null, 2)}`);
  if (!req.body.loginSNSType || !req.body.email) {
    return resCode.returnResponseCode(res, 1002, apiName, null, null);
  }

  const rows = await memberMngDB.insertNewMember(req.body);
  logger.info(`insertNewMember() 리턴값: \n${JSON.stringify(rows, null, 2)}`);
  if (rows == 9999) {
    return resCode.returnResponseCode(res, 9999, apiName, null, null); // 이미존재하는 이메일도 9999처리. 1005메세지내용과 맞지않음
  } else {
    const plusResult = { user_id: rows }; // 원하는 출력 모양을 만듦
    return resCode.returnResponseCode(res, 0, apiName, 'addToResult', plusResult); // user_id 알고싶으면 null 대신 'addToResult' 넣기
  }
})





/**
 * 이용약관
*/



module.exports = router;