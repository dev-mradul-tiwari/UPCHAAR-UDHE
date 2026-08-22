"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Star, Stethoscope, Users } from "lucide-react";
import type { HospitalSummary } from "@upchaar/types";
import { Button } from "@upchaar/ui/button";
import { Badge } from "@upchaar/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@upchaar/ui/card";

import { BedChips } from "@/components/hospitals/bed-availability";

export function HospitalCard({ hospital }: { hospital: HospitalSummary }) {
  return (
    <Card className="h-full gap-4 py-5">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-snug">{hospital.name}</CardTitle>
          <Badge variant="outline" className="gap-1">
            <Star aria-hidden className="fill-warning text-warning" />
            <span className="tabular-nums">{hospital.rating.toFixed(1)}</span>
          </Badge>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin aria-hidden className="size-3.5 shrink-0" />
          {hospital.city}, {hospital.state} · {hospital.type}
        </p>
      </CardHeader>

      <CardContent className="grid gap-3">
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Stethoscope aria-hidden className="size-3.5" />
            <dt className="sr-only">Departments</dt>
            <dd>
              {hospital.departmentCount}{" "}
              {hospital.departmentCount === 1 ? "department" : "departments"}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Users aria-hidden className="size-3.5" />
            <dt className="sr-only">Doctors</dt>
            <dd>
              {hospital.doctorCount} {hospital.doctorCount === 1 ? "doctor" : "doctors"}
            </dd>
          </div>
        </dl>

        <BedChips beds={hospital.beds} />
      </CardContent>

      <CardFooter className="justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {hospital.availableBeds} of {hospital.totalBeds} beds free
        </span>
        <Button asChild variant="outline" size="sm">
          <Link href={`/hospitals/${hospital.id}`}>
            View hospital
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
