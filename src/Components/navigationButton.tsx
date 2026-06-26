import React from "react";
import { useNavigate } from "react-router-dom";

interface NavigateButtonProps {
    children: React.ReactNode;
    path: string;
    onClick?: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navState?: Record<string, any>;
}

const NavigateButton: React.FC<NavigateButtonProps> = ({
    children,
    path = "/",
    onClick,
    navState = {}
}) => {
    const navigate = useNavigate();

    return (
        <span
            onClick={() => {
                navigate(path, { state: navState });
                if (typeof onClick === "function") onClick();
            }}
            style={{ cursor: "pointer" }}
        >
            {children}
        </span>
    );
};

export default NavigateButton;
