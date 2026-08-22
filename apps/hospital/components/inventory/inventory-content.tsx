"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { InventoryQuery } from "@upchaar/types";
import { Button } from "@upchaar/ui/button";
import { Input } from "@upchaar/ui/input";
import { PageHeader } from "@upchaar/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@upchaar/ui/table";
import { Skeleton } from "@upchaar/ui/skeleton";
import { Checkbox } from "@upchaar/ui/checkbox";
import { Badge } from "@upchaar/ui/badge";

import { api } from "@/lib/api";
import { MedicineDialog } from "./medicine-dialog";
import { DeleteMedicineDialog } from "./delete-medicine-dialog";

export function InventoryContent() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [lowStockOnly, setLowStockOnly] = React.useState(false);
  const [expiringSoonOnly, setExpiringSoonOnly] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const query: InventoryQuery = {
    q: searchQuery || undefined,
    lowStock: lowStockOnly ? true : undefined,
    expiringInDays: expiringSoonOnly ? 30 : undefined,
  };

  const medicineQuery = useQuery({
    queryKey: ["inventory", query],
    queryFn: () => api.inventory.list(query),
  });

  const medicines = medicineQuery.data ?? [];

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Inventory" description="Manage medicine stock" />
        <MedicineDialog onSuccess={handleSuccess}>
          <Button>Add medicine</Button>
        </MedicineDialog>
      </div>

      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Search medicines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={lowStockOnly}
              onCheckedChange={(val) => setLowStockOnly(Boolean(val))}
            />
            <span className="text-sm">Low stock only</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={expiringSoonOnly}
              onCheckedChange={(val) => setExpiringSoonOnly(Boolean(val))}
            />
            <span className="text-sm">Expiring soon (30 days)</span>
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine name</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Expiry date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicineQuery.isPending ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : medicines.length > 0 ? (
                medicines.map((medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell className="font-medium">{medicine.name}</TableCell>
                    <TableCell className="text-right text-sm">{medicine.quantity}</TableCell>
                    <TableCell className="text-right text-sm">{medicine.threshold}</TableCell>
                    <TableCell className="text-sm">{medicine.unit}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(medicine.expiryDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {medicine.isLowStock && (
                          <Badge variant="warning">Low stock</Badge>
                        )}
                        {medicine.daysToExpiry !== undefined && medicine.daysToExpiry <= 30 && (
                          <Badge variant="destructive">
                            {medicine.daysToExpiry} days left
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <MedicineDialog
                          medicine={medicine}
                          onSuccess={handleSuccess}
                        >
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </MedicineDialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingId(medicine.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No medicines found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {deletingId && (
        <DeleteMedicineDialog
          medicineId={deletingId}
          onSuccess={() => {
            setDeletingId(null);
            handleSuccess();
          }}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
