'use client'

import '@lunagraph/editor/styles.css';
import { LunagraphEditor } from "@lunagraph/editor";
import * as UI from '../../components/ui';
import { GreetingCard } from '../../components/GreetingCard';
import componentIndex from '../../.lunagraph/ComponentIndex.json'

export default function Editor() {
 return <LunagraphEditor components={{ ...UI, GreetingCard }} componentIndex={componentIndex} />
}
