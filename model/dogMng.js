const dbPool = require('../util/dbPool');
//카멜케이스로 DB컬럼값을 응답하기 위한 모듈 선언
const camelcaseKeys = require('camelcase-keys');
const connection = dbPool.init();


let message; //응답 메세지 전역변수 선언
function dogMng() {
}

// 반려견 앞모습, 옆모습사진 유무조회와 삭제하기
dogMng.prototype.deleteDogImage = (s3, fv_filename, sv_filename) => {
  console.log('deleteDogImage() 입장');
  
  // 버킷 정보
  const params1 = { Bucket: 'user-input-photo', Key: `side/${fv_filename}` };
  const params2 = { Bucket: 'user-input-photo', Key: `front/${sv_filename}` };
  
  return Promise.all([ // Promise.all:비동기. 모든 함수의 결과를 기다린 후 하나의 프로미스 객체를 반환
    deleteIfExists(params1), 
    deleteIfExists(params2)
  ])
  .then(([res1, res2]) => {
    console.log('반려견 사진삭제 성공');
    console.log('res1:', res1);
    console.log('res2:', res2);
    return true; 
  })
  .catch(err => {
    console.log('반려견 사진삭제 오류');
    console.log('err:', err);
    return false;
  });

  // 파일 존재조회 후 삭제
  function deleteIfExists(params) {
    console.log('deleteIfExists() 입장');
    return new Promise((resolve, reject) => {
      s3.headObject(params, function (err, exists_data) { 
        if (err) {
          console.log(`File ${params.Key} does not exist.`);
        } else {
          console.log(`File ${params.Key} exists. Deleting...`);
          s3.deleteObject(params, function (err, delete_data) { // deleteObjects로 사진여러장 지우는 메소드 안 쓴 이유: headObject로 여러장을 조회할 수 없었음 
                                                                // delete_data:{} 빈값임
            if (err) {
              console.log('err:', err.stack);
              reject(err); // catch문으로 이동
            } else { // 조회O 삭제O
              console.log(`File ${params.Key} deleted successfully.`);
              resolve(exists_data);
            }
          });
        }
      });
    });
  }
}

//반려견 앞모습, 옆모습사진 파일명, S3 파일경로 DB에 저장
dogMng.prototype.insertDogPhoto = (query) => {
  
  let sql;
  if (query.type === 'front') { //앞모습 사진을 처리하는 쿼리문
    sql = 'UPDATE DOG SET fv_filename = ?, fv_filepath = ? WHERE dog_id = ?';  
  } else { //옆모습 사진을 처리하는 쿼리문
    sql = 'UPDATE DOG SET sv_filename = ?, sv_filepath = ? WHERE dog_id = ?';  
  }


  return new Promise((resolve, reject) => {
    connection.query ( 
      sql, 
      [query.filename, query.path, query.dogId],
      (err, rows) => {
      if (err) {
        console.log(err)
        return reject(new Error('반려견 사진 정보 DB 저장 오류'));
      } else {
        return resolve(rows);
      }
    })
  })
}

//텍스처가 입혀진 3D모델 생성을 위해 이미지 파일 URL,후처리된 3D model URL 조회
dogMng.prototype.selectDogInfo = (query) => {

  console.log('==== selectDogInfo ====');
  console.log(query);
  
  const sql = `SELECT d.fv_filepath, d.sv_filepath, b.model_filepath
              FROM DOG d, DOG_BREED b
            WHERE d.user_id = ? AND b.breed_id = ?;`;

  return new Promise((resolve, reject) => {
    connection.query ( 
      sql, 
      [query.userId, query.breedId],
      (err, rows) => {
      if (err) {
        console.log(err)
        return reject(new Error('반려견 사진 정보 DB 저장 오류'));
      } else {
        return resolve(rows);
      }
    })
  })
}


//dogMng 모듈 export 
module.exports = new dogMng();