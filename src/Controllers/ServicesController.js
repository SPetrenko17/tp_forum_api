const dbConfig = require('../config/db');

const { db } = dbConfig;

export default new class ServiceController {

  async ping(req, reply) {
    db.none({
      text: 'ANALYZE',
    });
    reply.code(200).send({});
  }

  async status(req, reply) {
    const query = `
    SELECT (
      SELECT COUNT(*) FROM forums) AS forum,
      (SELECT COUNT(*) FROM   users) AS "user",
      (SELECT COUNT(*) FROM threads) AS thread,
      (SELECT COUNT(*) FROM posts) AS post
    `;

    db.one(query)
        .then((data) => {
          data.forum = parseInt(data.forum, 10);
          data.user = parseInt(data.user, 10);
          data.thread = parseInt(data.thread, 10);
          data.post = parseInt(data.post, 10);
          reply.code(200).send(data);
        })
        .catch((err) => {
          // console.log(err);
          reply.code(500).send(err);
        });
  }

  async clear(req, reply) {
    const query = `
    TRUNCATE TABLE forum_users, votes, posts, threads, forums, users;
  `;

    dbConfig.counter = {
      forum: 0,
      thread: 0,
      user: 0,
      post: 0,
    };

    db.none(query)
        .then(() => {
          reply.code(200).send(null);
        })
        .catch((err) => {
          // console.log(err);
          reply.code(500).send(err);
        });
  }

}
