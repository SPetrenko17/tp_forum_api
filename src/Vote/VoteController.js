import VoteModel from "./VoteModel";
import usersModel from "../User/UserModel";
import {isValidId} from "../utils/utils";
import threadsModel from "../Thread/ThreadModel";
import threadsSerializer from "../Thread/ThreadSerializer";

export default new class VoteController {

    async createVoteForThread(req, reply) {
        let voteData = req.body;

        let user = await usersModel.getByNickname(voteData.nickname);
        if (!user) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Can't find user with nickname " + voteData.nickname})
        }

        const type = isValidId(req.params['slug_or_id'])? 'id' : 'slug';
        let value = isValidId(req.params['slug_or_id'])?Number(req.params['slug_or_id']):req.params['slug_or_id']
        let thread = await threadsModel.get(type,value);

        if (!thread) {
            return reply
                .code(404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({message: "Can't find forum with slug or id " + req.params['slug_or_id']})
        }
        thread.id = Number(thread.id);

        let voteResult = await votesModel.create(voteData.voice, user, thread);
        if (!voteResult.isSuccess) {
            return reply
                .code(400)
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
        return reply
            .code(500)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send();
    }

}
