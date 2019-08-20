let channel = require("./channel");
let fs = require("fs");

module.exports = class Server {
    constructor(io) {
        this.userList = new Map();
        this.lobbies = [];

        io.on("connection", (socket) => {

            socket.on(channel.LOGIN, (username) => {
                if (this.userList.has(username)) {
                    socket.emit(channel.LOGIN, "User already exists.");
                    return;
                }
                this.userList.set(socket, username);
                socket.emit(channel.LOGIN, "");
            });

            socket.on(channel.VIDEOS, () => {
                socket.emit(channel.VIDEOS, fs.readdirSync("./public/videos/"));
            });

            socket.on(channel.CREATE_LOBBY, data => {
                this.lobbies.push({
                    host: socket,
                    name: data.name,
                    video: data.video,
                    viewers: []
                });
                socket.emit(channel.JOIN_LOBBY, {
                    host: this.userList.get(socket),
                    name: data.name,
                    video: data.video,
                    viewers: [],
                    id: this.lobbies.length - 1,
                    isHost: true
                });
            });

            socket.on(channel.JOIN_LOBBY, (id) => {
                let tempLobby = this.lobbies[id];
                tempLobby.viewers.push(socket);
                this.notifyLobby(id, channel.NEW_VIEWER, this.userList.get(socket));

                socket.emit(channel.JOIN_LOBBY, {
                    host: this.userList.get(tempLobby.host),
                    name: tempLobby.name,
                    video: tempLobby.video,
                    viewers: tempLobby.viewers.map(x => this.userList.get(x)),
                    id: id,
                    isHost: false
                });
            });

            socket.on(channel.LOBBY, () => {
                socket.emit(channel.LOBBY, this.lobbies.map(x => {
                    return {
                        host: this.userList.get(x.host),
                        name: x.name,
                        video: x.video,
                        viewers: x.viewers.map(x => this.userList.get(x)),
                        id: this.lobbies.indexOf(x)
                    };
                }));
            });

            socket.on(channel.LOST_VIEWER, () => {
                this.disconnectIfInLobby(socket);
            });

            /* #region Controlls */
            socket.on(channel.PLAYER_PLAY, id => {
                if(!this.isHost(socket)) return;
                this.notifyViewers(id, channel.PLAYER_PLAY);
            });
            socket.on(channel.PLAYER_STOP, id => {
                if(!this.isHost(socket)) return;
                this.notifyViewers(id, channel.PLAYER_STOP);
            });
            socket.on(channel.PLAYER_UPDATE, data => {
                if(!this.isHost(socket)) return;
                this.notifyViewers(data.id, channel.PLAYER_UPDATE, data.currentTime);
            });
            socket.on(channel.PLAYER_CHANGED, data => {
                if(!this.isHost(socket)) return;
                this.lobbies[data.id].video = data.newSrc;
                this.notifyViewers(data.id, channel.PLAYER_CHANGED, data.newSrc);
            });
            /* #endregion */

            socket.on("disconnect", () => {
                if (!this.userList.has(socket)) return;
                
                this.disconnectIfInLobby(socket);
                this.userList.delete(socket);
            });
        });
    }

    disconnectIfInLobby(socket){
        this.lobbies.forEach(lobby => {
            let id = this.lobbies.indexOf(lobby);
            if(lobby.host == socket){
                this.notifyLobby(id, channel.LOBBY_CLOSED);
                this.lobbies.splice(id, 1);
                return;
            }
            if(lobby.viewers.includes(socket)){
                lobby.viewers.splice(lobby.viewers.indexOf(socket), 1);
                this.notifyLobby(id, channel.LOST_VIEWER, this.userList.get(socket));
            }
        });
    }

    isHost(id, socket) {
        return this.lobbies[id].host == socket;
    }

    notifyLobby(id, channel, data) {
        let tempLobby = this.lobbies[id];
        tempLobby.host.emit(channel, data);
        tempLobby.viewers.forEach(socket => {
            socket.emit(channel, data);
        });
    }
    notifyViewers(id, channel, data) {
        let tempLobby = this.lobbies[id];
        tempLobby.viewers.forEach(socket => {
            socket.emit(channel, data);
        });
    }
    notifyHost(id, channel, data) {
        let tempLobby = this.lobbies[id];
        tempLobby.host.emit(channel, data);
    }
}