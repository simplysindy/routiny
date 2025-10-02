import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DurationSelector } from "@/components/task/DurationSelector";

describe("DurationSelector", () => {
  it("should render all preset duration options", () => {
    render(<DurationSelector value={1} onChange={() => {}} />);

    expect(screen.getByLabelText("1 day")).toBeInTheDocument();
    expect(screen.getByLabelText("7 days")).toBeInTheDocument();
    expect(screen.getByLabelText("30 days")).toBeInTheDocument();
    expect(screen.getByLabelText("90 days")).toBeInTheDocument();
    expect(screen.getByLabelText("Custom")).toBeInTheDocument();
  });

  it("should call onChange with selected preset duration", () => {
    const onChange = vi.fn();
    render(<DurationSelector value={1} onChange={onChange} />);

    const option7Days = screen.getByLabelText("7 days");
    fireEvent.click(option7Days);

    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("should show custom input when custom option is selected", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DurationSelector value={1} onChange={onChange} />
    );

    const customOption = screen.getByLabelText("Custom");
    fireEvent.click(customOption);

    // Component calls onChange(1) when custom is clicked with no value
    // Rerender with custom value to show input
    rerender(<DurationSelector value={14} onChange={onChange} />);

    expect(screen.getByLabelText(/enter custom duration/i)).toBeInTheDocument();
  });

  it("should validate custom duration and show error for negative values", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DurationSelector value={1} onChange={onChange} />
    );

    // Select custom option
    const customOption = screen.getByLabelText("Custom");
    fireEvent.click(customOption);

    // Rerender with custom value to show input
    rerender(<DurationSelector value={14} onChange={onChange} />);

    // Enter negative value
    const input = screen.getByLabelText(/enter custom duration/i);
    fireEvent.change(input, { target: { value: "-5" } });

    expect(
      screen.getByText(/must be a positive number between 1 and 365 days/i)
    ).toBeInTheDocument();
  });

  it("should validate custom duration and show error for zero", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DurationSelector value={1} onChange={onChange} />
    );

    // Select custom option and rerender
    const customOption = screen.getByLabelText("Custom");
    fireEvent.click(customOption);
    rerender(<DurationSelector value={14} onChange={onChange} />);

    // Enter zero
    const input = screen.getByLabelText(/enter custom duration/i);
    fireEvent.change(input, { target: { value: "0" } });

    expect(
      screen.getByText(/must be a positive number between 1 and 365 days/i)
    ).toBeInTheDocument();
  });

  it("should validate custom duration and show error for values over 365", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DurationSelector value={1} onChange={onChange} />
    );

    // Select custom option and rerender
    const customOption = screen.getByLabelText("Custom");
    fireEvent.click(customOption);
    rerender(<DurationSelector value={14} onChange={onChange} />);

    // Enter value over limit
    const input = screen.getByLabelText(/enter custom duration/i);
    fireEvent.change(input, { target: { value: "500" } });

    expect(
      screen.getByText(/must be a positive number between 1 and 365 days/i)
    ).toBeInTheDocument();
  });

  it("should accept valid custom duration", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DurationSelector value={1} onChange={onChange} />
    );

    // Select custom option and rerender
    const customOption = screen.getByLabelText("Custom");
    fireEvent.click(customOption);
    rerender(<DurationSelector value={14} onChange={onChange} />);

    // Enter valid value
    const input = screen.getByLabelText(/enter custom duration/i);
    fireEvent.change(input, { target: { value: "14" } });

    expect(onChange).toHaveBeenCalledWith(14);
    expect(
      screen.queryByText(/must be a positive number/)
    ).not.toBeInTheDocument();
  });

  it("should highlight selected preset option", () => {
    render(<DurationSelector value={7} onChange={() => {}} />);

    const option7Days = screen.getByLabelText("7 days");
    expect(option7Days).toBeChecked();
  });

  it("should switch from custom to preset and clear custom value", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DurationSelector value={1} onChange={onChange} />
    );

    // Select custom and enter a value
    const customOption = screen.getByLabelText("Custom");
    fireEvent.click(customOption);

    // Rerender with custom value to show input
    rerender(<DurationSelector value={14} onChange={onChange} />);

    const input = screen.getByLabelText(/enter custom duration/i);
    fireEvent.change(input, { target: { value: "14" } });

    // Switch to preset
    const option30Days = screen.getByLabelText("30 days");
    fireEvent.click(option30Days);

    expect(onChange).toHaveBeenCalledWith(30);

    // Rerender with preset value
    rerender(<DurationSelector value={30} onChange={onChange} />);

    // Custom input should be hidden
    expect(
      screen.queryByLabelText(/enter custom duration/i)
    ).not.toBeInTheDocument();
  });
});
