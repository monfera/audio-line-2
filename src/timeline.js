import {timer} from "d3-timer"
import {line, curveCatmullRom} from "d3-shape"
//import {scaleLinear} from "d3-scale" // importing this imports way too much stuff due to the fluent style d3 is using

export default function() {

  if(typeof document == 'undefined') {
    return 42
  }

// Grid 2
// Web Audio works w/ Chrome & FF
// Put https:// before the URL
//     as WebAudio needs SSL

  /*
   * D3 lookalike functionality
   */

// We have no d3.select or d3.selectAll, so... no data binding
  function create(tagName) {
    return document.createElement(tagName)
  }

  function createSVG(tagName) {
    return document.createElementNS("http://www.w3.org/2000/svg", tagName)
  }

  function append(parentElement, newChildElement) {
    parentElement.appendChild(newChildElement)
  }

  function select(s) {
    return document.querySelector(s)
  }

  function attr(element, attribute, value) {
    element.setAttribute(attribute, value)
  }

  function attrSVG(element, attribute, value) {
    element.setAttributeNS("http://www.w3.org/2000/svg", attribute, value)
  }

  function style(element, property, value) {
    element.style[property] = value
  }

  /*
   * Setup the canvas
   */

  const width = document.documentElement.clientWidth
  const height = document.documentElement.clientHeight
  const aaMultiple = window.devicePixelRatio

  const body = select('body')
  const canvas = create('canvas')
  append(body, canvas)

  attr(canvas, 'width', width * aaMultiple)
  attr(canvas, 'height', height * aaMultiple)

  style(canvas, 'width', 100 + '%')
  style(canvas, 'height', 100 + '%')
  style(canvas, 'position', 'absolute')
  style(canvas, 'top', 0)
  style(canvas, 'left', 0)

  const svg = createSVG('svg')
  append(body, svg)

  attr(svg, 'width', width)
  attr(svg, 'height', height)

  style(svg, 'width', 100 + '%')
  style(svg, 'height', 100 + '%')
  style(svg, 'position', 'absolute')
  style(svg, 'top', 0)
  style(svg, 'left', 0)

  const svgLine = createSVG('path')
  append(svg, svgLine)

  style(svgLine, 'fill', 'none')
  style(svgLine, 'stroke', 'red')
  style(svgLine, 'stroke-width', '2px')

  const canvasContext = canvas.getContext('2d')

  /*
   * Render a circle
   */

  const lineWidth = 0.5
  const radius = 31

  function renderCircle(context, x, y, radius, s) {
    const r = radius * s
    context.moveTo(x * s + r, y * s)
    context.arc(x * s , y * s, r, 0, 2 * Math.PI)
  }

/*
  function renderPath(context, moveTo, beziersToArray) {
    context.beginPath()
    context.moveTo.apply(context, moveTo)
    beziersToArray.forEach(function (b) {
      context.bezierCurveTo.apply(context, b)
    })
    context.stroke()
  }
*/

  /*
   * Render the audio visualisation
   */

  canvasContext.strokeStyle = 'rgba(0,0,0,1)'
  canvasContext.fillStyle = 'rgba(255,255,255,.1)'

  function renderCircleHexGrid(context, frequencyData) {

    var i, j

    context.lineWidth = aaMultiple * lineWidth
    context.beginPath()
    for(j = 0; j < 10; j++) {
      for(i = 0; i < 10; i++) {
        renderCircle(
          context,
          (i + 1) * 2 * radius + (j % 2) * radius,
          (9 - j + 1) * 2 * Math.sqrt(Math.pow(radius, 2) - Math.pow(radius / 2, 2)),
          frequencyData[(i + 10 * j) * 2] * radius / 255,
          aaMultiple
        )
      }
    }
    context.stroke()
  }

  function fadeCanvas(context) {

    context.fillRect(
      0, 0,
      width * aaMultiple, height * aaMultiple
    )
  }

  /*
   * Audio input and analyser
   */

  navigator.getUserMedia  = MediaDevices.getUserMedia
    || navigator.webkitGetUserMedia
    || navigator.mozGetUserMedia
  const audioApi = new AudioContext()

  const fftSize = 1024

  const fArraySize = fftSize

  const binCount = 100

  function makeAnalyser(source) {
    const analyser = audioApi.createAnalyser()
    analyser.fftSize = fftSize
    analyser.smoothingTimeConstant = 0.9
    source.connect(analyser)
    return analyser
  }

  var lineScaleX = function (x) {return x / binCount * width} //scaleLinear().domain([0, binCount]).range([0, width])
  var lineScaleY = function (y) {return height / 4 + height / 2 * (1 - y / 255)} //scaleLinear().domain([0, 255]).range([height - 20, 0])
  var xIndex = Array.apply(Array, new Array(binCount))
    .map(function(d, i) {return i})
  var lineX = xIndex
    .map(lineScaleX)

  function renderLine (canvasContext, svgLine, frequencyData) {

    var svgPathMaker = line()
      .curve(curveCatmullRom, 0.5) // which is the default value anyway: centripetal
      .x(function (i) {return lineX[i]})
      .y(function (i) {return lineScaleY(frequencyData[i])})

    var canvasPathMaker =  line()
      .curve(curveCatmullRom, 0.5) // which is the default value anyway: centripetal
      .x(function (i) {return lineX[i] * aaMultiple})
      .y(function (i) {return lineScaleY(frequencyData[i]) * aaMultiple})
      .context(canvasContext)

    // Draw the curve on the Canvas
    canvasContext.beginPath()
    canvasPathMaker(xIndex)
    canvasContext.stroke()

    // Draw the curve as an SVG path
    attr(svgLine, "d", svgPathMaker(xIndex))
  }

  function onStream(stream) {
    const source = audioApi.createMediaStreamSource(stream)
    const analyser = makeAnalyser(source)
    const frequencyData = new Uint8Array(fArraySize)
    timer(function() {
      // side effect: refresh into frequencyData
      analyser.getByteFrequencyData(frequencyData)
      // side effect: render
      fadeCanvas(canvasContext)
      //renderCircleHexGrid(canvasContext, frequencyData)
      renderLine(canvasContext, svgLine, frequencyData)
    })
  }

  navigator.getUserMedia(
    {audio:true},
    onStream,
    function(error) {
      console.log("Error: " + error)
    }
  )

  return 42
}