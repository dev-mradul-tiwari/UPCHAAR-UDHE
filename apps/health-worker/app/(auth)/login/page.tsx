import { login } from "../../actions/auth";
import { Button } from "@upchaar/ui/button";
import { Input } from "@upchaar/ui/input";
import { Label } from "@upchaar/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@upchaar/ui/card";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm shadow-soft">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to access your assigned patients
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={login} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              name="phone"
              required
              placeholder="e.g. 9876543210"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              required
            />
          </div>
          
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
