const dbPool = require('../util/dbPool');
//카멜케이스로 DB컬럼값을 응답하기 위한 모듈 선언
const camelcaseKeys = require('camelcase-keys');
const connection = dbPool.init();
const logger = require('../config/winston');

let message; //응답 메세지 전역변수 선언
function letterMng() {
}

//mysql구문을 순차적으로 실행하기위해 사용하는 함수
letterMng.prototype.mySQLQuery = (query) => {
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


function mySQLQuery(query) {
  return new Promise(function(resolve, reject) {
      try {
        connection.query(query.text, query.params, function(err, rows, fields) {
              if (err) {
                  return reject(err);
              } else {
                  //순차적으로 실행하면 반환되는 행을 관리
                  return resolve(rows); //카멜케이스 X
              }
          });
      } catch (err) {
          return reject(err);
      }
  })
};


//DB에 작성한 엽서 SELECT
letterMng.prototype.selectPostcards = (query) => {
    

  // 쿼리: DOG_POSTCARD 테이블에서 이전에 강아지가 보낸 엽서에 대한 정보를 조회한다.
  function selectPostcard(query) {
    return {
      text: `SELECT *, DATE_FORMAT(date_detail, '%Y-%m-%d') AS date FROM DOG_POSTCARD 
              WHERE user_id = ? `, 
      params: [query.user_id, query.postcard_id] 
    };
  }
  function selectPostcards(query) {
    return {
      text: `SELECT *, DATE_FORMAT(date_detail, '%Y-%m-%d') AS date FROM DOG_POSTCARD
              WHERE user_id = ?`, 
      params: [query.user_id] 
    };
  }


  // 엽서 여러장이라면
  if (query.postcard_id == 0) {
      // 쿼리 실행 결과, 편지id를 리턴한다. 
      return new Promise((resolve, reject) => {
        mySQLQuery(selectPostcards(query)) 
        .then((res) => { 
          logger.warn(`엽서 여러장 : ${res}`);
          return resolve(res);
        }) 
        .catch((err) => {
          logger.warn(`selectLetter() err: ${err} `);
          return resolve(9999); 
        });
      }); 
  } else {
      // 쿼리 실행 결과, 편지id를 리턴한다. 
      return new Promise((resolve, reject) => {
        mySQLQuery(selectPostcard(query)) 
        .then((res) => { 
          logger.warn(`엽서 1장 : ${res}`);
          return resolve(res);
        }) 
        .catch((err) => {
          logger.warn(`selectLetter() err: ${err} `);
          return resolve(9999); 
        });
      }); 
  }
}



//DB에 작성한 편지 SELECT
letterMng.prototype.selectLetters = (query) => {
    
    // 쿼리: MEMBER_LETTER 테이블에서 이전에 강아지에게 보냈던 편지에 대한 정보를 조회한다.
    function selectLetters(query) {
        return {
          text: `SELECT *, DATE_FORMAT(date_detail, '%Y-%m-%d') AS date FROM MEMBER_LETTER
                 WHERE user_id = ?`, 
          params: [query] 
        };
      }

    // 쿼리 실행 결과, 편지id를 리턴한다. 
    return new Promise((resolve, reject) => {
        mySQLQuery(selectLetters(query)) 
        .then((res) => { 
          logger.warn(`편지 res : ${res}`);
          return resolve(res);
        }) 
        .catch((err) => {
          logger.warn(`selectLetter() err: ${err} `);
          return resolve(9999); 
        });
    }); 
    
}


//DB에 작성한 편지 INSERT
letterMng.prototype.insertNewLetter = (query) => {
    
    // 쿼리: MEMBER_LETTER 테이블에 강아지에게 보내는 편지에 대한 정보를 삽입한다.
    function insertMember(query) {
      return {
        text: `INSERT INTO MEMBER_LETTER 
                (user_id, dog_id, letter_content, dog_item, dog_location, member_name, date_detail) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())`, 
        params: [query.user_id, query.dog_id, query.letter_content, query.dog_item, query.dog_location, query.member_name] 
      };
    }

    // 쿼리 실행 결과, 편지id를 리턴한다. 
    return new Promise((resolve, reject) => {
        mySQLQuery(insertMember(query)) 
        .then((res) => { 
          logger.info(`편지id : ${res.insertId}`);
          return resolve(res.insertId); // res.insert_id : insert한 row의 id를 얻는다.
        })
        .catch((err) => {
          logger.warn(`insertNewLetter() err: ${err} `);
        return resolve(9999); 
        });
    }); 
    
}


//DB에 작성된 엽서 INSERT
letterMng.prototype.insertNewPostcard = (query) => {
    
  // 쿼리: DOG_POSTCARD 테이블에 강아지에게 받은 엽서에 대한 정보를 삽입한다.
  function insertPostcard(query) {
    return {
      text: `INSERT INTO DOG_POSTCARD 
              (postcard_id, user_id, dog_id, letter_content, img_path, member_name, date_detail) 
              VALUES (?, ?, ?, ?, ?, ?, NOW())`, 
      params: [query.postcard_id, query.user_id, query.dog_id, query.letter_content, `${query.img_path}`, query.member_name] 
    };
  }

  // 쿼리 실행 결과, 편지id를 리턴한다. 
  return new Promise((resolve, reject) => {
      mySQLQuery(insertPostcard(query)) 
      .then((res) => { 
        logger.warn(`엽서id : ${res.insertId}`);
        return resolve(res.insertId); // res.insertId : insert한 row의 id를 얻는다.
      })
      .catch((err) => {
        logger.warn(`insertNewPostcard() err: ${err} `);
      return resolve(9999); 
      });
  }); 
  
}

  

//letterMng 모듈 export 
module.exports = new letterMng();