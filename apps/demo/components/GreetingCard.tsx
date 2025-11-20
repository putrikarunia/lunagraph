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
      {children}
    </CardContent>
    <CardFooter>
      <Button>{ctaText}</Button>
    </CardFooter>
  </Card>
}
