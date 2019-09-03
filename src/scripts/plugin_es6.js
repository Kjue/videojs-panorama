'use strict'

import videojs from 'video.js'
import Canvas from './lib/Canvas'
import ThreeCanvas from './lib/ThreeCanvas'
import './lib/Notice'
import './lib/HelperCanvas'
import './lib/VRButton'
import panorama from './plugin'
import '../styles/plugin.scss'

function getTech (player) {
  return player.tech({ IWillNotUseThisInPlugins: true }).el()
}

function getFullscreenToggleClickFn (player) {
  return player.controlBar.fullscreenToggle.handleClick
}

if (typeof window !== 'undefined') {
  var registerPlugin = videojs.registerPlugin || videojs.plugin
  registerPlugin('panorama', panorama({
    _init: function (options) {
      videojs.registerComponent('Canvas', (options.videoType !== '3dVideo') ? Canvas : ThreeCanvas)
    },
    mergeOption: function (defaults, options) {
      return videojs.mergeOptions(defaults, options)
    },
    getTech: getTech,
    getFullscreenToggleClickFn: getFullscreenToggleClickFn
  }))
}

export default function (player, options) {
  return player.panorama(options)
};
