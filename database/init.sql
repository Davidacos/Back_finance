-- ==============================================================================
-- 🚀 POSTGRESQL PRODUCTION SCHEMA FOR BACK FINANCE
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 📌 DECISIONES DE DISEÑO (ENUM vs CHECK):
-- Se implementan ENUM nativos de PostgreSQL.
-- Beneficios: 
-- 1. Reducen el espacio en disco (ocupan internamente 4 bytes vs los bytes del VARCHAR).
-- 2. Aseguran consistencia a nivel global sin repetir validaciones CHECK en cada tabla.

CREATE TYPE category_type AS ENUM ('income', 'expense');
CREATE TYPE payment_method_type AS ENUM ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'other');
CREATE TYPE frequency_type AS ENUM ('monthly', 'yearly');

-- 🛠️ FUNCIÓN GENÉRICA PARA ACTUALIZACIÓN AUTOMÁTICA DEL CAMPO updated_at
-- Esta función asegura que el campo updated_at refleje siempre la última transacción real
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Evitamos triggers innecesarios si el registro no cambió
    IF ROW(NEW.*) IS DISTINCT FROM ROW(OLD.*) THEN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 📦 TABLAS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    currency_code CHAR(3) DEFAULT 'USD',
    language CHAR(2) DEFAULT 'en',
    monthly_budget DECIMAL(15, 2) NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    user_agent VARCHAR(255),
    ip_address VARCHAR(45),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- 💡 CATEGORIAS GLOBALES:
-- Para buscar todas las categorías de un usuario, siempre deberás consultar:
-- WHERE (user_id = 'UUID-DEL-USUARIO' OR is_default = TRUE) AND deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL, -- NULL = Categoría del sistema (global)
    name VARCHAR(100) NOT NULL,
    type category_type NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TRIGGER update_categories_modtime BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    category_id UUID NOT NULL,
    type category_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    description VARCHAR(255),
    transaction_date DATE NOT NULL,
    payment_method payment_method_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TRIGGER update_transactions_modtime BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS fixed_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    category_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    frequency frequency_type NOT NULL,
    day_of_month INT CHECK (day_of_month BETWEEN 1 AND 31),
    start_date DATE NOT NULL,
    end_date DATE,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TRIGGER update_fixed_expenses_modtime BEFORE UPDATE ON fixed_expenses FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ==============================================================================
-- 🚀 ÍNDICES OPTIMIZADOS
-- ==============================================================================

-- Búsqueda principal para el dashboard mensual (Analítica)
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_user_type_date ON transactions(user_id, type, transaction_date DESC) WHERE deleted_at IS NULL;

-- Restricción y búsqueda de gastos fijos activos
CREATE INDEX idx_fixed_expenses_active ON fixed_expenses(user_id) WHERE is_active = TRUE AND deleted_at IS NULL;

-- Búsqueda de categorías globales + locales optimizada con cobertura parcial
CREATE INDEX idx_categories_user_lookup ON categories(user_id) WHERE user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_categories_default ON categories(is_default) WHERE is_default = TRUE AND deleted_at IS NULL;

-- Restricción Única de Categorías (Evita duplicidad de nombres activos bajo el mismo usuario)
CREATE UNIQUE INDEX idx_categories_unique_name_user ON categories(user_id, LOWER(name)) WHERE user_id IS NOT NULL AND deleted_at IS NULL;

-- Optimización de Tokens
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- ==============================================================================
-- 📊 VISTAS ANALÍTICAS
-- ==============================================================================

DROP VIEW IF EXISTS v_monthly_summary;
CREATE VIEW v_monthly_summary AS
SELECT 
    user_id,
    EXTRACT(YEAR FROM transaction_date)::INTEGER as summary_year,
    EXTRACT(MONTH FROM transaction_date)::INTEGER as summary_month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as balance
FROM transactions
WHERE deleted_at IS NULL
GROUP BY user_id, EXTRACT(YEAR FROM transaction_date), EXTRACT(MONTH FROM transaction_date);

-- ==============================================================================
-- 📍 DATOS POR DEFECTO
-- ==============================================================================

INSERT INTO categories (id, name, type, is_default, icon, color) VALUES
(gen_random_uuid(), 'Salary', 'income', TRUE, 'wallet', '#10b981'),
(gen_random_uuid(), 'Freelance', 'income', TRUE, 'briefcase', '#3b82f6'),
(gen_random_uuid(), 'Groceries', 'expense', TRUE, 'shopping-cart', '#ef4444'),
(gen_random_uuid(), 'Rent', 'expense', TRUE, 'home', '#f59e0b'),
(gen_random_uuid(), 'Utilities', 'expense', TRUE, 'zap', '#8b5cf6')
ON CONFLICT DO NOTHING;
