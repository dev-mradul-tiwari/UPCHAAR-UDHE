"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { BedInput } from "@upchaar/types";
import { Button } from "@upchaar/ui/button";
import { PageHeader } from "@upchaar/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@upchaar/ui/card";
import { FormField, FormRow } from "@upchaar/ui/form-field";
import { Input } from "@upchaar/ui/input";
import { toast } from "@upchaar/ui/sonner";
import { Skeleton } from "@upchaar/ui/skeleton";

import { api, fieldErrorsOf, type FieldErrors } from "@/lib/api";
import { useHospital } from "@/components/session-provider";
import { FormAlert } from "@/components/form-alert";
import { firstError } from "@/lib/validation";

interface BedFormData {
  icu: { total: string; available: string };
  general: { total: string; available: string };
  premium: { total: string; available: string };
}

export function BedsContent() {
  const { data: hospital } = useHospital();
  const [formData, setFormData] = React.useState<BedFormData>({
    icu: { total: "", available: "" },
    general: { total: "", available: "" },
    premium: { total: "", available: "" },
  });
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [failure, setFailure] = React.useState<unknown>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const bedsQuery = useQuery({
    queryKey: ["beds", hospital?.id],
    queryFn: () => (hospital?.id ? api.beds.list(hospital.id) : []),
    enabled: !!hospital?.id,
  });

  React.useEffect(() => {
    if (bedsQuery.data) {
      const newFormData: BedFormData = {
        icu: { total: "", available: "" },
        general: { total: "", available: "" },
        premium: { total: "", available: "" },
      };

      bedsQuery.data.forEach((bed: { type: string; total: number; available: number }) => {
        const key = bed.type.toLowerCase() as keyof BedFormData;
        newFormData[key] = {
          total: bed.total.toString(),
          available: bed.available.toString(),
        };
      });

      setFormData(newFormData);
    }
  }, [bedsQuery.data]);

  function updateBedField(
    type: keyof BedFormData,
    field: "total" | "available",
    value: string
  ) {
    setFormData((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFailure(null);
    setErrors({});

    // Validate
    for (const [type, data] of Object.entries(formData)) {
      const total = parseInt(data.total, 10) || 0;
      const available = parseInt(data.available, 10) || 0;
      if (available > total) {
        setErrors((prev) => ({
          ...prev,
          [type]: [`Available beds cannot exceed total beds`],
        }));
        return;
      }
    }

    const input: BedInput = {
      beds: [
        {
          type: "ICU",
          total: parseInt(formData.icu.total, 10) || 0,
          available: parseInt(formData.icu.available, 10) || 0,
        },
        {
          type: "GENERAL",
          total: parseInt(formData.general.total, 10) || 0,
          available: parseInt(formData.general.available, 10) || 0,
        },
        {
          type: "PREMIUM",
          total: parseInt(formData.premium.total, 10) || 0,
          available: parseInt(formData.premium.available, 10) || 0,
        },
      ],
    };

    setSubmitting(true);
    try {
      await api.beds.update(input);
      toast.success("Bed configuration updated");
    } catch (error) {
      setErrors(fieldErrorsOf(error));
      setFailure(error);
    } finally {
      setSubmitting(false);
    }
  }

  if (bedsQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 2 }).map((_, j) => (
                <Skeleton key={j} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bed Management"
        description="Configure total beds and occupancy for each type"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormAlert error={failure} />

        {(["icu", "general", "premium"] as const).map((type) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="capitalize">{type} Beds</CardTitle>
              <CardDescription>
                Configure total and available {type} beds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormRow>
                <FormField
                  label="Total beds"
                  error={firstError(errors, type)}
                  required
                >
                  {(field) => (
                    <Input
                      {...field}
                      type="number"
                      name={`${type}-total`}
                      placeholder="0"
                      value={formData[type].total}
                      onChange={(e) => updateBedField(type, "total", e.target.value)}
                      min="0"
                    />
                  )}
                </FormField>
                <FormField
                  label="Available beds"
                  error={firstError(errors, type)}
                  required
                >
                  {(field) => (
                    <Input
                      {...field}
                      type="number"
                      name={`${type}-available`}
                      placeholder="0"
                      value={formData[type].available}
                      onChange={(e) => updateBedField(type, "available", e.target.value)}
                      min="0"
                    />
                  )}
                </FormField>
              </FormRow>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={submitting}>
            {submitting ? "Saving..." : "Save bed configuration"}
          </Button>
        </div>
      </form>
    </div>
  );
}
