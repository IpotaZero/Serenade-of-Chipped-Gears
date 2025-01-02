const IDict = class {
    constructor(dict) {
        this.dict = dict
    }

    get(key) {
        for (let k in this.dict) {
            if (key.match(new RegExp("^" + k + "$"))) return this.dict[k]
        }

        return undefined
    }
}
