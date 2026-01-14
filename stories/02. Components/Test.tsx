import type React from "react";

interface TestProps {
	title?: string;
	onClick?: () => void;
}

export const Test: React.FC<TestProps> = ({
	title = "Test Component",
	onClick,
}) => {
	return (
		<div className="test-component">
			<h2>{title}</h2>
			<button type="button" onClick={onClick}>
				Click me
			</button>
		</div>
	);
};
