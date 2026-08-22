"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { ClipboardPlus, Info, Pill, Sparkles, TriangleAlert } from "lucide-react";
import { drugInteractionRequestSchema, type DrugInteractionReport } from "@upchaar/types";
import { Alert, AlertDescription, AlertTitle } from "@upchaar/ui/alert";
import { Button } from "@upchaar/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@upchaar/ui/card";
import { EmptyState } from "@upchaar/ui/empty-state";
import { FormField } from "@upchaar/ui/form-field";
import { PageHeader } from "@upchaar/ui/page-header";
import { Separator } from "@upchaar/ui/separator";
import { SeverityBadge } from "@upchaar/ui/severity-badge";
import { Skeleton } from "@upchaar/ui/skeleton";

import { FormAlert } from "@/components/form-alert";
import { ListInput } from "@/components/list-input";
import { api, isApiError, type FieldErrors } from "@/lib/api";
import { useMedicalRecord } from "@/lib/queries";
import { firstError, issuesToFieldErrors } from "@/lib/validation";

export function InteractionChecker() {
  const [medicines, setMedicines] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<FieldErrors>({});

  const record = useMedicalRecord();
  const mine = record.data?.medicalHistory?.currentMedications ?? [];

  const check = useMutation<DrugInteractionReport, unknown, string[]>({
    mutationFn: (list) => api.ai.drugInteraction(list),
  });

  const unavailable = isApiError(check.error) && check.error.isUnavailable;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = drugInteractionRequestSchema.safeParse({ medicines });
    if (!parsed.success) {
      setErrors(issuesToFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    check.mutate(parsed.data.medicines);
  }

  const report = check.data;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Medicine check"
        title="Check how your medicines mix"
        description="Add two or more medicines and we will look for interactions worth knowing about."
      />

      <Card>
        <CardHeader>
          <CardTitle>Your medicines</CardTitle>
          <CardDescription>
            Use the names on the packet — brand or generic both work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
            {unavailable ? null : (
              <FormAlert
                error={check.error}
                fallback="We could not check those medicines."
              />
            )}

            <FormField
              label="Medicines to compare"
              description="At least two. Press Enter after each one."
              error={firstError(errors, "medicines")}
              required
            >
              {(field) => (
                <ListInput
                  {...field}
                  listLabel="Medicines to compare"
                  placeholder="e.g. Aspirin"
                  emptyHint="No medicines added yet."
                  value={medicines}
                  onChange={setMedicines}
                />
              )}
            </FormField>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={check.isPending}>
                {check.isPending ? "Checking" : "Check interactions"}
                {check.isPending ? null : <Sparkles aria-hidden />}
              </Button>

              {mine.length >= 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const merged = new Set([...medicines, ...mine]);
                    setMedicines([...merged]);
                  }}
                >
                  <ClipboardPlus aria-hidden />
                  Add my recorded medicines
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {unavailable ? (
        <Alert variant="warning">
          <TriangleAlert aria-hidden />
          <AlertTitle>The interaction checker is offline</AlertTitle>
          <AlertDescription>
            <p>{isApiError(check.error) ? check.error.message : ""}</p>
            <p>
              The checker needs a Gemini API key on the server. Everything else in Upchaar
              keeps working without it.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      {check.isPending ? (
        <Card>
          <CardHeader>
            <CardTitle>Reading the interactions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </CardContent>
        </Card>
      ) : report !== undefined ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-3">
              Interaction report
              <SeverityBadge severity={report.severity} />
            </CardTitle>
            <CardDescription>{report.summary}</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-6">
            <section className="grid gap-3">
              <h3 className="text-sm font-semibold text-foreground">Pair by pair</h3>
              {report.pairs.length === 0 ? (
                <EmptyState
                  variant="plain"
                  icon={<Pill />}
                  title="No pairwise interactions found"
                  description="Nothing notable came up between the medicines you listed."
                />
              ) : (
                <ul className="grid gap-3">
                  {report.pairs.map((pair) => (
                    <li
                      key={`${pair.a}-${pair.b}`}
                      className="grid gap-2 rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-foreground">
                          {pair.a} <span className="text-muted-foreground">+</span>{" "}
                          {pair.b}
                        </p>
                        <SeverityBadge severity={pair.severity} />
                      </div>
                      <p className="text-sm text-muted-foreground">{pair.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {report.advice.length > 0 ? (
              <section className="grid gap-3">
                <h3 className="text-sm font-semibold text-foreground">What to do</h3>
                <ul className="grid gap-2">
                  {report.advice.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Info
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0 text-primary"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <Separator />

            <p className="text-xs text-muted-foreground">{report.disclaimer}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
