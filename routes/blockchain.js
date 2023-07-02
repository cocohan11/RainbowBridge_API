/** 편지주고받기 및 조회 API */
const express = require('express');
const router = express.Router();
const blockchainMngDB = require('../model/blockchainMng');
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
 * 블록체인 지갑주소 등록 API 
 * @route {POST} api/blockchain/wallet
 */
router.post('/wallet', async (req, res) => {


    const apiName = '블록체인 지갑주소 등록';
    logger.info(`${apiName} API`);
    logger.info(`POST 바디: \n${JSON.stringify(req.body, null, 2)}`);
    logger.info(`user_id : ${req.body.user_id}`);
    logger.info(`wallet_address : ${req.body.wallet_address}`);

    // 응답코드 1002 : 필수파라미터 누락 오류
    if (!req.body.user_id || !req.body.wallet_address) 
        return resCode.returnResponseCode(res, 1002, apiName, null, null);

    // DB - insert문
    const result = await blockchainMngDB.insertWalletAddress(req.body);

    // 응답코드 9999 : 기타 에러 코드
    if (result == 9999) {
        return resCode.returnResponseCode(res, 9999, apiName, null, null);
    
    // 응답코드 0000 : 성공
    } else {
        const plusResult = { blockchain_id: result }; // 원하는 출력 모양을 만듦
        return resCode.returnResponseCode(res, 0, apiName, "addToResult", plusResult);
    }
})



/**
 * 블록체인 토큰ID 등록 API 
 * @route {POST} api/blockchain/token
 */
router.post('/token', async (req, res) => {


    const apiName = '블록체인 지갑주소 등록';
    logger.info(`${apiName} API`);
    logger.info(`POST 바디: \n${JSON.stringify(req.body, null, 2)}`);
    logger.info(`user_id : ${req.body.user_id}`);
    logger.info(`token_id : ${req.body.token_id}`);


    // 응답코드 1002 : 필수파라미터 누락 오류
    if (!req.body.user_id || !req.body.token_id) 
        return resCode.returnResponseCode(res, 1002, apiName, null, null);

    // DB - insert문
    const result = await blockchainMngDB.updateTokenId(req.body);

    // 응답코드 1005 : 빈값일때
    if (result == 1005) {
        return resCode.returnResponseCode(res, 1005, apiName, null, null);
    
    // 응답코드 0000 : 성공
    } else if (result == 0) {
        return resCode.returnResponseCode(res, 0, apiName, null, null);
        
    // 응답코드 9999 : 기타 에러 코드
    } else {
        return resCode.returnResponseCode(res, 9999, apiName, null, null);
    }
})



/**
 * 블록체인 정보조회 API 
 * @route {GET} api/blockchain/info/:user_id
 */
router.get('/info/:user_id?', async (req, res) => {


    const apiName = '블록체인 정보조회';
    logger.info(`${apiName} API`);
    logger.info(`user_id : ${req.params.user_id}`);


    // 응답코드 1002 : 필수파라미터 누락 오류
    if (!req.params.user_id) 
        return resCode.returnResponseCode(res, 1002, apiName, null, null);

    // DB - select문
    const result = await blockchainMngDB.selectBlockchainInfo(req.params);
    logger.info(`selectBlockchainInfo() 리턴값: \n${JSON.stringify(result, null, 2)}`);

    // 응답코드 9999 : 기타 에러 코드
    if (result == 9999) {
        resCode.returnResponseCode(res, 9999, apiName, null, null);
    
    // 응답코드 1005 : 빈값일때
    } else if (result == 1005) {
        resCode.returnResponseCode(res, 1005, apiName, null, null);

    // 응답코드 0000 : 성공
    } else {
        resCode.returnResponseCode(res, 0, apiName, 'addToResult', result[0]);
    }
    

})



module.exports = router;