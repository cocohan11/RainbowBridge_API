const dbPool = require('../util/dbPool');
//카멜케이스로 DB컬럼값을 응답하기 위한 모듈 선언
const camelcaseKeys = require('camelcase-keys');
const connection = dbPool.init();
const logger = require('../config/winston');

let message; //응답 메세지 전역변수 선언
function blockchainMng() {
}


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



// 블록체인 지갑주소 INSERT
blockchainMng.prototype.insertWalletAddress = (query) => {
    
    // 쿼리: MEMBER_LETTER 테이블에 강아지에게 보내는 편지에 대한 정보를 삽입한다.
    function insertWalletAddress(query) {
      return {
          text: `INSERT INTO BLOCKCHAIN (user_id, wallet_address, wallet_created_date) 
                VALUE (?, ?, now())`, 
        params: [query.user_id, query.wallet_address] 
      };
    }

    // 쿼리 실행 결과, 편지id를 리턴한다. 
    return new Promise((resolve, reject) => {
        mySQLQuery(insertWalletAddress(query)) 
        .then((res) => { 
          logger.info(`블록체인 id : ${res.insertId}`);
          return resolve(res.insertId); // res.insert_id : insert한 row의 id를 얻는다.
        })
        .catch((err) => {
          logger.warn(`insertWalletAddress() err: ${err} `);
        return resolve(9999); 
        });
    }); 
    
}

// 블록체인 토큰ID UPDATE
blockchainMng.prototype.updateTokenId = (query) => {
    
    // 쿼리: BLOCKCHAIN 테이블에 토큰ID를 등록한다.
    function updateTokenId(query) {
      return {
          text: `UPDATE BLOCKCHAIN 
                SET token_id = ?, token_created_date = now() 
                WHERE user_id = ?`, 
        params: [query.token_id, query.user_id] 
      };
    }

    // 쿼리 실행 결과, 토큰id를 등록한다.
    return new Promise((resolve, reject) => {
        mySQLQuery(updateTokenId(query)) 
        .then((res) => { 
            logger.info(`블록체인 changedRows : ${res.changedRows}`);

            if (res.changedRows == 1) { // update성공인 경우 1
                logger.info(`블록체인 테이블에 토큰id를 등록한다`);
                return resolve(0); 
            } else {
                return resolve(1005); 
            }
        })
        .catch((err) => {
          logger.warn(`updateTokenId() err: ${err} `);
        return resolve(9999); 
        });
    }); 
    
}

// 블록체인 조회 SELECT
blockchainMng.prototype.selectBlockchainInfo = (query) => {
    
    // 쿼리: BLOCKCHAIN 테이블에 토큰ID를 등록한다.
    function selectBlockchainInfo(query) {
      return {
          text: `SELECT * FROM BLOCKCHAIN 
                where user_id = ?`, 
        params: [query.user_id] 
      };
    }

    // 쿼리 실행 결과, 토큰id를 등록한다.
    return new Promise((resolve, reject) => {
        mySQLQuery(selectBlockchainInfo(query)) 
        .then((res) => { 

            logger.info(`블록체인 테이블에서 정보를 조회한다`);
            logger.info(`res.length : ${res.length}`);
            if (res.length == 1) { // 빈값으로 응답하는 경우 예외처리
                return resolve(res); 
            } else { 
                return resolve(1005);
              }
        })
        .catch((err) => {
          logger.warn(`selectBlockchainInfo() err: ${err} `);
        return resolve(9999); 
        });
    }); 
    
}


//blockchainMng 모듈 export 
module.exports = new blockchainMng();