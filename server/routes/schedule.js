const express = require('express');
const router = express.Router();
const { getSchedules, createSchedule, updateSchedule, deleteSchedule } = require('../controllers/scheduleController');
const { authenticate } = require('../middleware/auth');
const { enforcePermission } = require('../middleware/orgAuth');
const { PERMISSIONS } = require('../utils/permissions');

router.get('/', authenticate, enforcePermission(PERMISSIONS.SCAN_VIEW), getSchedules);
router.post('/', authenticate, enforcePermission(PERMISSIONS.SCAN_MANAGE_SCHEDULE), createSchedule);
router.put('/:id', authenticate, enforcePermission(PERMISSIONS.SCAN_MANAGE_SCHEDULE), updateSchedule);
router.delete('/:id', authenticate, enforcePermission(PERMISSIONS.SCAN_MANAGE_SCHEDULE), deleteSchedule);

module.exports = router;
