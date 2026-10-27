import { afterEach, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { feedbackService } from "@/services/feedback-service";
import { seedFeedback } from "@/data/feedback";
import Inbox from "./Inbox";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("keeps feedback on cancel and deletes and selects the next item on confirmation", async () => {
  const user = userEvent.setup();
  const successToast = vi.spyOn(toast, "success").mockReturnValue("delete-toast");
  const first = seedFeedback[0]!;
  const second = seedFeedback[1]!;
  vi.spyOn(feedbackService, "listFeedback").mockReturnValue([first, second]);
  const deleteFeedback = vi.spyOn(feedbackService, "deleteFeedback").mockReturnValue([second]);
  render(
    <TooltipProvider>
      <Inbox />
    </TooltipProvider>,
  );

  await user.click(screen.getByRole("button", { name: "Delete feedback" }));
  expect(deleteFeedback).not.toHaveBeenCalled();
  expect(successToast).not.toHaveBeenCalled();
  const cancelDelete = within(screen.getByRole("alertdialog")).getByRole("button", {
    name: "Cancel",
  });
  expect(cancelDelete.classList.contains("h-8")).toBe(true);
  await user.click(cancelDelete);
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(deleteFeedback).not.toHaveBeenCalled();
  expect(successToast).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: first.summary })).toBeTruthy();

  await user.click(screen.getByRole("button", { name: "Delete feedback" }));
  const confirmDelete = within(screen.getByRole("alertdialog")).getByRole("button", {
    name: "Delete",
  });
  expect(confirmDelete.classList.contains("h-8")).toBe(true);
  expect(confirmDelete.classList.contains("bg-destructive")).toBe(true);
  expect(confirmDelete.classList.contains("text-destructive-foreground")).toBe(true);
  expect(confirmDelete.classList.contains("bg-primary")).toBe(false);
  await user.click(confirmDelete);
  expect(deleteFeedback).toHaveBeenCalledExactlyOnceWith(first.id);
  expect(successToast).toHaveBeenCalledExactlyOnceWith("Feedback deleted");
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(screen.queryByText(first.summary)).toBeNull();
  expect(screen.getByRole("heading", { name: second.summary })).toBeTruthy();
});
