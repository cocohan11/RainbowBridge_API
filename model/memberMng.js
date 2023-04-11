const dbPool = require('../util/dbPool');
//카멜케이스로 DB컬럼값을 응답하기 위한 모듈 선언
const camelcaseKeys = require('camelcase-keys');
const connection = dbPool.init();



let message; //응답 메세지 전역변수 선언

function memberMng() {
}

//mysql구문을 순차적으로 실행하기위해 사용하는 함수
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


// DB에서 회원탈퇴 + (3D반려견 사진파일 삭제 구현 예정)
memberMng.prototype.updateMemberAndDeleteDogForLeave = (query) => {
  console.log('..query : %o', query);

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

  // 쿼리2. 탈퇴한 사용자의 강아지사진 삭제
  const deleteDog = {
    text : 'DELETE FROM DOfG WHERE user_id = ?;',
    params : [query.userId]
  };

  return new Promise((resolve, reject) => {
    // 쿼리1 실행
    mySQLQuery(updateMemberInfo)
    .then(() => {
      // 쿼리2 실행
      return mySQLQuery(deleteDog); // 문제)두 번째 쿼리의 에러발생시 catch문으로 안 가고 동작이 멈춰버렸음
                                    // 해결) return mySQLQuery(deleteDog); 추가
    })
    .then((res) => {
      console.log('..p res : %o', res);
      resolve(camelcaseKeys(res))
    })
    .catch((err) => {
      console.log('...err:'+err)
      const message = 'Error while executing SQL Query: ' + err.message;
      // 수정예정 
      reject(new Error(JSON.stringify({ // Error 객체는 문자열만을 속성으로 가짐
        "result": {
          "code": "9999",
          "message": message
        }
      })));
      
    });
  });
}


//DB에서 회원정보 SELECT
memberMng.prototype.selectMemberByEmail = (query) => {
  const sql = `SELECT * FROM MEMBER WHERE user_email = ?`;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [query], (err, rows) => {
      if (err) {
        console.log(err)
        return reject(new Error('회원정보 DB 조회 오류'));
      } else {
        return resolve(camelcaseKeys(rows));
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
        return reject(new Error('회원정보 DB 저장 오류'));
      } else {
        return resolve(rows.insertId);
      }
    })
  })
}


//반려견 정보 등록
memberMng.prototype.updateMemberInfo = (query) => {
  // const insertDogInfo = {
  //   text : 'INSERT INTO DOG (dog_name, breed_type, user_id) VALUE (?, ?, ?)',
  //   params : [query.dogName, query.breedType, query.userId]
  // };

  // //1.26: 사용자 닉네임 미사용으로 삭제해야함
  // const updateMemberInfo = {
  //   text: 'UPDATE MEMBER SET nickname = ? WHERE user_id = ?', 
  //   params : [query.nickname, query.userId]
  // }

  // return new Promise((resolve, reject) => {
  //   //쿼리들 순차 실행
  //   mySQLQuery(insertDogInfo)
  //   .then(mySQLQuery(updateMemberInfo))
  //   .then((res) => { resolve(camelcaseKeys(res)) })
  //   .catch((err) => { reject(new Error('Error while executing SQL Query : %o', err)) });
  // })

  const sql = 'INSERT INTO DOG (dog_name, breed_type, user_id) VALUE (?, ?, ?)';  
  
  return new Promise((resolve, reject) => {
    connection.query ( 
      sql, 
      [query.dogName, query.breedType, query.userId],
      (err, rows) => {
      if (err) {
        console.log(err)
        return reject(new Error('반려견 정보 DB 저장 오류'));
      } else {
        return resolve(rows.insertId);
      }
    })
  })

}


//memberMng 모듈 export 
module.exports = new memberMng();
