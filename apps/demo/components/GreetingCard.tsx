import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui"

export function GreetingCard({
  title,
  ctaText,
  children,
  ...props
}:  {
  title: string,
  ctaText: string
} & React.ComponentProps<typeof Card>) {
  return <Card {...props}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div style={{
        gap: "16px",
        borderRadius: "12px",
        background: "#efefef",
        color: "#2e2e2e"
      }} className="flex items-center justify-center p-2 bg-amber-50">
        This is a greeting card
        <div style={{
          borderRadius: "8px",
          padding: "4px",
          background: "lavender",
          color: "purple",
          display: "flex",
          alignItems: "center",
          gap: "2px"
        }} className="flex items-center justify-center p-2 bg-green-50 text-green-800">
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "999px",
            background: "purple"
          }}></div>
          To do
        </div>
      </div>
      {children}
    </CardContent>
    <CardFooter>
      <Button>{ctaText}</Button>
    </CardFooter>
  </Card>
}