import threadSerializer from '../Serializers/ThreadSerializer'
import postSerializer from '../Serializers/PostSerializer'
import forumSerializer from '../Serializers/ForumSerializer'
import userSerializer from '../Serializers/UserSerializer'
const dbConfig = require('../config/db');

const { db } = dbConfig;

export default new class PostsController {

    async createPost(req, reply) {
        let query = 'SELECT id AS thread_id, forum FROM threads WHERE ';
        if (isNaN(req.params.slug)) {
            query += ' slug = $1';
        } else {
            query += ' id = $1';
        }

        const posts = req.body;
        dbConfig.postsCount += posts.length;

        db.one({
            text: query,
            values: req.params.slug,
        })
            .then((threadForumInfo) => {
                if (posts.length === 0) {
                    reply.code(201).send([]);
                }
                if (threadForumInfo.length === 0) {
                    reply.code(404)
                        .send({
                            message: `Can't find thread by slug ${req.params.slug}`,
                        });
                }

                query = `INSERT INTO posts (id, edited, author, message,thread_id, parent_id, path, forum_slug) VALUES `;

                const args = [];
                let i = 1;
                const forumUsers = [];

                for (let j = 0; j < posts.length; j++) {
                    forumUsers.push(posts[j].author);

                    if (posts[j].parent !== undefined) {
                        query += `((SELECT nextval('posts_id_seq')::integer),
            FALSE, $${i}, $${i + 1}, (
              SELECT (
                CASE WHEN
                EXISTS (
                  SELECT 1 FROM posts p
                  WHERE p.id=$${i + 3}
                  AND p.thread_id=$${i + 2}
                )
                THEN $${i + 2} ELSE NULL END)
            ), $${i + 3},  array_append(
              (SELECT path FROM posts WHERE id=$${i + 3}),
                (SELECT currval('posts_id_seq')::integer)),
                $${i + 4}),`;
                        i += 5;
                        args.push(...[posts[j].author, posts[j].message, threadForumInfo.thread_id, posts[j].parent, threadForumInfo.forum],
                        );
                    } else {
                        query += `((SELECT nextval('posts_id_seq')::integer),
            FALSE, $${i}, $${i + 1}, $${i + 2}, NULL,
              array_append('{}', (SELECT currval('posts_id_seq')::integer)), $${i + 3}),`;
                        i += 4;
                        args.push(...[posts[j].author, posts[j].message, threadForumInfo.thread_id, threadForumInfo.forum],
                        );
                    }
                }

                query = query.slice(0, -1);
                query += ` RETURNING author, id, created,
        thread_id AS thread, parent_id AS parent, forum_slug AS forum, message`;

                db.any(query, args)
                    .then(async (data) => {
                        await db.none('UPDATE forums SET posts=forums.posts+$1 WHERE slug=$2',[posts.length, threadForumInfo.forum]);
                        let forum_usersSql = `INSERT INTO forum_users(user_id, forum_slug, username) VALUES`;
                        let index = 1;
                        const forum_usersArgs = [];
                        for (let k = 0; k < forumUsers.length; k++) {
                            forum_usersSql += `((SELECT id FROM users WHERE users.nickname = $${index + 1}),
              $${index}, $${index + 1}),`;
                            index += 2;
                            forum_usersArgs.push(threadForumInfo.forum, forumUsers[k]);
                        }
                        forum_usersSql = forum_usersSql.slice(0, -1);
                        forum_usersSql += ' ON CONFLICT DO NOTHING';

                        await db.none(forum_usersSql,forum_usersArgs)
                            .catch(err => console.log(err));

                        reply.code(201).send(data);
                    })
                    .catch((error) => {
                        console.log(error);
                        if (error.code === dbConfig.notNullError) {
                            reply.code(409)
                                .send({
                                    message: 'Parent post was created in another thread',
                                });
                        } else if (error.code === dbConfig.dataDoesNotExist) {
                            reply.code(404)
                                .send({
                                    message: 'User not found',
                                });
                        } else if (error.code === dbConfig.notNullError) {
                            reply.code(404).send({
                                message: "Can't find user with id #",
                            });
                        } else {
                            reply.code(500).send(error);
                        }
                    });
            })
            .catch((err) => {
                if (err.code === 0) {
                    reply.code(404)
                        .send({
                            message: "Can't find user with id #",
                        });
                } else {
                    reply.code(500).send(err);
                }
            });
    }

    async getPostInfo(req, reply) {
        const id = req.params.slug;
        const related = req.query.related;

        let userRelated;
        let threadRelated;
        let forumRelated;

        if (related !== undefined) {
            userRelated = related.includes('user');
            threadRelated = related.includes('thread');
            forumRelated = related.includes('forum');
        }

        let query;
        if (related === undefined) {
            query = `SELECT id, parent_id AS parent, thread_id AS thread, message, edited AS "isEdited", created, forum_slug AS forum, author FROM posts WHERE id = $1 LIMIT 1`;
            db.one(query, [id])
                .then((post) => {
                    reply.code(200).send({
                        post,
                    });
                })
                .catch((err) => {
                    if (err.code === 0) {
                        reply.code(404)
                            .send({
                                message: `Can't find post with id ${id}`,
                            });
                    } else {
                        reply.code(500).send(err);
                    }
                });
        } else {
            let beginQuery = `
      SELECT posts.id AS pid, posts.parent_id AS pparent,
        posts.thread_id AS pthread, posts.message AS pmessage,
        posts.edited AS pisedited, posts.created AS pcreated,
        posts.forum_slug AS pforumslug, posts.author AS pauthor,`;
            let endQuery = ' FROM posts ';
            if (userRelated) {
                beginQuery += `
        U.nickname AS unickname, U.about AS uabout,
        U.fullname AS ufullname, U.email AS uemail,`;
                endQuery += 'LEFT JOIN users U ON U.nickname = posts.author ';
            }
            if (threadRelated) {
                beginQuery += `
        threads.author AS tauthor, threads.created AS tcreated,
        threads.votes AS tvotes, threads.id AS tid,
        threads.title AS ttitle, threads.message AS tmessage,
        threads.slug AS tslug, threads.forum AS tforumslug,`;
                endQuery += 'LEFT JOIN threads ON threads.id = posts.thread_id ';
            }
            if (forumRelated) {
                beginQuery += `
        F.slug AS fslug, F.threads AS fthreads, F.title as ftitle,
        F.posts AS fposts, F."user" AS fuser_nickname,`;
                endQuery += 'LEFT JOIN forums F ON F.slug = posts.forum_slug ';
            }
            endQuery += ' WHERE posts.id = $1 LIMIT 1';
            const query = beginQuery.slice(0, -1) + endQuery;
            db.one(query, id)
                .then((responseData) => {
                    const response = {};
                    response.post = postSerializer.serializeRelated(responseData);
                    if (forumRelated) {
                        response.forum = forumSerializer.serializeRelated(responseData);
                    }
                    if (userRelated) {
                        response.author = userSerializer.serializeRelated(responseData);
                    }
                    if (threadRelated) {
                        response.thread = threadSerializer.serializeRelated(responseData)
                    }
                    reply.code(200).send(response);
                })
                .catch((err) => {
                    // console.log(err);
                    if (err.code === 0) {
                        reply.code(404)
                            .send({
                                message: `Can't find thread with id ${id}`,
                            });
                    } else {
                        reply.code(500)
                            .send(err);
                    }
                });
        }
    }

    async updatePost(req, reply) {
        let query;
        const args = [];

        if (req.body.message === undefined) {
            query = `
      SELECT id, author, message, created,forum_slug AS forum, thread_id AS thread FROM posts WHERE id=$1`;
            args.push(req.params.id);
        } else {
            query = `
    UPDATE posts SET edited = message <> $1, message = $1 WHERE id = $2 RETURNING id, message, author, created, forum_slug AS forum,
        parent_id AS parent, thread_id AS thread, edited AS "isEdited"

    `;
            args.push(req.body.message, req.params.id);
        }

        db.one(query, args)
            .then((data) => {
                if (data.length === 0) {
                    reply.code(404)
                        .send({
                            message: `Can't find post by id ${req.params.id}`,
                        });
                }
                reply.code(200)
                    .send(data);
            })
            .catch((err) => {
                if (err.code === 0) {
                    reply.code(404)
                        .send({
                            message: `Can't find post by id ${req.params.id}`,
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
