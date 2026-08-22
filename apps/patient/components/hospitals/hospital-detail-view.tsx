"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BedDouble,
  CalendarPlus,
  Clock,
  MapPin,
  Phone,
  Search,
  Star,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@upchaar/ui/alert";
import { Badge } from "@upchaar/ui/badge";
import { Button } from "@upchaar/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@upchaar/ui/card";
import { EmptyState } from "@upchaar/ui/empty-state";
import { PageHeader } from "@upchaar/ui/page-header";
import { Skeleton } from "@upchaar/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@upchaar/ui/tabs";
import { UserAvatar } from "@upchaar/ui/avatar";

import { BedStats } from "@/components/hospitals/bed-availability";
import { errorMessage, isApiError } from "@/lib/api";
import { useHospital } from "@/lib/queries";

export function HospitalDetailView({ hospitalId }: { hospitalId: string }) {
  const { data: hospital, isPending, error } = useHospital(hospitalId);

  if (isPending) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (error !== null || hospital === undefined) {
    const notFound = isApiError(error) && error.status === 404;
    return (
      <div className="grid gap-6">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/hospitals">
            <ArrowLeft aria-hidden />
            Back to search
          </Link>
        </Button>
        <EmptyState
          icon={<Search />}
          title={notFound ? "We could not find that hospital" : "Something went wrong"}
          description={
            notFound
              ? "The link may be out of date. Try searching again."
              : errorMessage(error)
          }
          action={
            <Button asChild>
              <Link href="/hospitals">Search hospitals</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/hospitals">
            <ArrowLeft aria-hidden />
            Back to search
          </Link>
        </Button>

        <PageHeader
          eyebrow={hospital.type}
          title={hospital.name}
          description={`${hospital.addressLine}, ${hospital.city}, ${hospital.state} ${hospital.zipcode}`}
          actions={
            <Button asChild>
              <Link href={`/appointments/new?hospitalId=${hospital.id}`}>
                <CalendarPlus aria-hidden />
                Book here
              </Link>
            </Button>
          }
        >
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className="gap-1">
              <Star aria-hidden className="fill-warning text-warning" />
              <span className="tabular-nums">{hospital.rating.toFixed(1)}</span>
            </Badge>
            <Badge variant="muted">
              <MapPin aria-hidden />
              {hospital.city}
            </Badge>
            <Badge variant="muted">
              <Phone aria-hidden />
              {hospital.phone}
            </Badge>
            <Badge variant="muted">
              <BadgeCheck aria-hidden />
              Reg. {hospital.registrationNumber}
            </Badge>
          </div>
        </PageHeader>
      </div>

      <section aria-labelledby="beds-heading" className="grid gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="beds-heading"
            className="flex items-center gap-2 text-lg font-semibold text-foreground"
          >
            <BedDouble aria-hidden className="size-4.5 text-primary" />
            Live bed availability
          </h2>
          <span className="text-sm text-muted-foreground">
            {hospital.availableBeds} of {hospital.totalBeds} free
          </span>
        </div>
        <BedStats beds={hospital.beds} />
      </section>

      <Tabs defaultValue="departments" className="gap-5">
        <TabsList>
          <TabsTrigger value="departments">
            Departments ({hospital.departments.length})
          </TabsTrigger>
          <TabsTrigger value="doctors">Doctors ({hospital.doctors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          {hospital.departments.length === 0 ? (
            <EmptyState
              title="No departments listed"
              description="This hospital has not published its departments yet."
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {hospital.departments.map((department) => (
                <li key={department.id}>
                  <Card className="h-full gap-3 py-5">
                    <CardHeader className="gap-1.5">
                      <CardTitle className="text-base">{department.name}</CardTitle>
                      <CardDescription>
                        {department.description ?? "General consultation and care."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users aria-hidden className="size-3.5" />
                          <dt className="sr-only">Doctors</dt>
                          <dd>{department.doctorCount} on staff</dd>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock aria-hidden className="size-3.5" />
                          <dt className="sr-only">Average consultation</dt>
                          <dd>~{department.avgConsultMinutes} min per patient</dd>
                        </div>
                      </dl>
                      {department.headDoctor !== null ? (
                        <p className="text-sm text-muted-foreground">
                          Head of department:{" "}
                          <span className="font-medium text-foreground">
                            {department.headDoctor.name}
                          </span>
                        </p>
                      ) : null}
                      <Button asChild variant="outline" size="sm" className="w-fit">
                        <Link
                          href={`/appointments/new?hospitalId=${hospital.id}&departmentId=${department.id}`}
                        >
                          Book in {department.name}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="doctors">
          {hospital.doctors.length === 0 ? (
            <EmptyState
              title="No doctors listed"
              description="This hospital has not published its doctors yet."
            />
          ) : (
            <ul className="grid gap-3">
              {hospital.doctors.map((doctor) => (
                <li
                  key={doctor.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar name={doctor.name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{doctor.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {doctor.specialization}
                        {doctor.departmentName === null
                          ? ""
                          : ` · ${doctor.departmentName}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="muted">{doctor.experienceYears} yrs</Badge>
                    <Badge variant={doctor.isAvailable ? "success" : "muted"}>
                      {doctor.isAvailable ? "On duty" : "Off duty"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      {hospital.departments.length === 0 ? (
        <Alert variant="info">
          <CalendarPlus aria-hidden />
          <AlertTitle>Booking is not open here yet</AlertTitle>
          <AlertDescription>
            An appointment needs a department, and this hospital has not listed any.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
