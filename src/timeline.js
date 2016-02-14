import {timer} from "d3-timer";

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

  function append(parentElement, newChildElement) {
    parentElement.appendChild(newChildElement)
  }

  function select(s) {
    return document.querySelector(s)
  }

  function attr(element, attribute, value) {
    element.setAttribute(attribute, value)
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

  const canvasContext = canvas.getContext('2d')

  /*
   * Render a circle
   */

  const lineWidth = 0.5
  const radius = 31

  function render(context, x, y, radius, s) {
    const r = radius * s
    context.moveTo(x * s + r, y * s)
    context.arc(x * s , y * s, r, 0, 2 * Math.PI)
  }

  /*
   * Render the audio visualisation
   */

  canvasContext.strokeStyle = 'rgba(0,0,0,1)'
  canvasContext.fillStyle = 'rgba(255,255,255,.1)'

  function renderOnCanvas(context, frequencyData) {

    var i, j

    context.lineWidth = aaMultiple * lineWidth
    context.fillRect(
      0, 0,
      width * aaMultiple, height * aaMultiple
    )
    context.beginPath()
    for(j = 0; j < 10; j++) {
      for(i = 0; i < 10; i++) {
        render(
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

  /*
   * Audio input and analyser
   */

  navigator.getUserMedia  = MediaDevices.getUserMedia
    || navigator.webkitGetUserMedia
    || navigator.mozGetUserMedia
  const audioApi = new AudioContext()

  function makeAnalyser(source) {
    const analyser = audioApi.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.5
    source.connect(analyser)
    return analyser
  }

  function onStream(stream) {
    const source = audioApi.createMediaStreamSource(stream)
    const analyser = makeAnalyser(source)
    const frequencyData = new Uint8Array(1024)
    timer(function() {
      // side effect: refresh frequencyData
      analyser.getByteFrequencyData(frequencyData)
      // side effect: rerender on canvas
      renderOnCanvas(canvasContext, frequencyData)
    })
  }

  navigator.getUserMedia(
    {audio:true},
    onStream,
    function(error) {
      console.log("Error: " + error)
    }
  )

  return 42;
};