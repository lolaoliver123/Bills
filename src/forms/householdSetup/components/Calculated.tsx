import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CalculatedField = ({ label, value, unit }: { label: string; value?: number; unit?: string }) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        <div className="relative max-w-xs">
            <Input type="number" value={value ?? ""} readOnly aria-label={label} className={unit ? "bg-muted pr-12" : "bg-muted"}/>
            {unit ? <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">{unit}</span> : null}
        </div>
    </div>
);
