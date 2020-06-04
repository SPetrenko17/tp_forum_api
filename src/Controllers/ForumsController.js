const dbConfig = require('../config/db');
const { db } = dbConfig;

export default new class ForumsController {


  async createForum(req, reply) {
    db.one(`INSERT INTO forums (slug, title, "user") VALUES
    ($1, $2, (SELECT nickname FROM users WHERE nickname=$3)) RETURNING *`,[req.body.slug, req.body.title, req.body.user])
        .then((data) => {
          reply.code(201)
              .send(data);
        })
        .catch((err) => {
          if (err.code === dbConfig.dataConflict) {
            db.one({
              text: 'SELECT slug, title, "user" FROM forums WHERE slug=$1',
              values: [req.body.slug],
            })
                .then((data) => {
                  reply.code(409)
                      .send(data);
                });
          } else if (err.code === dbConfig.notNullError) {
            reply.code(404)
                .send(err);
          }
        });
  }

  async getForumInfo(req, reply) {
    db.one( 'SELECT * FROM forums WHERE slug=$1;',[req.params.slug])
        .then((data) => {
          if (data.length === 0) {
            reply.code(404)
                .send({
                  message: `Can't find forum by slug ${req.params.slug}`,
                });
          }
          reply.code(200)
              .send(data);
        })
        .catch((err) => {
          if (err.code === 0) {
            reply.code(404)
                .send({
                  message: `Can't find forum by slug ${req.params.slug}`,
                });
          }
        });
  }

  async getForumUsers(req, reply) {

    const desc = req.query.desc;
    const limit = req.query.limit;
    const since = req.query.since;
    const slug = req.params.slug;

    let query = `
    SELECT u.* FROM "users" u
    JOIN forum_users f ON u.id = f.user_id
    WHERE
      f.forum_slug = $1
    `;
    const args = [slug];
    let i = 2;
    if (since) {
      if (desc === 'true') {
        query += ` AND f.username < $${i++} COLLATE "C" `;
      } else {
        query += ` AND f.username > $${i++} COLLATE "C" `;
      }
      args.push(since);
    }
    if (desc === 'true') {
      query += ' ORDER BY f.username COLLATE "C" DESC ';
    } else {
      query += ' ORDER BY f.username COLLATE "C" ASC ';
    }
    if (limit) {
      query += ` LIMIT $${i++}`;
      args.push(limit);
    }
    db.any(query,args)
        .then((data) => {
          if (data.length === 0) {
            db.one({
              text: 'SELECT id FROM forums WHERE slug = $1 LIMIT 1',
              values: [slug],
            })
                .then((forumInfo) => {
                  if (forumInfo.length !== 0) {
                    reply.code(200).send([]);
                  } else {
                    reply.code(500)
                        .send({
                          message: 'Everything is empty',
                          forumInfo,
                        });
                  }
                })
                .catch((error) => {
                  if (error.code === 0) {
                    reply.code(404)
                        .send({
                          message: `Can't find forum by slug ${slug}`,
                        });
                  } else {
                    reply.code(500).send(error);
                  }
                });
          } else {
            reply.header('Content-Type', 'application/json')
                .type('application/json')
                .code(200).send(data);
          }
        })
        .catch((err) => {
          if (err.code === 0) {
            reply.code(404)
                .send({
                  message: `Can't find forum by slug ${slug}`,
                });
          } else {
            reply.code(500).send(err);
          }
        });
  }

}
