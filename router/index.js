const Router = require('express').Router;
const router = new Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * добавляем нужные эндпоинты
 */
router.post(
    '/registration',
    [
        body('email').isEmail(),
        body('password').trim().isLength({ min: 5, max: 32 }),
    ],
    userController.registration,
);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/activate/:link', userController.activate);
router.get('/refresh', userController.refresh);
/**
 * роут только для авторизованных пользователей
 */
router.get('/users', authMiddleware, userController.getUsers);

module.exports = router;
