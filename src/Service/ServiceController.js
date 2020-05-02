import forumsModel from '../Forum/ForumModel';
import usersModel from '../User/UserModel';
import threadsModel from '../Thread/ThreadModel';
import postsModel from '../Post/PostModel';
import votesModel from '../Vote/VoteModel';

export default new class ServiceController {

    async getServiceStatus(req, reply) {
        await usersModel.getCount();
        await forumsModel.getCount();
        await threadsModel.getCount();
        await postsModel.getCount();
        reply
            .header('Content-Type', 'application/json; charset=utf-8')
            .send({
                user: Number(usersModel.count),
                forum: Number(forumsModel.count),
                thread: Number(threadsModel.count),
                post: Number(postsModel.count)
            });
    }

    async clearAll(req = null, reply) {
        console.log('test service!');
        await usersModel.clearAll();
        await forumsModel.clearAll();
        await threadsModel.clearAll();
        await postsModel.clearAll();
        await votesModel.clearAll();
         reply
             .code(200)
             .header('Content-Type', 'application/json; charset=utf-8')
             .send(null);
    }

}
