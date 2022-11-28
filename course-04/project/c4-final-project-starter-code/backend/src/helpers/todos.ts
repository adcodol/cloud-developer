import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'

import { getUserId } from '../lambda/utils'

// TODO: Implement businessLogic

const todosAccess = new TodosAccess()

const logger = createLogger('todos')

export async function getAllTodos(event): Promise<TodoItem[]> {
  logger.info('getAllTodos', { event })
  return todosAccess.getAllTodos(getUserId(event))
}

export async function createTodo(createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
  logger.info('createTodo', createTodoRequest)
  return todosAccess.createTodo({
    todoId: uuid.v4(),
    userId: getUserId(createTodoRequest),
    name: createTodoRequest.name,
    done: false,
    dueDate: createTodoRequest.dueDate,
    createdAt: new Date().toISOString(),
    attachmentUrl: '',
  })
}

export async function generateUploadUrl(todoId: string, userId: string): Promise<String> {
  logger.info('generateUploadUrl', { todoId, userId })
  return todosAccess.generateUploadUrl(userId, todoId);
}

export async function updateTodo(todoId: string, userId: string, updateTodoRequest: UpdateTodoRequest): Promise<void> {
  logger.info('updateTodo', { todoId, userId })
  await todosAccess.updateTodo(userId, todoId, updateTodoRequest)
}

export async function deleteTodo(itemId: string, userId: string): Promise<void> {
  logger.info('deleteTodo', { itemId, userId })
  await todosAccess.deleteTodo(itemId, userId)
}