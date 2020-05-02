import forumsModel from '../Forum/ForumModel';
import usersModel from '../User/UserModel';
import threadsModel from './ThreadModel';
import postsModel from '../Post/PostModel';
import votesModel from '../Vote/VoteModel';

import postsSerializer from "../Post/PostSerializer";
import threadsSerializer from "./ThreadSerializer";
import {isValidId} from "../utils/utils";

export default new class ThreadsController {

    async createPostsForThread(req, res) {
        let postsData = req.body;

        const type = isValidId(req.params['slug_or_id'])? 'id' : 'slug';
        let value = isValidId(req.params['slug_or_id'])?Number(req.params['slug_or_id']):req.params['slug_or_id']

        let thread = await threadsModel.get(type,value);


        if (!thread) {
            return res.status(404).json({message: "Can't find forum with slug or id " + req.params['slug_or_id']});
        }

        thread.id = Number(thread.id);
        if (Array.isArray(postsData) && !postsData.length) {
            return res.status(201).json(postsData);
        } else if (!Array.isArray(postsData)) {
            return res.status(400).json({message: "Request data must be an array."});
        }

        let postsResult = [];
        let createdDatetime = new Date();
        for (let postData of postsData) {

            let user = await usersModel.getByNickname(postData.author);
            if (!user) {
                return res.status(404).json({message: "Can't find user with nickname " + postData.author});
            }

            postData['created'] = createdDatetime;

            let createPostResult = await postsModel.createPost(postData, thread, user);
            if (createPostResult.isSuccess) {
                postsResult.push(createPostResult.data);
            } else if (createPostResult.message === '409') {
                return res.status(409).json({message: "Can't create post this parent in a different thread."});
            } else {
                return res.status(400).end();
            }
        }

        if (postsData.length > 0) {
            let addPostsResult = await forumsModel.addPostsToForum(thread.forum_id, postsData.length);
            if (!addPostsResult.isSuccess) {
                return res.status(500).end();
            }
        }

        res.status(201).json(postsSerializer.serialize_many(postsResult));
    }

    async createOrUpdateVoteForThread(req, res) {
        let voteData = req.body;

        let user = await usersModel.getByNickname(voteData.nickname);
        if (!user) {
            return res.status(404).json({message: "Can't find user with nickname " + voteData.nickname});
        }

        const type = isValidId(req.params['slug_or_id'])? 'id' : 'slug';
        let value = isValidId(req.params['slug_or_id'])?Number(req.params['slug_or_id']):req.params['slug_or_id']
        let thread = await threadsModel.get(type,value);

        if (!thread) {
            return res.status(404).json({message: "Can't find forum with slug or id " + req.params['slug_or_id']});
        }
        thread.id = Number(thread.id);

        let voteResult = await votesModel.create(voteData.voice, user, thread);
        if (!voteResult.isSuccess) {
            return res.status(400).json({message: voteResult.message});
        } else if (!voteResult.data) {

            return res.status(200).json(threadsSerializer.serialize_one(thread));
        }

        let voiceValue = voteResult.data.voice;
        if (voteResult.data.existed) {
            voiceValue = voiceValue == 1 ? voiceValue + 1 : voiceValue - 1;
        }

        let updateThreadResult = await threadsModel.updateThreadVotes(thread, voiceValue);
        if (voteResult.isSuccess) {
            return res.status(200).json(threadsSerializer.serialize_one(updateThreadResult.data));
        }

        res.status(500).end();
    }

    async getThreadDetails(req, res) {

        const type = isValidId(req.params['slug_or_id'])? 'id' : 'slug';
        let value = isValidId(req.params['slug_or_id'])?Number(req.params['slug_or_id']):req.params['slug_or_id'];

        let thread = await threadsModel.get(type,value);

        if (!thread) {
            return res.status(404).json({message: "Can't find forum with slug or id " + req.params['slug_or_id']});
        }
        res.json(threadsSerializer.serialize_one(thread));
    }

    async updateThreadDetails(req, res) {

        const type = isValidId(req.params['slug_or_id'])? 'id' : 'slug';
        let value = isValidId(req.params['slug_or_id'])?Number(req.params['slug_or_id']):req.params['slug_or_id']
        let thread = await threadsModel.get(type,value);

        if (!thread) {
            return res.status(404).json({message: "Can't find forum with slug or id " + req.params['slug_or_id']});
        }

        let updatedThread = await threadsModel.updateThread(thread.id, req.body);
        if (!updatedThread) {
            return res.status(409).json({ message: "Can't change thread with id " + thread_id });
        }

        if (updatedThread === true) {
            res.json(threadsSerializer.serialize_one(thread));
        } else {
            res.json(threadsSerializer.serialize_one(updatedThread));
        }

    }

    async getThreadPosts(req, res) {

        const getParams = {
            desc : req.query.desc === 'true',
            limit : req.query.limit ? parseInt(req.query.limit) : 100,
            since : req.query.since,
        };


        const type = isValidId(req.params['slug_or_id'])? 'id' : 'slug';
        let value = isValidId(req.params['slug_or_id'])?Number(req.params['slug_or_id']):req.params['slug_or_id']
        let thread = await threadsModel.get(type,value);

        if (!thread) {
            return res.status(404).json({message: "Can't find forum with slug or id " + req.params['slug_or_id']});
        }

        let postsResult;
        switch (req.query.sort) {
            case 'tree':
                postsResult = await postsModel.getPostsByThreadIdTreeSort(thread.id, getParams);
                break;
            case 'parent_tree':
                postsResult = await postsModel.getPostsByThreadIdParentTreeSort(thread.id, getParams);
                break;
            default:
                postsResult = await postsModel.getPostsByThreadIdFlatSort(thread.id, getParams);
        }
        res.json(postsSerializer.serialize_many(postsResult));
    }

}
