//커밋을 위한 주석
const dbPool = require('../util/dbPool');
//카멜케이스로 DB컬럼값을 응답하기 위한 모듈 선언
const camelcaseKeys = require('camelcase-keys');
const connection = dbPool.init();



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
        console.log(err)
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
  console.log('..query : %o', query); 
  if (!query.leaveReasonCtx) {
    query.leaveReasonCtx = null;
  }
  console.log('..query.leaveReasonCtx : %o', query.leaveReasonCtx);
  
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
      console.log('res1 : %o', res1);
      console.log('res1 changedRows: %o', res1.changedRows); // 쿼리2 실행
      if (res1.changedRows == 1) { // 수정) changedRows값이 0이 아닌걸로 조건문 수정하기
        return mySQLQuery(deleteDog); // 문제) 두 번째 쿼리의 에러발생시 catch문으로 안 가고 동작이 멈춰버렸음
                                      // 해결) return mySQLQuery(deleteDog); 추가
      } else {
        return resolve(1005); 
      }
    })
    .then((res2) => {
      console.log('res2 ㅡㅡ : %o', res2); // {fvFilename, svFilename ..} 
      console.log('res2[0][0]!! ㅡㅡ : %o', res2[0][0]); // {fvFilename, svFilename ..}
      if (res2[0][0] == undefined) { // 반려견등록을 한 번도 한 전 없다면 undefined가 뜸 -> 0000
        console.log('undefined 나옴'); 
        return resolve('undefined');
      } else {
        return resolve([res2[0][0]]);
      }
    })
    .catch((err) => {
      console.log('err:'+err)
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
      console.log('query... : %o', query);
      console.log('res11 : %o', res1);
      console.log('res11 length : %o', res1.length);

      if (res1.length == 1) { 
        console.log('이멜있음');
        console.log('이멜있음', res1[0].userId);
        user_id = res1[0].userId;
        console.log('user_id :', user_id);
        return mySQLQuery(selectS3fileName(user_id)); // 텍스처까지 생성된 완성형 반려견모델인지 확인해서 isModelCreated:1응답하기
      } else if (res1.length == 0) { 
        console.log('이멜없음');
        return resolve(1005);
      }
      else { // 중복! 
        // return resolve(9999); //중복테스트할 때만 주석하기 //<-주석풀면 아래내용을 주석하기
        if (query == 'test_hj@gmail.com') user_id = 42; // 테스트계정지정
        if (query == 'asdf4777@naver.com') user_id = 254; 
        console.log('중복! user_id :', user_id);
        return mySQLQuery(selectS3fileName(user_id)); // 텍스처까지 생성된 완성형 반려견모델인지 확인해서 isModelCreated:1응답하기
      }
    })
      
    // DOG테이블에서 반려견모델 조회
    .then((res2) => {
      console.log('DOG테이블에서 반려견모델 조회 res2 : %o', res2); // {fvFilename, svFilename ..}
      if (res2 == null)  console.log('if (res2 == null)');
      if (res2 == undefined)  console.log('if (res2 == undefined)');
      if (res2[0] == null)console.log('if (res2[0] == null)');
      if (res2[0] == undefined)   console.log('if (res2[0] == undefined)');
        
      // 반려견 모델을 아예 만든 적 없음 ~ 텍스처생성직전까지 오는 곳
      // isModelCreated:0 리턴
      if (res2[0] == null || res2[0].fvFilename == undefined || res2[0].svFilename == undefined || res2[0].fvTxtFilename == undefined || res2[0].svTxtFilename == undefined) {
        console.log('텍스처까지 생성된 완성형 반려견모델X 1');
        getMemberInfo(0, user_id) // 회원정보+모델이 생성된 적 없다.             
          .then(res2 => {
            console.log('텍스처까지 생성된 완성형 반려견모델X 2');
            resolve(res2[0]);
          })
          .catch(error => {
            reject(error);
          });
        
      // 텍스처까지 생성된 완성형 반려견모델이라면 
      // isModelCreated:1 리턴
      } else {
        console.log('텍스처까지 생성된 완성형 반려견모델O');
        /** 
          S3에서 해당 파일이 있는지 조회하기
          S3에 없는 파일명이면 응답코드0000, isModelCreated=0
          S3에 있는 파일명이면 응답코드0000, isModelCreated=1
        */ 
          checkExists(s3, res2[0]) // 동기처리
          .then(res3 => {
            console.log('res3333:', res3);
            if (res3 == 0000) {  
              getMemberInfo(1, user_id) // s3에도 존재O
                .then(res3 => {
                  console.log('getMemberInfo(1, user_id) res3 :', user_id);
                  console.log('res3[0]:', res3[0]);
                  resolve(res3[0]);
                })
                .catch(error => { reject(error); });
              
            } else if (res3 == 1005) { // s3에 존재X.
              console.log('getMemberInfo(0, user_id) user_id :', user_id);
              getMemberInfo(0, user_id) 
              .then(res3 => { resolve(res3[0]); })
              .catch(error => { reject(error); });
            } else { resolve(9999); }
          })
        .catch(err => { reject(err); });
      }
    })
    .catch((err) => { console.log('err:'+err) });
  });
  
  // 보여지는 출력값
  async function getMemberInfo(isModelCreated, user_id) {
    console.log('getMemberInfo()입장', isModelCreated, user_id);
    // const sql_2 = `SELECT *, ? as isModelCreated 
    //                 FROM MEMBER
    //                 WHERE user_id = ?`;
    
    
    const sql_2 = `
    SELECT m.user_id AS userId, m.login_sns_type AS loginSnsType, m.mem_type AS memType, m.user_email AS userEmail,
          m.nickname, m.created_at AS createdAt, m.leave_at AS leaveAt, m.leave_reason_num AS leaveReasonNum, m.leave_reason,
          d.dog_name AS dogName, d.dog_id AS dogId, d.breed_type AS dogBreedName, d.fv_txt_filename, d.sv_txt_filename
      , ? as isModelCreated 
          FROM MEMBER m
          LEFT JOIN DOG d ON m.user_id = d.user_id
      WHERE m.user_id = ?
    `;
    const rows_2 = await new Promise((resolve, reject) => {
      connection.query(sql_2, [isModelCreated, user_id], (err, rows) => {
        console.log('try rows : %o', rows);
        if (err) {
          console.log('err,', err)
          resolve(9999);
        } else {
          if (!rows) resolve(1005);
          console.log(',,rows.length,', rows.length)
          if (rows.length > 0) { // 로그확인할 때 에러나서 따로 if문만듦
            console.log('rows.0번째,', rows[rows.length - 1])
            let res = [rows[rows.length - 1]]
            console.log('rows.0번째,', rows[rows.length - 1])
            console.log('resff :', res)
          }
          
          if (rows.length == 1) { 
            resolve(camelcaseKeys(rows));
            console.log('11')

          } else if (rows.length == 0) {
            console.log('22')
            console.log('res :%o', res)
            resolve(camelcaseKeys(res)); // 중복! 테스트끝나면 주석처리하기
          } else {
            console.log('33')
            let result = [rows[rows.length - 1]]; // []로 감싸기
            console.log('result :%o', result)
            resolve(camelcaseKeys(result));
          }
        }
      });
    });
    console.log('camelcaseKeys(rows) 다 들어가있는지 확인2,', rows_2)
    return rows_2; // 응답코드뿐만 아니라 회원정보까지 Promise로 리턴
  }
};


//DB에 회원정보 INSERT
memberMng.prototype.insertNewMember = (query) => {
  console.log('log : %o', query);
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
  if (query.email == 'test_hj@gmail.com' || query.email == 'asdf4777@naver.com') { // 테스트계정지정
    return new Promise((resolve, reject) => {
      mySQLQuery(insertMember(query)) // 쿼리1 실행
      .then((res) => { // MEMBER테이블에 회원가입 완료
        return resolve(res.insertId);
      })
      .catch((err) => {
        console.log('err:' + err)
        return resolve(9999); 
      });
    }); 
  
  } else {
    // 회원가입 가능한지 확인
    return new Promise((resolve, reject) => {
      mySQLQuery(isExitMember(query)) // 쿼리1 실행
      .then((res1) => { // res:mySQLQuery의 결과 
        console.log('res1', res1);

        if (res1.length == 0) {
          console.log('회원가입 가능하다');
          return mySQLQuery(insertMember(query)); 
        } else {
          console.log('회원가입 불가능하다');
          return resolve(9999); // 이미존재하는 이메일도 9999처리. 1005메세지내용과 맞지않음
        }
      })
      // MEMBER테이블에 회원가입 완료
      .then((res2) => {
        console.log('res2', res2);
        return resolve(res2.insertId); 
      })
      .catch((err) => {
        console.log('err:' + err)
        return resolve(9999); 
      });
    });
  }
}


// S3에서 파일명으로 사진존재유무 확인하기
async function checkExists(s3, item) { // 수정예정
  console.log('checkExists() 입장 item:', item);
  let bucketPathList = [];
  bucketPathList.push({ Bucket: 'user-input-photo', Key: `front/${item.fvFilename}` })
  bucketPathList.push({ Bucket: 'user-input-photo', Key: `side/${item.svFilename}` })
  bucketPathList.push({ Bucket: 'user-input-texture-photo', Key: `side/${item.fvTxtFilename}` })
  bucketPathList.push({ Bucket: 'user-input-texture-photo', Key: `side/${item.svTxtFilename}` })

  const promises = [];
  bucketPathList.forEach((value, index, array) => {
    console.log('forEach() value: %o', value);

    // 1개씩 조회
    promises.push(
      new Promise((resolve, reject) => {
        s3.headObject(value, function (err, exists_data) { // 1개일때만 조회됨
          console.log('headObject() index: %o', index);

          if (err) {
            console.log(`File ${value.Key} does not exist.`);
            resolve(false); // 사진없음
          } else {
            console.log(`File ${value.Key} exists. checking...`);

            if (exists_data == null) {
              reject(`File ${value.Key} does not exist.`);
            } else {
              resolve(true); // 사진있음
            }
          }
          console.log('headObject() exists_data: %o', exists_data);
        });
      })
    );
  });
  
  return Promise.all(promises)
    .then((res) => {
      console.log('res[0]...', res[0]);
      console.log('res[1]...', res[1]);
      if (res[0] == true && res[1] == true) { // 회원조회할 때 사진 2개다 있으면 isModelCreated값이 1로 리턴한다.
        console.log('true - 회원조회할 때 사진 2개다 있으면 isModelCreated값이 1로 리턴한다.');
        return 0000;
      } else {
        console.log('false - 회원조회할 때 사진 2개다 있으면 isModelCreated값이 1로 리턴한다.');
        return 1005; // 사진이 1개라도 조회되지않으면 빈값응답코드 리턴
      }
    })
    .catch((err) => {
      console.log('File does not exist. Cannot delete.');
      throw err;
    });
}


//memberMng 모듈 export 
module.exports = new memberMng();
