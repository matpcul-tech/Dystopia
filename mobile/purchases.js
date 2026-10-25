// RevenueCat is not connected. This module must not unlock chapters.

export const PRODUCTS = {
  season: { id: 'season_pass_book_one', price: '$6.99' },
  removeAds: { id: 'remove_ads', price: '$2.99' },
};

export async function purchase(){
  return { ok: false, reason: 'RevenueCat is not connected. Nothing was charged.' };
}
