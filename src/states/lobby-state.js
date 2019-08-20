let channel = require("../channel");
let CreateLobbyState = require("./create-lobby-state");
let WatchingState = require("./watching-state");

module.exports = class LobbyState {
    constructor(socket, ctrl) {
        this.type = "lobby-state";
        this.ctrl = ctrl;
        this.socket = socket;

        this.lobbyList = [];

        this._initListeners();

        this.socket.emit(channel.LOBBY);
        this.interval = setInterval(this.pollLobbies.bind(this), 1000);
    }

    _initListeners() {
        this.socket.removeAllListeners(channel.LOBBY);
        this.socket.on(channel.LOBBY, lobbyList => {
            this.lobbyList = lobbyList;
            this.ctrl.$scope.$apply();
        });
        this.socket.removeAllListeners(channel.JOIN_LOBBY);
        this.socket.on(channel.JOIN_LOBBY, data => {
            this.ctrl.state = new WatchingState(this.socket, this.ctrl, this, data);
            this.ctrl.$scope.$apply();
        });
    }

    startPolling() {
        this.interval = setInterval(this.pollLobbies.bind(this), 1000);
    }

    pollLobbies() {
        this.socket.emit(channel.LOBBY);
    }

    createLobby() {
        clearInterval(this.interval);
        this.ctrl.state = new CreateLobbyState(this.socket, this.ctrl, this);
    }

    joinLobby(id) {
        this.socket.emit(channel.JOIN_LOBBY, id);
    }

}