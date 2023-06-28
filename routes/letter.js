/** 회원정보 처리 API */
const express = require('express');
const router = express.Router();
// const memberMngDB = require('../model/memberMng');
// const dogMngDB = require('../model/dogMng');
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
 * 편지작성 API 
 * @route {POST} api/letter/write
 */
router.post('/write', async (req, res) => {
  const apiName = '편지작성';
  logger.info(`${apiName} API`);
  logger.info(`POST 바디: \n${JSON.stringify(req.body, null, 2)}`);
return resCode.returnResponseCode(res, 0, apiName, null, null);

    
//   if (!req.body.loginSNSType || !req.body.email) {
//     return resCode.returnResponseCode(res, 1002, apiName, null, null);
//   }

//   const rows = await memberMngDB.insertNewMember(req.body);
//   logger.info(`insertNewMember() 리턴값: \n${JSON.stringify(rows, null, 2)}`);
//   if (rows == 9999) {
//     return resCode.returnResponseCode(res, 9999, apiName, null, null); // 이미존재하는 이메일도 9999처리. 1005메세지내용과 맞지않음
//   } else {
//     const plusResult = { user_id: rows }; // 원하는 출력 모양을 만듦
//     return resCode.returnResponseCode(res, 0, apiName, 'addToResult', plusResult); // user_id 알고싶으면 null 대신 'addToResult' 넣기
//   }
})


module.exports = router;