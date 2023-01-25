const dbPool = require('../util/dbPool');
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
                  return resolve(rows);
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
  const sql = `select * from MEMBER WHERE user_email = 'test@gmail.com';`;
  
  return new Promise((resolve, reject) => {
    
    connection.query(sql, (err, rows) => {
      //throw error test
      //return reject(new Error('member error !!!'));
      if (err) {
        console.log(err)
        return reject(new Error('회원조회 오류 발생 !!!'));
      } else {
        message = '회원가입에 성공했습니다.';
        return resolve(rows, message);
      }
    })
  })
}

//DB에서 회원정보 SELECT
memberMng.prototype.selectMemberByEmail = (query) => {
  const sql = `select * from MEMBER WHERE user_email = ?`;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [query], (err, rows) => {
      if (err) {
        console.log(err)
        return reject(new Error('회원정보 DB 조회 오류'));
      } else {
        return resolve(rows);
      }
    })
  })
}

//DB에 회원정보 INSERT
memberMng.prototype.insertNewMember = (query) => {
  console.log('log : %o', query);
  
  const sql = 'INSERT INTO MEMBER (login_sns_type, mem_type, leave_cause_num, user_email, created_at) VALUES (?, \'N\', 0, ?, NOW())';

  return new Promise((resolve, reject) => {
    connection.query ( 
      sql, 
      [query.loginSNSType, query.email],
      (err, rows) => {
      if (err) {
        console.log(err)
        return reject(new Error('회원정보 DB 저장 오류'));
      } else {
        return resolve(rows);
      }
    })
  })
}


//반려견 정보와 사용자 닉네임 정보 등록
memberMng.prototype.updateMemberInfo = (query) => {
  const insertDogInfo = {
    text : 'INSERT INTO DOG (dog_name, breed_type, user_id) VALUE (?, ?, ?)',
    params : [query.dogName, query.breedType, query.userId]
  };

  const updateMemberInfo = {
    text: 'UPDATE MEMBER SET nickname = ? WHERE user_id = ?', 
    params : [query.nickname, query.userId]
  }

  return new Promise((resolve, reject) => {
    //쿼리들 순차 실행
    mySQLQuery(insertDogInfo)
    .then(mySQLQuery(updateMemberInfo))
    .then((res) => { resolve(res) })
    .catch((err) => { reject(new Error('Error while executing SQL Query : %o', err)) });
  })

}


//memberMng 모듈 export 
module.exports = new memberMng();
