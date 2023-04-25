function resCode() {
}
/**
 * 에러코드로 응답을 받기 
 * 파라미터로 에러코드 넣으면 바로 json출력해주기
 */
resCode.prototype.returnResponseCode = (res, value, apiName, addField, subMessage) => { // subMessage:특별히 출력한 메세지가있는경우 기입, 없으면 null
    console.log('returnResponseCode:', value+'/'+apiName+'/'+addField+'/'+subMessage);
    switch (value) {
      
      case 0000:
        message = apiName + ' 성공' // ex) 3D 모델 재성성 성공
        if (addField == 'addToResult') {
          let result = {
            code: '0000',
            message: message
          };
          // 속성으로 감싸지않고 기존result에 row추가해주기
          for (let key in subMessage) { // list에서 key에 해당하는 이름과 이름의 속성 값을 result에 추가
            result[key] = subMessage[key];
          }
          console.log('result:', result);
          res.status(200).json({
            result: result
          });
          
        } else {
          res.status(200).json({
            result: {
              code: '0000', message: message
            }
          });
        }

        break;
    
      case 1002 :
        if (subMessage) {
          message = subMessage
        } else {
          message = '필수파라미터가 누락되어있습니다!'
        }
        res.status(200).json({
          result: {
            code: '1002', message
          }
        })
        break;
    
      case 1005 :
        if (subMessage) {
          message = subMessage
        } else {
          message = '해당되는 정보가 없습니다!' 
        }
        res.status(404).json({
          result: {
            code: '1005', message
          }
        })
        break;
    
      default:
        if (subMessage) {
          message = subMessage
        } else {
          message = apiName+' 실패' // ex) 3D 모델 재성성 실패
        }
        res.json({
          result: {
            code: '9999', message : message
          }
        }) 
        break;
    }
    console.log('returnResponseCode 빠져나옴');
}
  
//resCode 모듈 export 
module.exports = new resCode();