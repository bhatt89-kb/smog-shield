// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import * as matchers from "vitest-axe/matchers";
expect.extend(matchers);
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import * as axeMatchers from "vitest-axe/matchers";
import LifestyleForm from "@/components/LifestyleForm";
import CityInput from "@/components/CityInput";

expect.extend(axeMatchers);

afterEach(cleanup);

describe("LifestyleForm", () => {
  it("has no automatically detectable accessibility violations", async () => {
    const { container } = render(<LifestyleForm onSubmit={() => {}} loading={false} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("labels every field", () => {
    render(<LifestyleForm onSubmit={() => {}} loading={false} />);
    for (const label of ["City", "People in household", "Main commute", "Cooking fuel", "Winter heating", "Language"]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it("shows an accessible error and does not submit an invalid city", async () => {
    const onSubmit = vi.fn();
    render(<LifestyleForm onSubmit={onSubmit} loading={false} />);
    await userEvent.type(screen.getByLabelText("City"), "x");
    await userEvent.click(screen.getByRole("button", { name: /get my action plan/i }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/too short/i);
    expect(screen.getByLabelText("City").getAttribute("aria-invalid")).toBe("true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid input", async () => {
    const onSubmit = vi.fn();
    render(<LifestyleForm onSubmit={onSubmit} loading={false} />);
    await userEvent.type(screen.getByLabelText("City"), "Dehradun, IN");
    await userEvent.click(screen.getByRole("button", { name: /get my action plan/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].city).toBe("Dehradun, IN");
  });
});

describe("CityInput", () => {
  it("shows popular cities on focus and lets keyboard users pick one", async () => {
    render(<CityInput fieldClass="" />);
    const input = screen.getByRole("combobox");
    await userEvent.click(input);
    expect(screen.getByRole("listbox")).toBeTruthy();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect((input as HTMLInputElement).value).toBe("Delhi, IN");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("closes the list with Escape", async () => {
    render(<CityInput fieldClass="" />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
