/**
 * Created by wensheng.yan on 5/23/16.
 * Refactored by kjuetus 09/02/19.
 */
import videojs from 'video.js'
const Component = videojs.getComponent('Component')

var element = document.createElement('canvas')
element.className = 'vjs-video-helper-canvas'

class HelperCanvas extends Component {
  constructor (player, options) {
    super(player, options)
    this.videoElement = options.video
    this.width = options.width
    this.height = options.height
    element.width = this.width
    element.height = this.height
    element.style.display = 'none'
    options.el = element
    this.context = element.getContext('2d')
    this.context.drawImage(this.videoElement, 0, 0, this.width, this.height)
  }

  getContext () {
    return this.context
  }

  update () {
    this.context.drawImage(this.videoElement, 0, 0, this.width, this.height)
  }

  el () {
    return element
  }
}
videojs.registerComponent('HelperCanvas', HelperCanvas)
