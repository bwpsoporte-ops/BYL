import { registerBankStatement, registerReceipt } from '@/app/actions/documents';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatLempiras } from '@/lib/finance';
import { queryRows } from '@/lib/db';
import { MetricTile, ModuleHeader, StatusPill, WorkPanel } from '@/components/module-ui';

export default async function DocumentsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const receiptItems = await queryRows<{
    id: string;
    fileName: string;
    merchant: string | null;
    ocrStatus: string;
    total: string | null;
  }>(
    `select id, file_name as "fileName", merchant, ocr_status as "ocrStatus", total
     from receipts
     where user_id = $1
     order by created_at desc`,
    [session.id],
  );
  const statementItems = await queryRows<{
    id: string;
    fileName: string;
    bank: string | null;
    status: string;
  }>(
    `select id, file_name as "fileName", bank, status
     from bank_statements
     where user_id = $1
     order by created_at desc`,
    [session.id],
  );
  const movementItems = await queryRows<{
    id: string;
    movementDate: string;
    description: string;
    amount: string;
    movementType: string;
    status: string;
  }>(
    `select id, movement_date::text as "movementDate", description, amount,
            movement_type as "movementType", status
     from bank_movements
     where user_id = $1
     order by created_at desc
     limit 20`,
    [session.id],
  );

  async function submitReceipt(formData: FormData) {
    'use server';
    await registerReceipt(formData);
  }

  async function submitStatement(formData: FormData) {
    'use server';
    await registerBankStatement(formData);
  }

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Archivo financiero"
        title="Documentos"
        description="Centraliza comprobantes, OCR pendiente y estados de cuenta para importar movimientos con control."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="Comprobantes" value={receiptItems.length} tone="blue" detail="Facturas y recibos" />
        <MetricTile label="Estados" value={statementItems.length} tone="neutral" detail="Bancarios o tarjetas" />
        <MetricTile label="Movimientos" value={movementItems.length} tone="amber" detail="Importados pendientes" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <WorkPanel title="Registrar comprobante" description="Deja el documento listo para OCR o revisión manual.">
            <form action={submitReceipt} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receiptFile">Archivo</Label>
                <Input id="receiptFile" name="receiptFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required className="h-11 rounded-md file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="merchant">Comercio</Label>
                  <Input id="merchant" name="merchant" className="h-11 rounded-md" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total</Label>
                  <Input id="total" name="total" type="number" step="0.01" className="h-11 rounded-md" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiptDate">Fecha</Label>
                  <Input id="receiptDate" name="receiptDate" type="date" className="h-11 rounded-md" />
                </div>
              </div>
              <Button className="rounded-md bg-[#102a4c] text-white hover:bg-[#173b69]">Dejar en revisión</Button>
            </form>
        </WorkPanel>

        <WorkPanel title="Registrar estado de cuenta" description="Carga el periodo para revisar movimientos antes de importarlos.">
            <form action={submitStatement} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="statementFile">Archivo</Label>
                <Input id="statementFile" name="statementFile" type="file" accept=".pdf,.csv,.xlsx,image/jpeg,image/png,image/webp" required className="h-11 rounded-md file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm" />
                <p className="text-xs text-slate-500">Si subes CSV, se leerán movimientos con columnas: fecha, descripción, monto.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bank">Banco</Label>
                  <Input id="bank" name="bank" className="h-11 rounded-md" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodStart">Desde</Label>
                  <Input id="periodStart" name="periodStart" type="date" className="h-11 rounded-md" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodEnd">Hasta</Label>
                  <Input id="periodEnd" name="periodEnd" type="date" className="h-11 rounded-md" />
                </div>
              </div>
              <Button className="rounded-md bg-[#102a4c] text-white hover:bg-[#173b69]">Crear importación</Button>
            </form>
        </WorkPanel>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="panel overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-semibold text-slate-950">Comprobantes</h2>
            <p className="mt-1 text-sm text-slate-500">Documentos recibidos y su estado de procesamiento.</p>
          </div>
          {receiptItems.map((item) => (
            <div key={item.id} className="data-row text-sm">
              <div>
                <p className="font-medium">{item.fileName}</p>
                <p className="text-slate-500">{item.merchant || 'Sin comercio'} · {item.ocrStatus}</p>
              </div>
              <div className="text-right">
                <StatusPill tone={item.ocrStatus === 'SUCCESS' ? 'green' : 'amber'}>{item.ocrStatus}</StatusPill>
                <p className="mt-2 font-semibold">{item.total ? formatLempiras(item.total) : 'Pendiente'}</p>
              </div>
            </div>
          ))}
          {receiptItems.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No hay comprobantes.</div>}
        </div>
        <div className="panel overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-semibold text-slate-950">Estados de cuenta</h2>
            <p className="mt-1 text-sm text-slate-500">Archivos bancarios pendientes de importación.</p>
          </div>
          {statementItems.map((item) => (
            <div key={item.id} className="data-row text-sm">
              <div>
                <p className="font-medium">{item.fileName}</p>
                <p className="text-slate-500">{item.bank || 'Banco no indicado'}</p>
              </div>
              <StatusPill tone={item.status === 'CONFIRMED' ? 'green' : 'amber'}>{item.status}</StatusPill>
            </div>
          ))}
          {statementItems.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No hay estados importados.</div>}
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-semibold text-slate-950">Movimientos importados</h2>
          <p className="mt-1 text-sm text-slate-500">Registros detectados desde estados CSV, pendientes de confirmación.</p>
        </div>
        {movementItems.map((item) => (
          <div key={item.id} className="data-row text-sm">
            <div>
              <p className="font-medium text-slate-950">{item.description}</p>
              <p className="text-slate-500">{new Date(item.movementDate).toLocaleDateString()} · {item.movementType}</p>
            </div>
            <div className="text-right">
              <StatusPill tone="amber">{item.status}</StatusPill>
              <p className="mt-2 font-semibold">{formatLempiras(item.amount)}</p>
            </div>
          </div>
        ))}
        {movementItems.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No hay movimientos importados.</div>}
      </div>
    </div>
  );
}
