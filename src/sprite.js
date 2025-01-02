const sprite = (type, x, y, args) => {
    const walkableType = ["move"]

    return {
        type: type,
        x: x,
        y: y,
        walkable: walkableType.includes(type),
        ...args,
    }
}
