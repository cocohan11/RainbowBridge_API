/** 회원정보 처리 API */
const express = require('express');
const router = express.Router();
const memberMngDB = require('../model/memberMng');
let message;

/**
 * 공통에러 핸들링
 * 
 */
class BadRequestError extends Error {}
class MissingParameterError extends Error {}

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
 * 회원정보 조회 
 * @route {GET} api/member/:email
 * @desc 로그인에 사용
 */
router.get('/:email', async (req, res) => {
  const email = req.params.email;
  const rows = await memberMngDB.selectMemberByEmail(email);
  if (!rows[0]) {
    res.json({result: {'message': '해당되는 회원정보가 없습니다.'}})
  } else {
    res.json({'result': rows[0]})  
  }
})


/**
 * 회원정보 가입 
 * @route {POST} api/member/join
 */
router.post('/join', async (req, res) => {
  if (!req.body.loginSNSType || !req.body.email) {
    throw new MissingParameterError('필수파라미터가 누락되어있습니다!')
  }
  const rows = await memberMngDB.insertNewMember(req.body);
  message = '회원정보 등록 완료!'
  console.log(`rows: ${rows}`);
  console.log(`message: ${message}`);
  res.json({result: {message: message, userId: rows}})
})


/**
 * 사용자 정보 등록(임시)
 * @route {POST} api/member/dog
 */
router.post('/dog', async (req, res) => {
  console.log('req.body: %o', req.body);
  const rows = await memberMngDB.updateMemberInfo(req.body);
  console.log('rows: %o', rows);
  res.json({'result': {'message': '반려견정보 등록 완료!', 'dogId': rows}})
})



/**
 * 이용약관
*/



module.exports = router;