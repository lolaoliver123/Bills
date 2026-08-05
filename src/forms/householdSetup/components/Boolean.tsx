import {useField} from "formik";

export const BooleanField = ({ name, label }: { name: string; label: string }) => {
    const [field, meta, helpers] = useField<boolean | undefined>(name);

    return (
        <fieldset className="field boolean-field">
            <legend>{label}</legend>
            <label>
                <input
                    type="radio"
                    name={name}
                    checked={field.value === true}
                    onChange={() => helpers.setValue(true)}
                    onBlur={() => helpers.setTouched(true)}
                />
                Yes
            </label>
            <label>
                <input
                    type="radio"
                    name={name}
                    checked={field.value === false}
                    onChange={() => helpers.setValue(false)}
                    onBlur={() => helpers.setTouched(true)}
                />
                No
            </label>
            {meta.touched && meta.error ? <span className="error">{meta.error}</span> : null}
        </fieldset>
    );
};
