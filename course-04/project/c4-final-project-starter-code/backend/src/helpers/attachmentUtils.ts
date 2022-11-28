import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

// TODO: Implement the fileStogare logic
export class FileStorage {
  constructor(
      private readonly s3 = new AWS.S3({ signatureVersion: 'v4' }),
      private readonly imageBucketName = process.env.IMAGE_BUCKET_NAME,
      private readonly signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION,
      private readonly docClient: DocumentClient = createDynamoDBClient(),
      private readonly todosTable = process.env.TODOS_TABLE,
      private readonly todosUserIndex = process.env.TODOS_USER_INDEX,
      ) {}

      async generateUploadUrl(userId: String, todoId: String): Promise<String> {

        const signedUrl = await this.s3.getSignedUrl('putObject', {
          Bucket: this.imageBucketName,
          Key: todoId,
          Expires: this.signedUrlExpiration
        })
    
        const param = {
          TableName: this.todosTable,
          IndexName: this.todosUserIndex,
          Key: {
            "userId": userId,
            "todoId": todoId
          },
          UpdateExpression: "set attachmentUrl = :attachmentUrl",
          ExpressionAttributeValues: {
            ":attachmentUrl": `https://${this.imageBucketName}.s3.amazonaws.com/${todoId}`
          }
        }
    
        await this.docClient.update(param).promise()
    
        return signedUrl
      }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8005'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}

