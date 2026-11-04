import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getApp } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import type { CreateTicketInput } from '../../services/ticketCrmService';
import { UserTicketForm } from '../../components/user-portal/UserTicketForm';

export function PortalNewTicketPage() {
  const { currentUser, createTicket } = useCrm();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const app = getApp(currentUser.appId);

  const handleSubmit = async (input: CreateTicketInput) => {
    const created = await createTicket(input);
    navigate(`/portal/ticket/${created.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/portal"
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Daftar Tiket Saya
          </Link>
          <h1 className="mt-1 text-lg font-bold tracking-tight text-ink">
            Buat Tiket Laporan Kendala — {app?.name ?? currentUser.appId}
          </h1>
        </div>
      </div>

      <UserTicketForm
        user={currentUser}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/portal')}
      />
    </div>
  );
}
