import forumsModel from '../Forum/ForumModel';
import usersModel from '../User/UserModel';
import threadsModel from '../Thread/ThreadModel';
import threadsSerializer from '../Thread/ThreadSerializer';
import forumSerializer from '../Forum/ForumSerializer'
import {isValidId} from "../utils/utils";

export default new class ForumsController {

    async createForum(req, reply) {
        let forumData = req.body;
        let ownerNickname = forumData.user;

        let user = await usersModel.getByNickname(ownerNickname);
        if (!user) {
            //В доке был поиск по айдишнку, но в запросе был никнейм. Оставил никнейм
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Can't find user with nickname " + ownerNickname});
        }

        let existingForum = await forumsModel.getForumBySlug(forumData.slug);
        if (existingForum) {
            return reply
                .code(409)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(forumSerializer.serialize_one(existingForum, '409'));
        }

        let createForumResult = await forumsModel.createForum(forumData, user);
        if (createForumResult.isSuccess) {
             reply
                .code(201)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(forumSerializer.serialize_one(createForumResult, '201'));

        } else {
            reply
                .code(500)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send();
        }
    }

    async getForumDetails(req, reply) {
        let slug = req.params['slug'];

        let existingForum = await forumsModel.getForumBySlug(slug);
        if (!existingForum) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Can't find forum with slug " + slug});
        }

        reply
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(forumSerializer.serialize_one(existingForum, '404'));
    }

    async createThreadForForum(req, reply) {
        let threadData = req.body;
        let authorNickname = threadData.author;
        let forumSlug = req.params['slug'];
        if (isValidId(forumSlug)) {
            console.log('formSlug', forumSlug);
            return reply
                .code(400)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Slug can not contain only digits "});
        }

        let user = await usersModel.getByNickname(authorNickname);
        if (!user) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Can't find user with nickname " + authorNickname});
        }

        let existingThread = await threadsModel.get('slug', threadData.slug);
        if (existingThread) {
            return reply
                .code(409)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(threadsSerializer.serialize_one(existingThread));
        }

        let forum = await forumsModel.getForumBySlug(forumSlug);
        if (!forum) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Can't find forum with slug " + forumSlug});
        }

        let createThreadResult = await threadsModel.createThread(threadData, user, forum);

        if (createThreadResult.isSuccess) {
            let addThreadResult = await forumsModel.addThreadsToForum(createThreadResult.data.forum_id);
            if (!addThreadResult.isSuccess) {
                return reply
                    .code(500)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send();
            }
            return reply
                .code(201)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(threadsSerializer.serialize_one(createThreadResult.data));
        } else {
            return reply
                .code(500)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send();
        }
    }

    async getForumThreads(req, reply) {
        const getParams = {
            desc : req.query.desc === 'true',
            limit : req.query.limit ? parseInt(req.query.limit) : 100,
            since : req.query.since,
            slug  : req.params['slug']
        };

        let existingForum = await forumsModel.getForumBySlug(getParams.slug);
        if (!existingForum) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Can't find forum with slug " + getParams.slug});
        }

        let threads = await threadsModel.getThreadsByForumSlug(getParams);
        reply
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(threadsSerializer.serialize_many(threads));
    }

    async getForumUsers(req, reply) {
        const getParams = {
            desc : req.query.desc === 'true',
            limit : req.query.limit ? parseInt(req.query.limit) : 100,
            since : req.query.since,
            slug  : req.params['slug']
        };
        const existingForum = await forumsModel.getForumBySlug(getParams.slug);
        if (!existingForum) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Can't find forum with slug " + getParams.slug});
        }
        const users = await usersModel.getUsersFromForum(existingForum.forum_id, getParams);// здесь
        reply
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(users);
    }

}
