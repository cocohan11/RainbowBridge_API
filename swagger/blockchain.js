
/**
 * @swagger
 * /api/blockchain/wallet:
 *  post:
 *    summary: "블록체인 지갑주소 등록"
 *    description: "블록체인 서버에서 발급받은 지갑주소가 저장됩니다."
 *    tags: [blockchain]
 *    requestBody:
 *      description: 
 *      required: true
 *      content:
 *        application/x-www-form-urlencoded:
 *          schema:
 *            type: object
 *            properties:
 *              user_id:
 *                type: integer
 *                description: "사용자 id"
 *              wallet_address:
 *                type: string
 *                description: "블록체인 지갑주소"
 *    responses:
 *      "200":
 *        description: (유저 조회)
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                result:
 *                  type: object
 */


/**
 * @swagger
 * /api/blockchain/token:
 *  post:
 *    summary: "블록체인 토큰ID 등록"
 *    description: "블록체인 서버에서 발급받은 SBT 토큰 id가 저장됩니다."
 *    tags: [blockchain]
 *    requestBody:
 *      description: 
 *      required: true
 *      content:
 *        application/x-www-form-urlencoded:
 *          schema:
 *            type: object
 *            properties:
 *              user_id:
 *                type: integer
 *                description: "사용자 id"
 *              token_id:
 *                type: integer
 *                description: "블록체인 토큰 id"
 *    responses:
 *      "200":
 *        description: (유저 조회)
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                result:
 *                  type: object
 */



/**
 * @swagger
 * /api/blockchain/info/{user_id}:
 *  get:
 *    summary: "블록체인 정보조회"
 *    description: |
 *    tags: [blockchain]
 *    parameters:
 *      - in: path
 *        name: user_id
 *        description: 사용자 id
 *        schema:
 *          type: integer
 *    responses:
 *      "200":
 *        description: (유저 조회)
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                result:
 *                  type: object
 *                  example: { 
 *                    "code": 0000,
 *                    "message": "회원정보 조회 성공", 
 *                    "blockchain_id": 1,
 *                    "user_id": 11,
 *                    "wallet_address": "abcdefg",
 *                    "token_id": 333333,
 *                    "wallet_created_date": "2023-07-02T06:38:56.000Z",
 *                    "token_created_date": "2023-07-02T06:39:13.000Z"
 *                  }
 */



 