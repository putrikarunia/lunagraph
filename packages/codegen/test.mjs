import { parseJSX, generateJSX } from './dist/index.js'

console.log('Testing JSX Codegen\n')

// Test 1: Parse simple JSX
const jsx1 = `<div><h1>Hello World</h1><button>Click me</button></div>`
console.log('Input JSX:')
console.log(jsx1)

const elements1 = parseJSX(jsx1)
console.log('\nParsed to FEElements:')
console.log(JSON.stringify(elements1, null, 2))

// Test 2: Generate JSX back
const generated1 = generateJSX(elements1)
console.log('\nGenerated JSX:')
console.log(generated1)

console.log('\n---\n')

// Test 3: Component with props
const jsx2 = `<Card variant="primary" style={{ padding: '20px' }}><CardTitle>Dashboard</CardTitle></Card>`
console.log('Input JSX with component:')
console.log(jsx2)

const elements2 = parseJSX(jsx2)
console.log('\nParsed to FEElements:')
console.log(JSON.stringify(elements2, null, 2))

const generated2 = generateJSX(elements2)
console.log('\nGenerated JSX:')
console.log(generated2)
