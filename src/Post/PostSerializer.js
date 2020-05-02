import BaseSerializer from "../Base/BaseSerializer";

export default new class PostsSerializer extends BaseSerializer{

    serialize_one(post) {
        let postResult = {
            id: Number(post.id),
            author: post.author_nickname,
            forum: post.forum_slug,
            thread: Number(post.thread_id),
            isEdited: post.isedited,
            created: post.created,
            message: post.message
        };
        if (post.parent !== post.id) {
            postResult.parent = Number(post.parent);
            postResult.path = post.path;
        }
        return postResult;
    }

    serialize_many(posts) {
        if (!posts.length) {
            return [];
        }
        return posts.map((post)=>{
            return this.serialize_one(post);
        });
    }

};
