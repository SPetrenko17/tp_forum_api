import BaseSerializer from "../Base/BaseSerializer";

export default new class ThreadsSerializer extends BaseSerializer{
    serialize_one(thread) {
        return {
            id: Number(thread.id),
            author: thread.author_nickname,
            slug: thread.slug,
            forum: thread.forum_slug,
            created: thread.created,
            title: thread.title,
            message: thread.message,
            votes: thread.votes
        };
    }

    serialize_many(threads) {
        if (!threads.length) {
            return [];
        }
        return threads.map((thread)=> {
            return this.serialize_one(thread)
        });
    }

};
