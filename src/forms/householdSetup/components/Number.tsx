import {useField} from "formik";

export const NumberField = ({ name, label, unit }: { name: string; label: string; unit?: string }) => {
    const [field, meta, helpers] = useField<number | undefined>(name);

    return (
        <label className="field">
            <span>{label}</span>
            <div className="input-with-unit">
                <input
                    id={name}
                    name={name}
                    type="number"
                    min="0"
                    step="any"
                    value={field.value ?? ""}
                    onBlur={field.onBlur}
                    onChange={(event) => helpers.setValue(event.target.value === "" ? undefined : Number(event.target.value))}
                />
                {unit ? <span>{unit}</span> : null}
            </div>
            {meta.touched && meta.error ? <span className="error">{meta.error}</span> : null}
        </label>
    );
};