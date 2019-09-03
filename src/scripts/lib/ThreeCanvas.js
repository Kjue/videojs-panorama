/**
 *
 * (c) Wensheng Yan <yanwsh@gmail.com>
 * Date: 10/21/16
 * Refactored by kjuetus 09/02/19.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
'use strict'

import BaseCanvas from './BaseCanvas'
import { Scene, PerspectiveCamera, Vector3, SphereBufferGeometry, Mesh, MeshBasicMaterial } from 'three-full'

class ThreeCanvas extends BaseCanvas {
  constructor (player, options) {
    super(player, options)

    // only show left part by default
    this.VRMode = false

    // define scene
    this.scene = new Scene()
    var aspectRatio = this.width / this.height

    // define camera
    this.cameraL = new PerspectiveCamera(options.initFov, aspectRatio, 1, 2000)
    this.cameraL.target = new Vector3(0, 0, 0)
    this.cameraR = new PerspectiveCamera(options.initFov, aspectRatio / 2, 1, 2000)
    this.cameraR.position.set(1000, 0, 0)
    this.cameraR.target = new Vector3(1000, 0, 0)
    var geometryL = new SphereBufferGeometry(500, 60, 40).toNonIndexed()
    var geometryR = new SphereBufferGeometry(500, 60, 40).toNonIndexed()
    var uvsL = geometryL.attributes.uv.array
    var normalsL = geometryL.attributes.normal.array

    for (var ii = 0; ii < normalsL.length / 3; ii++) {
      uvsL[ii * 2 + 1] = uvsL[ii * 2 + 1] / 2
    }

    var uvsR = geometryR.attributes.uv.array
    var normalsR = geometryR.attributes.normal.array

    for (var jj = 0; jj < normalsR.length / 3; jj++) {
      uvsR[jj * 2 + 1] = uvsR[jj * 2 + 1] / 2 + 0.5
    }

    geometryL.scale(-1, 1, 1)
    geometryR.scale(-1, 1, 1)
    this.meshL = new Mesh(geometryL, new MeshBasicMaterial({
      map: this.texture
    }))
    this.meshR = new Mesh(geometryR, new MeshBasicMaterial({
      map: this.texture
    }))
    this.meshR.position.set(1000, 0, 0)
    this.scene.add(this.meshL)
    if (options.callback) options.callback()
  }

  handleResize () {
    super.handleResize(this)
    var aspectRatio = this.width / this.height

    if (!this.VRMode) {
      this.cameraL.aspect = aspectRatio
      this.cameraL.updateProjectionMatrix()
    } else {
      aspectRatio /= 2
      this.cameraL.aspect = aspectRatio
      this.cameraR.aspect = aspectRatio
      this.cameraL.updateProjectionMatrix()
      this.cameraR.updateProjectionMatrix()
    }
  }

  handleMouseWheel (event) {
    super.handleMouseWheel(event)

    if (event.wheelDeltaY) {
      // WebKit
      this.cameraL.fov -= event.wheelDeltaY * 0.05
    } else if (event.wheelDelta) {
      // Opera / Explorer 9
      this.cameraL.fov -= event.wheelDelta * 0.05
    } else if (event.detail) {
      // Firefox
      this.cameraL.fov += event.detail * 1.0
    }

    this.cameraL.fov = Math.min(this.settings.maxFov, this.cameraL.fov)
    this.cameraL.fov = Math.max(this.settings.minFov, this.cameraL.fov)
    this.cameraL.updateProjectionMatrix()

    if (this.VRMode) {
      this.cameraR.fov = this.cameraL.fov
      this.cameraR.updateProjectionMatrix()
    }
  }

  enableVR () {
    this.VRMode = true
    this.scene.add(this.meshR)
    this.handleResize()
  }

  disableVR () {
    this.VRMode = false
    this.scene.remove(this.meshR)
    this.handleResize()
  }

  render () {
    super.render(this)
    this.cameraL.target.x = 500 * Math.sin(this.phi) * Math.cos(this.theta)
    this.cameraL.target.y = 500 * Math.cos(this.phi)
    this.cameraL.target.z = 500 * Math.sin(this.phi) * Math.sin(this.theta)
    this.cameraL.lookAt(this.cameraL.target)

    if (this.VRMode) {
      var viewPortWidth = this.width / 2
      var viewPortHeight = this.height
      this.cameraR.target.x = 1000 + 500 * Math.sin(this.phi) * Math.cos(this.theta)
      this.cameraR.target.y = 500 * Math.cos(this.phi)
      this.cameraR.target.z = 500 * Math.sin(this.phi) * Math.sin(this.theta)
      this.cameraR.lookAt(this.cameraR.target)

      // render left eye
      this.renderer.setViewport(0, 0, viewPortWidth, viewPortHeight)
      this.renderer.setScissor(0, 0, viewPortWidth, viewPortHeight)
      this.renderer.render(this.scene, this.cameraL)

      // render right eye
      this.renderer.setViewport(viewPortWidth, 0, viewPortWidth, viewPortHeight)
      this.renderer.setScissor(viewPortWidth, 0, viewPortWidth, viewPortHeight)
      this.renderer.render(this.scene, this.cameraR)
    } else {
      this.renderer.render(this.scene, this.cameraL)
    }
  }
}

export default ThreeCanvas
