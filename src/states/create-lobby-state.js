let channel = require("../channel");
let LobbyState = require("./lobby-state");
let WatchingState = require("./watching-state");

module.exports = class CreateLobbyState {
    constructor(socket, ctrl, tmpState) {
        this.type = "create-lobby-state";
        this.ctrl = ctrl;
        this.socket = socket;
        this.tmpState = tmpState;

        this.videoList = [];
        this.selectedVideo = "";
        this.name = "";

        this._initListeners();

        this.socket.emit(channel.VIDEOS);

    }

    _initListeners() {
        this.socket.removeAllListeners(channel.VIDEOS);
        this.socket.on(channel.VIDEOS, videos => {
            this.videoList = videos;
            this.ctrl.$scope.$apply();
        });
        this.socket.removeAllListeners(channel.JOIN_LOBBY);
        this.socket.on(channel.JOIN_LOBBY, data => {
            this.ctrl.state = new WatchingState(this.socket, this.ctrl, this, data);
            this.ctrl.$scope.$apply();
        });
    }

    back() {
        this.ctrl.state = this.tmpState;
        this.tmpState.startPolling();
    }
    create() {
        if (this.name.length <= 0) {
            this.ctrl.showErrIf(this.name.length <= 0, "Please enter a lobby name.");
            return;
        }

        this.socket.emit(channel.CREATE_LOBBY, {
            video: this.selectedVideo,
            name: this.name
        });
    }

}