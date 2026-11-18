import { useCallback, useEffect, useState } from 'react';
import { HandCoins, Loader2, Users, HeartHandshake, Landmark, Calculator, LayoutDashboard, Wifi, WifiOff } from 'lucide-react';
import { MembersTab } from './components/MembersTab';
import { SocialFundTab } from './components/SocialFundTab';
import { LoansTab } from './components/LoansTab';
import { ShareOutTab } from './components/ShareOutTab';
import { DashboardTab } from './components/DashboardTab';
import { UssdSimulator } from './components/UssdSimulator';
import { supabase } from './lib/supabase';
import { emptyDb, type Db, type Loan, type PaymentMethod, type SocialFundEvent } from './lib/types';

type Tab = 'dashboard' | 'members' | 'loans' | 'social' | 'shareout';

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', label: 'Abanyamuryango · Members', icon: Users },
  { id: 'loans', label: 'Inguzi · Loans', icon: Landmark },
  { id: 'social', label: 'Ingoboka Fund', icon: HeartHandshake },
  { id: 'shareout', label: 'Kugabana · Share-Out', icon: Calculator },
];

export default function App() {
  const [db, setDb] = useState<Db>(emptyDb);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const reload = useCallback(async () => {
    setError(null);
    const [members, contribs, social, loans, repayments] = await Promise.all([
      supabase.from('members').select('*').order('name'),
      supabase.from('share_contributions').select('*').order('paid_at'),
      supabase.from('social_fund_events').select('*').order('event_date'),
      supabase.from('loans').select('*').order('issued_at'),
      supabase.from('loan_repayments').select('*').order('paid_at'),
    ]);
    const errs = [members.error, contribs.error, social.error, loans.error, repayments.error];
    const firstErr = errs.find(Boolean);
    if (firstErr) {
      setError(firstErr.message);
      return;
    }
    setDb({
      members: members.data ?? [],
      contributions: contribs.data ?? [],
      socialFundEvents: social.data ?? [],
      loans: loans.data ?? [],
      repayments: repayments.data ?? [],
    });
  }, []);

  useEffect(() => {
    (async () => {
      await reload();
      setLoading(false);
    })();
  }, [reload]);

  const addMember = async (name: string, phone: string) => {
    const { error: e } = await supabase.from('members').insert({ name, phone });
    if (e) setError(e.message);
    await reload();
  };

  const deleteMember = async (id: string) => {
    const { error: e } = await supabase.from('members').delete().eq('id', id);
    if (e) setError(e.message);
  };

  const addContribution = async (
    memberId: string,
    type: 'share' | 'social' | 'fine',
    amount: number,
    method: PaymentMethod,
    note: string,
  ) => {
    const { data, error: e } = await supabase
      .from('share_contributions')
      .insert({ member_id: memberId, type, amount, method, note })
      .select('id')
      .single();
    if (e) setError(e.message);
    await reload();
    return (data?.id as string | undefined) ?? null;
  };

  const deleteContribution = async (id: string) => {
    const { error: e } = await supabase.from('share_contributions').delete().eq('id', id);
    if (e) setError(e.message);
    await reload();
  };

  const addSocialEvent = async (ev: Omit<SocialFundEvent, 'id'>) => {
    const { error: e } = await supabase.from('social_fund_events').insert(ev);
    if (e) setError(e.message);
  };

  const deleteSocialEvent = async (id: string) => {
    const { error: e } = await supabase.from('social_fund_events').delete().eq('id', id);
    if (e) setError(e.message);
  };

  const addLoan = async (memberId: string, principal: number) => {
    const { error: e } = await supabase.from('loans').insert({ member_id: memberId, principal });
    if (e) setError(e.message);
  };

  const markRepaid = async (loan: Loan) => {
    const { error: e } = await supabase.from('loans').update({ status: 'repaid' }).eq('id', loan.id);
    if (e) setError(e.message);
    await reload();
  };

  const addRepayment = async (loanId: string, amount: number, method: PaymentMethod) => {
    const { error: e } = await supabase.from('loan_repayments').insert({ loan_id: loanId, amount, method });
    if (e) setError(e.message);
    await reload();
  };

  const deleteLoan = async (id: string) => {
    const { error: e } = await supabase.from('loans').delete().eq('id', id);
    if (e) setError(e.message);
    await reload();
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-emerald-800 text-white print:hidden">
        <div className="mx-auto max-w-5xl px-4 pt-6 pb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-700 p-2">
              <HandCoins size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Ibimina</h1>
              <p className="text-xs text-emerald-200">Ikibina — Community Savings & Lending · Rwanda</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-900/60 px-3 py-1.5 text-[11px] font-medium">
              {online ? (
                <>
                  <Wifi size={12} className="text-emerald-300" />
                  <span className="text-emerald-100">Saved &amp; up to date</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} className="text-amber-300" />
                  <span className="text-amber-200">Offline — will save when back online</span>
                </>
              )}
            </div>
          </div>
          <nav className="mt-4 flex gap-1 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex min-h-[48px] items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  tab === id ? 'bg-neutral-100 text-emerald-900' : 'text-emerald-100 hover:bg-emerald-700'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-neutral-500">
            <Loader2 className="animate-spin" size={18} />
            Loading...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Something went wrong loading data: {error}
            <button onClick={() => reload()} className="ml-2 underline">
              Retry
            </button>
          </div>
        ) : (
          <>
            {tab === 'dashboard' && <DashboardTab db={db} goTo={setTab} />}
            {tab === 'members' && (
              <MembersTab
                db={db}
                addMember={addMember}
                addContribution={addContribution}
                deleteContribution={deleteContribution}
                deleteMember={deleteMember}
                reload={reload}
              />
            )}
            {tab === 'loans' && (
              <LoansTab db={db} addLoan={addLoan} markRepaid={markRepaid} addRepayment={addRepayment} deleteLoan={deleteLoan} reload={reload} />
            )}
            {tab === 'social' && <SocialFundTab db={db} addSocialEvent={addSocialEvent} deleteSocialEvent={deleteSocialEvent} reload={reload} />}
            {tab === 'shareout' && <ShareOutTab db={db} />}
          </>
        )}
      </main>

      <UssdSimulator db={db} />
    </div>
  );
}
