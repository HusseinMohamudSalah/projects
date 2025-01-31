const express = require('express');

const router = express.Router();

const {
    getChats,
    sendMessage,
    updateMessage,
    deleteMessage
} = require('../controllers/chat');

const { allowedRoles } = require('../middlewares/acl');
const { guard } = require('../middlewares/guard');


router.get('/', guard, allowedRoles('admin', 'user'), getChats);
router.post('/', guard, allowedRoles('admin', 'user'), sendMessage);
router.patch('/:id', guard, allowedRoles('admin', 'user'), updateMessage);
router.delete('/:id', guard, allowedRoles('admin', 'user'), deleteMessage);


module.exports = router;
