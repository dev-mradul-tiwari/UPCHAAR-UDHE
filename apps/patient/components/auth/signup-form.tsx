"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Lock, Mail, Phone, User } from "lucide-react";
import {
  BLOOD_GROUPS,
  patientRegisterSchema,
  type BloodGroup,
  type Gender,
  type PatientRegisterInput,
} from "@upchaar/types";
import { Button } from "@upchaar/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@upchaar/ui/card";
import { DateInput, todayInputValue } from "@upchaar/ui/date-input";
import { FormField, FormRow } from "@upchaar/ui/form-field";
import { Input } from "@upchaar/ui/input";
import { Progress } from "@upchaar/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@upchaar/ui/select";
import { Switch } from "@upchaar/ui/switch";
import { Textarea } from "@upchaar/ui/textarea";
import { toast } from "@upchaar/ui/sonner";

import { FormAlert } from "@/components/form-alert";
import { ListInput } from "@/components/list-input";
import { createSession } from "@/components/session-provider";
import { api, fieldErrorsOf, type FieldErrors } from "@/lib/api";
import { HOME_PATH } from "@/lib/session";
import { firstError, issuesToFieldErrors } from "@/lib/validation";

/** Step 1 is validated with exactly the fields it owns. */
const personalSchema = patientRegisterSchema.pick({
  name: true,
  email: true,
  password: true,
  phone: true,
  dateOfBirth: true,
  gender: true,
  bloodGroup: true,
});

const GENDER_OPTIONS: ReadonlyArray<{ value: Gender; label: string }> = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

type Step = 1 | 2;

export function SignupForm() {
  const router = useRouter();

  const [step, setStep] = React.useState<Step>(1);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [failure, setFailure] = React.useState<unknown>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [dateOfBirth, setDateOfBirth] = React.useState("");
  const [gender, setGender] = React.useState<Gender | "">("");
  const [bloodGroup, setBloodGroup] = React.useState<BloodGroup | "">("");

  const [chronicDiseases, setChronicDiseases] = React.useState<string[]>([]);
  const [allergies, setAllergies] = React.useState<string[]>([]);
  const [pastSurgeries, setPastSurgeries] = React.useState<string[]>([]);
  const [currentMedications, setCurrentMedications] = React.useState<string[]>([]);
  const [smoking, setSmoking] = React.useState(false);
  const [alcohol, setAlcohol] = React.useState(false);
  const [notes, setNotes] = React.useState("");

  function buildPayload(): unknown {
    const trimmedNotes = notes.trim();
    return {
      name,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      bloodGroup: bloodGroup === "" ? undefined : bloodGroup,
      medicalHistory: {
        chronicDiseases,
        allergies,
        pastSurgeries,
        currentMedications,
        smoking,
        alcohol,
        notes: trimmedNotes.length > 0 ? trimmedNotes : undefined,
      },
    };
  }

  function goToStepTwo() {
    setFailure(null);
    const parsed = personalSchema.safeParse({
      name,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      bloodGroup: bloodGroup === "" ? undefined : bloodGroup,
    });

    if (!parsed.success) {
      setErrors(issuesToFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setStep(2);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1) {
      goToStepTwo();
      return;
    }

    setFailure(null);
    const parsed = patientRegisterSchema.safeParse(buildPayload());
    if (!parsed.success) {
      const found = issuesToFieldErrors(parsed.error);
      setErrors(found);
      const onStepOne = Object.keys(found).some(
        (key) => !key.startsWith("medicalHistory"),
      );
      if (onStepOne) setStep(1);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const input: PatientRegisterInput = parsed.data;
      const session = await api.auth.register(input);
      await createSession(session.token);
      toast.success("Your Upchaar account is ready");
      router.replace(HOME_PATH);
      router.refresh();
    } catch (error) {
      const apiErrors = fieldErrorsOf(error);
      setErrors(apiErrors);
      setFailure(error);
      if (Object.keys(apiErrors).some((key) => !key.startsWith("medicalHistory"))) {
        setStep(1);
      }
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="grid gap-1.5">
            <CardTitle className="text-xl">
              {step === 1 ? "Create your account" : "A little about your health"}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? "We only ask for what a hospital needs to see you safely."
                : "This helps your doctor prepare. You can change any of it later."}
            </CardDescription>
          </div>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            Step {step} of 2
          </span>
        </div>
        <Progress
          value={step === 1 ? 50 : 100}
          size="sm"
          aria-label={`Signup progress: step ${step} of 2`}
        />
      </CardHeader>

      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          <FormAlert error={failure} fallback="We could not create your account." />

          {step === 1 ? (
            <>
              <FormField label="Full name" error={firstError(errors, "name")} required>
                {(field) => (
                  <Input
                    {...field}
                    name="name"
                    autoComplete="name"
                    placeholder="Mradul Tiwari"
                    icon={<User />}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                )}
              </FormField>

              <FormRow>
                <FormField
                  label="Email address"
                  error={firstError(errors, "email")}
                  required
                >
                  {(field) => (
                    <Input
                      {...field}
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      icon={<Mail />}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  )}
                </FormField>

                <FormField
                  label="Phone number"
                  error={firstError(errors, "phone")}
                  required
                >
                  {(field) => (
                    <Input
                      {...field}
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="+91-9900011122"
                      icon={<Phone />}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  )}
                </FormField>
              </FormRow>

              <FormField
                label="Password"
                description="At least 8 characters."
                error={firstError(errors, "password")}
                required
              >
                {(field) => (
                  <Input
                    {...field}
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="Choose a password"
                    icon={<Lock />}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                )}
              </FormField>

              <FormRow>
                <FormField
                  label="Date of birth"
                  error={firstError(errors, "dateOfBirth")}
                  required
                >
                  {(field) => (
                    <DateInput
                      {...field}
                      name="dateOfBirth"
                      max={todayInputValue()}
                      value={dateOfBirth}
                      onChange={(event) => setDateOfBirth(event.target.value)}
                    />
                  )}
                </FormField>

                <FormField label="Gender" error={firstError(errors, "gender")} required>
                  {(field) => (
                    <Select
                      value={gender === "" ? undefined : gender}
                      onValueChange={(value) => setGender(value as Gender)}
                    >
                      <SelectTrigger {...field}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
              </FormRow>

              <FormField
                label="Blood group"
                description="Optional, but useful in an emergency."
                error={firstError(errors, "bloodGroup")}
              >
                {(field) => (
                  <Select
                    value={bloodGroup === "" ? undefined : bloodGroup}
                    onValueChange={(value) => setBloodGroup(value as BloodGroup)}
                  >
                    <SelectTrigger {...field} className="sm:max-w-48">
                      <SelectValue placeholder="Not sure" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              <Button type="submit" size="lg" block>
                Continue
                <ArrowRight aria-hidden />
              </Button>
            </>
          ) : (
            <>
              <FormField
                label="Ongoing conditions"
                description="Anything you are being treated for, such as asthma or diabetes."
                error={firstError(errors, "medicalHistory.chronicDiseases")}
              >
                {(field) => (
                  <ListInput
                    {...field}
                    listLabel="Ongoing conditions"
                    placeholder="e.g. Asthma"
                    emptyHint="No ongoing conditions added."
                    value={chronicDiseases}
                    onChange={setChronicDiseases}
                  />
                )}
              </FormField>

              <FormField
                label="Allergies"
                error={firstError(errors, "medicalHistory.allergies")}
              >
                {(field) => (
                  <ListInput
                    {...field}
                    listLabel="Allergies"
                    placeholder="e.g. Penicillin"
                    emptyHint="No allergies added."
                    value={allergies}
                    onChange={setAllergies}
                  />
                )}
              </FormField>

              <FormField
                label="Past surgeries"
                error={firstError(errors, "medicalHistory.pastSurgeries")}
              >
                {(field) => (
                  <ListInput
                    {...field}
                    listLabel="Past surgeries"
                    placeholder="e.g. Appendectomy 2019"
                    emptyHint="No surgeries added."
                    value={pastSurgeries}
                    onChange={setPastSurgeries}
                  />
                )}
              </FormField>

              <FormField
                label="Current medications"
                error={firstError(errors, "medicalHistory.currentMedications")}
              >
                {(field) => (
                  <ListInput
                    {...field}
                    listLabel="Current medications"
                    placeholder="e.g. Salbutamol inhaler"
                    emptyHint="No medications added."
                    value={currentMedications}
                    onChange={setCurrentMedications}
                  />
                )}
              </FormField>

              <fieldset className="grid gap-3 rounded-xl border border-border p-4">
                <legend className="px-1 text-sm font-medium text-foreground">
                  Lifestyle
                </legend>
                <label
                  htmlFor="signup-smoking"
                  className="flex items-center justify-between gap-4 text-sm text-foreground"
                >
                  <span>I smoke</span>
                  <Switch
                    id="signup-smoking"
                    checked={smoking}
                    onCheckedChange={setSmoking}
                  />
                </label>
                <label
                  htmlFor="signup-alcohol"
                  className="flex items-center justify-between gap-4 text-sm text-foreground"
                >
                  <span>I drink alcohol</span>
                  <Switch
                    id="signup-alcohol"
                    checked={alcohol}
                    onCheckedChange={setAlcohol}
                  />
                </label>
              </fieldset>

              <FormField
                label="Anything else your doctor should know"
                description="Optional."
                error={firstError(errors, "medicalHistory.notes")}
              >
                {(field) => (
                  <Textarea
                    {...field}
                    name="notes"
                    rows={3}
                    maxLength={1000}
                    placeholder="Flare-ups in winter, recent travel, ongoing symptoms…"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                )}
              </FormField>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="sm:w-40"
                  onClick={() => {
                    setFailure(null);
                    setStep(1);
                  }}
                >
                  <ArrowLeft aria-hidden />
                  Back
                </Button>
                <Button type="submit" size="lg" className="flex-1" loading={submitting}>
                  {submitting ? "Creating your account" : "Create account"}
                  {submitting ? null : <Check aria-hidden />}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Already registered?{" "}
          <Link
            href="/login"
            className="rounded font-medium text-primary-subtle-foreground underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/45 focus-visible:outline-none"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
