// src/types/catalog.ts

/**
 * catalog.games table
 * The overarching category (e.g., One Piece, Pokemon)
 */
export interface Game {
  game_id: string;
  slug: string;
  name: string; // The primary name of the game
}

/**
 * catalog.set_localizations table
 * Linked to catalog.sets
 */
export interface SetLocalization {
  set_id: string;
  local_set_id: string;
  name: string;
  local_set_slug: string;
  master_set_slug: string;
  language: string;
}

/**
 * catalog.sets table
 * Categories that cards fall into (e.g., Romance Dawn, Base Set)
 */
export interface CardSet {
  set_id: string;
  game_id: string;
  slug: string;
  name: string;           // Base/English name
  code: string;           // e.g., "OP01"
  series?: string | null;
  release_date?: string | null;
  set_localizations?: SetLocalization[]; // Joined data
}

/**
 * catalog.localizations table
 * Linked to catalog.cards
 */
export interface CardLocalization {
  name: string;
  language: 'kr' | 'en';
}

/**
 * catalog.cards table
 * The specific card information
 */
export interface Card {
  id?: string | number;
  card_id?: string | number;
  set_id?: string | null;
  name?: string;
  card_name?: string | null;
  number?: string | null;
  set_code?: string | null;
  game?: string | null;
  rarity?: string | null;
  rarity_name?: string | null;
  variant_name?: string | null;
  condition?: string | null;
  price?: number | null;
  card_slug?: string | null;
  release_date?: string | null;
  image_url?: string | null;
  metadata?: Record<string, unknown> | null;
  language?: string | null;
  created_at?: string | null;
  cameos?: unknown;
  localizations?: CardLocalization[]; // Joined data
}

/**
 * catalog.product_localizations table
 * Linked to catalog.products
 */
export interface ProductLocalization {
  product_id: string;
  name: string;
  language: 'kr' | 'en';
  localized_slug?: string;
}

/**
 * catalog.products table
 * Sealed product listings tied to sets
 */
export interface Product {
  id?: string;
  product_id?: string;
  set_id?: string;
  name?: string;
  product_name?: string;
  product_type?: string;
  category?: string;
  series?: string | null;
  release_date?: string | null;
  product_slug?: string | null;
  local_slug?: string | null;
  image_url?: string | null;
  price?: number | null;
  metadata?: Record<string, unknown> | null;
  language?: string | null;
  created_at?: string | null;
  set_code?: string | null;
  product_code?: string | null;
  [key: string]: unknown;
}