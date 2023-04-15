/** 회원정보 처리 API */
const express = require('express');
const router = express.Router();
const memberMngDB = require('../model/memberMng');
const dogMngDB = require('../model/dogMng');
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
 * 회원탈퇴 정보변경 
 * @route {POST} api/member/leave
 */
router.post('/leave', async (req, res) => {
  console.log('req.body: %o', req.body);

  // 파라미터값 누락 확인
  if (!req.body.email || !req.body.leaveReasonNum || !req.body.userId) {
    const message = '필수파라미터가 누락되어있습니다!'
    return res.status(400).json({
      result: {
        code: '1002', message
      }
    })
  }

  // DB에서 회원정보 UPDATE, 강아지정보 DELETE
  const list = await memberMngDB.updateMemberAndDeleteDogForLeave(req.body); // 삭제할 사진이름 알아내기
  console.log('~~list: %o', list); // err -> rows:false
  console.log('~~list[0]: %o', list[0]); // rows[0]:{ fvFilename: 'start.png', svFilename: 'text.jpg' } 
  if (!list) { 
    const message = '해당되는 정보가 없습니다.' // 리스트 조회시 빈값일때
    return res.status(404).json({
      result: {
        code: '1005', message
      }
    }) 
  } 
  
  // S3에서 사진 삭제하기
  console.log('list:', list); 
  const data = await dogMngDB.deleteDogImage(s3, list); 
  console.log('S3에서 사진 삭제하기 data:', data); 
  if (data) { // 파일 삭제 true OR false
    const message = '회원탈퇴가 성공적으로 처리 되었습니다.' // 최종 성공시 보이는 문구
    return res.status(200).json({
      result: {
        code: '0000', message: message
      }
    });
  } 

  console.log('그 외 기타 에러코드'); // 에러코드는 여기로 귀결
  message = '회원탈퇴에 실패하였습니다. '
  return res.json({
    result: {
      code: '9999', message : message
    }
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
  console.log('rows[0]: %o', rows[0]);
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