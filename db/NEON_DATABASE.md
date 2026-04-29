# BYL Finanzas - SQL para Neon PostgreSQL

Ejecuta este script completo en el SQL Editor de Neon. Crea o actualiza la estructura, usa consultas seguras desde la app y deja el usuario inicial: usuario `bryan` y contraseña `pas2026`.

Nota de seguridad: las tarjetas guardan banco, alias, tipo, ultimos 4 digitos, limite/saldo y metadatos visuales. No guardan numero completo, CVV ni datos suficientes para cobrar en POS. Para pagos contactless reales se necesita Apple Pay, Google Wallet o un proveedor bancario certificado.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(255) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  password_hash text NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'OWNER',
  couple_id uuid,
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS couple_id uuid;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by_id uuid;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(100) NOT NULL,
  amount numeric(12,2) NOT NULL,
  description text,
  date date NOT NULL,
  visibility varchar(50) NOT NULL DEFAULT 'PRIVATE',
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_frequency varchar(50),
  created_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE incomes ADD COLUMN IF NOT EXISTS next_run_date date;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank varchar(100) NOT NULL,
  name varchar(100) NOT NULL,
  last_four varchar(4) NOT NULL,
  card_brand varchar(30),
  card_type varchar(20) NOT NULL DEFAULT 'CREDIT',
  credit_limit numeric(12,2) NOT NULL,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  cut_date date,
  due_date date,
  min_payment numeric(12,2) NOT NULL DEFAULT 0,
  visibility varchar(50) NOT NULL DEFAULT 'PRIVATE',
  image_url text,
  wallet_enabled boolean NOT NULL DEFAULT false,
  wallet_provider varchar(100),
  created_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS card_type varchar(20) NOT NULL DEFAULT 'CREDIT';
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS card_brand varchar(30);
ALTER TABLE credit_cards ALTER COLUMN cut_date DROP NOT NULL;
ALTER TABLE credit_cards ALTER COLUMN due_date DROP NOT NULL;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS min_payment numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS statement_url text;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS wallet_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS wallet_provider varchar(100);
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  target_amount numeric(12,2) NOT NULL,
  target_date date NOT NULL,
  current_amount numeric(12,2) NOT NULL DEFAULT 0,
  visibility varchar(50) NOT NULL DEFAULT 'PRIVATE',
  status varchar(50) NOT NULL DEFAULT 'ACTIVE',
  created_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS project_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  date date NOT NULL,
  note text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(100) NOT NULL,
  category varchar(100) NOT NULL,
  amount numeric(12,2) NOT NULL,
  payment_method varchar(100) NOT NULL,
  date date NOT NULL,
  visibility varchar(50) NOT NULL DEFAULT 'PRIVATE',
  card_id uuid REFERENCES credit_cards(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  split_type varchar(50),
  split_data jsonb,
  receipt_url text,
  ocr_status varchar(50),
  created_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS paid_by_id uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_id uuid;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS fixed_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  amount numeric(12,2) NOT NULL,
  day_of_month numeric NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'ACTIVE',
  created_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE fixed_expenses ALTER COLUMN day_of_month TYPE integer USING day_of_month::integer;
ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS category varchar(100) NOT NULL DEFAULT 'Servicios del hogar';
ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS payment_method varchar(100) NOT NULL DEFAULT 'Banco';
ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS visibility varchar(50) NOT NULL DEFAULT 'PRIVATE';
ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS last_paid_at date;
ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS couple_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,
  payer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  expense_id uuid REFERENCES expenses(id) ON DELETE SET NULL,
  status varchar(50) NOT NULL DEFAULT 'PENDING',
  created_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE couple_balances ADD COLUMN IF NOT EXISTS paid_amount numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE couple_balances ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category varchar(100) NOT NULL,
  monthly_limit numeric(12,2) NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  visibility varchar(50) NOT NULL DEFAULT 'PRIVATE',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_category_period_idx ON budgets(user_id, category, month, year);

CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expense_id uuid REFERENCES expenses(id) ON DELETE SET NULL,
  file_name varchar(255) NOT NULL,
  file_type varchar(50) NOT NULL,
  file_url text,
  merchant varchar(255),
  invoice_number varchar(100),
  receipt_date date,
  subtotal numeric(12,2),
  tax numeric(12,2),
  total numeric(12,2),
  currency varchar(20) DEFAULT 'HNL',
  payment_method varchar(100),
  extracted_data jsonb,
  ocr_status varchar(50) NOT NULL DEFAULT 'PENDING',
  confirmed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name varchar(255) NOT NULL,
  file_type varchar(50) NOT NULL,
  bank varchar(100),
  period_start date,
  period_end date,
  status varchar(50) NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id uuid NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movement_date date NOT NULL,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  suggested_category varchar(100),
  movement_type varchar(50) NOT NULL DEFAULT 'UNKNOWN',
  status varchar(50) NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  imported_expense_id uuid REFERENCES expenses(id) ON DELETE SET NULL,
  imported_income_id uuid REFERENCES incomes(id) ON DELETE SET NULL,
  fingerprint varchar(255) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bank_movements_user_fingerprint_idx ON bank_movements(user_id, fingerprint);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(100) NOT NULL,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'UNREAD',
  related_type varchar(100),
  related_id uuid,
  created_at timestamp NOT NULL DEFAULT now(),
  read_at timestamp
);

CREATE INDEX IF NOT EXISTS incomes_user_date_idx ON incomes(user_id, date);
CREATE INDEX IF NOT EXISTS expenses_user_date_idx ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS expenses_visibility_idx ON expenses(visibility);
CREATE INDEX IF NOT EXISTS credit_cards_user_idx ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS projects_user_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS fixed_expenses_user_idx ON fixed_expenses(user_id);
CREATE INDEX IF NOT EXISTS couple_balances_couple_idx ON couple_balances(couple_id, status);
CREATE INDEX IF NOT EXISTS notifications_user_status_idx ON notifications(user_id, status);

DO $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT id INTO owner_id FROM users WHERE username = 'bryan';

  IF owner_id IS NULL THEN
    INSERT INTO users (username, name, password_hash, role, must_change_password)
    VALUES ('bryan', 'Bryan', '$2b$10$ejz9YMNk7bvcI6G/iISeiuYfHpUcPjMlDH7e.NPfH5pO8aCveF7y2', 'OWNER', false)
    RETURNING id INTO owner_id;
  END IF;

  UPDATE users
  SET password_hash = '$2b$10$ejz9YMNk7bvcI6G/iISeiuYfHpUcPjMlDH7e.NPfH5pO8aCveF7y2',
      role = 'OWNER',
      must_change_password = false,
      couple_id = COALESCE(couple_id, owner_id),
      updated_at = now()
  WHERE id = owner_id;
END $$;


```

