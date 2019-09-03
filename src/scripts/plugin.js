/**
 * Created by yanwsh on 4/3/16.
 * Refactored by kjuetus 09/02/19.
 */
'use strict'

import videojs from 'video.js'
import util from './lib/Util'
import Detector from './lib/Detector'
const runOnMobile = typeof window !== 'undefined' ? util.mobileAndTabletcheck() : false // Default options for the plugin.

const defaults = {
  clickAndDrag: runOnMobile,
  showNotice: true,
  NoticeMessage: 'Please use your mouse drag and drop the video.',
  autoHideNotice: 3000,
  // limit the video size when user scroll.
  scrollable: true,
  initFov: 75,
  maxFov: 105,
  minFov: 51,
  // initial position for the video
  initLat: 0,
  initLon: -180,
  // A float value back to center when mouse out the canvas. The higher, the faster.
  returnStepLat: 0.5,
  returnStepLon: 2,
  backToVerticalCenter: !runOnMobile,
  backToHorizonCenter: !runOnMobile,
  clickToToggle: false,
  // limit viewable zoom
  minLat: -85,
  maxLat: 85,
  minLon: -Infinity,
  maxLon: Infinity,
  videoType: 'equirectangular',
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  autoMobileOrientation: false,
  mobileVibrationValue: runOnMobile && util.isIos() ? 0.022 : 1,
  VREnable: true,
  VRGapDegree: 2.5,
  closePanorama: false,
  helperCanvas: {},
  dualFish: {
    width: 1920,
    height: 1080,
    circle1: {
      x: 0.240625,
      y: 0.553704,
      rx: 0.23333,
      ry: 0.43148,
      coverX: 0.913,
      coverY: 0.9
    },
    circle2: {
      x: 0.757292,
      y: 0.553704,
      rx: 0.232292,
      ry: 0.4296296,
      coverX: 0.913,
      coverY: 0.9308
    }
  }
}

const Plugin = videojs.getPlugin('plugin')
const plugin = function (settings = {}) {
  /**
     * A video.js plugin.
     *
     * In the plugin function, the value of `this` is a video.js `Player`
     * instance. You cannot rely on the player being in a "ready" state here,
     * depending on how the plugin is invoked. This may or may not be important
     * to you; if not, remove the wait for "ready"!
     *
     * @function panorama
     * @param    {Object} [options={}]
     *           An object of options left to the plugin author to define.
     */
  const videoTypes = ['equirectangular', 'fisheye', '3dVideo', 'dual_fisheye']

  class PanoramaPlugin extends Plugin {
    constructor (player, options) {
      super(player, options)
      if (settings.mergeOption) options = settings.mergeOption(defaults, options)

      if (typeof settings._init === 'undefined' || typeof settings._init !== 'function') {
        console.error('plugin must implement init function().')
        return
      }

      if (videoTypes.indexOf(options.videoType) == -1) options.videoType = defaults.videoType

      settings._init(options)
      /* implement callback function when videojs is ready */

      const _this = this
      player.ready(() => {
        _this.onPlayerReady(options, settings)
      })
    }

    /**
     * Function to invoke when the player is ready.
     *
     * This is a great place for your plugin to initialize itself. When this
     * function is called, the player will have its DOM and child components
     * in place.
     *
     * @function onPlayerReady
     * @param    {Player} player
     * @param    {Object} [options={}]
     */
    onPlayerReady (options, settings) {
      var vjsDom = videojs.dom || videojs
      vjsDom.addClass('vjs-panorama')

      if (!Detector.webgl) {
        this.PopupNotification({
          NoticeMessage: Detector.getWebGLErrorMessage(),
          autoHideNotice: options.autoHideNotice
        })

        if (options.callback) {
          options.callback()
        }

        return
      }

      var canvas = this.player.addChild('Canvas', util.deepCopy(options))
      // var canvas = this.player.getChild('Canvas')

      if (runOnMobile) {
        // var videoElement = settings.getTech(player)
        // TODO: Skip player
        var videoElement = this.el()

        if (util.isRealIphone()) {
          const makeVideoPlayableInline = require('iphone-inline-video') // ios 10 support play video inline

          videoElement.setAttribute('playsinline', '')
          makeVideoPlayableInline(videoElement, true)
        }

        if (util.isIos()) {
          this.fullscreenOnIOS(settings.getFullscreenToggleClickFn())
        }

        vjsDom.addClass('vjs-panorama-mobile-inline-video')
        vjsDom.removeClass('vjs-using-native-controls')
        canvas.playOnMobile()
      }

      const _this = this
      if (options.showNotice) {
        this.player.on('playing', function () {
          _this.PopupNotification(util.deepCopy(options))
        })
      }

      if (options.VREnable) {
        this.player.controlBar.addChild('VRButton', {}, this.player.controlBar.children().length - 1)
      }

      canvas.hide()
      this.player.on('play', function () {
        canvas.show()
      })
      this.player.on('fullscreenchange', function () {
        canvas.handleResize()
      })
      if (options.callback) options.callback()
    }

    playerResize () {
      var canvas = this.player.getChild('Canvas')
      return function () {
        this.el().style.width = window.innerWidth + 'px'
        this.el().style.height = window.innerHeight + 'px'
        canvas.handleResize()
      }
    }

    fullscreenOnIOS (clickFn) {
      var resizeFn = this.playerResize()
      this.player.controlBar.fullscreenToggle.off('tap', clickFn)
      this.player.controlBar.fullscreenToggle.on('tap', function fullscreen () {
        var canvas = this.player.getChild('Canvas')

        if (!this.isFullscreen()) {
          // set to fullscreen
          this.isFullscreen(true)
          this.enterFullWindow()
          resizeFn()
          window.addEventListener('devicemotion', resizeFn)
        } else {
          this.isFullscreen(false)
          this.exitFullWindow()
          this.el().style.width = ''
          this.el().style.height = ''
          canvas.handleResize()
          window.removeEventListener('devicemotion', resizeFn)
        }
      })
    }

    PopupNotification (options = {
      NoticeMessage: ''
    }) {
      var notice = this.player.addChild('Notice', options)

      if (options.autoHideNotice > 0) {
        setTimeout(function () {
          if (!notice.el_) {
            return
          }

          notice.addClass('vjs-video-notice-fadeOut')
          var transitionEvent = util.whichTransitionEvent()

          var hide = function () {
            notice.hide()
            notice.removeClass('vjs-video-notice-fadeOut')
            notice.off(transitionEvent, hide)
          }

          notice.on(transitionEvent, hide)
        }, options.autoHideNotice)
      }
    }
  }

  PanoramaPlugin.VERSION = '0.1.0'
  return PanoramaPlugin
}

export default plugin
