//winston을 이용해 로그를 남기는 처리
const logger = require('../config/winston');

function resCode() {
}
/**
 * 에러코드로 응답을 받기 
 * 파라미터로 에러코드 넣으면 바로 json출력해주기
 */
resCode.prototype.returnResponseCode = (res, value, apiName, addField, subMessage) => { // subMessage:특별히 출력한 메세지가있는경우 기입, 없으면 null
    switch (value) {
      
      case 0000:
        message = apiName + ' 성공' // ex) 3D 모델 재성성 성공
        const result_success = {
          code: '0000',
          message: message
        };
        if (addField == 'addToResult') {
          // 속성으로 감싸지않고 기존result에 row추가해주기
          for (let key in subMessage) { // list에서 key에 해당하는 이름과 이름의 속성 값을 result에 추가
            result_success[key] = subMessage[key];
          }
        }

        logger.info(`최종응답값 : \n${JSON.stringify(result_success, null, 2)}`);
        res.status(200).json({
          result: result_success
        });
        break;
    
      case 1002 :
        if (subMessage) {
          message = subMessage
        } else {
          message = '필수파라미터가 누락되어있습니다!'
        }
        let result_empty = {
          code: '0000',
          message: message
        };
        logger.warn(`최종응답값 : \n${JSON.stringify(result_empty, null, 2)}`);
        // logger.error(`[ ${apiName} ] code: 1002 | message: ${message}`)
        res.status(401).json({
          result: result_empty
        })
        break;
    
      case 1005 :
        if (subMessage) {
          message = subMessage
        } else {
          message = '해당되는 정보를 조회할 수 없습니다!' 
        }
        let result_notExist = {
          code: '1005',
          message: message
        };
        logger.warn(`최종응답값 : \n${JSON.stringify(result_notExist, null, 2)}`);
        // logger.error(`[ ${apiName} ] code: 1002 | message: ${message}`)
        res.status(200).json({
          result: result_notExist
        })
        break;
    
      default:
        if (subMessage) {
          message = subMessage
        } else {
          message = apiName+' 실패' // ex) 3D 모델 재성성 실패
        }
        let result_fail = {
          code: '9999',
          message: message
        };
        logger.warn(`최종응답값 : \n${JSON.stringify(result_fail, null, 2)}`);
        res.status(500).json({
          result: result_fail
        }) 
        break;
    }
}
  
//resCode 모듈 export 
module.exports = new resCode();