const express = require('express');
const router = express.Router();
const db = require('../services/dynamodb');

// Get tasks page
router.get('/', async (req, res) => {
    try {
        let tasks;
        
        // Admins can see all tasks, regular users see only their own
        if (req.session.user.isAdmin) {
            tasks = await db.getAllTasks();
        } else {
            tasks = await db.getTasksByUser(req.session.user.id);
        }
        
        // Sort by creation date (newest first)
        tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.render('tasks', { 
            tasks, 
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.render('tasks', { tasks: [], user: req.session.user, error: 'Failed to load tasks' });
    }
});

// Create new task
router.post('/', async (req, res) => {
    try {
        const { title, description } = req.body;
        await db.createTask(req.session.user.id, title, description || '');
        res.redirect('/tasks');
    } catch (error) {
        console.error('Error creating task:', error);
        res.redirect('/tasks?error=create_failed');
    }
});

// Update task status
router.post('/:taskId/status', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status, userId } = req.body;
        
        // Use provided userId for admins, otherwise use session user id
        const targetUserId = req.session.user.isAdmin && userId ? userId : req.session.user.id;
        
        await db.updateTaskStatus(targetUserId, taskId, status);
        res.redirect('/tasks');
    } catch (error) {
        console.error('Error updating task:', error);
        res.redirect('/tasks?error=update_failed');
    }
});

// Delete task
router.post('/:taskId/delete', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { userId } = req.body;
        
        // Use provided userId for admins, otherwise use session user id
        const targetUserId = req.session.user.isAdmin && userId ? userId : req.session.user.id;
        
        await db.deleteTask(targetUserId, taskId);
        res.redirect('/tasks');
    } catch (error) {
        console.error('Error deleting task:', error);
        res.redirect('/tasks?error=delete_failed');
    }
});

module.exports = router;