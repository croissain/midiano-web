export class ThreeJsTextureManager {
    constructor() {
        this.textures = {}
        this.loader = new THREE.TextureLoader()
    }
    loadTexture(textureName, callback = () => {}) {
        if (!this.textures.hasOwnProperty(textureName)) {
            this.loader.load(
                "../../../images/particles/" + textureName + ".png",
                texture => {
                    this.textures[textureName] = texture
                    callback(texture)
                },
                undefined,
                function(err) {
                    console.log("Error loading texture: " + err)
                }
            )
        }
    }
    getTexture(textureName) {
        if (!this.textures.hasOwnProperty(textureName)) {
            this.loadTexture(textureName)
        }
        return this.textures[textureName]
    }
}