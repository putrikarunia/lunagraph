import { CardItem } from "./card-item";


export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card flex items-center gap-4 w-full *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
      <CardItem
        label="Total Revenue"
        value="$1,250.00"
        trend="up"
        trendValue="+12.5%"
        footerTitle="Trending up this month"
        footerDescription="Visitors for the last 6 months"
      />
      <CardItem
        label="New Customers"
        value="1,234"
        trend="down"
        trendValue="-20%"
        footerTitle="Down 20% this period"
        footerDescription="Acquisition needs attention"
      />
      <CardItem
        label="Active Accounts"
        value="45,678"
        trend="up"
        trendValue="+12.5%"
        footerTitle="Strong user retention"
        footerDescription="Engagement exceed targets"
      />
      <CardItem
        label="Growth Rate"
        value="4.5%"
        trend="up"
        trendValue="+4.5%"
        footerTitle="Steady performance increase"
        footerDescription="Meets growth projections"
      />
    </div>
  )
}
