const dbPool = require('../util/dbPool');
const memberMng = require('./memberMng');
//카멜케이스로 DB컬럼값을 응답하기 위한 모듈 선언
const camelcaseKeys = require('camelcase-keys');
const connection = dbPool.init();


let message; //응답 메세지 전역변수 선언
function dogMng() {
}

// DB에서 반려견정보 DELETE
dogMng.prototype.deleteDogForRemake = (userId) => { 
  console.log('..userId : ', userId);

  const selectDog = { // S3에 저장된 파일을 삭제하기위해 파일명 알아내기
    text: `SELECT fv_filename, sv_filename, fv_txt_filename, sv_txt_filename 
            FROM DOG WHERE user_id = ?;`,
    params : userId
  };
  const updateDogInfo = { // 강아지 정보를 아예 삭제하는게 아니라 사진정보만 비워준다. 
    text: `UPDATE DOG SET 
            fv_filename = null,
            fv_filepath = null,
            sv_filename = null,
            sv_filepath = null, 
            fv_txt_filename = null,
            sv_txt_filename = null
           WHERE user_id = ?`, 
    params : userId
  }

  return new Promise((resolve, reject) => {
    let result1 = '';

    memberMng.mySQLQuery(selectDog) // 쿼리1 실행
    .then((res1) => { 
      result1 = res1;

      if (result1.length == 0) {
        console.log('result1length : %o', result1.length); 
        result1 = false;
      } else {
        console.log('result1 : %o', result1); // {fvFilename, svFilename, fv_txt_filename, sv_txt_filename}
        return memberMng.mySQLQuery(updateDogInfo); // 쿼리2 실행
      }
    })
    .then((res2) => {
      console.log('res2');
      return resolve(result1);
    })
    .catch((err) => {
      console.log('err:'+err)
      return reject(false); 
    });
  });
}


// 반려견 사진 4장 유무조회와 삭제하기 (일반 앞, 일반 옆, 텍스처 앞, 텍스처 옆) 
dogMng.prototype.deleteDogImage = (s3, list) => { // list: 사진명 담긴 리스트
  console.log('deleteDogImage() 입장');

  // 버킷 정보
  const item = list[0];
  console.log('list66 :', list);
  console.log('item66 :', item);
  if (item.fvFilename === null || item.svFilename === null || item.fvTxtFilename === null || item.svTxtFilename === null) {
    console.log('파일명 필수값 확인 item.fvFilename:', item.fvFilename);
    return 1005; // 응답코드
  }
  let bucketPathList = [];
  bucketPathList.push({ Bucket: 'user-input-photo', Key: `front/${item.fvFilename}` })
  bucketPathList.push({ Bucket: 'user-input-photo', Key: `side/${item.svFilename}` })
  bucketPathList.push({ Bucket: 'user-input-texture-photo', Key: `front/${item.fvTxtFilename}` })
  bucketPathList.push({ Bucket: 'user-input-texture-photo', Key: `side/${item.svTxtFilename}` })


  return Promise.all([ // Promise.all:비동기. 모든 함수의 결과를 기다린 후 하나의 프로미스 객체를 반환
    checkExists(bucketPathList),
    deleteFiles(bucketPathList)
  ])
  .then(([res1, res2]) => {
    console.log('반려견 사진삭제 성공');
    console.log('res1:', res1);
    console.log('res2: %o', res2);
    return 0000; 
  })
  .catch(err => {
    console.log('반려견 사진삭제 오류');
    console.log('err:', err);
    return 9999;
  });


  function checkExists(bucketPathList) {
    return new Promise((resolve, reject) => {
      const promises = [];
      bucketPathList.forEach((value, index, array) => {
        console.log('forEach() value: %o', value);
  
        // 1개씩 조회
        promises.push(
          new Promise((resolve, reject) => {
            s3.headObject(value, function (err, exists_data) {
              console.log('headObject() index: %o', index);
              if (err) {
                console.log(`File ${value.Key} does not exist.`);
                reject(err);
              } else {
                console.log(`File ${value.Key} exists. checking...`);
                resolve(exists_data);
              }
              console.log('headObject() exists_data: %o', exists_data);
            });
          })
        );
      });
      Promise.all(promises) // 비동기로 사진4개 조회되면 res객체 반환
      .then((res) => {
        console.log('All files exist. Deleting...');
        resolve(res);
      })
      .catch((err) => {
        console.log('File does not exist. Cannot delete.');
        reject(err);
      });
    });
  }

  // 여러 오브젝트 삭제
  function deleteFiles(bucketPathList) {
    console.log('deleteFiles() 입장 Bucket', bucketPathList[0].Bucket);
    return new Promise((resolve, reject) => {
      
      Promise.all([
        s3.deleteObjects(pramsForDeleteObjects(0,1)).promise(), // 메소드가 2개인 이유:경로마다 삭제요청을 별로도 해야함 
        s3.deleteObjects(pramsForDeleteObjects(2,3)).promise()
      ]).then(delete_data => {
        console.log(`File deleted successfully.`);  // 조회O 삭제O
        resolve(delete_data);
      }).catch(err => {
        console.log('err:', err.stack);
        reject(err); // catch문으로 이동
      });
    });
  }

  // 사진삭제 메소드에 필요한 파라미터 리턴
  function pramsForDeleteObjects(idx1, idx2) { // 삭제할 파일 경로가 늘어나면 로직 수정하기
    return params = {
      Bucket: bucketPathList[idx1].Bucket, 
      Delete: {
       Objects: [
        {
          Key: bucketPathList[idx1].Key
        }, 
        {
          Key: bucketPathList[idx2].Key 
        }
       ], 
       Quiet: false // (참고) Delete API 요청에 대한 응답에 삭제 작업의 성공/실패 여부와 관련된 정보
      }
    };
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
        console.log('에러다~~!!~!~!')
        return resolve(9999);
      } else {
        return resolve(rows);
      }
    })
  })
}


//텍스처가 입혀진 3D모델 생성을 위해 이미지 파일 URL,후처리된 3D model URL 조회
dogMng.prototype.selectDogInfo = (query) => {
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


//반려견 정보 등록
dogMng.prototype.updateMemberInfo = (query) => {

  const sql = 'INSERT INTO DOG (dog_name, breed_type, user_id, created_date) VALUE (?, ?, ?, now())';  
  // todo: created_date 컬럼에 값 추가해주기(now)
  return new Promise((resolve, reject) => {
    connection.query ( 
      sql, 
      [query.dogName, query.breedName, query.userId],
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


//dogMng 모듈 export 
module.exports = new dogMng();