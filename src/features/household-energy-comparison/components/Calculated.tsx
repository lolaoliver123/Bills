import { useId } from "react";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";

export const CalculatedField = ({ label, value, unit }: { label: string; value?: number; unit?: string }) => {
    const inputId = useId();

    return (
        <div className="space-y-2">
            <Label htmlFor={inputId} className="text-question">{label}</Label>
            <div className="relative max-w-xs">
                <Input id={inputId} type="number" value={value ?? ""} readOnly className={unit ? "bg-muted pr-12" : "bg-muted"}/>
                {unit ? <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">{unit}</span> : null}
            </div>
        </div>
    );
};
