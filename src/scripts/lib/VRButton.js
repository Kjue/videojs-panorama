/**
 * Created by yanwsh on 8/13/16.
 * Refactored by Kjue 09/02/19.
 */
import videojs from 'video.js'
const Button = videojs.getComponent('Button')

class VRButton extends Button {
  constructor (player, options) {
    super(player, options)
    this.controlText_ = 'VR'
  }

  buildCSSClass () {
    return `vjs-VR-control ${super.buildCSSClass(this)}`
  }

  handleClick () {
    const vjsDom = videojs.dom || videojs
    const canvas = this.player().getChild('Canvas')
    !canvas.VRMode ? canvas.enableVR() : canvas.disableVR()
    canvas.VRMode ? vjsDom.addClass('enable') : vjsDom.removeClass('enable')
    canvas.VRMode ? this.player().trigger('VRModeOn') : this.player().trigger('VRModeOff')
  }
}

videojs.registerComponent('VRButton', VRButton)
