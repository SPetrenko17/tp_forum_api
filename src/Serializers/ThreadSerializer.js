export default new class ThreadSerializer {
    //using in postsController
    serializeRelated(responseData){
        return {
            forum: responseData.thread_forum_slug,
            author: responseData.thread_author,
            created: responseData.thread_created,
            votes: responseData.thread_votes,
            id: responseData.thread_id,
            title: responseData.thread_title,
            message: responseData.thread_message,
            slug: responseData.thread_slug,
        };
    }
}
