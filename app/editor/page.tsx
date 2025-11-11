'use client'

import { LunagraphEditor } from '@/src'
import * as UI from '../components/ui'
import componentIndex from '../../.lunagraph/ComponentIndex.json'

export default function EditorPage() {
  return <LunagraphEditor components={UI} componentIndex={componentIndex} />
}
