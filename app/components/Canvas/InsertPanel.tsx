import { Button } from "../ui/Button"
import { Text } from "../ui/Text"
import { FEElement } from "./types"

export const InsertPanel = ({onAddElement}: {
  onAddElement: (element: FEElement) => void
}) => {
  return <div className="w-full flex flex-col">
    <Text size="md" variant="secondary">Layout</Text>
    <Button variant={"secondary"} onClick={() => onAddElement({
      id: `element-${Date.now()}`,
      type: "html",
      tag: "div",
      styles: {
        background: "white",
        width: "200px",
        height: "100px",
        display: "flex",
        padding: "8px",
      },
      canvasPosition: {
        x: 100,
        y: 100
      },
      children: []
    })}>div</Button>
  </div>
}
