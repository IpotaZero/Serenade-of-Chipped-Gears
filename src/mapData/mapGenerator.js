// オブジェクトを文字列に変換する関数
const objectToJsString = (obj, indent = 4) => {
    if (obj === null) return "null"
    if (typeof obj === "undefined") return "undefined"
    if (typeof obj === "function") return obj.toString()

    if (Array.isArray(obj)) {
        const items = obj.map((item) => objectToJsString(item, indent + 4)).join(",\n" + " ".repeat(indent))
        return `[\n${" ".repeat(indent)}${items}\n${" ".repeat(indent - 4)}]`
    }

    if (typeof obj === "object") {
        const entries = Object.entries(obj)
            .map(([key, value]) => {
                const formattedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`
                return `${" ".repeat(indent)}${formattedKey}: ${objectToJsString(value, indent + 4)}`
            })
            .join(",\n")
        return `{\n${entries}\n${" ".repeat(indent - 4)}}`
    }

    if (typeof obj === "string") return `\`${obj.replace(/'/g, "\\'")}\``
    return String(obj)
}
