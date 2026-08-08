import {StrictMode, type ReactNode} from "react";

export const AppProvider = ({children}: {children: ReactNode}) => (
    <StrictMode>{children}</StrictMode>
);
