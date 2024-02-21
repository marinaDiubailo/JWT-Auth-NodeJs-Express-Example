const UserModel = require('../models/user');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./mail.service');
const tokenService = require('./token.service');
const UserDto = require('../dtos/user.dto');
const ApiError = require('../exceptions/api.error');

class UserService {
  async registration(email, password) {
    /**
     * достаем юзера из бд
     */
    const candidate = await UserModel.findOne({ email });
    /**
     * проверяем, если такой есть, то пробрасываем ошибку
     */
    if (candidate) {
      throw ApiError.BadRequest('Пользователь с такий email уже существует');
    }
    /**
     * хэшируем пароль
     */
    const hashedPassword = await bcrypt.hash(password, 3);
    /**
     * создаем линк для активации аккаунта
     */
    const activationLink = uuid.v4();
    /**
     * создаем юзера в бд
     */
    const user = await UserModel.create({
      email,
      password: hashedPassword,
      activationLink,
    });
    /**
     * отправляем ссылку по почте
     */
    await mailService.sendActivationMail(
      email,
      `${process.env.API_URL}/api/activate/${activationLink}`,
    );
    /**
     * создаем дто юзера
     */
    const userDto = new UserDto(user);
    /**
     * генерируем токены
     */
    const tokens = tokenService.generateTokens({ ...userDto });
    /**
     * сохраняем токены в бд
     */
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return {
      ...tokens,
      user: userDto,
    };
  }

  async activate(activationLink) {
    const user = await UserModel.findOne({
      activationLink,
    });
    if (!user) throw ApiError.BadRequest('Некорректная ссылка активации');
    user.isActivated = true;
    await user.save();
  }

  async login(email, passowrd) {
    const candidate = await UserModel.findOne({ email });
    if (!candidate) {
      throw ApiError.BadRequest('Пользователь с такий email не найден');
    }
    const isPassEquals = await bcrypt.compare(passowrd, candidate.password);
    if (!isPassEquals) {
      throw ApiError.BadRequest('Неверный пароль');
    }
    const userDto = new UserDto(candidate);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return {
      ...tokens,
      user: userDto,
    };
  }

  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken);
    return token;
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }

    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFormDB = await tokenService.findToken(refreshToken);
    if (!userData || !tokenFormDB) {
      throw ApiError.UnauthorizedError();
    }

    const user = await UserModel.findById(userData.id);
    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return {
      ...tokens,
      user: userDto,
    };
  }

  async getAllUsers() {
    const users = await UserModel.find();
    const result = users.map((user) => new UserDto(user));
    console.log(result);
    return result;
  }
}
module.exports = new UserService();

// когда ищете пользователя для активации почты нужно в запросе findOne добавить isActivated: false, чтобы активация проходила только один раз
