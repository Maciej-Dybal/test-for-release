import type React from "react";

interface RouterProps {
	children?: React.ReactNode;
}

const Router: React.FC<RouterProps> = ({ children }) => {
	return <div>{children}</div>;
};

export default Router;
