export default new class UserSerializer {
    //using in postsController
    serializeRelated(responseData){
        return {
            nickname: responseData.user_nickname,
            about: responseData.user_about,
            fullname: responseData.user_fullname,
            email: responseData.user_email,
        };
    }

    serializeRequest(req){
        return {
            nickname: req.params.nickname,
            fullname: req.body.fullname,
            email: req.body.email,
            about: req.body.about,
        };
    }
}
