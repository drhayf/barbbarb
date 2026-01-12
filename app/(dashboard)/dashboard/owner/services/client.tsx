'use client';

import { useState, useActionState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import type { Service } from '@/lib/db/schema';
import { createService, deleteService } from '@/lib/actions/services';
import { Plus, Trash2, Clock, DollarSign } from 'lucide-react';

type ActionState = {
  error?: string;
  success?: string;
};

// ============================================
// FORMATTERS
// ============================================

function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceInCents / 100);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ============================================
// COMPONENTS
// ============================================

function ServiceCard({ service }: { service: Service }) {
  const deleteFormRef = useRef<HTMLFormElement>(null);
  const [deleteState, _deleteAction, isDeletePending] = useActionState<ActionState, FormData>(
    deleteService,
    {}
  );

  return (
    <Card className={`${!service.isActive ? 'opacity-60' : ''}`}>
      <form ref={deleteFormRef} action={() => deleteFormRef.current?.requestSubmit()}>
        <input type="hidden" name="serviceId" value={service.id} />
      </form>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{service.name}</CardTitle>
            {service.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {service.description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            type="submit"
            form={deleteFormRef.current?.id}
            disabled={isDeletePending}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatDuration(service.durationMinutes)}</span>
          </div>
          <div className="flex items-center gap-1 font-medium">
            <DollarSign className="h-4 w-4" />
            <span>{formatPrice(service.price)}</span>
          </div>
        </div>
        <div className="mt-3">
          <span className={`text-xs px-2 py-1 rounded-full ${
            service.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {service.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        {deleteState?.error && (
          <p className="text-red-500 text-sm mt-2">{deleteState.error}</p>
        )}
        {deleteState?.success && (
          <p className="text-green-500 text-sm mt-2">{deleteState.success}</p>
        )}
      </CardContent>
    </Card>
  );
}

function CreateServiceForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, action, isPending] = useActionState<ActionState, FormData>(
    createService,
    {}
  );

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Service
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Royal Shave"
                required
                className="mt-1"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                name="description"
                placeholder="e.g., Traditional hot towel shave"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="1"
                placeholder="30"
                required
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="price">Price (cents)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                placeholder="2500 = $25.00"
                required
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter amount in cents (e.g., 2500 for $25.00)
              </p>
            </div>
          </div>

          {state?.error && (
            <p className="text-red-500 text-sm">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-green-500 text-sm">{state.success}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isPending ? 'Creating...' : 'Create Service'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN CLIENT COMPONENT
// ============================================

export default function OwnerServicesClient({ 
  services 
}: { 
  services: Service[] 
}) {
  const [isAddingService, setIsAddingService] = useState(false);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg lg:text-2xl font-medium">Services</h1>
        <Button
          onClick={() => setIsAddingService(!isAddingService)}
          variant={isAddingService ? 'outline' : 'default'}
          className={!isAddingService ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isAddingService ? 'Cancel' : 'Add Service'}
        </Button>
      </div>

      {isAddingService && (
        <CreateServiceForm onSuccess={() => setIsAddingService(false)} />
      )}

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No services yet. Add your first service to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </section>
  );
}
