const Iaudio = class {
    static context = new AudioContext()
    static gain = this.context.createGain()

    static initialize() {
        this.gain.connect(this.context.destination)
        this.gain.gain.value = 0.5
    }

    constructor(path) {
        this.audio = new Audio(path)
        this.source = this.constructor.context.createMediaElementSource(this.audio)
        this.source.connect(this.constructor.gain)
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

Iaudio.initialize()
