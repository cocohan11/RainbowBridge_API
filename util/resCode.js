function resCode() {
}
/**
 * 에러코드로 응답을 받기 
 * 파라미터로 에러코드 넣으면 바로 json출력해주기
 */
resCode.prototype.returnResponseCode = (res, value, apiName, subMessage) => { // subMessage:특별히 출력한 메세지가있는경우 기입, 없으면 null
    console.log('returnResponseCode:', value+'/'+apiName+'/'+subMessage);
    switch (value) {
  
      case 0000:
        message = apiName+'를 성공했습니다'
        if (subMessage) {
          res.status(200).json({
            result: {
              code: '0000', message: message, return: subMessage
            }
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
          message = apiName+'를 실패했습니다!' // ex) 3D 모델 재성성 API를 실패했습니다!
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