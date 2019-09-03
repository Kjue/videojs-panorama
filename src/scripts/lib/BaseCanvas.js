/**
 *
 * (c) Wensheng Yan <yanwsh@gmail.com>
 * Date: 10/30/16
 * Refactored by kjuetus 09/02/19.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
'use strict'

import Detector from '../lib/Detector'
import MobileBuffering from '../lib/MobileBuffering'
import Util from '../lib/Util'
import videojs from 'video.js'
import { RGBFormat, LinearFilter, Texture, WebGLRenderer, _Math } from 'three-full'
const Component = videojs.getComponent('Component')
const HAVE_CURRENT_DATA = 2
const vjsDom = videojs.dom || videojs

class BaseCanvas extends Component {
  constructor (player, options) {
    super(player, options)
    this.settings = options

    // basic settings
    this.width = player.el().offsetWidth
    this.height = player.el().offsetHeight
    this.lon = options.initLon
    this.lat = options.initLat
    this.phi = 0
    this.theta = 0
    this.videoType = options.videoType
    this.clickToToggle = options.clickToToggle
    this.mouseDown = false
    this.isUserInteracting = false

    // define render
    this.renderer = new WebGLRenderer()
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)
    this.renderer.autoClear = false
    this.renderer.setClearColor(0x000000, 1)

    // define texture, on ie 11, we need additional helper canvas to solve rendering issue.
    var video = player.tech(true).el_
    this.supportVideoTexture = Detector.supportVideoTexture()
    this.liveStreamOnSafari = Detector.isLiveStreamOnSafari(video)
    if (this.liveStreamOnSafari) {
      this.supportVideoTexture = false
    }

    if (!this.supportVideoTexture) {
      this.helperCanvas = player.addChild('HelperCanvas', {
        video: video,
        width: options.helperCanvas.width ? options.helperCanvas.width : this.width,
        height: options.helperCanvas.height ? options.helperCanvas.height : this.height
      })
      var context = this.helperCanvas.el()
      this.texture = new Texture(context)
    } else {
      this.texture = new Texture(video)
    }

    video.style.visibility = 'hidden'
    this.texture.generateMipmaps = false
    this.texture.minFilter = LinearFilter
    this.texture.maxFilter = LinearFilter
    this.texture.format = RGBFormat
    this.el_ = this.renderer.domElement
    this.el_.classList.add('vjs-video-canvas')
    options.el = this.el_

    const _this = this
    this.attachControlEvents(player)
    // player.one('ready', () => { _this.attachControlEvents() })
    player.on('play', function () {
      _this.time = new Date().getTime()
      _this.startAnimation()
    })
  }

  attachControlEvents (player) {
    player.on('mousemove', this.handleMouseMove)
    player.on('touchmove', this.handleTouchMove)
    player.on('mousedown', this.handleMouseDown)
    player.on('touchstart', this.handleTouchStart)
    player.on('mouseup', this.handleMouseUp)
    player.on('touchend', this.handleTouchEnd)

    if (this.settings.scrollable) {
      player.on('mousewheel', this.handleMouseWheel)
      player.on('MozMousePixelScroll', this.handleMouseWheel)
    }

    player.on('mouseenter', this.handleMouseEnter)
    player.on('mouseleave', this.handleMouseLease)
    player.on('dispose', this.handleDispose)
  }

  handleDispose (event) {
    var _this = this.getChild('Canvas')
    this.off('mousemove', this.handleMouseMove)
    this.off('touchmove', this.handleTouchMove)
    this.off('mousedown', this.handleMouseDown)
    this.off('touchstart', this.handleTouchStart)
    this.off('mouseup', this.handleMouseUp)
    this.off('touchend', this.handleTouchEnd)

    if (_this.settings.scrollable) {
      this.off('mousewheel', this.handleMouseWheel)
      this.off('MozMousePixelScroll', this.handleMouseWheel)
    }

    this.off('mouseenter', this.handleMouseEnter)
    this.off('mouseleave', this.handleMouseLease)
    this.off('dispose', this.handleDispose)
    this.stopAnimation()
  }

  startAnimation () {
    this.render_animation = true
    this.animate()
  }

  stopAnimation () {
    this.render_animation = false

    if (this.requestAnimationId) {
      cancelAnimationFrame(this.requestAnimationId)
    }
  }

  handleResize () {
    this.width = this.player().el().offsetWidth
    this.height = this.player().el().offsetHeight
    this.renderer.setSize(this.width, this.height)
  }

  handleMouseUp (event) {
    var _this = this.getChild('Canvas')
    _this.mouseDown = false

    if (_this.clickToToggle) {
      var clientX = event.clientX || (event.changedTouches && event.changedTouches[0].clientX)
      var clientY = event.clientY || (event.changedTouches && event.changedTouches[0].clientY)
      if (typeof clientX === 'undefined' || clientY === 'undefined') return
      var diffX = Math.abs(clientX - _this.onPointerDownPointerX)
      var diffY = Math.abs(clientY - _this.onPointerDownPointerY)

      if (diffX < 0.1 && diffY < 0.1) {
        this.paused() ? this.play() : this.pause()
      }
    }
  }

  handleMouseDown (event) {
    event.preventDefault()
    var _this = this.getChild('Canvas')
    var clientX = event.clientX || (event.touches && event.touches[0].clientX)
    var clientY = event.clientY || (event.touches && event.touches[0].clientY)
    if (typeof clientX === 'undefined' || clientY === 'undefined') return
    _this.mouseDown = true
    _this.onPointerDownPointerX = clientX
    _this.onPointerDownPointerY = clientY
    _this.onPointerDownLon = _this.lon
    _this.onPointerDownLat = _this.lat
  }

  handleTouchStart (event) {
    if (event.touches.length > 1) {
      this.isUserPinch = true
      this.multiTouchDistance = Util.getTouchesDistance(event.touches)
    }

    this.handleMouseDown(event)
  }

  handleTouchEnd (event) {
    this.isUserPinch = false
    this.handleMouseUp(event)
  }

  handleMouseMove (event, extra) {
    var _this = this.getChild('Canvas')
    var clientX = event.clientX || (event.touches && event.touches[0].clientX)
    var clientY = event.clientY || (event.touches && event.touches[0].clientY)
    if (typeof clientX === 'undefined' || clientY === 'undefined') return

    if (_this.settings.clickAndDrag) {
      if (_this.mouseDown) {
        _this.lon = (_this.onPointerDownPointerX - clientX) * 0.2 + _this.onPointerDownLon
        _this.lat = (clientY - _this.onPointerDownPointerY) * 0.2 + _this.onPointerDownLat
      }
    } else {
      var x = clientX - _this.el_.offsetLeft
      var y = clientY - _this.el_.offsetTop
      _this.lon = x / _this.width * 430 - 225
      _this.lat = y / _this.height * -180 + 90
    }
  }

  handleTouchMove (event) {
    // handle single touch event,
    if (!this.isUserPinch || event.touches.length <= 1) {
      this.handleMouseMove(event)
    }
  }

  handleMobileOrientation (event, x, y) {
    var portrait = typeof event.portrait !== 'undefined' ? event.portrait : window.matchMedia('(orientation: portrait)').matches
    var landscape = typeof event.landscape !== 'undefined' ? event.landscape : window.matchMedia('(orientation: landscape)').matches
    var orientation = event.orientation || window.orientation

    if (portrait) {
      this.lon = this.lon - y * this.settings.mobileVibrationValue
      this.lat = this.lat + x * this.settings.mobileVibrationValue
    } else if (landscape) {
      var orientationDegree = -90

      if (typeof orientation !== 'undefined') {
        orientationDegree = orientation
      }

      this.lon = orientationDegree == -90 ? this.lon + x * this.settings.mobileVibrationValue : this.lon - x * this.settings.mobileVibrationValue
      this.lat = orientationDegree == -90 ? this.lat + y * this.settings.mobileVibrationValue : this.lat - y * this.settings.mobileVibrationValue
    }
  }

  handleMobileOrientationDegrees (event) {
    if (typeof event.rotationRate === 'undefined') return
    var x = event.rotationRate.alpha * Math.PI / 180
    var y = event.rotationRate.beta * Math.PI / 180
    this.handleMobileOrientation(event, x, y)
  }

  handleMobileOrientationRadians (event) {
    if (typeof event.rotationRate === 'undefined') return
    var x = event.rotationRate.alpha
    var y = event.rotationRate.beta
    this.handleMobileOrientation(event, x, y)
  }

  handleMouseWheel (event) {
    event.stopPropagation()
    event.preventDefault()
  }

  handleMouseEnter (event) {
    this.isUserInteracting = true
  }

  handleMouseLease (event) {
    this.isUserInteracting = false

    if (this.mouseDown) {
      this.mouseDown = false
    }
  }

  animate () {
    // const _this = this
    if (!this.render_animation) return
    this.requestAnimationId = this.requestAnimationFrame(this.animate)

    if (!this.player().paused()) {
      if (typeof this.texture !== 'undefined' && ((!this.isPlayOnMobile && this.player().readyState() >= HAVE_CURRENT_DATA) || (this.isPlayOnMobile && vjsDom.hasClass('vjs-playing')))) {
        var ct = new Date().getTime()

        if (ct - this.time >= 30) {
          this.texture.needsUpdate = true
          this.time = ct
        }

        if (this.isPlayOnMobile) {
          var currentTime = this.player().currentTime()

          if (MobileBuffering.isBuffering(currentTime)) {
            if (!vjsDom.hasClass('vjs-panorama-mobile-inline-video-buffering')) {
              vjsDom.addClass('vjs-panorama-mobile-inline-video-buffering')
            }
          } else {
            if (vjsDom.hasClass('vjs-panorama-mobile-inline-video-buffering')) {
              vjsDom.removeClass('vjs-panorama-mobile-inline-video-buffering')
            }
          }
        }
      }
    }

    this.render()
  }

  render () {
    if (!this.isUserInteracting) {
      var symbolLat = this.lat > this.settings.initLat ? -1 : 1
      var symbolLon = this.lon > this.settings.initLon ? -1 : 1

      if (this.settings.backToVerticalCenter) {
        this.lat = this.lat > this.settings.initLat - Math.abs(this.settings.returnStepLat) && this.lat < this.settings.initLat + Math.abs(this.settings.returnStepLat) ? this.settings.initLat : this.lat + this.settings.returnStepLat * symbolLat
      }

      if (this.settings.backToHorizonCenter) {
        this.lon = this.lon > this.settings.initLon - Math.abs(this.settings.returnStepLon) && this.lon < this.settings.initLon + Math.abs(this.settings.returnStepLon) ? this.settings.initLon : this.lon + this.settings.returnStepLon * symbolLon
      }
    }

    this.lat = Math.max(this.settings.minLat, Math.min(this.settings.maxLat, this.lat))
    this.lon = Math.max(this.settings.minLon, Math.min(this.settings.maxLon, this.lon))
    this.phi = _Math.degToRad(90 - this.lat)
    this.theta = _Math.degToRad(this.lon)

    if (!this.supportVideoTexture) {
      this.helperCanvas.update()
    }

    this.renderer.clear()
  }

  playOnMobile () {
    this.isPlayOnMobile = true

    if (this.settings.autoMobileOrientation) {
      if (Util.getChromeVersion() >= 66 || Util.getFirefoxVersion() >= 6) {
        // Chrome and Firefox is using degrees instead of radians
        window.addEventListener('devicemotion', this.handleMobileOrientationDegrees)
      } else {
        window.addEventListener('devicemotion', this.handleMobileOrientationRadians)
      }
    }
  }

  el () {
    return this.el_
  }
}

export default BaseCanvas
