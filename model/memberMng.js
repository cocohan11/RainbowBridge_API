const dbPool = require('../util/dbPool');
//카멜케이스로 DB컬럼값을 응답하기 위한 모듈 선언
const camelcaseKeys = require('camelcase-keys');
const connection = dbPool.init();
const logger = require('../config/winston');



let message; //응답 메세지 전역변수 선언

function memberMng() {
}

//mysql구문을 순차적으로 실행하기위해 사용하는 함수
memberMng.prototype.mySQLQuery = (query) => {
  return new Promise(function(resolve, reject) {
      try {
        connection.query(query.text, query.params, function(err, rows, fields) {
              if (err) {
                  return reject(err);
              } else {
                  //순차적으로 실행하면 반환되는 행을 관리
                  return resolve(camelcaseKeys(rows));
              }
          });
      } catch (err) {
          return reject(err);
      }
  })
};
function mySQLQuery(query) {
  return new Promise(function(resolve, reject) {
      try {
        connection.query(query.text, query.params, function(err, rows, fields) {
              if (err) {
                  return reject(err);
              } else {
                  //순차적으로 실행하면 반환되는 행을 관리
                  return resolve(camelcaseKeys(rows)); //카멜케이스로 응답해달라는 요구받음
              }
          });
      } catch (err) {
          return reject(err);
      }
  })
};


/**
 * 샘플
 * @returns 
 */
memberMng.prototype.selectMemberList = () => {
  const sql = `SELECT * FROM MEMBER WHERE user_email = 'test@gmail.com';`;
  
  return new Promise((resolve, reject) => {
    
    connection.query(sql, (err, rows) => {
      //throw error test
      //return reject(new Error('member error !!!'));
      if (err) {
        logger.warn(`샘플 에러: ${err}`)
        return reject(new Error('회원조회 오류 발생 !!!'));
      } else {
        message = '회원가입에 성공했습니다.';
        return resolve(camelcaseKeys(rows), message);
      }
    })
  })
}



// 회원탈퇴
// 1. 쿼리1) DB에서 회원탈퇴 처리
// 2. 쿼리2) DB에서 강아지정보 삭제
memberMng.prototype.updateMemberAndDeleteDogForLeave = (query) => {
  if (!query.leaveReasonCtx) {
    query.leaveReasonCtx = null;
  }
  // 쿼리1. 회원탈퇴 처리
  const updateMemberInfo = {
    text: `UPDATE MEMBER 
            SET mem_type = 'L',
            leave_reason_num = ?,
            leave_at = now(),
            leave_reason = ?
            WHERE user_id = ? and user_email = ?`, 
    params : [query.leaveReasonNum, query.leaveReasonCtx, query.userId, query.email] // 탈퇴사유가 없는 요청은 query.leaveReasonCtx null이다.
  }
  // 쿼리2. DB에서 탈퇴한 사용자의 강아지정보삭제
  const deleteDog = { 
    text: `SELECT fv_filename, sv_filename, fv_txt_filename, sv_txt_filename FROM DOG WHERE user_id = ?; 
           DELETE FROM DOG WHERE user_id = ?;`, // 강아지 row 삭제
    params : [query.userId, query.userId]
  };

  return new Promise((resolve, reject) => {
    mySQLQuery(updateMemberInfo) // 쿼리1 실행
    .then((res1) => { // res:mySQLQuery의 결과 
      if (res1.changedRows == 1) { // 수정) changedRows값이 0이 아닌걸로 조건문 수정하기
            logger.info(`MEMBER테이블 변경 성공. DOG테이블에서 강아지정보삭제해라.`);
            return mySQLQuery(deleteDog); // 문제) 두 번째 쿼리의 에러발생시 catch문으로 안 가고 동작이 멈춰버렸음
                                          // 해결) return mySQLQuery(deleteDog); 추가
      } else {
        return resolve(1005); 
      }
    })
    .then((res2) => {
      // logger.info(`DOG테이블 삭제 성공. 사진4개: ${res2[0][0]}`); // {fvFilename, svFilename ..}
      if (res2[0][0] == undefined) { // 반려견등록을 한 번도 한 전 없다면 undefined가 뜸 -> 0000
        logger.info(`반려견등록을 한 번도 한 적 없다.`);
        return resolve('undefined');
      } else {
        return resolve([res2[0][0]]);
      }
    })
    .catch((err) => {
      logger.warn(`쿼리 updateMemberInfo 또는 deleteDog 에러 : \n${JSON.stringify(err, null, 2)}`);
      return resolve(9999); 
    });
  });
}


//DB에서 회원정보 SELECT
memberMng.prototype.selectMemberByEmail = async (s3, query) => { 

  let user_id = 0;
  function selectMemberInfo(query) {
    return {
      text: `SELECT * FROM MEMBER 
             WHERE user_email = ? and mem_type = 'N'`, 
      params: [query] 
    };
  }
  function selectS3fileName(user_id) {
    return {
      text: `SELECT fv_filename, sv_filename, fv_txt_filename, sv_txt_filename
              FROM DOG
              left join MEMBER
              ON DOG.user_id = MEMBER.user_id
              WHERE DOG.user_id = ?
              ORDER BY dog_id DESC
			        LIMIT 1`, // 중복때문에 추가했지만 있어도 상관없음
      params : [user_id] 
    };
  }

  // 해당이메일의 사용자가 존재하는지, 사용자의 강아지가 존재하는지 확인
  return new Promise((resolve, reject) => {
    mySQLQuery(selectMemberInfo(query)) // 쿼리1 실행
    .then((res1) => { // res:mySQLQuery의 결과 
      logger.info(`이메일 갯수 : ${res1.length} `);

      if (res1.length == 1) { 
        user_id = res1[0].userId;
        logger.info(`이메일 있음. userId : ${user_id}`);
        return mySQLQuery(selectS3fileName(user_id)); // 텍스처까지 생성된 완성형 반려견모델인지 확인해서 isModelCreated:1응답하기
      } else if (res1.length == 0) { 
        logger.info(`이메일 없음.`);
        return resolve(1005);
      }
      else { // 중복! 
        // return resolve(9999); //중복테스트할 때만 주석하기 //<-주석풀면 아래내용을 주석하기
        if (query == '중복test_hj@gmail.com') user_id = process.env.TEST_HJ_USER_ID; // 중복! 테스트계정지정
        if (query == '중복asdf4777@naver.com') user_id = process.env.TEST_ASDF_USER_ID; 
        if (query == '중복alswnsdlqkqh@hanmail.net') user_id = process.env.TEST_QKQH_USER_ID; 
        if (query == '중복kmj87664966@gmail.com') user_id = process.env.TEST_MJ_USER_ID; 
        if (query == '중복test_wk@gmail.com') user_id = process.env.TEST_WK_USER_ID; 
        user_id = res1[res1.length-1].userId; // (테스트)이메일 여러개있으면 맨 마지막으로 생성된 계정으로 조회하기
        logger.info(`이메일 중복. userId : ${user_id}`);
        return mySQLQuery(selectS3fileName(user_id)); // 텍스처까지 생성된 완성형 반려견모델인지 확인해서 isModelCreated:1응답하기
      }
    })
      
    // DOG테이블에서 반려견모델 조회
      .then((res2) => {
      logger.info(`DOG테이블에서 반려견모델 조회. res2 : ${res2}`); // {fvFilename, svFilename ..}
        
      // 반려견 모델을 아예 만든 적 없음 ~ 텍스처생성직전까지 오는 곳
      // isModelCreated:0 리턴
      if (res2[0] == null || res2[0].fvFilename == undefined || res2[0].svFilename == undefined || res2[0].fvTxtFilename == undefined || res2[0].svTxtFilename == undefined) {
        logger.info(`텍스처까지 생성된 완성형 반려견모델X`); 
        getMemberInfo(0, user_id) // 회원정보+모델이 생성된 적 없다.             
          .then(res2 => {
            resolve(res2[0]);
          })
          .catch(error => {
            reject(error);
          });
        
      // 텍스처까지 생성된 완성형 반려견모델이라면 
      // isModelCreated:1 리턴
      } else {
        logger.info(`텍스처까지 생성된 완성형 반려견모델O`); 
        /** 
          S3에서 해당 파일이 있는지 조회하기
          S3에 없는 파일명이면 응답코드0000, isModelCreated=0
          S3에 있는 파일명이면 응답코드0000, isModelCreated=1
        */ 
          checkExists(s3, res2[0]) // 동기처리
          .then(res3 => {
            if (res3 == 0) {  
              getMemberInfo(1, user_id) // s3에도 존재O
                .then(res3 => {
                  resolve(res3[0]);
                })
                .catch(err => {
                  logger.warn(`selectMemberByEmail() 에러 : \n${JSON.stringify(err, null, 2)}`);
                  reject(err);
                });
              
            } else if (res3 == 1005) { // s3에 존재X.
              getMemberInfo(0, user_id) 
              .then(res3 => { resolve(res3[0]); })
                .catch(err => {
                  logger.warn(`selectMemberByEmail() 에러 : \n${JSON.stringify(err, null, 2)}`);
                  reject(err);
                });
            } else { resolve(9999); }
          })
            .catch(err => {
              logger.warn(`selectMemberByEmail() 에러 : \n${JSON.stringify(err, null, 2)}`);
              reject(err);
            });
      }
    })
      .catch((err) => {
        logger.warn(`selectMemberByEmail() 에러 : \n${JSON.stringify(err, null, 2)}`);
      });
  });
  
  // 보여지는 출력값
  async function getMemberInfo(isModelCreated, user_id) {
    const sql_2 = `
    SELECT m.user_id AS userId, m.login_sns_type AS loginSnsType, m.mem_type AS memType, m.user_email AS userEmail,
      m.nickname, m.created_at AS createdAt, m.leave_at AS leaveAt, m.leave_reason_num AS leaveReasonNum, m.leave_reason,
      d.dog_name AS dogName, d.dog_id AS dogId, db.breed_type_en AS dogBreedName, d.fv_txt_filename, d.sv_txt_filename,
      ? as isModelCreated 
      FROM MEMBER m
      LEFT JOIN DOG d ON m.user_id = d.user_id
      LEFT JOIN DOG_BREED db ON d.breed_type = db.breed_id
      WHERE m.user_id = ?
    `;
    const rows_2 = await new Promise((resolve, reject) => {
      connection.query(sql_2, [isModelCreated, user_id], (err, rows) => {
        if (err) {
          logger.warn(`getMemberInfo() 에러 : \n${JSON.stringify(err, null, 2)}`);
          resolve(9999);
        } else {
          if (!rows) resolve(1005);
          logger.info(`반려견 마리 수 : ${rows.length} `);
          
          // 임시!` fv_txt_filepath, sv_txt_filepath컬럼만들어서 값 삽입되면 다시 돌려놓기
          const result = JSON.parse(JSON.stringify(rows[rows.length - 1])); // RowDataPacket형식없애서 속성변경할 수 있도록 함
          if (result.fv_txt_filename != null) result['fvTxtFilename'] = process.env.FV_TEXT_FILE_PATH + result.fv_txt_filename; // 'https://user-input-texture-photo-prod.s3.ap-northeast-2.amazonaws.com/front/Face_result_image_96069e9a-f744-4678-92bf-01f2ef662c08.png'
          else result['fvTxtFilename'] = null;
          if (result.fv_txt_filename != null) result['svTxtFilename'] = process.env.SV_TEXT_FILE_PATH + result.sv_txt_filename;
          else result['svTxtFilename'] = null;
          
          // 기존 프로퍼티 제거
          delete result['fv_txt_filename'];
          delete result['sv_txt_filename'];
          // 이름 변경 후 
          logger.info(`텍스처 앞모습 이름 변경 후 : \n${JSON.stringify(result['fvTxtFilename'], null, 2)}`);  // {name: '둘리', age: 20, money: 20000} -> {name: '둘리', age: 20, salary: 20000}
          logger.info(`텍스처 옆모습 이름 변경 후 : \n${JSON.stringify(result['svTxtFilename'], null, 2)}`);  // {name: '둘리', age: 20, money: 20000} -> {name: '둘리', age: 20, salary: 20000}

          if (rows.length == 1) { 
            resolve(camelcaseKeys([result]));
          } else if (rows.length == 0) {
            resolve(camelcaseKeys([result])); // 중복! 테스트끝나면 주석처리하기
          } else {
            resolve(camelcaseKeys([result]));
          }
        }
      });
    });
    return rows_2; // 응답코드뿐만 아니라 회원정보까지 Promise로 리턴
  }
};


//DB에 회원정보 INSERT
memberMng.prototype.insertNewMember = (query) => {
  function isExitMember(query) {
    return {
      text: `SELECT * FROM MEMBER
              WHERE user_email = ? and mem_type = 'N' `, 
      params: [query.email] 
    };
  }
  function insertMember(query) {
    return {
      text: `INSERT INTO MEMBER 
              (login_sns_type, mem_type, leave_reason_num, user_email, created_at) 
              VALUES (?, \'N\', 0, ?, NOW())`, 
      params: [query.loginSNSType, query.email] 
    };
  }

  // 중복테스트면 계정1개바로추가, 아니면 이메일존재확인 후 계정추가 (주석필요는 없음)
  if ( query.email == '중복test_hj@gmail.com'
    || query.email == '중복asdf4777@naver.com'
    || query.email == '중복alswnsdlqkqh@hanmail.net'
    || query.email == '중복kmj87664966@gmail.com'
    || query.email == '중복test_wk@gmail.com'
  ) { // 중복! 테스트계정지정
    return new Promise((resolve, reject) => {
      mySQLQuery(insertMember(query)) // 쿼리1 실행
      .then((res) => { // MEMBER테이블에 회원가입 완료
        return resolve(res.insertId);
      })
      .catch((err) => {
        logger.warn(`insertNewMember() err: ${err} `);
      return resolve(9999); 
      });
    }); 
  
  } else {
    // 회원가입 가능한지 확인
    return new Promise((resolve, reject) => {
      mySQLQuery(isExitMember(query)) // 쿼리1 실행
      .then((res1) => { // res:mySQLQuery의 결과 
        logger.info(`해당 이메일로 회원가입 한 사람의 수: ${res1.length}`);
        if (res1.length == 0) {
          return mySQLQuery(insertMember(query)); 
        } else {
          return resolve(9999); // 이미존재하는 이메일도 9999처리. 1005메세지내용과 맞지않음
        }
      })
      // MEMBER테이블에 회원가입 완료
      .then((res2) => {
        return resolve(res2.insertId); 
      })
      .catch((err) => {
        logger.warn(`insertNewMember() err: ${err} `);
        return resolve(9999); 
      });
    });
  }
}


// S3에서 파일명으로 사진존재유무 확인하기
async function checkExists(s3, item) { // 수정예정
  logger.info(`checkExists() item: \n${JSON.stringify(item, null, 2)}`);
  let bucketPathList = [];
  bucketPathList.push({ Bucket: process.env.S3_BUCKET_PHOTO, Key: `front/${item.fvFilename}` })
  bucketPathList.push({ Bucket: process.env.S3_BUCKET_PHOTO, Key: `side/${item.svFilename}` })
  bucketPathList.push({ Bucket: process.env.S3_BUCKET_TEXTURE_PHOTO, Key: `front/${item.fvTxtFilename}` })
  bucketPathList.push({ Bucket: process.env.S3_BUCKET_TEXTURE_PHOTO, Key: `side/${item.svTxtFilename}` })

  const promises = [];
  bucketPathList.forEach((value, index, array) => {

    // 1개씩 조회
    promises.push(
      new Promise((resolve, reject) => {
        s3.headObject(value, function (err, exists_data) { // 1개일때만 조회됨

          if (err) {
            logger.warn(`File ${value.Key} does not exist.`);
            resolve(false); // 사진없음
          } else {
            logger.info(`File ${value.Key} exists. checking...`);

            if (exists_data == null) {
              logger.warn(`File ${value.Key} does not exist.`);
              reject(`File ${value.Key} does not exist.`);
            } else {
              resolve(true); // 사진있음
            }
          }
        });
      })
    );
  });
  
  return Promise.all(promises)
    .then((res) => {
      logger.info(`사진유무) 1.사용자가 전송한 사진 앞:${res[0]} 2.뒤:${res[1]} 3.텍스처사진 얼굴:${res[2]} 4.몸:${res[3]}`);
      if (res[0] == true && res[1] == true && res[2] == true && res[3] == true) { // 회원조회할 때 사진 4개다 있으면 isModelCreated값이 1로 리턴한다.
        return 0;
      } else {
        return 1005; // 사진이 1개라도 조회되지않으면 빈값응답코드 리턴
      }
    })
    .catch((err) => {
      logger.warn('File does not exist. Cannot delete.');
      throw err;
    });
}


//memberMng 모듈 export 
module.exports = new memberMng();
