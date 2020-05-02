import forumsModel from '../Forum/ForumModel';
import usersModel from '../User/UserModel';
import threadsModel from '../Thread/ThreadModel';
import threadsSerializer from '../Thread/ThreadSerializer';
import forumSerializer from '../Forum/ForumSerializer'
import {isValidId} from "../utils/utils";

export default new class ForumsController {

    async createForum(req, res) {
        let forumData = req.body;
        let ownerNickname = forumData.user;

        let user = await usersModel.getByNickname(ownerNickname);
        if (!user) {
            //В доке был поиск по айдишнку, но в запросе был никнейм. Оставил никнейм
            return res.status(404).json({message: "Can't find user with nickname " + ownerNickname});
        }

        let existingForum = await forumsModel.getForumBySlug(forumData.slug);
        if (existingForum) {
            return res.status(409).json(forumSerializer.serialize_one(existingForum, '409'));
        }

        let createForumResult = await forumsModel.createForum(forumData, user);
        if (createForumResult.isSuccess) {
            res.status(201).json(forumSerializer.serialize_one(createForumResult, '201'));

        } else {
            res.status(500).end();
        }
    }

    async getForumDetails(req, res) {
        let slug = req.params['slug'];

        let existingForum = await forumsModel.getForumBySlug(slug);
        if (!existingForum) {
            return res.status(404).json({message: "Can't find forum with slug " + slug});
        }

        res.json(forumSerializer.serialize_one(existingForum, '404'));
    }

    async createThreadForForum(req, res) {
        let threadData = req.body;
        let authorNickname = threadData.author;
        let forumSlug = req.params['slug'];
        if (isValidId(forumSlug)) {
            console.log('formSlug', forumSlug);
            return res.status(400).json({message: "Slug can not contain only digits "});
        }

        let user = await usersModel.getByNickname(authorNickname);
        if (!user) {
            return res.status(404).json({message: "Can't find user with nickname " + authorNickname});
        }

        let existingThread = await threadsModel.get('slug', threadData.slug);
        if (existingThread) {
            return res.status(409).json(threadsSerializer.serialize_one(existingThread));
        }

        let forum = await forumsModel.getForumBySlug(forumSlug);
        if (!forum) {
            return res.status(404).json({message: "Can't find forum with slug " + forumSlug});
        }

        let createThreadResult = await threadsModel.createThread(threadData, user, forum);

        if (createThreadResult.isSuccess) {
            let addThreadResult = await forumsModel.addThreadsToForum(createThreadResult.data.forum_id);
            if (!addThreadResult.isSuccess) {
                return res.status(500).end();
            }
            return res.status(201).json(threadsSerializer.serialize_one(createThreadResult.data));
        } else {
            return res.status(500).end();
        }
    }

    async getForumThreads(req, res) {
        const getParams = {
            desc : req.query.desc === 'true',
            limit : req.query.limit ? parseInt(req.query.limit) : 100,
            since : req.query.since,
            slug  : req.params['slug']
        };

        let existingForum = await forumsModel.getForumBySlug(getParams.slug);
        if (!existingForum) {
            return res.status(404).json({message: "Can't find forum with slug " + getParams.slug});
        }

        let threads = await threadsModel.getThreadsByForumSlug(getParams);
        res.json(threadsSerializer.serialize_many(threads));
    }

    async getForumUsers(req, res) {
        const getParams = {
            desc : req.query.desc === 'true',
            limit : req.query.limit ? parseInt(req.query.limit) : 100,
            since : req.query.since,
            slug  : req.params['slug']
        };
        const existingForum = await forumsModel.getForumBySlug(getParams.slug);
        if (!existingForum) {
            return res.status(404).json({message: "Can't find forum with slug " + getParams.slug});
        }
        const users = await usersModel.getUsersFromForum(existingForum.forum_id, getParams);// здесь
        res.json(users);
    }

}
