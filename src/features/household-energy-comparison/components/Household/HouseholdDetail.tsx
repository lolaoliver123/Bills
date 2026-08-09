import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card'

export const DetailCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="border-primary/15 bg-muted/30 shadow-none">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="grid gap-5">{children}</CardContent>
  </Card>
)
