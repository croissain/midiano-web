import {
    getCurrentParticleTypes
} from "../../settings/ParticlePreset.js"
import {
    getSetting,
    setSettingCallback
} from "../../settings/Settings.js"
import {
    getRenderDimensions
} from "../RenderDimensions.js"
import {
    ThreeJsBuffer
} from "./ThreeJsBuffer.js"
import {
    getScene,
    loadTexture
} from "./threeJsHandler.js"

export class ThreeJsParticle {
    constructor() {
        // this.points = []
        this.textures = {}

        this.particleCache = {}
        this.loadAllTextures()
        this.addTextureCallbacks()
    }
    addTextureCallbacks() {
        // getCurrentParticleTypes().forEach(type =>
        // 	loadTexture(type.particlesTexture)
        // )
        setSettingCallback("particlePreset", () => this.loadAllTextures())
        setSettingCallback("particlesTexture", () =>
            loadTexture(getSetting("particlesTexture"), () => {})
        )
        let particleAttributes = ["particleSpeedX", "particleSpeedY"]

        let particleUniformSettings = [
            "particleSize",
            "particleRising",
            "particlesOpacity",
            "particleSpeed",
            "particlesShrink",
            "particlesFriction",
            "turbulenceXFrequency",
            "turbulenceYFrequency",
            "turbulenceXAmplitude",
            "turbulenceYAmplitude",
            "particleFadeOut",
            "particleYOffset",
            "particlesTexture"
        ]
        let resetShaderOpts = [
            "particleLife",
            "particleAmount",
            "particlesTexture",
            "particlesSpeedX",
            "particleSpeedY"
        ]
        setSettingCallback("particlesBlending", () => {
            let currentType = getSetting("particleTypeName")
            let cache = this.particleCache[currentType]
            if (cache) {
                for (let color in cache) {
                    cache[color].refreshMaterial(getSetting("particlesBlending"))
                }
            }
        })
        resetShaderOpts.forEach(settingName => {
            setSettingCallback(settingName, () => {
                let type = getSetting("particleTypeName")
                let cache = this.particleCache[type]
                if (cache) {
                    this.deleteCacheType(type)
                }
            })
        })
        setSettingCallback("particlePreset", () => {
            for (let type in this.particleCache) {
                this.deleteCacheType(type)
            }
        })
        particleUniformSettings.forEach(setting => {
            setSettingCallback(setting, () => {
                let currentType = getSetting("particleTypeName")
                let cache = this.particleCache[currentType]
                if (cache) {
                    for (let color in this.particleCache[currentType]) {
                        this.particleCache[currentType][color].material.uniforms[
                            setting
                        ].value = getSetting(setting)
                    }
                } else {
                    // console.log("Couldnt find fitting preset type " + currentType)
                }
            })
        })

        getRenderDimensions().registerResizeCallback(() => {
            let currentType = getSetting("particleTypeName")
            let cache = this.particleCache[currentType]
            for (let type in this.particleCache) {
                for (let color in this.particleCache[type]) {
                    let cache = this.particleCache[type][color]
                    cache.material.uniforms.screenWidth.value =
                        getRenderDimensions().renderWidth
                    cache.material.uniforms.screenHeight.value =
                        getRenderDimensions().renderHeight
                }
            }
        })
    }
    deleteCacheType(type) {
        for (let color in this.particleCache[type]) {
            this.deleteCacheColor(type, color)
        }
        this.particleCache[type] = null
        delete this.particleCache[type]
    }
    deleteCacheColor(type, color) {
        let opts = this.particleCache[type][color].opts

        let scene = getScene(opts.particleDistributionZ)
        scene.remove(this.particleCache[opts.particleTypeName][color].points)
        this.particleCache[type][color].dispose()
        this.particleCache[type][color] = null
        delete this.particleCache[type][color]

        if (Object.keys(this.particleCache[type]).length == 0) {
            this.particleCache[type] = null
            delete this.particleCache[type]
        }
    }
    loadAllTextures() {
        getCurrentParticleTypes().forEach(type =>
            loadTexture(type.particlesTexture, tex => {
                for (let color in this.particleCache[type.particleTypeName]) {
                    let cache = this.particleCache[type.particleTypeName][color]
                    if (cache) {
                        cache.material.uniforms.particlesTexture.value = tex
                    }
                }
            })
        )
    }
    create(renderInfo) {
        let optsList = getCurrentParticleTypes()
        optsList.forEach(opts => this.createParticlesOfType(renderInfo, opts))
    }
    render() {
        Object.keys(this.particleCache).forEach(type => {
            for (let color in this.particleCache[type]) {
                if (this.particleCache[type][color].isDisposed) {
                    this.deleteCacheColor(type, color)
                }
            }
        })

        Object.keys(this.particleCache).forEach(typeName => {
            Object.keys(this.particleCache[typeName]).forEach(color => {
                this.particleCache[typeName][color].update()
            })
        })
    }
    createParticlesOfType(renderInfo, opts) {
        let color = opts.particleOverrideColor ?
            opts.particleColor :
            renderInfo.fillStyle
        let amount = parseFloat(
            opts.particleAmount > 1 ?
            Math.floor(opts.particleAmount) :
            opts.particleAmount
        )

        opts.ticker = opts.ticker || 0
        if (amount < 1 && opts.ticker < 1) {
            opts.ticker += amount
            if (opts.ticker < 1) return
            amount = 1
            opts.ticker = 0
        }

        let bufferAmount = amount * opts.particleLife * 2
        if (!this.particleCache.hasOwnProperty(opts.particleTypeName)) {
            this.particleCache[opts.particleTypeName] = {}
        }

        let cache = this.particleCache[opts.particleTypeName][color]
        if (!cache) {
            cache = new ThreeJsBuffer(opts, color, bufferAmount)

            this.particleCache[opts.particleTypeName][color] = cache
            let scene = getScene(opts.particleDistributionZ)

            scene.add(cache.points)
        }
        cache.addParticles(amount, renderInfo, opts)
    }
}