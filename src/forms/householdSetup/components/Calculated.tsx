export const CalculatedField = ({ label, value, unit }: { label: string; value?: number; unit?: string }) => (
    <label className="field">
        <span>{label}</span>
        <div className="input-with-unit">
            <input type="number" value={value ?? ""} readOnly aria-label={label}/>
            {unit ? <span>{unit}</span> : null}
        </div>
    </label>
);