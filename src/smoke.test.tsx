import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function SmokeComponent() {
	return <p>vitest is wired up</p>;
}

describe("test runner smoke test", () => {
	it("renders with React Testing Library under jsdom", () => {
		render(<SmokeComponent />);
		expect(screen.getByText("vitest is wired up")).toBeInTheDocument();
	});
});
