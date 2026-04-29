import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { CreditCardForm } from './card-form';
import { getVisibleUserIds } from '@/lib/server-finance';
import { formatLempiras } from '@/lib/finance';
import { queryRows } from '@/lib/db';
import { MetricTile, ModuleHeader, StatusPill, WorkPanel } from '@/components/module-ui';
import { CardsGallery } from './cards-gallery';

export default async function CardsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const visibleUserIds = await getVisibleUserIds(session);
  const myCards = await queryRows<{
    id: string;
    bank: string;
    name: string;
    lastFour: string;
    cardBrand: string | null;
    cardType: string;
    creditLimit: string;
    balance: string;
    visibility: string;
    imageUrl: string | null;
    walletEnabled: boolean;
  }>(
    `select id, bank, name, last_four as "lastFour", card_brand as "cardBrand", card_type as "cardType",
            credit_limit as "creditLimit", balance, visibility, image_url as "imageUrl",
            wallet_enabled as "walletEnabled"
     from credit_cards
     where user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[]))
     order by created_at desc`,
    [session.id, visibleUserIds.length ? visibleUserIds : [session.id]],
  );
  const creditCards = myCards.filter((card) => card.cardType === 'CREDIT');
  const debitCards = myCards.filter((card) => card.cardType === 'DEBIT');
  const usedCredit = creditCards.reduce((acc, card) => acc + Number(card.balance), 0);
  const creditLimit = creditCards.reduce((acc, card) => acc + Number(card.creditLimit), 0);

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Galileo Digital First"
        title="Tarjetas virtuales"
        description="Administra tarjetas con una experiencia tipo wallet: emisión digital, control de saldos, disponibilidad y preparación para tokenización segura."
      >
        <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-950">
          Estado del programa: <span className="font-semibold">Sandbox visual listo</span>
        </div>
      </ModuleHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="Crédito usado" value={formatLempiras(usedCredit)} tone="amber" detail={`${creditCards.length} tarjetas de crédito`} />
        <MetricTile label="Crédito disponible" value={formatLempiras(creditLimit - usedCredit)} tone="blue" detail="Límite total menos saldo" />
        <MetricTile label="Débito registradas" value={debitCards.length} tone="green" detail="Cuentas y tarjetas de débito" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Wallet readiness</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">Flujo preparado para tokenización</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Cuando Galileo habilite el programa, esta vista puede conectarse a push provisioning para Apple Pay, Google Pay o Samsung Pay.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Digital cards</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">Vista tipo wallet</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Las tarjetas se muestran como instrumentos digitales: marca, banco, disponibilidad, estado y privacidad.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Seguridad</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">Sin PAN ni CVV almacenado</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Se conserva una referencia segura para control financiero mientras la tokenización real queda delegada al issuer.
          </p>
        </div>
      </div>

      <div className="module-grid">
        <WorkPanel title="Emitir / registrar tarjeta" description="Registra la tarjeta para control financiero y preparación visual de wallet." className="sticky top-8 self-start">
          <CreditCardForm coupleActive={!!session.coupleId} />
        </WorkPanel>

        <div>
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Wallet de tarjetas</h2>
              <p className="text-sm text-slate-500">Tarjetas digitales con diseño de pago móvil y estado de provisioning.</p>
            </div>
            <StatusPill tone="blue">{myCards.length} registradas</StatusPill>
          </div>
          <CardsGallery cards={myCards} />
        </div>
      </div>
    </div>
  );
}
