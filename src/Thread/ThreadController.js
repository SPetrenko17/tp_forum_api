import forumsModel from '../Forum/ForumModel';
import usersModel from '../User/UserModel';
import threadsModel from './ThreadModel';
import postsModel from '../Post/PostModel';
import votesModel from '../Vote/VoteModel';

import postsSerializer from "../Post/PostSerializer";
import threadsSerializer from "./ThreadSerializer";
import {isValidId} from "../utils/utils";

export default new class ThreadsController {

    async PostRequestPostForThread(req, reply) {
        let postsData = req.body;

        const type = isValidId(req.params['slug_or_id'])? 'id' : 'slug';
        let value = isValidId(req.params['slug_or_id'])?Number(req.params['slug_or_id']):req.params['slug_or_id'];

        let thread = await threadsModel.get(type,value);


        if (!thread) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Can't find forum with slug or id " + req.params['slug_or_id']});
        }

        thread.id = Number(thread.id);
        if (Array.isArray(postsData) && !postsData.length) {
            return reply
                .code(201)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(postsData);

        } else if (!Array.isArray(postsData)) {
            return reply
                .code(400)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Request data must be an array."});
        }

        let postsResult = [];
        let createdDatetime = new Date();
        for (let postData of postsData) {

            let user = await usersModel.getByNickname(postData.author);
            if (!user) {
                return reply
                    .code(404)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send({message: "Can't find user with nickname " + postData.author});
            }

            postData['created'] = createdDatetime;

            let createPostResult = await postsModel.createPost(postData, thread, user);
            if (createPostResult.isSuccess) {
                postsResult.push(createPostResult.data);
            } else if (createPostResult.message === '409') {
                return reply
                    .code(409)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send({message: "Can't create post this parent in a different thread."});
            } else {
                return reply
                    .code(400)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send();
            }
        }

        if (postsData.length > 0) {
            let addPostsResult = await forumsModel.addPostsToForum(thread.forum_id, postsData.length);
            if (!addPostsResult.isSuccess) {
                return reply
                    .code(500)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send();
            }
        }

        reply
            .code(201)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(postsSerializer.serialize_many(postsResult));
    }

    async PostRequestVoteForThread(req, reply) {
        let voteData = req.body;
        const type = isValidId(req.params['slug_or_id'])? 'id' : 'slug';
        let value = isValidId(req.params['slug_or_id'])?Number(req.params['slug_or_id']):req.params['slug_or_id']
        let thread = await threadsModel.get(type,value);

        if (!thread) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Can't find forum with slug or id " + req.params['slug_or_id']});
        }
        thread.id = Number(thread.id);

        let voteResult = await votesModel.create(voteData.voice, voteData.nickname, thread);
        if (!voteResult.isSuccess) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: voteResult.message});
        } else if (!voteResult.data) {

            return reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(threadsSerializer.serialize_one(thread));
        }

        let voiceValue = voteResult.data.voice;
        if (voteResult.data.existed) {
            voiceValue = voiceValue == 1 ? voiceValue + 1 : voiceValue - 1;
        }

        let updateThreadResult = await threadsModel.updateThreadVotes(thread, voiceValue);
        if (voteResult.isSuccess) {
            return reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(threadsSerializer.serialize_one(updateThreadResult.data));
        }

        reply
            .code(404)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send();
    }

    async GetRequestThreadDetails(req, reply) {

        const type = isValidId(req.params['slug_or_id'])? 'id' : 'slug';
        let value = isValidId(req.params['slug_or_id'])?Number(req.params['slug_or_id']):req.params['slug_or_id'];

        let thread = await threadsModel.get(type,value);

        if (!thread) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Can't find forum with slug or id " + req.params['slug_or_id']});
        }
        reply
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(threadsSerializer.serialize_one(thread));
    }

    async PostRequestThreadDetails(req, reply) {

        const type = isValidId(req.params['slug_or_id'])? 'id' : 'slug';
        let value = isValidId(req.params['slug_or_id'])?Number(req.params['slug_or_id']):req.params['slug_or_id']
        let thread = await threadsModel.get(type,value);

        if (!thread) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Can't find forum with slug or id " + req.params['slug_or_id']});
        }

        let updatedThread = await threadsModel.updateThread(thread.id, req.body);
        if (!updatedThread) {
            return reply
                .code(409)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({ message: "Can't change thread with id " + thread_id });
        }

        if (updatedThread === true) {
            reply
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(threadsSerializer.serialize_one(thread));
        } else {
            reply
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(threadsSerializer.serialize_one(updatedThread));
        }

    }

    async GetRequestThreadsPost(req, reply) {

        const type = isValidId(req.params['slug_or_id'])? 'id' : 'slug';
        let value = isValidId(req.params['slug_or_id'])?Number(req.params['slug_or_id']):req.params['slug_or_id']
        let thread = await threadsModel.get(type,value);

        if (!thread) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Can't find forum with slug or id " + req.params['slug_or_id']});
        }

        let postsResult;
        postsResult = await postsModel.getPostByThreadId(req.query.sort, thread.id, {
            desc : req.query.desc === 'true',
            limit : req.query.limit ? parseInt(req.query.limit) : 100,
            since : req.query.since,
        });

        reply
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(postsSerializer.serialize_many(postsResult));
    }

}
