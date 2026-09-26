"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@upchaar/ui/dialog";
import { Button } from "@upchaar/ui/button";
import { Input } from "@upchaar/ui/input";
import { toast } from "@upchaar/ui/sonner";
import { assignPatient, searchPatients } from "../../app/actions/patients";

export function AssignPatientDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.length < 3) return;
    setSearching(true);
    try {
      const data = await searchPatients(query);
      setResults(data);
      if (data.length === 0) {
        toast.info("No unassigned patients found matching that query.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to search patients.");
    } finally {
      setSearching(false);
    }
  }

  async function handleAssign(patientId: string) {
    setAssigningId(patientId);
    try {
      await assignPatient(patientId);
      toast.success("Patient assigned successfully!");
      setOpen(false);
      setResults([]);
      setQuery("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to assign patient.");
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Assign Existing Patient</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Existing Patient</DialogTitle>
          <DialogDescription>
            Search by name or phone number to find an existing patient.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Name or phone..." 
            className="flex-1"
          />
          <Button type="submit" disabled={searching || query.length < 3}>
            {searching ? "..." : "Search"}
          </Button>
        </form>

        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {results.map(patient => (
            <div key={patient.id} className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <p className="font-medium text-sm">{patient.name}</p>
                <p className="text-xs text-muted-foreground">{patient.phone}</p>
              </div>
              <Button 
                size="sm" 
                onClick={() => handleAssign(patient.id)}
                disabled={assigningId === patient.id}
              >
                {assigningId === patient.id ? "Assigning..." : "Assign"}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
