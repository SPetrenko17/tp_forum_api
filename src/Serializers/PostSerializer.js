export default new class PostSerializer {
    //using in postsController
    serializeRelated(responseData){
        return {
            author: responseData.post_author,
            id: responseData.pid,
            thread: responseData.post_thread,
            parent: responseData.post_parent,
            forum: responseData.post_forum_slug,
            message: responseData.post_message,
            isEdited: responseData.pisEdited,
            created: responseData.post_created,
        };
    }
}
