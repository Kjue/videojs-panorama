/**
 * Created by yanwsh on 4/3/16.
 * Refactored by Kjue 09/02/19.
 */
import BaseCanvas from './BaseCanvas'
import Util from './Util'
import { Scene, PerspectiveCamera, Vector3, SphereGeometry, SphereBufferGeometry, Mesh, MeshBasicMaterial, _Math } from 'three-full'

class Canvas extends BaseCanvas {
  constructor (player, options) {
    super(player, options)
    this.VRMode = false

    // define scene
    this.scene = new Scene()

    // define camera
    this.camera = new PerspectiveCamera(options.initFov, this.width / this.height, 1, 2000)
    this.camera.target = new Vector3(0, 0, 0)

    // define geometry
    var geometry = this.videoType === 'equirectangular'
      ? new SphereGeometry(500, 60, 40)
      : new SphereBufferGeometry(500, 60, 40).toNonIndexed()

    if (this.videoType === 'fisheye') {
      const normals = geometry.attributes.normal.array
      const uvs = geometry.attributes.uv.array

      for (let i = 0, l = normals.length / 3; i < l; i++) {
        const x = normals[i * 3 + 0]
        const y = normals[i * 3 + 1]
        const z = normals[i * 3 + 2]
        let r = Math.asin(Math.sqrt(x * x + z * z) / Math.sqrt(x * x + y * y + z * z)) / Math.PI
        if (y < 0) r = 1 - r
        let theta = x == 0 && z == 0 ? 0 : Math.acos(x / Math.sqrt(x * x + z * z))
        if (z < 0) theta = theta * -1
        uvs[i * 2 + 0] = -0.8 * r * Math.cos(theta) + 0.5
        uvs[i * 2 + 1] = 0.8 * r * Math.sin(theta) + 0.5
      }

      geometry.rotateX(options.rotateX)
      geometry.rotateY(options.rotateY)
      geometry.rotateZ(options.rotateZ)
    } else if (this.videoType === 'dual_fisheye') {
      const normals = geometry.attributes.normal.array
      const uvs = geometry.attributes.uv.array
      const l = normals.length / 3

      for (let i = 0; i < l / 2; i++) {
        const x = normals[i * 3 + 0]
        const y = normals[i * 3 + 1]
        const z = normals[i * 3 + 2]
        const r = x == 0 && z == 0 ? 1 : Math.acos(y) / Math.sqrt(x * x + z * z) * (2 / Math.PI)
        uvs[i * 2 + 0] = x * options.dualFish.circle1.rx * r * options.dualFish.circle1.coverX + options.dualFish.circle1.x
        uvs[i * 2 + 1] = z * options.dualFish.circle1.ry * r * options.dualFish.circle1.coverY + options.dualFish.circle1.y
      }

      for (let i = l / 2; i < l; i++) {
        const x = normals[i * 3 + 0]
        const y = normals[i * 3 + 1]
        const z = normals[i * 3 + 2]
        const r = x == 0 && z == 0 ? 1 : Math.acos(-y) / Math.sqrt(x * x + z * z) * (2 / Math.PI)
        uvs[i * 2 + 0] = -x * options.dualFish.circle2.rx * r * options.dualFish.circle2.coverX + options.dualFish.circle2.x
        uvs[i * 2 + 1] = z * options.dualFish.circle2.ry * r * options.dualFish.circle2.coverY + options.dualFish.circle2.y
      }

      geometry.rotateX(options.rotateX)
      geometry.rotateY(options.rotateY)
      geometry.rotateZ(options.rotateZ)
    }

    geometry.scale(-1, 1, 1)

    // define mesh
    this.mesh = new Mesh(geometry, new MeshBasicMaterial({
      map: this.texture
    }))
    // this.mesh.scale.x = -1;
    this.scene.add(this.mesh)
  }

  enableVR () {
    var _this = this.getChild('Canvas') || this
    _this.VRMode = true

    if (typeof vrHMD !== 'undefined') {
      // eslint-disable-next-line no-undef
      var eyeParamsL = vrHMD.getEyeParameters('left')

      // eslint-disable-next-line no-undef
      var eyeParamsR = vrHMD.getEyeParameters('right')
      _this.eyeFOVL = eyeParamsL.recommendedFieldOfView
      _this.eyeFOVR = eyeParamsR.recommendedFieldOfView
    }

    _this.cameraL = new PerspectiveCamera(_this.camera.fov, _this.width / 2 / _this.height, 1, 2000)
    _this.cameraR = new PerspectiveCamera(_this.camera.fov, _this.width / 2 / _this.height, 1, 2000)
  }

  disableVR () {
    var _this = this.getChild('Canvas') || this
    _this.VRMode = false
    _this.renderer.setViewport(0, 0, _this.width, _this.height)
    _this.renderer.setScissor(0, 0, _this.width, _this.height)
  }

  handleResize () {
    var _this = this.getChild('Canvas') || this
    super.handleResize()
    _this.camera.aspect = _this.width / _this.height
    _this.camera.updateProjectionMatrix()

    if (_this.VRMode) {
      _this.cameraL.aspect = _this.camera.aspect / 2
      _this.cameraR.aspect = _this.camera.aspect / 2
      _this.cameraL.updateProjectionMatrix()
      _this.cameraR.updateProjectionMatrix()
    }
  }

  handleMouseWheel (event) {
    var _this = this.getChild('Canvas') || this
    super.handleMouseWheel(event)

    if (event.wheelDeltaY) {
      // WebKit
      _this.camera.fov -= event.wheelDeltaY * 0.05
    } else if (event.wheelDelta) {
      // Opera / Explorer 9
      _this.camera.fov -= event.wheelDelta * 0.05
    } else if (event.detail) {
      // Firefox
      _this.camera.fov += event.detail * 1.0
    }

    _this.camera.fov = Math.min(_this.settings.maxFov, _this.camera.fov)
    _this.camera.fov = Math.max(_this.settings.minFov, _this.camera.fov)
    _this.camera.updateProjectionMatrix()

    if (_this.VRMode) {
      _this.cameraL.fov = _this.camera.fov
      _this.cameraR.fov = _this.camera.fov
      _this.cameraL.updateProjectionMatrix()
      _this.cameraR.updateProjectionMatrix()
    }
  }

  handleTouchMove (event) {
    var _this = this.getChild('Canvas') || this
    super.handleTouchMove(event)

    if (_this.isUserPinch) {
      const currentDistance = Util.getTouchesDistance(event.touches)
      event.wheelDeltaY = (currentDistance - _this.multiTouchDistance) * 2
      _this.handleMouseWheel(event)
      _this.multiTouchDistance = currentDistance
    }
  }

  render () {
    var _this = this.getChild('Canvas') || this
    super.render()
    _this.camera.target.x = 500 * Math.sin(_this.phi) * Math.cos(_this.theta)
    _this.camera.target.y = 500 * Math.cos(_this.phi)
    _this.camera.target.z = 500 * Math.sin(_this.phi) * Math.sin(_this.theta)
    _this.camera.lookAt(_this.camera.target)

    if (!_this.VRMode) {
      _this.renderer.render(this.scene, this.camera)
    } else {
      var viewPortWidth = _this.width / 2
      var viewPortHeight = _this.height

      if (typeof vrHMD !== 'undefined') {
        _this.cameraL.projectionMatrix = Util.fovToProjection(_this.eyeFOVL, true, _this.camera.near, _this.camera.far)
        _this.cameraR.projectionMatrix = Util.fovToProjection(_this.eyeFOVR, true, _this.camera.near, _this.camera.far)
      } else {
        var lonL = _this.lon + _this.settings.VRGapDegree
        var lonR = _this.lon - _this.settings.VRGapDegree
        var thetaL = _Math.degToRad(lonL)
        var thetaR = _Math.degToRad(lonR)
        var targetL = Util.deepCopy(_this.camera.target)
        targetL.x = 500 * Math.sin(_this.phi) * Math.cos(thetaL)
        targetL.z = 500 * Math.sin(_this.phi) * Math.sin(thetaL)
        _this.cameraL.lookAt(targetL)
        var targetR = Util.deepCopy(_this.camera.target)
        targetR.x = 500 * Math.sin(_this.phi) * Math.cos(thetaR)
        targetR.z = 500 * Math.sin(_this.phi) * Math.sin(thetaR)
        _this.cameraR.lookAt(targetR)
      }

      // render left eye
      _this.renderer.setViewport(0, 0, viewPortWidth, viewPortHeight)
      _this.renderer.setScissor(0, 0, viewPortWidth, viewPortHeight)
      _this.renderer.render(_this.scene, _this.cameraL)

      // render right eye
      _this.renderer.setViewport(viewPortWidth, 0, viewPortWidth, viewPortHeight)
      _this.renderer.setScissor(viewPortWidth, 0, viewPortWidth, viewPortHeight)
      _this.renderer.render(_this.scene, _this.cameraR)
    }
  }
}

export default Canvas
