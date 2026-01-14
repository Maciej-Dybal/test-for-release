import type { Meta, StoryObj } from "@storybook/react";
import { Test } from "./Test";

const meta: Meta<typeof Test> = {
	title: "Components/Test",
	component: Test,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

export const WithProps: Story = {
	args: {
		// Add your component props here
	},
};
