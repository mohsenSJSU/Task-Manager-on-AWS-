const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({
    region: process.env.AWS_REGION
    // Credentials are automatically picked up from:
    // - Instance role (App Runner) or
    // - Environment variables (local dev)
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'Tasks';

// Create a new task
const createTask = async (userId, title, description) => {
    const taskId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            userId,
            taskId,
            title,
            description,
            status: 'pending',
            createdAt: timestamp,
            updatedAt: timestamp
        }
    });
    
    await docClient.send(command);
    return { userId, taskId, title, description, status: 'pending', createdAt: timestamp };
};

// Get tasks for a specific user
const getTasksByUser = async (userId) => {
    const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        }
    });
    
    const response = await docClient.send(command);
    return response.Items || [];
};

// Get all tasks (for admin)
const getAllTasks = async () => {
    const command = new ScanCommand({
        TableName: TABLE_NAME
    });
    
    const response = await docClient.send(command);
    return response.Items || [];
};

// Update task status
const updateTaskStatus = async (userId, taskId, status) => {
    const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId, taskId },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#status': 'status'
        },
        ExpressionAttributeValues: {
            ':status': status,
            ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
    });
    
    const response = await docClient.send(command);
    return response.Attributes;
};

// Delete a task
const deleteTask = async (userId, taskId) => {
    const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { userId, taskId }
    });
    
    await docClient.send(command);
    return { success: true };
};

module.exports = {
    createTask,
    getTasksByUser,
    getAllTasks,
    updateTaskStatus,
    deleteTask
}