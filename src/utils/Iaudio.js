const Iaudio = class {
    constructor(path) {
        this.audio = new Audio(path)
    }

    async play() {
        this.audio.currentTime = 0
        return this.audio.play()
    }

    setVolume(volume) {
        this.audio.volume = volume
        return this
    }
}
