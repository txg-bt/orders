-- CREATE DATABASE reservations_service;
-- \c reservations_service
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE reservations (
  reservation_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  reservation_date TIMESTAMPTZ NOT NULL,
  num_guests INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(255) NOT NULL
);
