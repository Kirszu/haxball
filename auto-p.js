export default class PlayerMessageHandler {
    constructor(room) {
        this.set = new Set();
        this.room = room;
    }

    handle(player, message) {
        switch (message) {
            case 'p':
                this.#TryToPause(player);
                break;
            case 'unp':
                this.#TryToUnpause(player);
            default:
                break;
        }
    }

    #TryToPause(player) {
        if (this.set.has(player)) {
            this.room.sendAnnouncement(player.name + 'już poprosił o przerwę.');
            return;
        }

        this.room.pauseGame(true);
        this.room.sendAnnouncement(player.name + 'prosi o przerwę.');
    }

    #TryToUnpause(player) {
        if (!this.set.has(player)) {
            this.room.sendAnnouncement(player.name + ': nie możesz odpauzować trwającej gry.');
            return;
        }
        
        this.set.delete(player);

        this.room.sendAnnouncement(player.name + 'wrócił z przerwy.');

        if (this.set.size === 0) {
            this.room.pauseGame(false);
        }
    }
}