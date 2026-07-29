-- 1. Create the 'expenses' table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  note TEXT DEFAULT '',
  client_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the 'settings' table
CREATE TABLE IF NOT EXISTS settings (
  client_id TEXT PRIMARY KEY,
  currency TEXT DEFAULT '₹',
  income NUMERIC DEFAULT 0,
  dark_mode BOOLEAN DEFAULT TRUE,
  custom_categories JSONB DEFAULT '[]'::jsonb,
  monthly_budgets JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS (Row Level Security) and allow anonymous public access matching client_id
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "Allow public select on expenses" ON expenses
  FOR SELECT TO anon USING (TRUE);

CREATE POLICY "Allow public insert on expenses" ON expenses
  FOR INSERT TO anon WITH CHECK (TRUE);

CREATE POLICY "Allow public update on expenses" ON expenses
  FOR UPDATE TO anon USING (TRUE);

CREATE POLICY "Allow public delete on expenses" ON expenses
  FOR DELETE TO anon USING (TRUE);

-- Settings policies
CREATE POLICY "Allow public select on settings" ON settings
  FOR SELECT TO anon USING (TRUE);

CREATE POLICY "Allow public insert on settings" ON settings
  FOR INSERT TO anon WITH CHECK (TRUE);

CREATE POLICY "Allow public update on settings" ON settings
  FOR UPDATE TO anon USING (TRUE);

CREATE POLICY "Allow public delete on settings" ON settings
  FOR DELETE TO anon USING (TRUE);
