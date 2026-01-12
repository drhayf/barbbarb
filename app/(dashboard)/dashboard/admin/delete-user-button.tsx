'use client';

import { useState } from 'react';
import { deleteAnyUser } from '@/lib/actions/super-admin';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export function DeleteUserButton({ userId }: { userId: number }) {
  const [pending, setPending] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this user and all their data? This action cannot be undone.')) {
      return;
    }
    
    setPending(true);
    try {
      await deleteAnyUser(userId);
      window.location.reload();
    } catch (error) {
      alert('Failed to delete user: ' + (error as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      className="flex items-center space-x-1"
      onClick={handleDelete}
      disabled={pending}
    >
      <Trash2 className="h-4 w-4" />
      <span>{pending ? 'Deleting...' : 'Hard Delete'}</span>
    </Button>
  );
}
