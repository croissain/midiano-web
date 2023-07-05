import {
    CONST
} from "./data/CONST.js"
import {
    getSetting
} from "./settings/Settings.js"

function formatTime(seconds, showMilis) {
    seconds = Math.max(seconds, 0)
    let date = new Date(seconds * 1000)
    let timeStrLength = showMilis ? 11 : 8
    try {
        let timeStr = date.toISOString().substr(11, timeStrLength)
        if (timeStr.substr(0, 2) == "00") {
            timeStr = timeStr.substr(3)
        }
        return timeStr
    } catch (e) {
        console.error(e)
        //ignore this. only seems to happend when messing with breakpoints in devtools
    }
}

/**
 * Returns the "white key index" of the note number. Ignores if the key itself is black
 * @param {Number} noteNumber
 */
function getWhiteKeyNumber(noteNumber) {
    noteNumber = parseInt(noteNumber)
    return (
        noteNumber -
        Math.floor(Math.max(0, noteNumber + 11) / 12) -
        Math.floor(Math.max(0, noteNumber + 8) / 12) -
        Math.floor(Math.max(0, noteNumber + 6) / 12) -
        Math.floor(Math.max(0, noteNumber + 3) / 12) -
        Math.floor(Math.max(0, noteNumber + 1) / 12)
    )
}
/**
 *  Checks whether a note Number corresponds to a black piano key
 * @param {Number} noteNumber
 */
function isBlack(noteNumber) {
    return (noteNumber + 11) % 12 == 0 ||
        (noteNumber + 8) % 12 == 0 ||
        (noteNumber + 6) % 12 == 0 ||
        (noteNumber + 3) % 12 == 0 ||
        (noteNumber + 1) % 12 == 0 ?
        1 :
        0
}

function sum(arr) {
    return arr.reduce((previousVal, currentVal) => previousVal + currentVal)
}

/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Number} radius
 */
function drawRoundRect(ctx, x, y, width, height, radius, isRounded) {
    // radius = radius * 2 < ( Math.min( height, width ) ) ? radius : ( Math.min( height, width ) ) / 2
    if (typeof radius === "undefined") {
        radius = 0
    }
    if (typeof radius === "number") {
        radius = Math.min(radius, Math.min(width / 2, height / 2))
        radius = {
            tl: radius,
            tr: radius,
            br: radius,
            bl: radius
        }
    } else {
        var defaultRadius = {
            tl: 0,
            tr: 0,
            br: 0,
            bl: 0
        }
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side]
        }
    }

    ctx.beginPath()
    if (!isRounded) {
        ctx.moveTo(x + radius.tl, y)
        ctx.lineTo(x + width - radius.tr, y)
        ctx.lineTo(x + width, y + radius.tr)
        ctx.lineTo(x + width, y + height - radius.br)
        ctx.lineTo(x + width - radius.br, y + height)
        ctx.lineTo(x + radius.bl, y + height)
        ctx.lineTo(x, y + height - radius.bl)
        ctx.lineTo(x, y + radius.tl)
        ctx.lineTo(x + radius.tl, y)
    } else {
        ctx.moveTo(x + radius.tl, y)
        ctx.lineTo(x + width - radius.tr, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr)
        ctx.lineTo(x + width, y + height - radius.br)
        ctx.quadraticCurveTo(
            x + width,
            y + height,
            x + width - radius.br,
            y + height
        )
        ctx.lineTo(x + radius.bl, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl)
        ctx.lineTo(x, y + radius.tl)
        ctx.quadraticCurveTo(x, y, x + radius.tl, y)
    }
    ctx.closePath()
}

function replaceAllString(text, replaceThis, withThat) {
    return text.replace(new RegExp(replaceThis, "g"), withThat)
}

function groupArrayBy(arr, keyFunc) {
    let keys = {}
    arr.forEach(el => (keys[keyFunc(el)] = []))
    Object.keys(keys).forEach(key => {
        arr.forEach(el => (keyFunc(el) == key ? keys[keyFunc(el)].push(el) : null))
    })
    return keys
}

function loadJson(url, callback) {
    let request = new XMLHttpRequest()
    request.overrideMimeType("application/json")
    request.open("GET", url, true)
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == "200") {
            callback(request.responseText)
        }
    }
    request.send(null)
}

function iOS() {
    return (
        [
            "iPad Simulator",
            "iPhone Simulator",
            "iPod Simulator",
            "iPad",
            "iPhone",
            "iPod"
        ].includes(navigator.platform) ||
        // iPad on iOS 13 detection
        (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    )
}

function roundToDecimals(value, decimalDigits) {
    let rounder = Math.pow(10, decimalDigits)
    return Math.floor(value * rounder) / rounder
}

function rndFloat(min, max) {
    return min + (max - min) * Math.random()
}

function rndInt(min, max) {
    return Math.round(min + (max - min) * Math.random())
}

function nFormatter(num, digits) {
    var si = [{
                value: 1e100,
                symbol: "It's Enough"
            },
            {
                value: 1e93,
                symbol: "Tg"
            },
            {
                value: 1e90,
                symbol: "NVt"
            },
            {
                value: 1e87,
                symbol: "OVt"
            },
            {
                value: 1e84,
                symbol: "SVt"
            },
            {
                value: 1e81,
                symbol: "sVt"
            },
            {
                value: 1e78,
                symbol: "QVt"
            },
            {
                value: 1e75,
                symbol: "qVt"
            },
            {
                value: 1e72,
                symbol: "TVt"
            },
            {
                value: 1e69,
                symbol: "DVt"
            },
            {
                value: 1e66,
                symbol: "UVt"
            },
            {
                value: 1e63,
                symbol: "Vt"
            },
            {
                value: 1e60,
                symbol: "ND"
            },
            {
                value: 1e57,
                symbol: "OD"
            },
            {
                value: 1e54,
                symbol: "SD"
            },
            {
                value: 1e51,
                symbol: "sD"
            },
            {
                value: 1e48,
                symbol: "QD"
            },
            {
                value: 1e45,
                symbol: "qD"
            },
            {
                value: 1e42,
                symbol: "TD"
            },
            {
                value: 1e39,
                symbol: "DD"
            },
            {
                value: 1e36,
                symbol: "UD"
            },
            {
                value: 1e33,
                symbol: "D"
            },
            {
                value: 1e30,
                symbol: "N"
            },
            {
                value: 1e27,
                symbol: "O"
            },
            {
                value: 1e24,
                symbol: "S"
            },
            {
                value: 1e21,
                symbol: "s"
            },
            {
                value: 1e18,
                symbol: "Q"
            },
            {
                value: 1e15,
                symbol: "q"
            },
            {
                value: 1e12,
                symbol: "T"
            },
            {
                value: 1e9,
                symbol: "B"
            },
            {
                value: 1e6,
                symbol: "M"
            },
            {
                value: 1e3,
                symbol: "k"
            }
        ],
        i
    if (num < 0) {
        return "-" + nFormatter(-1 * num, digits)
    }
    for (i = 0; i < si.length; i++) {
        if (num >= si[i].value) {
            if (i == 0) {
                return "It's Enough..."
            }
            if (!digits) {
                return Math.floor(num / si[i].value) + si[i].symbol
            }
            return (
                Math.floor((Math.pow(10, digits) * num) / si[i].value) /
                Math.pow(10, digits) +
                si[i].symbol
            )
            //(num / si[i].value).toFixed(digits).replace(/\.?0+$/, "") + si[i].symbol;
        }
    }
    return num
}

function getCssVariable(aVarName) {
    return getComputedStyle(document.documentElement).getPropertyValue(
        "--" + aVarName
    )
}

function setCssVariable(aVarName, value) {
    document.documentElement.style.setProperty("--" + aVarName, value)
}

function sumArray(arr) {
    return arr.reduce((a, b) => a + b, 0)
}

function formatNote(midiNoteNumber) {
    let keyString = CONST.MIDI_NOTE_TO_KEY[midiNoteNumber] || ""

    if (keyString.split("b").length > 1) {
        if (getSetting("showPianoKeyNameFlats")) {
            keyString = replaceAllString(keyString, "b", "♭")
        } else {
            keyString = CONST.MIDI_NOTE_TO_KEY[midiNoteNumber - 1].charAt(0) + "♯"
        }
    }
    return keyString.replace(/[0-9]/g, "")
}

function getNoteName(midiNoteNumber) {
    return CONST.MIDI_NOTE_TO_KEY[midiNoteNumber]
}

function getVexFlowNoteName(midiNoteNum) {
    let name = getNoteName(midiNoteNum)
    let spl = name.split("b")
    if (spl.length > 1) {
        return spl[0] + "b/" + spl[1]
    } else {
        return spl[0][0] + "/" + spl[0][1]
    }
}

function getKeyManagerNoteName(midiNoteNum) {
    let name = getNoteName(midiNoteNum)
    let spl = name.split("b")
    if (spl.length > 1) {
        return spl[0] + "b"
    } else {
        return spl[0][0]
    }
}

function equalsIgnoreCase(a, b) {
    return typeof a === "string" && typeof b === "string" ?
        a.localeCompare(b, undefined, {
            sensitivity: "accent"
        }) === 0 :
        a === b
}

export {
    formatTime,
    isBlack,
    getWhiteKeyNumber,
    sum,
    drawRoundRect,
    replaceAllString,
    groupArrayBy,
    loadJson,
    iOS,
    roundToDecimals,
    nFormatter,
    getCssVariable,
    setCssVariable,
    sumArray,
    formatNote,
    getNoteName,
    getVexFlowNoteName,
    getKeyManagerNoteName,
    equalsIgnoreCase,
    rndFloat,
    rndInt
}