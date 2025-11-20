import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface CardItemProps {
  label: string
  value: string
  trend: "up" | "down"
  trendValue: string
  footerTitle: string
  footerDescription: string
}

export function CardItem({
  label,
  value,
  trend,
  trendValue,
  footerTitle,
  footerDescription,
}: CardItemProps) {
  const TrendIcon = trend === "up" ? IconTrendingUp : IconTrendingDown

  return (
    <Card className="@container/card flex-1">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <TrendIcon />
            {trendValue}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {footerTitle} <TrendIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">{footerDescription}</div>
      </CardFooter>
    </Card>
  )
}
