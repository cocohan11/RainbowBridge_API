const swaggerUi = require("swagger-ui-express")
const swaggereJsdoc = require("swagger-jsdoc")

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "RainbowBridge App-dev API",
      description:
        "앱 개발서버 API문서화 페이지",
    },
    servers: [ // 요청 URL
      {
        "url": "https://app-dev.api-rainbowbridge.xyz" // 테섭
      },
      {
        "url": "http://localhost:3001" 
      },
      {
        "url": "https://app.api-rainbowbridge.xyz" // 실섭
      }
    ],
  },
  apis: ["./swagger/*.js"], //Swagger 파일 연동
}
const specs = swaggereJsdoc(options)

module.exports = { swaggerUi, specs }