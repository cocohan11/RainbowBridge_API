
/**
 * @swagger
 * /api/member/leave:
 *  post:
 *    summary: "회원탈퇴 정보변경"
 *    description: "사용자 정보가 변경되고 강아지의 모든 정보가 삭제됩니다."
 *    tags: [member]
 *    requestBody:
 *      description: 사용자가 서버로 전달하는 값에 따라 결과 값은 다릅니다. (유저 등록)
 *      required: true
 *      content:
 *        application/x-www-form-urlencoded:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *                description: "사용자 이메일"
 *              leaveReasonNum:
 *                type: integer
 *                description: "변경사유번호"
 *              userId:
 *                type: integer
 *                description: "사용자 id"
 *              leaveReasonCtx:
 *                type: integer
 *                description: "탈퇴사유"
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
 * /api/member/{email}:
 *  get:
 *    summary: "회원정보조회"
 *    description: |
 *      로그인할 때 쓴다.
 *      isModelCreated:1 -> 이 사용자는 텍스처까지 생성된 반려견 모델이 있다.
 *    tags: [member]
 *    parameters:
 *      - in: path
 *        name: email
 *        description: 사용자 이메일
 *        schema:
 *          type: string
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
 *                    "userId": 262,
 *                    "loginSnsType": "G",
 *                    "memType": "N",
 *                    "userEmail": "yhj970416@gmail.com",
 *                    "nickname": null,
 *                    "createdAt": "2023-05-08T22:11:25.000Z",
 *                    "leaveAt": null,
 *                    "leaveReasonNum": 0,
 *                    "leaveReason": null,
 *                    "dogName": "구그리",
 *                    "dogId": 1046,
 *                    "dogBreedName": "Long Hair Chihuahua",
 *                    "isModelCreated": 1,
 *                    "fvTxtFilename": "https://user-input-texture-photo.s3.ap-northeast-2.amazonaws.com/front/Face_result_image_14254231-81d7-415c-a4b9-8e019a7d8b1f.png",
 *                    "svTxtFilename": "https://user-input-texture-photo.s3.ap-northeast-2.amazonaws.com/side/Body_result_image_1161f573-655f-48f8-9767-d1ae15a4ef42.png"
 *                  }
 */




/**
 * 회원정보 가입 API 
 * @route {POST} api/member/join
 */
/**
 * @swagger
 * /api/member/join:
 *  post:
 *    summary: "회원정보 가입"
 *    tags: [member]
 *    requestBody:
 *      required: true
 *      content:
 *        application/x-www-form-urlencoded:
 *          schema:
 *            type: object
 *            properties:
 *              loginSNSType:
 *                type: string
 *                description: "로그인 카카오 or 구글"
 *              email:
 *                type: string
 *                description: "사용자 이메일"
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
 