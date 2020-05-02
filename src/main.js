'use strict';

let express = require('express');
let logger = require('morgan');
let app = express();
let fs = require('fs');


let userRouter = express.Router();
let forumRouter = express.Router();
let postRouter = express.Router();
let threadRouter = express.Router();
let serviceRouter = express.Router();


userRouter.get('/:nickname/profile', usersController.get);
userRouter.post('/:nickname/profile', usersController.updateUser);
userRouter.post('/:nickname/create', usersController.createUser);
app.use('/api/user', userRouter);

forumRouter.post('/create', forumsController.createForum);
forumRouter.get('/:slug/details', forumsController.getForumDetails);
forumRouter.post('/:slug/create', forumsController.createThreadForForum);
forumRouter.get('/:slug/threads', forumsController.getForumThreads);
forumRouter.get('/:slug/users', forumsController.getForumUsers);
app.use('/api/forum', forumRouter);

threadRouter.post('/:slug_or_id/create', threadsController.createPostsForThread);
threadRouter.post('/:slug_or_id/vote', threadsController.createOrUpdateVoteForThread);
threadRouter.get('/:slug_or_id/details', threadsController.getThreadDetails);
threadRouter.post('/:slug_or_id/details', threadsController.updateThreadDetails);
threadRouter.get('/:slug_or_id/posts', threadsController.getThreadPosts);
app.use('/api/thread', threadRouter);

postRouter.get('/:id/details', postsController.getPostDetails);
postRouter.post('/:id/details', postsController.updatePostDetails);
app.use('/api/post', postRouter);

serviceRouter.get('/status', serviceController.getServiceStatus);
serviceRouter.post('/clear', serviceController.clearAll);
app.use('/api/service', serviceRouter);


app.use(logger('common', {stream: fs.createWriteStream('./access.log', {flags: 'a'})}))
app.use(logger('common'));
app.use(express.json());


const port = process.env.PORT || 5000;
app.listen(port, () => console.log('Server on ', port));
