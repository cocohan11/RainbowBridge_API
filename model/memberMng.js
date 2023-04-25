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
                  return resolve(camelcaseKeys(rows));
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
      console.log('res1 : %o', res1); // 쿼리2 실행
      console.log('res1 changedRows: %o', res1.changedRows); // 쿼리2 실행
      if (res1.changedRows == 1) { // 수정) changedRows값이 0이 아닌걸로 조건문 수정하기
        return mySQLQuery(deleteDog); // 문제) 두 번째 쿼리의 에러발생시 catch문으로 안 가고 동작이 멈춰버렸음
                                      // 해결) return mySQLQuery(deleteDog); 추가
      } else {
        return resolve(1005); 
      }
    })
    .then((res2) => {
      console.log('res2 ㅡㅡ : %o', res2); // {fvFilename, svFilename}
      return resolve([res2[0][0]]);
    })
    .catch((err) => {
      console.log('err:'+err)
      return resolve(9999); 
    });
  });
}


//DB에서 회원정보 SELECT
memberMng.prototype.selectMemberByEmail = (query) => {
  const sql = `SELECT * FROM MEMBER WHERE user_email = ?`;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [query], (err, rows) => {
      console.log('rows.: %o', rows);
      // console.log('rows.length:', rows.length);
      if (err) {
        console.log('err,', err)
        return resolve(9999);
      } else {
        if (!rows) {
          return resolve(1005);
        }
        if (rows.length == 1) {
          return resolve(rows);
        } else {
          return resolve(1005);
        }
      }
    })
  })
}

//DB에 회원정보 INSERT
memberMng.prototype.insertNewMember = (query) => {
  console.log('log : %o', query);
  
  const sql = 'INSERT INTO MEMBER (login_sns_type, mem_type, leave_reason_num, user_email, created_at) VALUES (?, \'N\', 0, ?, NOW())';

  return new Promise((resolve, reject) => {
    connection.query ( 
      sql, 
      [query.loginSNSType, query.email],
      (err, rows) => {
      if (err) {
        console.log(err)
        return resolve(9999);
      } else {
        return resolve(rows.insertId);
      }
    })
  })
}




//memberMng 모듈 export 
module.exports = new memberMng();
