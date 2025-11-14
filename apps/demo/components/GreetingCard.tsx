import { PropsWithChildren } from "react"
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
      <div className="flex items-center justify-center p-2 bg-amber-50">
        Hi There
        <div className="flex items-center justify-center p-2 bg-green-50 text-green-800">
          Active
        </div>
      </div>
      {children}
    </CardContent>
    <CardFooter>
      <Button>{ctaText}</Button>
    </CardFooter>
  </Card>
}
