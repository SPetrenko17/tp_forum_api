'use strict';

import forumsModel from '../Forum/ForumModel';
import usersModel from '../User/UserModel';
import threadsModel from '../Thread/ThreadModel';
import postsModel from './PostModel';
import postsSerializer from './PostSerializer';
import threadsSerializer from '../Thread/ThreadSerializer';

export default new class PostsController {

    async getPostDetails(req, reply) {
        const postId = req.params['id'];
        const existingPost = await postsModel.getPostById(postId);

        if (!existingPost) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: `Can't find post with id #${postId}\n`})
        }
        let result = {};
        result.post = postsSerializer.serialize_one(existingPost);
        if(req.query['related']) {
            const relatedArray = req.query['related'].split(',');
            if (relatedArray.includes('user')) {
                result.author = await usersModel.getById(existingPost.author_id);
            }
            if (relatedArray.includes('thread')) {
                result.thread = threadsSerializer.serialize_one
                (await threadsModel.get('id', existingPost.thread_id));
            }
            if (relatedArray.includes('forum')) {
                result.forum = await forumsModel.getForumById(existingPost.forum_id);
                result.forum.user = result.forum.owner_nickname;
            }
        }
       reply
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(result)
    }

    async updatePostDetails(req, reply) {
        const postId = req.params['id'];
        const existingPost = await postsModel.getPostById(postId);
        if (!existingPost) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Can't find post with id " + postId})
        }

        if (!req.body.message || req.body.message === existingPost.message) {
            return reply
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(postsSerializer.serialize_one(existingPost))
        }

        let updatedPost = await postsModel.updatePost(postId, req.body);
        if (!updatedPost.isSuccess) {
            return reply
                .code(500)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({ message: "Can't change post with id " + postId })
        }

        return reply
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(postsSerializer.serialize_one(updatedPost.data));
    }

}
