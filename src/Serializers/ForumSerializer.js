export default new class ForumSerializer {
    //using in postsController
    serializeRelated(responseData){
        return {
            threads: responseData.fthreads,
            posts: responseData.fposts,
            title: responseData.ftitle,
            user: responseData.fuser_nickname,
            slug: responseData.fslug,
        };
    }
}
