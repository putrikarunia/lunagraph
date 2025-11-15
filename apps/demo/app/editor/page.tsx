'use client'

import '@lunagraph/editor/styles.css';
import { LunagraphEditor } from "@lunagraph/editor";
import * as lunagraph from '../../.lunagraph/components';

export default function Editor() {
 return <LunagraphEditor {...lunagraph} />
}
