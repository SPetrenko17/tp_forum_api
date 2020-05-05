import usersController from "./User/UserController";
import forumsController from "./Forum/ForumController";
import postsController from "./Post/PostController";
import threadsController from "./Thread/ThreadController";
import serviceController from "./Service/ServiceController";

const fastify = require('fastify')({
     logger: true,
});


fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
    try {
        let json = { };
        if(body){
            json = JSON.parse(body)
        }
        done(null, json)
    } catch (err) {
        err.statusCode = 400;
        done(err, undefined)
    }
});


fastify.get('/api/user/:nickname/profile', usersController.get);
fastify.post('/api/user/:nickname/profile', usersController.updateUser);
fastify.post('/api/user/:nickname/create', usersController.createUser);


fastify.post('/api/forum/create', forumsController.createForum);
fastify.get('/api/forum/:slug/details', forumsController.GetRequestGetForumDetails);
fastify.post('/api/forum/:slug/create', forumsController.PostRequestCreateThreadsForForum);
fastify.get('/api/forum/:slug/threads', forumsController.GetRequestGetForumThreads);
fastify.get('/api/forum/:slug/users', forumsController.GetRequestGetForumUsers);


fastify.post('/api/thread/:slug_or_id/create', threadsController.PostRequestPostForThread);
fastify.post('/api/thread/:slug_or_id/vote', threadsController.PostRequestVoteForThread);
fastify.get('/api/thread/:slug_or_id/details', threadsController.GetRequestThreadDetails);
fastify.post('/api/thread/:slug_or_id/details', threadsController.PostRequestThreadDetails);
fastify.get('/api/thread/:slug_or_id/posts', threadsController.GetRequestThreadsPost);


fastify.get('/api/post/:id/details', postsController.GetRequestPostDetails);
fastify.post('/api/post/:id/details', postsController.PostRequestPostDetails);


fastify.get('/api/service/status', serviceController.getServiceStatus);
fastify.post('/api/service/clear', serviceController.clearAll);



const port = process.env.PORT || 5000;
fastify.listen(port, '0.0.0.0', function (err, address) {
    if (err) {
        fastify.log.error(err);
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
});
