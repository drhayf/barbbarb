import { getBarberProfile } from '@/lib/actions/barber';
import { BarberScheduleForm } from './client';
import { redirect } from 'next/navigation';
import { defaultWeeklyAvailability, WeeklyAvailability } from '@/lib/types/barber-profile';

export default async function BarberSchedulePage() {
  try {
    const profile = await getBarberProfile();
    
    // Parse availability from JSONB
    const availabilityData = profile.availability as 
      | Record<string, { isOpen: boolean; start: string; end: string }>
      | undefined;

    // Ensure we have a valid WeeklyAvailability object
    let availability: WeeklyAvailability;
    if (availabilityData) {
      availability = {
        monday: availabilityData.monday || defaultWeeklyAvailability.monday,
        tuesday: availabilityData.tuesday || defaultWeeklyAvailability.tuesday,
        wednesday: availabilityData.wednesday || defaultWeeklyAvailability.wednesday,
        thursday: availabilityData.thursday || defaultWeeklyAvailability.thursday,
        friday: availabilityData.friday || defaultWeeklyAvailability.friday,
        saturday: availabilityData.saturday || defaultWeeklyAvailability.saturday,
        sunday: availabilityData.sunday || defaultWeeklyAvailability.sunday,
      };
    } else {
      availability = defaultWeeklyAvailability;
    }

    return (
      <div className="container mx-auto py-10 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Barber Schedule & Profile</h1>
          <p className="text-gray-500 mt-2">
            Manage your professional profile and weekly availability
          </p>
        </div>
        
        <BarberScheduleForm
          initialData={{
            bio: profile.bio || '',
            specialties: (profile.specialties as string[]) || [],
            instagramHandle: profile.instagramHandle || '',
            availability,
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading barber profile:', error);
    redirect('/dashboard');
  }
}
