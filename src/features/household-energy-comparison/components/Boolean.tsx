import { useField } from "formik";
import { Label } from "components/ui/label";
import { RadioGroup, RadioGroupItem } from "components/ui/radio-group";

export const BooleanField = ({ name, label }: { name: string; label: string }) => {
    const [field, meta, helpers] = useField<boolean | undefined>(name);
    const inputId = name.replaceAll(".", "-");
    const errorId = `${inputId}-error`;

    return (
        <fieldset className="space-y-2">
            <legend className="text-sm leading-none font-medium">{label}</legend>
            <RadioGroup
                value={field.value === undefined ? "" : String(field.value)}
                onValueChange={(value) => {
                    void helpers.setTouched(true, false);
                    void helpers.setValue(value === "true");
                }}
                aria-invalid={meta.touched && Boolean(meta.error)}
                aria-describedby={meta.touched && meta.error ? errorId : undefined}
                className="flex gap-6"
            >
                <div className="flex items-center gap-2">
                    <RadioGroupItem id={`${inputId}-yes`} value="true" />
                    <Label htmlFor={`${inputId}-yes`} className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                    <RadioGroupItem id={`${inputId}-no`} value="false" />
                    <Label htmlFor={`${inputId}-no`} className="font-normal">No</Label>
                </div>
            </RadioGroup>
            {meta.touched && meta.error ? <p id={errorId} className="text-sm text-destructive">{meta.error}</p> : null}
        </fieldset>
    );
};
