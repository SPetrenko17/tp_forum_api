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


userRouter.get('/:nickname/profile', null);
userRouter.post('/:nickname/profile', null);
userRouter.post('/:nickname/create', null);
app.use('/api/user', userRouter);

forumRouter.post('/create', null);
forumRouter.get('/:slug/details', null);
forumRouter.post('/:slug/create', null);
forumRouter.get('/:slug/threads', null);
forumRouter.get('/:slug/users', null);
app.use('/api/forum', forumRouter);

threadRouter.post('/:slug_or_id/create', null);
threadRouter.post('/:slug_or_id/vote', null);
threadRouter.get('/:slug_or_id/details', null);
threadRouter.post('/:slug_or_id/details', null);
threadRouter.get('/:slug_or_id/posts', null);
app.use('/api/thread', threadRouter);

postRouter.get('/:id/details', null);
postRouter.post('/:id/details', null);
app.use('/api/post', postRouter);

serviceRouter.get('/status', null);
serviceRouter.post('/clear', null);
app.use('/api/service', serviceRouter);


app.use(logger('common', {stream: fs.createWriteStream('./access.log', {flags: 'a'})}))
app.use(logger('common'));
app.use(express.json());


const port = process.env.PORT || 5000;
app.listen(port, () => console.log('Server on ', port));
