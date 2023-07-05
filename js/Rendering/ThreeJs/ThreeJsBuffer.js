import {
    CONST
} from "../../data/CONST.js"
import {
    getSetting
} from "../../settings/Settings.js"
import {
    rndFloat
} from "../../Util.js"
import {
    getRenderDimensions
} from "../RenderDimensions.js"
import {
    getShader,
    SHADERS
} from "./Shader.js"
import {
    getTexture,
    getTheeJsColor
} from "./threeJsHandler.js"

export class ThreeJsBuffer {
    constructor(opts, color, bufferAmount) {
        this.freeSpace = bufferAmount
        this.cursor = 0
        this.timestamps = []

        this.bufferAmount = bufferAmount
        this.color = color
        this.opts = opts
        this.init()
    }
    init() {
        let opts = this.opts
        let bufferAmount = this.bufferAmount
        let geometry = new THREE.BufferGeometry()

        let vertices = new Float32Array(bufferAmount * 3)

        let startingRotations = new Float32Array(bufferAmount * 1)
        let rotationSpeeds = new Float32Array(bufferAmount * 1)
        let randomX = new Float32Array(bufferAmount * 1)
        let randomY = new Float32Array(bufferAmount * 1)
        let radius = new Float32Array(bufferAmount * 1)
        let motX = new Float32Array(bufferAmount * 1)
        let motY = new Float32Array(bufferAmount * 1)
        let startTime = new Float32Array(bufferAmount * 1)

        this.geometry = geometry
        this.bufferCache = {
            vertices,
            startingRotations,
            rotationSpeeds,
            randomX,
            randomY,
            radius,
            motX,
            motY,
            startTime
        }
        if (!this.uniforms) {
            this.initUniforms(opts)
        }

        this.initMaterial(opts)
        if (!this.points) {
            this.points = new THREE.Points(this.geometry, this.material)
        } else {
            this.points.material = this.material
            this.points.geometry = this.geometry
        }
    }
    initMaterial(opts) {
        if (this.material) {
            this.material.dispose()
            this.material = null
        }
        this.material = this.getParticleShaderMaterial(
            this.uniforms,
            CONST.BLENDING[opts.particlesBlending]
        )
    }
    initUniforms(opts) {
        this.uniforms = {
            time: {
                type: "f",
                value: window.performance.now() / 17
            },
            particleLife: {
                type: "f",
                value: opts.particleLife
            },
            particleRising: {
                type: "f",
                value: parseFloat(opts.particleRising)
            },
            particleSpeed: {
                type: "f",
                value: opts.particleSpeed
            },
            particlesShrink: {
                type: "f",
                value: opts.particlesShrink
            },
            particlesFriction: {
                type: "f",
                value: opts.particlesFriction
            },
            particlesOpacity: {
                type: "f",
                value: opts.particlesOpacity
            },
            turbulenceXFrequency: {
                type: "f",
                value: opts.turbulenceXFrequency
            },
            turbulenceYFrequency: {
                type: "f",
                value: opts.turbulenceYFrequency
            },
            turbulenceXAmplitude: {
                type: "f",
                value: opts.turbulenceXAmplitude
            },
            turbulenceYAmplitude: {
                type: "f",
                value: opts.turbulenceYAmplitude
            },
            particleFadeOut: {
                type: "f",
                value: parseFloat(opts.particleFadeOut)
            },
            particleSize: {
                type: "f",
                value: parseFloat(opts.particleSize)
            },
            screenWidth: {
                type: "f",
                value: getRenderDimensions().renderWidth
            },
            screenHeight: {
                type: "f",
                value: getRenderDimensions().renderHeight
            },
            particlesTexture: {
                type: "t",
                value: getTexture(opts.particlesTexture)
            },
            color: {
                type: "vec3",
                value: getTheeJsColor(this.color)
            },
            particleYOffset: {
                type: "f",
                value: opts.particleYOffset
            }
        }
    }
    refreshMaterial(blending) {
        this.initMaterial({
            particlesBlending: blending
        })
        this.points.material = this.material
    }
    increaseSize(factor) {
        let oldAmount = this.bufferAmount
        this.bufferAmount = Math.min(
            parseFloat(getSetting("particlesMaxTextureSize")),
            Math.ceil(this.bufferAmount * factor)
        )
        if (oldAmount >= this.bufferAmount) return
        this.freeSpace += this.bufferAmount - oldAmount

        let vertices = this.bufferCache.vertices
        let startingRotations = this.bufferCache.startingRotations
        let rotationSpeeds = this.bufferCache.rotationSpeeds
        let randomX = this.bufferCache.randomX
        let randomY = this.bufferCache.randomY
        let radius = this.bufferCache.radius
        let motX = this.bufferCache.motX
        let motY = this.bufferCache.motY
        let startTime = this.bufferCache.startTime

        this.init()

        this.bufferCache.vertices.set(vertices, 0)
        this.bufferCache.startingRotations.set(startingRotations, 0)
        this.bufferCache.rotationSpeeds.set(rotationSpeeds, 0)
        this.bufferCache.randomX.set(randomX, 0)
        this.bufferCache.randomY.set(randomY, 0)
        this.bufferCache.radius.set(radius, 0)
        this.bufferCache.motX.set(motX, 0)
        this.bufferCache.motY.set(motY, 0)
        this.bufferCache.startTime.set(startTime, 0)

        this.initMaterial(this.opts)
    }
    dispose() {
        Object.keys(this.bufferCache).forEach(key => {
            this.bufferCache[key] = null
        })

        this.bufferCache = null

        this.points.material.dispose()
        this.points.geometry.dispose()

        this.points.material = null
        this.points.geometry = null

        this.geometry.dispose()
        this.geometry = null

        this.material.dispose()
        this.material = null

        this.uniforms = null
        this.opts = null
        this.points = null
    }
    addParticles(amount, renderInfo, opts) {
        this.lastUsed = window.performance.now() / 17
        this.timestamps.push({
            amount,
            timestamp: window.performance.now() / 17
        })
        this.freeSpace -= amount
        // if (this.freeSpace < 0) {
        // console.log("isFULL")
        //TODO - causes webgl to die
        // this.increaseSize(1.5)
        // }

        const distr = this.getDistributions(
            renderInfo,
            opts.particleDistributionX,
            opts.particleDistributionY
        )

        const partSize = parseFloat(opts.particleSize)
        const initialX = opts.particleSpeedX
        const initialY = opts.particleSpeedY
        const renderDims = getRenderDimensions()
        const windowWd = renderDims.renderWidth
        const windowHt = renderDims.renderHeight
        for (var g = this.cursor; g < this.cursor + amount * 1; g++) {
            let index = g % this.bufferAmount
            this.bufferCache.vertices[index * 3] =
                distr.x - windowWd / 2 + Math.random() * distr.w
            this.bufferCache.vertices[index * 3 + 1] =
                windowHt / 2 - distr.y - Math.random() * distr.h
            this.bufferCache.vertices[index * 3 + 2] = 1

            this.bufferCache.startingRotations[index] =
                (opts.particlesRotation / 360) * Math.PI * 2 +
                rndFloat(-(opts.particlesRotationRandom / 180) * Math.PI,
                    (opts.particlesRotationRandom / 180) * Math.PI
                )
            this.bufferCache.startTime[index] = window.performance.now() / 17
            this.bufferCache.rotationSpeeds[index] = rndFloat(-opts.particlesRotationSpeed,
                opts.particlesRotationSpeed
            )
            this.bufferCache.randomX[index] = rndFloat(0, 2)
            this.bufferCache.randomY[index] = rndFloat(0, 2)
            this.bufferCache.radius[index] = rndFloat(0.0 * partSize, partSize)
            this.bufferCache.motX[index] = rndFloat(-initialX, initialX)
            this.bufferCache.motY[index] = rndFloat(initialY * 0.0, initialY)
        }
        this.cursor += amount
        let geometry = this.geometry
        if (!this.hasAttributes) {
            this.hasAttributes = true

            this.verticeAttr = new THREE.BufferAttribute(this.bufferCache.vertices, 3)
            this.rotationAttr = new THREE.BufferAttribute(
                this.bufferCache.startingRotations,
                1
            )
            this.rotationSpeedAttr = new THREE.BufferAttribute(
                this.bufferCache.rotationSpeeds,
                1
            )
            this.startTimeAttr = new THREE.BufferAttribute(
                this.bufferCache.startTime,
                1
            )
            this.randomXAttr = new THREE.BufferAttribute(this.bufferCache.randomX, 1)
            this.randomYAttr = new THREE.BufferAttribute(this.bufferCache.randomY, 1)
            this.radiusAttr = new THREE.BufferAttribute(this.bufferCache.radius, 1)
            this.motXAttr = new THREE.BufferAttribute(this.bufferCache.motX, 1)
            this.motYAttr = new THREE.BufferAttribute(this.bufferCache.motY, 1)

            geometry.setAttribute("position", this.verticeAttr)
            geometry.setAttribute("rotation", this.rotationAttr)
            geometry.setAttribute("rotationSpeed", this.rotationSpeedAttr)
            geometry.setAttribute("startTime", this.startTimeAttr)
            geometry.setAttribute("randomX", this.randomXAttr)
            geometry.setAttribute("randomY", this.randomYAttr)
            geometry.setAttribute("radius", this.radiusAttr)
            geometry.setAttribute("motX", this.motXAttr)
            geometry.setAttribute("motY", this.motYAttr)
        } else {
            this.verticeAttr.needsUpdate = true
            this.rotationAttr.needsUpdate = true
            this.rotationSpeedAttr.needsUpdate = true
            this.startTimeAttr.needsUpdate = true
            this.randomXAttr.needsUpdate = true
            this.randomYAttr.needsUpdate = true
            this.radiusAttr.needsUpdate = true
            this.motXAttr.needsUpdate = true
            this.motYAttr.needsUpdate = true
        }
    }

    update() {
        if (this.isDisposed) return
        if (
            window.performance.now() / 17 - this.lastUsed >
            500 + parseFloat(this.uniforms.particleLife.value)
        ) {
            this.isDisposed = true
            return
        }
        let now = window.performance.now() / 17
        this.uniforms.time.value = now
        for (let i = this.timestamps.length - 1; i >= 0; i--) {
            let timestampObj = this.timestamps[i]
            if (
                timestampObj.timestamp + parseFloat(this.uniforms.particleLife.value) <
                now
            ) {
                this.freeSpace += timestampObj.amount
                this.timestamps.splice(i, 1)
            }
        }
    }
    getDistributions(renderInfo, distrX, distrY) {
        let x = renderInfo.x
        let w = renderInfo.w
        let y = renderInfo.y
        let h = renderInfo.h
        const renderDims = getRenderDimensions()
        const wKeyHt = renderDims.whiteKeyHeight
        const bKeyHt = renderDims.blackKeyHeight
        const pianoPos = renderDims.getAbsolutePianoPosition(true)
        switch (distrX) {
            case CONST.DISTRIBUTIONS.X.ACROSS:
                let spread = (w * getSetting("particleDistributionXSpread")) / 100
                x = x + w / 2 - spread / 2
                w = spread
                break
            case CONST.DISTRIBUTIONS.X.LEFT:
                w = 1
                break
            case CONST.DISTRIBUTIONS.X.RIGHT:
                x = x + w - 1
                w = 1
                break

            default:
                break
        }
        let keyHeight = renderInfo.isBlack ? bKeyHt : wKeyHt
        switch (distrY) {
            case CONST.DISTRIBUTIONS.Y.NOTE_TOP:
                h = 1
                break
            case CONST.DISTRIBUTIONS.Y.ACROSS_NOTE:
                break
            case CONST.DISTRIBUTIONS.Y.NOTE_BOTTOM:
                y = y + h - 1
                h = 1
                break
            case CONST.DISTRIBUTIONS.Y.KEYS_TOP:
                y = pianoPos
                h = 1
                break
            case CONST.DISTRIBUTIONS.Y.ACROSS_KEYS:
                y = pianoPos
                h = keyHeight
                break
            case CONST.DISTRIBUTIONS.Y.KEYS_BOTTOM:
                y = pianoPos + keyHeight - 1
                h = 1
                break

            default:
                break
        }
        return {
            x,
            y,
            w,
            h
        }
    }
    getParticleShaderMaterial(uniforms, blending) {
        return new THREE.ShaderMaterial({
            uniforms: uniforms,
            transparent: true,
            opacity: 1,
            blending: blending,
            vertexShader: getShader(SHADERS.PARTICLE_V),
            fragmentShader: getShader(SHADERS.PARTICLE_F)
        })
    }
}