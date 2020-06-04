const dbConfig = require('../config/db');

const { db } = dbConfig;

export default new class ServiceController {
  async status(req, reply) {
    const query = `
    SELECT (
      SELECT COUNT(*) FROM forums) AS forum,
      (SELECT COUNT(*) FROM users) AS user_count,
      (SELECT COUNT(*) FROM threads) AS thread,
      (SELECT COUNT(*) FROM posts) AS post
    `;

    db.one(query)
        .then((data) => {
          data.forum = parseInt(data.forum, 10);
          data.user = parseInt(data.user_count, 10);
          data.thread = parseInt(data.thread, 10);
          data.post = parseInt(data.post, 10);
          reply.code(200).send(data);
        })
        .catch((err) => {
          reply.code(500).send(err);
        });
  }

  async clear(req, reply) {
    const query = `
    TRUNCATE TABLE forum_users, votes, posts, threads, forums, users;`;
    db.none(query)
        .then(() => {
          reply.code(200).send(null);
        })
        .catch((err) => {
          reply.code(500).send(err);
        });
  }

}
