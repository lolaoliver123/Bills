export const ComparisonResultValue = (props: { title: string; value: string }) => {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{props.title}</p>
      <p className="text-xl font-semibold">{props.value}</p>
    </div>
  )
}
