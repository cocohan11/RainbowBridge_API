# RainbowBridge Backend API 서버
  
- RainbowBridge Backend API 프로젝트 입니다. 


# 서비스 시작방법
| 개발 / 사용과 구분해서 서비스 실행.

## 개발(dev)버전 서비스 시작방법
### node를 이용한 시작방법
방법 1. `node index.js` (기본 개발모드로 실행됨)
방법 2. `NODE_ENV=development node index.js`
방법 3. `pm2 start pm2.config.dev.json`
방법 4. 코드를 수정하면서 동시에 서버를 끄지 않기 위해 실행하는 명령어 `nodemon index.js` (nodemon npm 설치필요)

        
## 상용(prod)버전 서비스 시작방법
방법 1. `NODE_ENV=production node index.js`
방법 2. `pm2 start pm2.config.prod.json`
   

## pm2 서비스 stop
- 1. 현재실행중인 프로세스 id 확인
- 2. `pm2 stop id` 명령어 실행 (ex: pm2 stop 1)


## pm2로 로그보는 법
- `pm2 log`
  
      
### 로컬에서 https로 서비스 시작 방법
방법1. 로컬터널사용(https://kibua20.tistory.com/151) 
`lt --port 3000`

방법2. ngrok 사용(https://yunwoong.tistory.com/131) 
macOS
$/Users/wkimdev/Downloads > ./ngrok http 3000

Linux
4 /home/wkimdev/Downloads > ./ngrok http 3000

