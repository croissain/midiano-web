import {
    CONST
} from "../../data/CONST.js"
import {
    getSetting,
    setSettingCallback
} from "../../settings/Settings.js"
import {
    getRenderDimensions
} from "../RenderDimensions.js"
import {
    getShader,
    SHADERS
} from "./Shader.js"
import {
    getScene,
    getTheeJsColor
} from "./threeJsHandler.js"

export class ThreeJsPianoLine {
    constructor() {
        this.setupSettings()

        let uniforms = {
            time: {
                type: "f",
                value: 0
            },
            screenWidth: {
                type: "f",
                value: getRenderDimensions().renderWidth
            },
            screenHeight: {
                type: "f",
                value: getRenderDimensions().renderHeight
            },
            noiseA: {
                type: "f",
                value: this.pianoLineNoiseA
            },
            noiseB: {
                type: "f",
                value: this.pianoLineNoiseB
            },
            noiseC: {
                type: "f",
                value: this.pianoLineNoiseC
            },
            noiseD: {
                type: "f",
                value: this.pianoLineNoiseD
            },
            opacity: {
                type: "f",
                value: this.pianoLineOpacity
            },
            color: {
                type: "vec3",
                value: getTheeJsColor(this.pianoLineColor)
            },
            resolution: {
                type: "f",
                value: this.pianoLineResolution
            },
            reflection: {
                type: "f",
                value: this.pianoLineReflection
            },
            amplitude: {
                type: "vec3",
                value: this.pianoLineAmplitude
            },

            yOffset: {
                type: "f",
                value: getRenderDimensions().getAbsolutePianoPosition(true) +
                    parseFloat(this.pianoLineYOffset)
            }
        }
        this.uniforms = uniforms

        this.addSettingCallbacksToUniforms([
            [uniforms.noiseA, "pianoLineNoiseA"],
            [uniforms.noiseB, "pianoLineNoiseB"],
            [uniforms.noiseC, "pianoLineNoiseC"],
            [uniforms.noiseD, "pianoLineNoiseD"],
            [uniforms.opacity, "pianoLineOpacity"],
            [uniforms.resolution, "pianoLineResolution"],
            [uniforms.reflection, "pianoLineReflection"],
            [uniforms.amplitude, "pianoLineAmplitude"]
        ])

        getRenderDimensions().registerResizeCallback(() => {
            this.uniforms.screenWidth.value = getRenderDimensions().renderWidth
            this.uniforms.screenHeight.value = getRenderDimensions().renderHeight
            if (getSetting("pianoLineEnabled")) {
                this.createShader()
            }
        })

        setSettingCallback("pianoLineColor", () => {
            this.uniforms.color.value = getTheeJsColor(getSetting("pianoLineColor"))
        })
        setSettingCallback("pianoResized", () => {
            this.uniforms.yOffset.value =
                getRenderDimensions().getAbsolutePianoPosition(true) +
                parseFloat(getSetting("pianoLineYOffset"))
        })
        setSettingCallback("pianoLineYOffset", () => {
            this.uniforms.yOffset.value =
                getRenderDimensions().getAbsolutePianoPosition(true) +
                parseFloat(getSetting("pianoLineYOffset"))
        })
        setSettingCallback("pianoLineEnabled", () => {
            if (getSetting("pianoLineEnabled")) {
                this.createShader()
            } else {
                this.removeShader()
            }
        })
        if (getSetting("pianoLineEnabled")) {
            this.createShader()
        }
    }
    getGeometry() {
        if (!this.geometry) {
            const renderDims = getRenderDimensions()
            this.geometry = new THREE.PlaneBufferGeometry(
                renderDims.renderWidth,
                renderDims.renderHeight,
                1,
                1, -renderDims.renderWidth / 2,
                0
            )
        }
        return this.geometry
    }
    createShader() {
        if (this.pianoLine) {
            this.removeShader()
        }
        if (!this.material) {
            this.material = new THREE.ShaderMaterial({
                uniforms: this.uniforms,
                transparent: true,
                opacity: 1,
                vertexShader: getShader(SHADERS.QUAD_V),
                fragmentShader: getShader(SHADERS.PIANOLINE_F)
            })
        }
        if (!this.point) {
            this.point = new THREE.Mesh(this.getGeometry(), this.material)
        }
        this.pianoLine = {
            point: this.point,
            start: window.performance.now()
        }

        getScene(CONST.DISTRIBUTIONS.Z.FRONT_OF_PIANO).add(this.point)
    }
    removeShader() {
        if (this.pianoLine) {
            this.pianoLine.point.material.dispose()
            this.pianoLine.point.geometry.dispose()
            getScene(CONST.DISTRIBUTIONS.Z.FRONT_OF_PIANO).remove(
                this.pianoLine.point
            )
            this.geometry = null
            this.material = null
            this.point = null
            this.pianoLine = null
        }
    }
    setupSettings() {
        let settingIds = [
            "pianoLineSpeed",
            "pianoLineNoiseA",
            "pianoLineNoiseB",
            "pianoLineNoiseC",
            "pianoLineNoiseD",
            "pianoLineOpacity",
            "pianoLineColor",
            "pianoLineResolution",
            "pianoLineReflection",
            "pianoLineAmplitude",
            "pianoLineYOffset"
        ]
        settingIds.forEach(settingId => {
            this[settingId] = getSetting(settingId)
            setSettingCallback(settingId, () => {
                this[settingId] = getSetting(settingId)
            })
        })
    }

    render() {
        if (this.pianoLine) {
            this.uniforms.time.value += parseFloat(this.pianoLineSpeed) * 0.001
        }
    }

    addSettingCallbacksToUniforms(arr) {
        arr.forEach(el => this.addSettingCallbackToUniform(el[0], el[1]))
    }
    addSettingCallbackToUniform(uniformVal, settingId) {
        setSettingCallback(
            settingId,
            () => (uniformVal.value = getSetting(settingId))
        )
    }
}