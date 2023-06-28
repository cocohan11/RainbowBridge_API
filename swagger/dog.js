/**
 * @swagger
 * /api/dog/breed:
 *  post:
 *    summary: "견종명 등록"
 *    description: "견종이 예측된 후에 사용자가 '맞아요'버튼을 클릭시 실행되는 API입니다."
 *    tags: [dog]
 *    requestBody:
 *      description: 사용자 강아지의 영어견종명이 DB에 저장됩니다. 
 *      required: true
 *      content:
 *        application/x-www-form-urlencoded:
 *          schema:
 *            type: object
 *            properties:
 *              dogId:
 *                type: integer
 *                description: "강아지 id"
 *              breedName:
 *                type: string
 *                description: "영어견종명 ex.French Bulldog"
 *    responses:
 *      "200":
 *        description: 사용자 강아지의 영어견종명이 DB에 저장되었습니다.
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
 * /api/dog/confirm/front/photo:
 *  post:
 *    summary: "반려견 앞모습 인풋사진 저장"
 *    description: |
 *      반려견의 앞모습 인풋사진을 저장하는 API입니다.
 *      다음은 이 API가 수행하는 작업입니다.
 *      1) AWS S3에 반려견 인풋사진 업로드
 *      2) DB에 S3 저장경로와 파일명 저장
 *    tags: [dog]
 *    requestBody:
 *      description: "앞모습 인풋사진을 전송합니다."
 *      required: true
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              dogId:
 *                type: integer
 *                description: "강아지 ID"
 *              type:
 *                type: string
 *                description: "인풋사진 타입"
 *              facePhoto:
 *                type: string
 *                format: binary
 *                description: "앞모습 인풋사진 파일"
 *    responses:
 *      "200":
 *        description: "앞모습 인풋사진이 성공적으로 저장되었습니다."
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                result:
 *                  type: string
 */


/**
 * @swagger
 * /api/dog/confirm/side/photo:
 *  post:
 *    summary: "반려견 옆모습 인풋사진 저장"
 *    description: |
 *      반려견의 옆모습 인풋사진을 저장하는 API입니다.
 *      다음은 이 API가 수행하는 작업입니다.
 *      1) AWS S3에 반려견 인풋사진 업로드
 *      2) DB에 S3 저장경로와 파일명 저장
 *    tags: [dog]
 *    requestBody:
 *      description: "옆모습 인풋사진을 전송합니다."
 *      required: true
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              dogId:
 *                type: integer
 *                description: "강아지 ID"
 *              type:
 *                type: string
 *                description: "인풋사진 타입"
 *              bodyPhoto:
 *                type: string
 *                format: binary
 *                description: "옆모습 인풋사진 파일"
 *    responses:
 *      "200":
 *        description: "옆모습 인풋사진이 성공적으로 저장되었습니다."
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                result:
 *                  type: string
 */



/**
 * @swagger
 * /api/dog/create:
 *  post:
 *    summary: "반려견 정보 등록"
 *    description: "사용자가 강아지 이름을 등록할 때 DB에 dogId가 생성됩니다."
 *    tags: [dog]
 *    requestBody:
 *      description: qqqqq
 *      required: true
 *      content:
 *        application/x-www-form-urlencoded:
 *          schema:
 *            type: object
 *            properties:
 *              userId:
 *                type: integer
 *                description: "사용자 id"
 *              dogName:
 *                type: string
 *                description: "강아지이름 ex.솜이"
 *    responses:
 *      "200":
 *        description: (qqqq)
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                result:
 *                  type: object
 */