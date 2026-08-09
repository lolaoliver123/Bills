import { useField } from 'formik'
import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'

export const NumberField = ({
  name,
  label,
  unit,
  max,
  description,
}: {
  name: string
  label: string
  unit?: string
  max?: number
  description?: string
}) => {
  const [field, meta, helpers] = useField<number | undefined>(name)

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-question">
        {label}
      </Label>
      <div className="relative max-w-xs">
        <Input
          id={name}
          name={name}
          type="number"
          min="0"
          max={max}
          step="any"
          value={field.value ?? ''}
          onBlur={field.onBlur}
          onChange={(event) =>
            helpers.setValue(event.target.value === '' ? undefined : Number(event.target.value))
          }
          aria-invalid={meta.touched && Boolean(meta.error)}
          aria-describedby={meta.touched && meta.error ? `${name}-error` : undefined}
          className={unit ? 'pr-12' : undefined}
        />
        {unit ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {meta.touched && meta.error ? (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {meta.error}
        </p>
      ) : null}
    </div>
  )
}
