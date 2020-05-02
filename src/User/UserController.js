import usersModel from './UserModel';
import UserSerializer from "./UserSerializer";

export default new class UsersController {

    async createUser(req, reply) {
        let nickname = req.params['nickname'];
        let userData = req.body;

        let existingUser = await usersModel.getUsersByNicknameOrEmail(nickname, userData.email);
        if (existingUser.length > 0) {
            return reply
                .code(409)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(existingUser)
        }

        let result = await usersModel.createUser(nickname, userData);
        if (result.isSuccess) {
            reply
                .code(201)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(UserSerializer.serialize_one(result))
        } else {
            reply
                .code(500)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send()
        }
    }

    async get(req, reply) {
        let nickname = req.params['nickname'];
        let existingUser = await usersModel.getByNickname(nickname);
        if (!existingUser) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({ message: "Can't find user with nickname " + nickname })
        }
        reply
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(existingUser);
    }

    async updateUser(req, reply) {
        let nickname = req.params['nickname'];
        let userData = req.body;

        let existingUser = await usersModel.getByNickname(nickname);

        if (!existingUser) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({ message: `Can't find user with nickname ${nickname}`});
        }

        let updatedUser = await usersModel.updateUser(nickname, userData);
        if (!updatedUser) {
            return reply
                .code(409)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({ message: `Can't change user with nickname ${nickname}`});
        }

        if (updatedUser === true) {
            reply
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(existingUser);
        } else {
            reply
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(updatedUser);
        }

    }
}
