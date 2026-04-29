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
        eyebrow="Banca y tarjetas"
        title="Tarjetas"
        description="Controla crédito y débito por banco, saldo, límite y disponibilidad sin guardar número completo ni CVV."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="Crédito usado" value={formatLempiras(usedCredit)} tone="amber" detail={`${creditCards.length} tarjetas de crédito`} />
        <MetricTile label="Crédito disponible" value={formatLempiras(creditLimit - usedCredit)} tone="blue" detail="Límite total menos saldo" />
        <MetricTile label="Débito registradas" value={debitCards.length} tone="green" detail="Cuentas y tarjetas de débito" />
      </div>

      <div className="module-grid">
        <WorkPanel title="Nueva tarjeta" description="Registra banco, tipo y últimos dígitos para controlar gastos." className="sticky top-8 self-start">
          <CreditCardForm coupleActive={!!session.coupleId} />
        </WorkPanel>

        <div>
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Tarjetas guardadas</h2>
              <p className="text-sm text-slate-500">Vista visual por banco y disponibilidad.</p>
            </div>
            <StatusPill tone="blue">{myCards.length} registradas</StatusPill>
          </div>
          <CardsGallery cards={myCards} />
        </div>
      </div>
    </div>
  );
}
