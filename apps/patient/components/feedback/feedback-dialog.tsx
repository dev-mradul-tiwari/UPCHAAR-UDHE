"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, MessageSquareHeart, Award, Building2, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@upchaar/ui/dialog";
import { Button } from "@upchaar/ui/button";
import { Textarea } from "@upchaar/ui/textarea";
import { toast } from "@upchaar/ui/sonner";

import { api } from "@/lib/api";

export function FeedbackDialog() {
  const queryClient = useQueryClient();
  const pathname = usePathname();

  const { data: pendingList } = useQuery({
    queryKey: ["pending-feedback"],
    queryFn: () => api.feedback.pending(),
    staleTime: 5_000,
  });

  const activePending = pendingList && pendingList.length > 0 ? pendingList[0] : null;

  const [doctorRating, setDoctorRating] = React.useState<number>(0);
  const [hospitalRating, setHospitalRating] = React.useState<number>(0);
  const [comment, setComment] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(true);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // Automatically reopen dialog if patient attempts to navigate to booking page (/appointments/new)
  React.useEffect(() => {
    if (activePending && pathname.includes("/appointments/new")) {
      setIsOpen(true);
    }
  }, [pathname, activePending]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!activePending) return;
      return api.feedback.submit({
        appointmentId: activePending.appointmentId,
        doctorRating,
        hospitalRating,
        comment,
      });
    },
    onSuccess: () => {
      setDoctorRating(0);
      setHospitalRating(0);
      setComment("");
      setValidationError(null);
      setIsOpen(false);
      toast.success("Thank you for your feedback!");
      queryClient.invalidateQueries({ queryKey: ["pending-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: any) => {
      setValidationError(err?.message || "Failed to submit feedback.");
    },
  });

  if (!activePending) return null;

  const rawDocName = activePending.doctor?.name || "Doctor";
  const formattedDoctorName = rawDocName.toLowerCase().startsWith("dr.")
    ? rawDocName
    : `Dr. ${rawDocName}`;

  function handleSubmit() {
    setValidationError(null);
    if (doctorRating === 0 || hospitalRating === 0) {
      setValidationError("Please select a 1-to-5 star rating for both Doctor and Hospital.");
      return;
    }
    submitMutation.mutate();
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md p-6 sm:p-8 border-primary/20 bg-card/95 backdrop-blur-md shadow-2xl">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
            <MessageSquareHeart className="size-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Rate Your Consultation
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Please rate your recent visit with{" "}
            <span className="font-semibold text-foreground">{formattedDoctorName}</span> at{" "}
            <span className="font-semibold text-foreground">
              {activePending.hospital?.name || "Hospital"}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Doctor Rating */}
          <div className="rounded-xl border border-border bg-accent/30 p-4 space-y-2 text-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1.5">
              <UserCheck className="size-4 text-primary" />
              Doctor Rating
            </label>
            <div className="flex justify-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setDoctorRating(star)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`size-7 transition-colors ${
                      star <= doctorRating
                        ? "fill-amber-400 text-amber-400 drop-shadow"
                        : "text-muted-foreground/30 hover:text-amber-400/50"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-medium text-amber-500">
              {doctorRating === 5
                ? "Excellent (5 Stars)"
                : doctorRating === 4
                ? "Very Good (4 Stars)"
                : doctorRating === 3
                ? "Good (3 Stars)"
                : doctorRating === 2
                ? "Fair (2 Stars)"
                : doctorRating === 1
                ? "Poor (1 Star)"
                : "Tap stars to select rating"}
            </p>
          </div>

          {/* Hospital Rating */}
          <div className="rounded-xl border border-border bg-accent/30 p-4 space-y-2 text-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1.5">
              <Building2 className="size-4 text-primary" />
              Hospital Rating
            </label>
            <div className="flex justify-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setHospitalRating(star)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`size-7 transition-colors ${
                      star <= hospitalRating
                        ? "fill-amber-400 text-amber-400 drop-shadow"
                        : "text-muted-foreground/30 hover:text-amber-400/50"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-medium text-amber-500">
              {hospitalRating === 5
                ? "Excellent (5 Stars)"
                : hospitalRating === 4
                ? "Very Good (4 Stars)"
                : hospitalRating === 3
                ? "Good (3 Stars)"
                : hospitalRating === 2
                ? "Fair (2 Stars)"
                : hospitalRating === 1
                ? "Poor (1 Star)"
                : "Tap stars to select rating"}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Optional Feedback / Review
            </label>
            <Textarea
              placeholder="Share details about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="h-20 text-xs resize-none"
            />
          </div>

          {validationError ? (
            <p className="text-xs text-destructive text-center font-medium bg-destructive/10 py-2 px-3 rounded-md">
              {validationError}
            </p>
          ) : null}

          <Button
            className="w-full h-11 text-sm font-semibold gap-2 shadow-lg"
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
          >
            <Award className="size-4" />
            {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
