//커밋을 위한 주석
const dbPool = require('../util/dbPool');
const memberMng = require('./memberMng');
//카멜케이스로 DB컬럼값을 응답하기 위한 모듈 선언
const camelcaseKeys = require('camelcase-keys');
const connection = dbPool.init();


let message; //응답 메세지 전역변수 선언
function dogMng() {
}



// 견종 등록
dogMng.prototype.updateDogBreed = (query) => {

  const updateDogBreed = { // 견종명 등록하기
    text: ` UPDATE DOG d
            SET d.breed_type = (
              SELECT breed_id
              FROM DOG_BREED
              WHERE breed_type_en = ?
            )
            WHERE d.dog_id = ? `,
    params : [query.breedName, query.dogId] 
  };

  return new Promise((resolve, reject) => {
    memberMng.mySQLQuery(updateDogBreed) 
    .then((res2) => {
      console.log('res2 :', res2);
      return resolve(0000); // 미정
    })
    .catch((err) => {
      console.log('err:'+err)
      return reject(9999); 
    });
  });
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
  console.log('prototype.deleteDogImage() 입장');

  // 버킷 정보
  let item = ''
  let fileCount = list.length;
  console.log('fileCount :', fileCount);
  if (list.length == 1) {
    item = list[0]; // 에러나면 여기 의심해보기(어쩔 때는 [0][0]여야되는 적이 있음)
  } else {
    console.log('else');
    item = list[fileCount-1]; // 에러나면 여기 의심해보기(어쩔 때는 [0][0]여야되는 적이 있음)
    console.log('list[0]', item);
  }
  console.log('파일명 있는 것만 삭제하기 :', item);
    // return 1005; // 응답코드
    // 값이 있는 것만 삭제하기
  console.log('bucketPathList에 push할거임');
  let bucketPathList = []; 
  let bucketPathList_exist = [];

  if (item.fvFilename) bucketPathList.push({ Bucket: process.env.S3_BUCKET_PHOTO, Key: `front/${item.fvFilename}` })
    else bucketPathList.push(null);
  if (item.svFilename) bucketPathList.push({ Bucket: process.env.S3_BUCKET_PHOTO, Key: `side/${item.svFilename}` })
    else bucketPathList.push(null);
  if (item.fvTxtFilename) bucketPathList.push({ Bucket: process.env.S3_BUCKET_TEXTURE_PHOTO, Key: `front/${item.fvTxtFilename}` })
    else bucketPathList.push(null);
  if (item.svTxtFilename) bucketPathList.push({ Bucket: process.env.S3_BUCKET_TEXTURE_PHOTO, Key: `side/${item.svTxtFilename}` })
    else bucketPathList.push(null);
  console.log('bucketPathList : ', bucketPathList);




  return new Promise((resolve, reject) => { // Promise.all() -> Promise()로 변경 // Promise.all:비동기. 모든 함수의 결과를 기다린 후 하나의 프로미스 객체를 반환
  console.log('new Promise');
  checkExists(bucketPathList) 
    .then((res1) => { 
      console.log('checkExists - res1 : %o', res1); 
      return deleteFiles(bucketPathList_exist); 
    })
    .then((res2) => {
      console.log('deleteFiles - %o'); // {fvFilename, svFilename}
      resolve (0000);
    })
    .catch((err) => {
      console.log('err:'+err)
      resolve (9999); 
    });
  });


  function checkExists(bucketPathList) {
    console.log('checkExists() 입장');
    const promises = [];

    bucketPathList.forEach((value, index, array) => {
    console.log('forEach index: %o', index);
    console.log('forEach() value: %o', value);

      // 1개씩 조회
      if (value != null) {
        promises.push(
          new Promise((resolve, reject) => {
            s3.headObject(value, function (err, exists_data) {
              if (err) {
                console.log(`File ${value.Key} does not exist.`);
                reject(err);
              } else {
                console.log(`File ${value.Key} exists. checking...`);
                bucketPathList_exist.push(value);
                console.log('존재 bucketPathList_exist : %o', bucketPathList_exist);

                if (exists_data == null) {
                  reject(new Error(`File ${value.Key} does not exist.`));
                } else {
                  resolve(exists_data);
                }
              }
              console.log('headObject() exists_data: %o', exists_data);
            });
          })
          );
      }
    });
    
    console.log('랭스promises.length: %o', promises.length);
    return Promise.all(promises)
      .then((res) => {
        console.log('All files exist. Deleting...');
        return res;
      })
      .catch((err) => {
        console.log('File does not exist. Cannot delete.');
        throw err;
      });
  }


  // 여러 오브젝트 삭제
  function deleteFiles(bucketPathList) {
    console.log('deleteFiles() 입장 Bucket:', bucketPathList);
    console.log('deleteFiles() 입장 bucketPathList.length:', bucketPathList.length);
    return new Promise((resolve, reject) => {
      
      Promise.all([ // 경로마다 삭제요청을 별로도 해야함 
        bucketPathList.forEach((value, index, array) => {
          console.log('index:', index);
          s3.deleteObjects(pramsForDeleteObjects(bucketPathList, index)).promise()
        })

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
  // function pramsForDeleteObjects(bucketPathList) {
  //   bucketPathList.forEach(obj => {
  //     if (obj) {
  //       console.log(obj.Bucket, obj.Key);
  //     }
  //   });
    
  // }

  function pramsForDeleteObjects(bucketPathList_exist, idx) { // 삭제할 파일 경로가 늘어나면 로직 수정하기
    return params = {
      Bucket: bucketPathList_exist[idx].Bucket, 
      Delete: {
       Objects: [
        {
          Key: bucketPathList_exist[idx].Key 
        }
       ], 
       Quiet: false // (참고) Delete API 요청에 대한 응답에 삭제 작업의 성공/실패 여부와 관련된 정보
      }
    };
  }
}


//반려견 앞모습, 옆모습사진 파일명, S3 파일경로 DB에 저장
dogMng.prototype.insertDogPhoto = async (query) => {
  console.log('반려견 앞모습, 옆모습사진 파일명:', query);
 
  // 중복! 테스트할 때만 실행시키기
  if (query.dogId == '-1') {
    console.log('-1이다'); 
    console.log('query : %o', query);
    console.log('query.dogId : %o', query.dogId);
    query.dogId = await getDogId(42); // 제일 최근 등록된 강아지id가져오기
    console.log('query.dogId : %o', query.dogId);
    console.log('dogId 다음에 위치하기');
  } 

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
          // console.log('ㅇㅇㅇ:', rows); 
          return resolve(rows);
          // 중복! 테스트할 때만 임시주석
          // if (rows.changedRows == 1) { // changedRows : 0 update한게없음
          //   return resolve(rows);
          // } else {
          //   return resolve('undefined'); 
          // }
      }
    })
  })
  
  async function getDogId(user_id) {
    console.log('getDogId()입장', user_id);
    const sql = `SELECT dog_id FROM DOG where user_id = ?
                  ORDER BY dog_id DESC
                  LIMIT 1`;
    const dogId = await new Promise((resolve, reject) => {
      connection.query(sql, [user_id], (err, rows) => {
        console.log('try rows_2 : %o', rows);
        if (err) {
          console.log('err,', err)
          resolve(9999);
        } else {
          console.log('dogId..: %o', rows[0].dog_id)
          resolve(rows[0].dog_id);
        }
      });
    });
    console.log('dogId :', dogId)
    return dogId; // 응답코드뿐만 아니라 회원정보까지 Promise로 리턴
  }
  
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
dogMng.prototype.insertDogInfo = (query) => {
  const sql = 'INSERT INTO DOG (dog_name, user_id, created_date) VALUE (?, ?, now())';  
  // todo: created_date 컬럼에 값 추가해주기(now)
  return new Promise((resolve, reject) => {
    connection.query ( 
      sql, 
      [query.dogName, query.userId],
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