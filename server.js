import users from './src/Controllers/UsersController'
import forums from './src/Controllers/ForumsController'
import threads from './src/Controllers/ThreadsController'
import posts from './src/Controllers/PostsController'
import votes from './src/Controllers/VotesController'
import service from './src/Controllers/ServicesController'

const port = 5000;

const app = require('fastify')({
  // logger: {
  //   level: 'error',
  // },
});

app.addContentTypeParser('application/json',
    { parseAs: 'buffer' },
    (req, body, done) => {
      if (body.length > 0) {
        done(null, JSON.parse(body));
      } else {
        done(null, {});
      }
    });

app.listen(port, '0.0.0.0', () => {
  console.log(`Started on ${port}`);
});
app.post('/api/user/:nickname/create', users.createUser);
app.get('/api/user/:nickname/profile', users.getUserInfo);
app.post('/api/user/:nickname/profile', users.updateUserInfo);
app.post('/api/forum/create', forums.createForum);
app.get('/api/forum/:slug/details', forums.getForumInfo);
app.post('/api/forum/:slug/create', threads.createThread);
app.get('/api/forum/:slug/threads', threads.getThreads);
app.post('/api/thread/:slug/create', posts.createPost);
app.post('/api/thread/:slug/vote', votes.createVote);
app.get('/api/thread/:slug/details', threads.getThreadInfo);
app.get('/api/thread/:slug/posts', threads.getPosts);
app.post('/api/thread/:slug/details', threads.updateThread);
app.get('/api/forum/:slug/users', forums.getForumUsers);
app.get('/api/post/:slug/details', posts.getPostInfo);
app.get('/api/service/status', service.status);
app.post('/api/service/clear', service.clear);
app.post('/api/post/:id/details', posts.updatePost);
