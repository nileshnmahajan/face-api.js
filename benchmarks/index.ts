import * as faceapi from '../src';
import { tf } from '../src';
import { New1 } from './New1';
import { New2 } from './New2';
import { BottomUpV1 } from './BottomUpV1';
import { BottomUpV5X } from './BottomUpV5X';
import { BottomUpV5XMnetV2 } from './BottomUpV5XMnetV2';

const inputSize = 300
//const numConvs = [0, 0, 0, 0, 0, 0, 0]
//const filters = [32, 32, 64, 64, 128, 180, 256]
//const filters = [32, 32, 64, 64, 64, 128, 256]
const expansionFactors = [2, 2, 4, 4, 4, 8, 16]
const filters = [16, 32, 32, 64, 64, 64, 64]

const withBn = true
const withComplexHeads = false
//const numConvs = [1, 1, 3, 2, 1, 1, 0]
//const channels = [16, 32, 64, 128, 256, 256, 256]
//const numConvs = [1, 1, 3, 2, 1, 1, 0]
//const channels = [16, 32, 64, 128, 256, 256, 256]

const numConvs = [1, 1, 1, 5, 1]
const channels = [16, 32, 64, 128, 256]
const topDownOutChannels = 64
const detectorChannels = [64, 64, 64]


/*
const numConvs = [0, 0, 0, 0, 0]
const channels = [8, 16, 32, 64, 64]
const topDownOutChannels = null//64
const detectorChannels = null//[64, 64, 64]
*/
window['tf'] = tf
//const bottomUp = new New1(inputSize, withBn, withComplexHeads, numConvs, channels, topDownOutChannels)
const bottomUp = new New2(inputSize, withBn, numConvs, channels, topDownOutChannels, detectorChannels)

//const bottomUp = new BottomUpV1(inputSize, numConvs, filters, topDownOutChannels, detectorChannels)
//const bottomUp = new BottomUpV5X(inputSize, mainModules, filters, topDownOutChannels, detectorChannels)
//const bottomUp = new BottomUpV5XMnetV2(inputSize, mainModules, [16, 16, 16, 16, 16, 16, 16], expansionFactors)
let input: tf.Tensor4D = tf.zeros([1, inputSize, inputSize, 3])
let isRunning = false
console.log('params (MB):', (bottomUp._getParamLayers().map(l => l.getNumParams()).reduce((a, b) => a + b) * 4) / (1024 * 1024))

function getNumIters() {
  return parseInt((document.getElementById('numItersInput') as HTMLInputElement).value) || 100
}

async function load() {
  document.getElementById('status').innerHTML = 'loading'
  document.getElementById('status').innerHTML = 'idle'
}

async function finish(outputs: tf.Tensor4D[]) {
  await Promise.all(outputs.map(t => t.data()))
  outputs.forEach(t => t.dispose())
}

window['run'] = async function run() {
  if (!input || isRunning) return
  isRunning = true

  // warm up
  document.getElementById('status').innerHTML = 'warmup'
  const netInput = await faceapi.toNetInput(input)
  //const res = bottomUp.forwardSync(netInput)
  const profile = await tf.profile(() => bottomUp.forwardSync(netInput))
  console.log(profile)
  const outputs = profile.result as any
  await finish(outputs)

  document.getElementById('status').innerHTML = 'running'

  const totalTime = Date.now()

  const times = []
  for(let i = 0; i < getNumIters(); i++) {
    const d = Date.now()
    const outputs = await bottomUp.forward(input)
    await finish(outputs)
    times.push(Date.now() - d)
  }

  console.log(times)

  document.getElementById('status').innerHTML = 'idle'
  document.getElementById('result').innerHTML =  `${faceapi.utils.round((Date.now() - totalTime) / getNumIters())}`
  document.getElementById('times').innerHTML = times.join(', ')
  isRunning = false
}