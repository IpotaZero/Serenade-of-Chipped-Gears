const Igear = (ctx, x, y, colour, module, teeth_num, pressure_angle_degree, { theta = 0, lineWidth = 2 } = {}) => {
    const get_inv = (alpha) => Math.tan(alpha) - alpha
    const get_alpha = (r) => Math.acos(r_b / r)

    //基準円
    const r_p = (teeth_num * module) / 2
    //歯先円
    const r_k = r_p + module
    //歯底円
    const r_f = r_p - 1.25 * module
    //基礎円
    const r_b = r_p * Math.cos((Math.PI * pressure_angle_degree) / 180)

    const s = (Math.PI * module) / 2

    const theta_b = s / r_p + 2 * get_inv((Math.PI * pressure_angle_degree) / 180)

    const sa = r_b - r_f

    // Iarc(ctx, colour, x, y, r_f, { lineWidth: lineWidth })

    ctx.strokeStyle = colour
    ctx.lineWidth = lineWidth

    const d = 50

    for (let i = 0; i < teeth_num; i++) {
        ctx.beginPath()
        let root0 = vec(r_b * Math.cos(get_inv(get_alpha(r_b))), r_b * Math.sin(get_inv(get_alpha(r_b)))).rot(
            (2 * Math.PI * i) / teeth_num + theta,
        )
        ctx.moveTo(x + root0.x, y + root0.y)
        for (let j = 0; j <= d; j++) {
            let r = r_b + ((r_k - r_b) * j) / d
            let inv = get_inv(get_alpha(r))
            let l = vec(r * Math.cos(inv), r * Math.sin(inv)).rot((2 * Math.PI * i) / teeth_num + theta)
            ctx.lineTo(x + l.x, y + l.y)
        }
        ctx.stroke()

        ctx.beginPath()
        let root1 = vec(r_b * Math.cos(get_inv(get_alpha(r_b))), -r_b * Math.sin(get_inv(get_alpha(r_b)))).rot(
            (2 * Math.PI * i) / teeth_num + theta + theta_b,
        )
        ctx.moveTo(x + root1.x, y + root1.y)
        for (let j = 0; j <= d; j++) {
            let r = r_b + ((r_k - r_b) * j) / d
            let inv = get_inv(get_alpha(r))
            let l = vec(r * Math.cos(inv), -r * Math.sin(inv)).rot((2 * Math.PI * i) / teeth_num + theta + theta_b)
            ctx.lineTo(x + l.x, y + l.y)
        }
        ctx.stroke()

        let inv = get_inv(get_alpha(r_k))
        ctx.beginPath()
        let top = vec(r_k * Math.cos(inv), r_k * Math.sin(inv)).rot((2 * Math.PI * i) / teeth_num + theta)
        ctx.moveTo(x + top.x, y + top.y)
        let top2 = vec(r_k * Math.cos(inv), -r_k * Math.sin(inv)).rot((2 * Math.PI * i) / teeth_num + theta + theta_b)
        ctx.lineTo(x + top2.x, y + top2.y)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(root0.x + x, root0.y + y)
        let bottom0 = vec(r_b - sa, 0).rot((2 * Math.PI * i) / teeth_num + theta)
        ctx.lineTo(bottom0.x + x, bottom0.y + y)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(root1.x + x, root1.y + y)
        let bottom1 = vec(r_b - sa, 0).rot((2 * Math.PI * i) / teeth_num + theta + theta_b)
        ctx.lineTo(bottom1.x + x, bottom1.y + y)
        ctx.stroke()

        // ctx.beginPath()
        // ctx.arc(x, y, r_k, 2 * Math.PI * i / teeth_num / 2 + theta, 2 * Math.PI * (i + 1) / teeth_num + theta)
        // ctx.stroke()
    }
}
