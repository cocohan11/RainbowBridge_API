// import winston from 'winston';
// import winstonDaily from 'winston-daily-rotate-file';

const winston = require('winston');
const winstonDaily = require('winston-daily-rotate-file');


const logDir = 'logs';  // logs 디렉토리 하위에 로그 파일 저장
const { combine, timestamp, printf } = winston.format;


//로그를 출력할 포맷을 정한다
const logFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`;
});

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 * createLogger -> logger를 생성
 */
const logger = winston.createLogger({
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    logFormat,
  ),
  transports: [
    // info 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir,
      filename: `%DATE%.log`,
      maxSize: '100m', //파일의 최대크기
      maxFiles: '30d',  // 30일치 로그 파일 저장, 보관할 최대 로그 수입니다. 설정하지 않으면 로그가 제거되지 않습니다
      zippedArchive: true, // 보관된 로그 파일을 gzip으로 압축할지 여부를 정의
    }),
    // warn 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: 'warn',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/warn',
      filename: `%DATE%.log`,
      maxSize: '100m',
      maxFiles: '30d',
      zippedArchive: true, //
    }),
    // error 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/error',  // error.log 파일은 /logs/error 하위에 저장 
      filename: `%DATE%.error.log`,
      maxSize: '100m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
  ],
});


logger.stream = {// morgan wiston 설정
  write: message => {
      logger.info(message);
  }
} 

// Production 환경이 아닌 경우(dev 등) 배포 환경에서는 최대한 자원을 안잡아 먹는 로그를 출력해야함
// 콘솔에 로그를 출력하는 transport 객체 추가
// Production 환경이 아닌 경우(dev 등) 
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
      format: combine(
          colorize({ all: true }), // console 에 출력할 로그 컬러 설정 적용함
          logFormat // log format 적용
      )
  }));
}

module.exports = logger;
