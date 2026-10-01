import fs from 'fs'

function inspectGLB(filePath) {
  console.log('=== Inspecting', filePath, '===')
  if (!fs.existsSync(filePath)) {
    console.log('Not found:', filePath)
    return
  }
  const buf = fs.readFileSync(filePath)
  const magic = buf.readUInt32LE(0)
  if (magic !== 0x46546c67) {
    console.log('Not a GLB')
    return
  }
  const chunkLength = buf.readUInt32LE(12)
  const jsonStr = buf.toString('utf8', 20, 20 + chunkLength)
  const json = JSON.parse(jsonStr)
  console.log('Extensions used:', json.extensionsUsed)
  console.log('Extensions required:', json.extensionsRequired)
  if (json.extensions && json.extensions.KHR_lights_punctual) {
    console.log('KHR_lights_punctual:', JSON.stringify(json.extensions.KHR_lights_punctual, null, 2))
  }
  const nodes = json.nodes || []
  nodes.forEach((n, idx) => {
    if (n.extensions && n.extensions.KHR_lights_punctual) {
      console.log('Node ' + idx + ' (' + n.name + ') has light:', n.extensions.KHR_lights_punctual)
    }
    if (/light|sun|key|fill|lamp/i.test(n.name || '')) {
      console.log('Node ' + idx + " named '" + n.name + "':", n)
    }
  })
  console.log('Total nodes:', nodes.length)
  console.log('All Node names:', nodes.map((n, i) => i + ': ' + (n.name || 'unnamed')))
}

inspectGLB('public/models/tbxp.glb')
inspectGLB('public/models/mask.glb')
