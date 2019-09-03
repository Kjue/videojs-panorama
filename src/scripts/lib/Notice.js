/**
 * Created by yanwsh on 4/4/16.
 * Refactored by kjuetus 09/02/19.
 */
import videojs from 'video.js'
const Component = videojs.getComponent('Component')

var element = document.createElement('div')
element.className = 'vjs-video-notice-label'

class Notice extends Component {
  constructor (player, options) {
    super(player, options)
    if (typeof options.NoticeMessage === 'object') {
      element = options.NoticeMessage
      options.el = options.NoticeMessage
    } else if (typeof options.NoticeMessage === 'string') {
      element.innerHTML = options.NoticeMessage
      options.el = element
    }
  }

  el () {
    return element
  }
}
videojs.registerComponent('Notice', Notice)
