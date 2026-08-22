"use client";

import * as React from "react";
import { Hospital, Search, SlidersHorizontal, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@upchaar/ui/alert";
import { Button } from "@upchaar/ui/button";
import { EmptyState } from "@upchaar/ui/empty-state";
import { Input } from "@upchaar/ui/input";
import { Label } from "@upchaar/ui/label";
import { PageHeader } from "@upchaar/ui/page-header";
import { Pagination } from "@upchaar/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@upchaar/ui/select";
import { Skeleton } from "@upchaar/ui/skeleton";
import { Switch } from "@upchaar/ui/switch";

import { HospitalCard } from "@/components/hospitals/hospital-card";
import { errorMessage, type HospitalSearchParams } from "@/lib/api";
import { useDepartments, useHospitals } from "@/lib/queries";

const ALL = "ALL";
const PAGE_SIZE = 6;

function useDebounced<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function HospitalSearch() {
  const [term, setTerm] = React.useState("");
  const [city, setCity] = React.useState<string>(ALL);
  const [departmentId, setDepartmentId] = React.useState<string>(ALL);
  const [bedsOnly, setBedsOnly] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const debouncedTerm = useDebounced(term);

  // Filter vocabulary: every hospital (for cities) and every department.
  const catalogue = useHospitals({ limit: 100 });
  const departments = useDepartments();

  const cities = React.useMemo(() => {
    const found = new Set<string>();
    for (const hospital of catalogue.data?.items ?? []) found.add(hospital.city);
    return [...found].sort((a, b) => a.localeCompare(b));
  }, [catalogue.data]);

  const hospitalNames = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const hospital of catalogue.data?.items ?? []) map.set(hospital.id, hospital.name);
    return map;
  }, [catalogue.data]);

  /** Departments belong to a single hospital, so group the options by hospital. */
  const departmentGroups = React.useMemo(() => {
    const groups = new Map<string, { id: string; name: string }[]>();
    for (const department of departments.data ?? []) {
      const hospitalName = hospitalNames.get(department.hospitalId) ?? "Other hospitals";
      const bucket = groups.get(hospitalName) ?? [];
      bucket.push({ id: department.id, name: department.name });
      groups.set(hospitalName, bucket);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [departments.data, hospitalNames]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedTerm, city, departmentId, bedsOnly]);

  const params: HospitalSearchParams = {
    ...(debouncedTerm.trim().length > 0 ? { q: debouncedTerm.trim() } : {}),
    ...(city === ALL ? {} : { city }),
    ...(departmentId === ALL ? {} : { departmentId }),
    ...(bedsOnly ? { hasBeds: true } : {}),
    page,
    limit: PAGE_SIZE,
  };

  const { data, isPending, isFetching, error } = useHospitals(params);
  const results = data?.items ?? [];
  const filtersActive =
    term.length > 0 || city !== ALL || departmentId !== ALL || bedsOnly;

  function resetFilters() {
    setTerm("");
    setCity(ALL);
    setDepartmentId(ALL);
    setBedsOnly(false);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Find care"
        title="Hospitals near you"
        description="Search by name or city, then narrow by department and free beds. Results are sorted by rating."
      />

      <section
        aria-label="Search filters"
        className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-soft"
      >
        <div className="grid gap-2">
          <Label htmlFor="hospital-search">Search hospitals</Label>
          <Input
            id="hospital-search"
            type="search"
            placeholder="Hospital name, city or type"
            icon={<Search />}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="city-filter">City</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger id="city-filter">
                <SelectValue placeholder="Any city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any city</SelectItem>
                {cities.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="department-filter">Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger id="department-filter">
                <SelectValue placeholder="Any department" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value={ALL}>Any department</SelectItem>
                {departmentGroups.map(([hospitalName, entries]) => (
                  <SelectGroup key={hospitalName}>
                    <SelectLabel>{hospitalName}</SelectLabel>
                    {entries.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="beds-filter"
            className="flex items-center gap-3 text-sm text-foreground"
          >
            <Switch id="beds-filter" checked={bedsOnly} onCheckedChange={setBedsOnly} />
            Only hospitals with free beds
          </label>

          {filtersActive ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              <X aria-hidden />
              Clear filters
            </Button>
          ) : null}
        </div>
      </section>

      {error !== null ? (
        <Alert variant="destructive">
          <SlidersHorizontal aria-hidden />
          <AlertTitle>Search is unavailable</AlertTitle>
          <AlertDescription>{errorMessage(error)}</AlertDescription>
        </Alert>
      ) : null}

      {isPending ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <li key={key}>
              <Skeleton className="h-64 w-full rounded-xl" />
            </li>
          ))}
        </ul>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Hospital />}
          title="No hospitals match those filters"
          description="Try a different city, clear the department filter, or search by name."
          action={
            filtersActive ? (
              <Button type="button" variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <ul
            className="grid gap-4 md:grid-cols-2"
            aria-busy={isFetching}
            data-fetching={isFetching ? "true" : undefined}
          >
            {results.map((hospital) => (
              <li key={hospital.id}>
                <HospitalCard hospital={hospital} />
              </li>
            ))}
          </ul>

          <Pagination
            page={data?.page ?? page}
            total={data?.total ?? results.length}
            limit={data?.limit ?? PAGE_SIZE}
            itemLabel="hospitals"
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
