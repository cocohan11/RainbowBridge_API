/** 편지주고받기 및 조회 API */
const express = require('express');
const router = express.Router();
const letterMngDB = require('../model/letterMng');
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
 * 편지조회 API 
 * @route {GET} api/letter/readLetter/:user_id
 * 
 */
router.get('/readLetter/:user_id?', async (req, res) => {


    const apiName = '편지조회';
    logger.info(`${apiName} API`);
    logger.info(`user_id : ${req.params.user_id}`);

    // 응답코드 1002 : 필수파라미터 누락 오류
    if (!req.params.user_id) 
        return resCode.returnResponseCode(res, 1002, apiName, null, null);

    // DB - select문
    const rows = await letterMngDB.selectLetter(req.params.user_id);
    logger.info(`selectLetter() 리턴값: \n${JSON.stringify(rows, null, 2)}`);

    // 응답코드 0000 : 성공
    if (rows != null && rows != undefined) {
        return resCode.returnResponseCode(res, 0, apiName, 'arraylist', rows);
        
    // 응답코드 9999 : 기타 에러 코드
    } else {
        return resCode.returnResponseCode(res, 9999, apiName, null, null);
    }
})


/**
 * 편지작성 API 
 * @route {POST} api/letter/write
 */
router.post('/write', async (req, res) => {


    const apiName = '편지작성';
    logger.info(`${apiName} API`);
    logger.info(`POST 바디: \n${JSON.stringify(req.body, null, 2)}`);
    logger.info(`dog_id : ${req.body.dog_id}`);

    // 응답코드 1002 : 필수파라미터 누락 오류
    if (!req.body.user_id || !req.body.dog_id || !req.body.email || !req.body.letter_content || !req.body.dog_item || !req.body.dog_location || !req.body.member_name || !req.body.dog_name) 
        return resCode.returnResponseCode(res, 1002, apiName, null, null);

    // DB - insert문
    const result = await letterMngDB.insertNewLetter(req.body);

    // 응답코드 9999 : 기타 에러 코드
    if (result == 9999) {
        return resCode.returnResponseCode(res, 9999, apiName, null, null);
    
    // 응답코드 0000 : 성공
    } else {
        const plusResult = { letter_id: result }; // 원하는 출력 모양을 만듦
        return resCode.returnResponseCode(res, 0, apiName, "addToResult", plusResult);
    }
})


module.exports = router;