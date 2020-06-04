const dbConfig = require('../config/db');

const { db } = dbConfig;


async function createThread(req, reply) {
  const slug = req.body.slug ? req.body.slug : null;
  const forum = req.body.forum ? req.body.forum : req.params.slug;
  db.one(`INSERT INTO threads (author, created, forum, message, title, slug) VALUES
    ((SELECT nickname FROM users WHERE nickname=$1),
    $2, (SELECT slug FROM forums WHERE slug=$3),$4, $5, $6)
    RETURNING author, created, forum, message, title, votes, id ${req.body.slug? ', slug' : ''}`,[
    req.body.author,
    req.body.created,
    forum,
    req.body.message,
    req.body.title,
    slug,
  ])
    .then(async (data) => {
      await db.none(`
        INSERT INTO forum_users(user_id,forum_slug, username) VALUES
          ((SELECT id FROM users WHERE users.nickname = $2), $1, $2) ON CONFLICT DO NOTHING
      `,[forum, req.body.author]);
      reply.code(201)
        .send(data);
    })
    .catch((err) => {
      if (err.code === dbConfig.dataConflict) {
        db.one({
          text: 'SELECT * FROM threads WHERE slug=$1',
          values: [slug],
        })
          .then((data) => {
            reply.code(409)
              .send(data);
          })
          .catch((error) => {
            reply.code(500).send(error);
          });
      } else if (err.code === dbConfig.notNullError) {
        reply.code(404)
          .send(err);
      } else {
        reply.code(500).send(err);
      }
    });
}

async function getThreads(req, reply) {
  const desc = req.query.desc;
  let sort;
  let limit;
  let since;

  if (desc === 'true') {
    sort = 'DESC';
  } else {
    sort = 'ASC';
  }

  if (req.query.limit) {
    limit = `LIMIT ${req.query.limit}`;
  }

  if (req.query.since) {
    if (desc === 'true') {
      since = `AND created <= '${req.query.since}'`;
    } else {
      since = `AND created >= '${req.query.since}'`;
    }
  } else {
    since = '';
  }

  db.any({
    text: `SELECT * FROM threads WHERE forum=$1 ${since} ORDER BY created ${sort} ${limit?limit:''};`,
    values: [req.params.slug],
  })
    .then((data) => {
      if (data.length === 0) {
        db.one({
          text: 'SELECT * FROM forums WHERE slug=$1',
          values: [req.params.slug],
        })
          .then(() => {
            reply.code(200).send(data);
          })
          .catch((error) => {
            if (error.code === 0) {
              reply.code(404).send({
                message: `Can't find threads by forum ${req.params.slug}`,
              });
            } else { reply.code(500).send(error); }
          });
      } else {
        reply.code(200).send(data);
      }
    })
    .catch((err) => {
      if (err.code === dbConfig.notFound) {
        reply.code(404)
          .send({
            message: `Can't find threads by forum ${req.params.slug}`,
          });
      } else {
        reply.code(500).send(err);
      }
    });
}

async function getThreadInfo(req, reply) {
  let query = `
    SELECT author, created, forum, id, message, votes, slug, title FROM threads WHERE`;
  if (isNaN(req.params.slug)) {
    query += ' slug = $1';
  } else {
    query += ' id = $1';
  }

  db.one({
    text: query,
    values: [req.params.slug],
  })
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

async function getPostsByID(req, reply, id) {
  const slugOrId = id;

  const { limit } = req.query;
  const { since } = req.query;
  let { sort } = req.query;
  const { desc } = req.query;

  if (!sort) {
    sort = 'flat';
  }
  let query;
  let args = [];
  if (sort === 'flat') {
    query = `SELECT id, thread_id AS thread, created,
    message, parent_id AS parent, author, forum_slug AS forum FROM
    (SELECT * FROM posts WHERE thread_id = $1 `;
    args = [slugOrId];
    let i = 2;
    if (since) {
      if (desc === 'true') {
        query += ` AND id < $${i++}`;
      } else {
        query += ` AND id > $${i++}`;
      }
      args.push(since);
    }
    query += ' ) p ';
    if (desc === 'true') {
      query += ' ORDER BY created DESC, id DESC ';
    } else {
      query += ' ORDER BY created, id  ';
    }

    if (limit) {
      query += ` LIMIT $${i++}`;
      args.push(limit);
    }
  } else if (sort === 'tree') {
    let sinceQuery;
    let descQuery;
    let limitSql;
    let i = 2;
    args = [];
    args.push(slugOrId);

    if (since) {
      sinceQuery = ` AND (path ${desc === 'true' ? '<' : '>'}
        (SELECT path FROM posts WHERE id = $${i++})) `;
      args.push(since);
    } else {
      sinceQuery = '';
    }

    if (desc === 'true') {
      descQuery = ' DESC ';
    } else {
      descQuery = '';
    }

    if (limit) {
      limitSql = ` LIMIT $${i++}`;
      args.push(limit);
    } else {
      limitSql = '';
    }

    query = `
      SELECT id, author, created, message, parent_id AS parent,
        forum_slug AS forum, thread_id AS thread
        FROM posts
        WHERE thread_id = $1 ${sinceQuery}
        ORDER BY path ${descQuery}
        ${limitSql}
    `;

  } else {
    args = [slugOrId];
    const descQuery = desc === 'true' ? 'DESC' : '';
    let sinceQuery;
    let limitSql;
    let k = 2;
    if (since) {
      sinceQuery = `
        AND id ${desc === 'true' ? '<' : '>'} (SELECT path[1] FROM posts WHERE id = $${k++})`;
      args.push(since);
    } else {
      sinceQuery = '';
    }

    if (limit) {
      limitSql = `LIMIT $${k++}`;
      args.push(limit);
    } else {
      limitSql = 'LIMIT 100000';
    }

    query = `
    SELECT author, created, forum_slug AS forum, id, edited,
      message, parent_id AS parent, thread_id AS thread
      FROM posts
      WHERE path[1] IN (
        SELECT id FROM posts
        WHERE thread_id=$1 AND parent_id IS NULL
        ${sinceQuery}
        ORDER BY id ${descQuery}
        ${limitSql}
      ) AND thread_id=$1
      ORDER BY path[1] ${descQuery}, path;
    `;
  }

  db.any({
    text: query,
    values: args,
  })
    .then(async (data) => {
      if (data.length === 0) {

        let query = 'SELECT threads.id FROM threads WHERE ';
        if (isNaN(slugOrId)) {
          query += 'threads.id = $1';
        } else {
          query += 'threads.id = $1';
        }

        await db.one({
          text: query,
          values: slugOrId,
        })
          .then((threadForumInfo) => {
            if (threadForumInfo.length === 0) {
              reply.code(404)
                .send({
                  message: "Can't find thread with id #",
                });
            } else {
              reply.code(200)
                .send([]);
            }
          })
          .catch((error) => {
            if (error.code === 0) {
              reply.code(404)
                .send({
                  message: "Can't find thread with id #",
                });
            } else {
              reply.code(500)
                .send(error);
            }
          });
      }

      reply.code(200)
        .send(data);
    })
    .catch((err) => {
      if (err.code === 0) {
        reply.code(404)
          .send({
            message: "Can't find thread with id #",
          });
      } else {
        reply.code(500).send(err);
      }
    });
}

async function getPosts(req, reply) {
  if (isNaN(req.params.slug)) {
    db.one({
      text: 'SELECT id FROM threads WHERE slug=$1',
      values: [req.params.slug],
    })
      .then((data) => {
        getPostsByID(req, reply, data.id);
      })
      .catch(() => {
        reply.code(404)
          .send({
            message: "Can't find thread with id #",
          });
      });
  } else {
    getPostsByID(req, reply, req.params.slug);
  }
}

async function updateThread(req, reply) {
  let query;
  let args = [];
  let i = 1;
  const title = req.body.title;
  const message = req.body.message;

  if (!title && !message) {
    query = `
      SELECT created, id, title,
        slug, message, author, forum
        FROM threads WHERE
    `;
    if (isNaN(req.params.slug)) {
      query += 'slug = $1';
    } else {
      query += 'id = $1';
    }
    args = [req.params.slug];
  } else {
    query = 'UPDATE threads SET ';
    if (title) {
      query += `title = $${i++},`;
      args.push(title);
    }

    if (message) {
      query += `message = $${i++},`;
      args.push(message);
    }
    query = query.slice(0, -1);
    query += ' WHERE ';
    if (isNaN(req.params.slug)) {
      query += `slug = $${i++} RETURNING created, id, title, slug, message, author, forum`;
    } else {
      query += `id = $${i++} RETURNING created, id, title,slug, message,author, forum`;
    }
    args.push(req.params.slug);
  }

  db.one({
    text: query,
    values: args,
  })
    .then((data) => {
      if (data.length === 0) {
        reply.code(404)
          .send({
            message: `Can't find thread by slug: ${req.params.slug}`,
          });
      } else {
        reply.code(200).send(data);
      }
    })
    .catch((err) => {
      if (err.code === 0) {
        reply.code(404)
          .send({
            message: `Can't find thread by slug: ${req.params.slug}`,
          })
      } else {
        reply.code(500).send(err);
      }
    });
}

module.exports = {
  createThread,
  getThreads,
  getThreadInfo,
  getPosts,
  updateThread,
};
