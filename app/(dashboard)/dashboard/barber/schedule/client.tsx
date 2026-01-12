'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  WeeklyAvailability,
  DayOfWeek,
  SPECIALTIES_OPTIONS,
  defaultWeeklyAvailability
} from '@/lib/types/barber-profile';
import { saveBarberProfileAndSchedule } from '@/lib/actions/barber';
import { Loader2, Save } from 'lucide-react';

interface BarberScheduleFormProps {
  initialData: {
    bio: string;
    specialties: string[];
    instagramHandle: string;
    availability: WeeklyAvailability;
  };
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export function BarberScheduleForm({ initialData }: BarberScheduleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [bio, setBio] = useState(initialData.bio || '');
  const [specialties, setSpecialties] = useState<string[]>(initialData.specialties || []);
  const [instagramHandle, setInstagramHandle] = useState(initialData.instagramHandle || '');
  const [availability, setAvailability] = useState<WeeklyAvailability>(
    initialData.availability || defaultWeeklyAvailability
  );

  const handleSpecialtyToggle = (specialty: string) => {
    setSpecialties(prev => 
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handleAvailabilityChange = (day: DayOfWeek, field: 'isOpen' | 'start' | 'end', value: boolean | string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);

    try {
      await saveBarberProfileAndSchedule(
        { bio, specialties, instagramHandle },
        availability
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full min-h-[120px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Tell clients about yourself, your experience, and your style..."
            />
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram Handle</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <Input
                id="instagram"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                className="pl-8"
                placeholder="yourhandle"
              />
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-2">
            <Label>Specialties</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES_OPTIONS.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => handleSpecialtyToggle(specialty)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    specialties.includes(specialty)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => (
            <div
              key={day.key}
              className="flex items-center justify-between p-4 border rounded-lg bg-card"
            >
              <div className="flex items-center gap-4">
                <Switch
                  checked={availability[day.key].isOpen}
                  onCheckedChange={(checked) => handleAvailabilityChange(day.key, 'isOpen', checked)}
                />
                <span className="font-medium min-w-[100px]">{day.label}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={availability[day.key].start}
                  onChange={(e) => handleAvailabilityChange(day.key, 'start', e.target.value)}
                  disabled={!availability[day.key].isOpen}
                  className={`px-3 py-2 border rounded-md ${
                    !availability[day.key].isOpen ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
                  }`}
                />
                <span className="text-gray-400">to</span>
                <input
                  type="time"
                  value={availability[day.key].end}
                  onChange={(e) => handleAvailabilityChange(day.key, 'end', e.target.value)}
                  disabled={!availability[day.key].isOpen}
                  className={`px-3 py-2 border rounded-md ${
                    !availability[day.key].isOpen ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
                  }`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {success && (
          <span className="text-green-600 text-sm">Changes saved successfully!</span>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Profile & Schedule
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
