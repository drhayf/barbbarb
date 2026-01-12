import { getServices } from '@/lib/actions/services';
import OwnerServicesClient from './client';

export default async function OwnerServicesPage() {
  const services = await getServices();
  return <OwnerServicesClient services={services} />;
}
