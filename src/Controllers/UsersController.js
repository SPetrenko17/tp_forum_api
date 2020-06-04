const dbConfig = require('../config/db');
import userSerializer from '../Serializers/UserSerializer'

const { db } = dbConfig;

export default new class UsersController {

  async createUser(req, reply) {
    const user = userSerializer.serializeRequest(req);
    db.one('INSERT INTO users (nickname, fullname, email, about) VALUES ($1, $2, $3, $4) RETURNING *',
        [user.nickname, user.fullname, user.email, user.about])
        .then((data) => {
          reply.code(201)
              .send(data);
        })
        .catch((err) => {
          if (err.code === dbConfig.dataConflict) {
            db.any('SELECT * FROM users WHERE nickname=$1 OR email=$2',[user.nickname, user.email])
                .then((data) => {
                  reply.code(409)
                      .send(data);
                })
                .catch((error) => {
                  reply.code(500)
                      .send(error);
                });
          }
        });
  }

  async getUserInfo(req, reply) {
    db.one('SELECT about, email, nickname, fullname FROM users WHERE nickname=$1;',[req.params.nickname])
        .then((data) => {
          if (data.length === 0) {
            reply.code(404)
                .send({
                  message: `Can't find user by nickname ${req.params.nickname}`,
                });
          }
          reply.code(200)
              .send(data);
        })
        .catch((err) => {
          if (err.code === 0) {
            reply.code(404)
                .send({
                  message: "Can't find user with id #",
                });
          }
        });
  }

  async updateUserInfo(req, reply) {
    let query = 'UPDATE users SET ';
    if (req.body.fullname) {
      query += `fullname = '${req.body.fullname}', `;
    } else {
      query += 'fullname = fullname, ';
    }
    if (req.body.email) {
      query += `email = '${req.body.email}', `;
    } else {
      query += 'email = email, ';
    }
    if (req.body.about) {
      query += `about = '${req.body.about}' `;
    } else {
      query += 'about = about ';
    }
    query += `
    WHERE nickname = '${req.params.nickname}'
    RETURNING *`;

    db.one(query)
        .then((data) => {
          if (data.length === 0) {
            reply.code(404)
                .send({
                  message: `Can't find user by nickname ${req.params.nickname}`,
                });
          }
          reply.code(200)
              .send(data);
        })
        .catch((err) => {
          if (err.code === 0) {
            reply.code(404)
                .send({
                  message: "Can't find user with id #",
                });
          } else if (err.code === dbConfig.dataConflict) {
            reply.code(409)
                .send({
                  message: "Can't find user with id #",
                });
          }
        });
  }
}

