/**
 * @param {string} path パス
 */
const IBGM = class {
    #volume
    path
    audio
    source
    context
    gain

    constructor(path) {
        this.path = path
        this.#volume = 1
    }

    fetch() {
        this.reset()

        this.audio = new Audio(this.path)
        this.audio.loop = true

        this.source = this.context.createMediaElementSource(this.audio)
        this.source.connect(this.gain)

        return new Promise((resolve) => {
            this.audio.oncanplay = () => {
                resolve()
            }
        })
    }

    reset() {
        if (!this.context) {
            this.context = new AudioContext()
            this.gain = this.context.createGain()
            this.gain.connect(this.context.destination)
        }

        if (this.audio) {
            this.audio.pause()
            this.audio.currentTime = 0
        }

        this.setVolume(this.#volume)
    }

    play() {
        if (!this.audio) return
        return this.audio.play()
    }

    pause() {
        if (!this.audio) return
        return this.audio.pause()
    }

    fade(value, ms) {
        if (!this.gain) return

        this.gain.gain.cancelScheduledValues(0)
        this.gain.gain.exponentialRampToValueAtTime(value, this.context.currentTime + ms / 1000)

        return new Promise((resolve) => {
            setTimeout(() => {
                if (value == 0) this.gain.gain.value = 0
                resolve(this)
            }, ms)
        })
    }

    setVolume(value) {
        if (!this.gain) return
        this.#volume = value
        this.gain.gain.cancelScheduledValues(0)
        this.gain.gain.value = this.#volume
    }
}
