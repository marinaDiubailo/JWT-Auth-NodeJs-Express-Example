const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env.local') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const router = require('./router/index');
const errorMiddleware = require('./middlewares/error.middleware');

const PORT = process.env.PORT || 5000;

/**
 * создаем экземпляр приложения
 */
const app = express();

/**
 * подключаем необходимые Middleware
 */
app.use(express.json());
app.use(cookieParser());

/**
 * разрешаем куки, указываем url фронта
 */
app.use(
    cors({
        credentials: true,
        origin: process.env.CLIENT_URL,
    }),
);

/**
 * добавляем маршрутизацию
 */
app.use('/api', router);

/**
 * добавляем Middleware для обработки ошибок
 * обязательно должен идти последним в цепочке
 */
app.use(errorMiddleware);

/**
 * запускаем приложение
 */
const start = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);

        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    } catch (error) {
        console.log(error);
    }
};

start();
