DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
  id SERIAL PRIMARY KEY NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  payment_id INTEGER NOT NULL REFERENCES payments (id) ON DELETE CASCADE,
  order_date TIMESTAMP NOT NULL,
  total_price DECIMAL NOT NULL
);