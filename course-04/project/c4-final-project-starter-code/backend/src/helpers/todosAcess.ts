import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todosUserIndex = process.env.TODOS_USER_INDEX,
        ) {}

    async getAllTodos(userId: string): Promise<TodoItem[]> {
        logger('getAllTodos')
        
        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todosUserIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId' : userId
            }
        }).promise()
        
        const items = result.Items
        return items as TodoItem[]
    }

    async getTodoItem(todoId: string, userId: string): Promise<TodoItem> {
        logger('getTodoItem')
        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todosUserIndex,
            KeyConditionExpression: 'userId = :userId and todoId = :todoId',
            ExpressionAttributeValues: {
                ':userId' : userId,
                ':todoId' : todoId
            }
        }).promise()

        const item = result.Items[0]
        return item as TodoItem
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        logger('createTodo')
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()

        return todo
    }

    async updateTodo(userId: String, todoId: String, updateTodoRequest: TodoUpdate): Promise<void> {
        logger('updateTodo')
        var params = {
            TableName: this.todosTable,
            Key: {
                "todoId": todoId,
                "userId": userId
            },
            UpdateExpression: 'set #name = :name, done = :done, dueDate = :dueDate',
            ExpressionAttributeNames: {'#name': 'name'},
            ExpressionAttributeValues: {
                ':name': updateTodoRequest.name,
                ':done': updateTodoRequest.done,
                ':dueDate': updateTodoRequest.dueDate,
            }
        };
        
        this.docClient.update(params).promise()
    }

    async deleteTodo(itemId: string, userId: string): Promise<void> {
        logger('deleteTodo')
        var params = {
            TableName: this.todosTable,
            Key: {
                "todoId": itemId,
                "userId": userId
            },
            // ConditionExpression: 'todoId = :todoId and userId = :userId',
            // ExpressionAttributeValues: {
            //     ':todoId': todoId,
            //     ':userId': userId
            // }
        }
        await this.docClient.delete(params).promise()
    }
}

function createDynamoDBClient() {
    logger('createDynamoDBClient')
    if (process.env.IS_OFFLINE) {
      return new XAWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8005'
      })
    }
  
    return new XAWS.DynamoDB.DocumentClient()
}