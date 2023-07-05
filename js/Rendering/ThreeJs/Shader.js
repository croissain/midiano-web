import {
    getLoader
} from "../../ui/Loader.js"

export const SHADERS = {
    PARTICLE_V: "particleVertex",
    PARTICLE_F: "particleFragment",
    QUAD_V: "quadVertex",
    PIANOLINE_F: "pianoLineFragment"
}
const shaderList = Object.values(SHADERS)
class Shaders {
    constructor() {
        this.shaders = {}
    }
    async load() {
        getLoader().setLoadMessage("Loading shaders")
        return Promise.all(
            shaderList.map(
                async shaderKey =>
                await fetch(`./shaders/${shaderKey}.glsl`)
                .then(res => res.text())
                .then(txt => Promise.resolve((this.shaders[shaderKey] = txt)))
            )
        )
    }
    get(key) {
        return this.shaders[key]
    }
}

let shaders
export const initShaders = async () => {
    shaders = new Shaders()
    return shaders.load()
}
const getShaders = () => {
    if (!shaders) {
        shaders = new Shaders()
        shaders.load()
    }
    return shaders
}
export const getShader = name => {
    return getShaders().get(name)
}