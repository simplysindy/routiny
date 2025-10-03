import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressBar from "@/components/ui/ProgressBar";

describe("ProgressBar", () => {
  it("should render with correct percentage and fraction", () => {
    render(<ProgressBar completed={3} total={5} />);
    expect(screen.getByText("60% - 3/5 completed")).toBeInTheDocument();
  });

  it("should render with custom label", () => {
    render(<ProgressBar completed={2} total={4} label="Day 1 Progress" />);
    expect(screen.getByText("Day 1 Progress")).toBeInTheDocument();
    expect(screen.getByText("50% - 2/4 completed")).toBeInTheDocument();
  });

  it("should render with default label", () => {
    render(<ProgressBar completed={1} total={1} />);
    expect(screen.getByText("Progress")).toBeInTheDocument();
  });

  it("should handle 0% progress", () => {
    render(<ProgressBar completed={0} total={5} />);
    expect(screen.getByText("0% - 0/5 completed")).toBeInTheDocument();
  });

  it("should handle 100% progress", () => {
    render(<ProgressBar completed={5} total={5} />);
    expect(screen.getByText("100% - 5/5 completed")).toBeInTheDocument();
  });

  it("should handle empty task list", () => {
    render(<ProgressBar completed={0} total={0} />);
    expect(screen.getByText("0% - 0/0 completed")).toBeInTheDocument();
  });

  it("should render progressbar with correct aria attributes", () => {
    render(<ProgressBar completed={3} total={5} />);
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "60");
    expect(progressbar).toHaveAttribute("aria-valuemin", "0");
    expect(progressbar).toHaveAttribute("aria-valuemax", "100");
  });

  it("should apply red color for low progress (0-33%)", () => {
    const { container } = render(<ProgressBar completed={1} total={5} />); // 20%
    const progressBar = container.querySelector(".bg-red-500");
    expect(progressBar).toBeInTheDocument();
  });

  it("should apply yellow color for medium progress (34-66%)", () => {
    const { container } = render(<ProgressBar completed={3} total={5} />); // 60%
    const progressBar = container.querySelector(".bg-yellow-500");
    expect(progressBar).toBeInTheDocument();
  });

  it("should apply green color for high progress (67-100%)", () => {
    const { container } = render(<ProgressBar completed={4} total={5} />); // 80%
    const progressBar = container.querySelector(".bg-green-500");
    expect(progressBar).toBeInTheDocument();
  });

  it("should round percentage to nearest integer", () => {
    render(<ProgressBar completed={2} total={3} />); // 66.67%
    expect(screen.getByText("67% - 2/3 completed")).toBeInTheDocument();
  });
});
