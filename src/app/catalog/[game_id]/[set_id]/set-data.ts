import { supabase } from '@/lib/supabase';
import type { CardSet } from '@/lib/supabase';
import type { Language } from '@/lib/i18n';

type SetLocalizationRow = {
  set_id: string;
  name: string;
  local_set_slug: string | null;
  master_set_slug?: string | null;
  language: string;
};

const pickPreferredSetLocalization = (
  rows: SetLocalizationRow[],
  language: Language
): SetLocalizationRow | null => {
  if (rows.length === 0) {
    return null;
  }

  return rows.find((row) => row.language === language) ?? rows[0];
};

export const fetchGameId = async (
  gameSlug: string
): Promise<{ gameId: string | null; errorMessage: string | null }> => {
  const normalizedSlug = gameSlug?.trim();
  if (!normalizedSlug || normalizedSlug === 'undefined') {
    return {
      gameId: null,
      errorMessage: 'Missing game slug in URL',
    };
  }

  const { data: slugData, error: slugError } = await supabase
    .from('games')
    .select('game_id')
    .eq('slug', normalizedSlug)
    .maybeSingle();

  if (slugError) {
    return {
      gameId: null,
      errorMessage: slugError.message,
    };
  }

  if (slugData) {
    return { gameId: slugData.game_id, errorMessage: null };
  }

  const { data: legacySlugData, error: legacySlugError } = await supabase
    .from('games')
    .select('game_id')
    .ilike('slug', `${normalizedSlug}%`)
    .limit(1)
    .maybeSingle();

  if (legacySlugError) {
    return {
      gameId: null,
      errorMessage: legacySlugError.message,
    };
  }

  if (legacySlugData) {
    return { gameId: legacySlugData.game_id, errorMessage: null };
  }

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      normalizedSlug
    );

  if (!isUuid) {
    return {
      gameId: null,
      errorMessage: 'No game found for this slug or id',
    };
  }

  const { data: idData, error: idError } = await supabase
    .from('games')
    .select('game_id')
    .eq('game_id', normalizedSlug)
    .maybeSingle();

  if (idError) {
    return {
      gameId: null,
      errorMessage: idError.message,
    };
  }

  if (!idData) {
    return {
      gameId: null,
      errorMessage: 'No game found for this slug or id',
    };
  }

  return { gameId: idData.game_id, errorMessage: null };
};

export const fetchSet = async (
  gameId: string | null,
  setSlug: string,
  language: Language
): Promise<{
  set: CardSet | null;
  localizedName: string | null;
  errorMessage: string | null;
}> => {
  const normalizedSlug = setSlug?.trim();
  if (!normalizedSlug || normalizedSlug === 'undefined') {
    return {
      set: null,
      localizedName: null,
      errorMessage: 'Missing set slug in URL',
    };
  }

  if (!gameId) {
    return {
      set: null,
      localizedName: null,
      errorMessage: 'Missing game_id for set query',
    };
  }

  if (language !== 'en') {
    const { data: localizationData, error: localizationError } = await supabase
      .from('set_localizations')
      .select('set_id, name, local_set_slug, master_set_slug, language')
      .eq('language', language)
      .ilike('local_set_slug', normalizedSlug)
      .limit(1)
      .maybeSingle();

    if (localizationError) {
      return {
        set: null,
        localizedName: null,
        errorMessage: localizationError.message,
      };
    }

    if (localizationData) {
      const { data, error } = await supabase
        .from('sets')
        .select('set_id, game_id, name, code, slug')
        .eq('game_id', gameId)
        .eq('set_id', localizationData.set_id)
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return {
          set: null,
          localizedName: localizationData.name,
          errorMessage: error?.message ?? 'Unknown error fetching set',
        };
      }

      return {
        set: data,
        localizedName: localizationData.name,
        errorMessage: null,
      };
    }

    const { data: fallbackLocalizations, error: fallbackLocalizationError } = await supabase
      .from('set_localizations')
      .select('set_id, name, local_set_slug, master_set_slug, language')
      .ilike('local_set_slug', normalizedSlug)
      .limit(5);

    if (fallbackLocalizationError) {
      return {
        set: null,
        localizedName: null,
        errorMessage: fallbackLocalizationError.message,
      };
    }

    const fallbackLocalization = pickPreferredSetLocalization(
      (fallbackLocalizations ?? []) as SetLocalizationRow[],
      language
    );

    if (fallbackLocalization) {
      const { data, error } = await supabase
        .from('sets')
        .select('set_id, game_id, name, code, slug')
        .eq('game_id', gameId)
        .eq('set_id', fallbackLocalization.set_id)
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return {
          set: null,
          localizedName: fallbackLocalization.name,
          errorMessage: error?.message ?? 'Unknown error fetching set',
        };
      }

      return {
        set: data,
        localizedName: fallbackLocalization.name,
        errorMessage: null,
      };
    }
  }

  const { data, error } = await supabase
    .from('sets')
    .select('set_id, game_id, name, code, slug')
    .eq('game_id', gameId)
    .eq('slug', normalizedSlug)
    .limit(1)
    .maybeSingle();

  if (data) {
    return { set: data, localizedName: null, errorMessage: null };
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('sets')
    .select('set_id, game_id, name, code, slug')
    .eq('game_id', gameId)
    .ilike('slug', normalizedSlug)
    .limit(1)
    .maybeSingle();

  if (error || fallbackError || !fallbackData) {
    return {
      set: null,
      localizedName: null,
      errorMessage:
        error?.message ??
        fallbackError?.message ??
        'Unknown error fetching set',
    };
  }

  return { set: fallbackData, localizedName: null, errorMessage: null };
};

export const fetchSetLocalizationDetails = async (
  setId: string,
  language: Language
): Promise<{ name: string | null; localSetSlug: string | null }> => {
  if (language === 'en') {
    return {
      name: null,
      localSetSlug: null,
    };
  }

  const { data, error } = await supabase
    .from('set_localizations')
    .select('set_id, name, local_set_slug, language')
    .eq('set_id', setId)
    .limit(5);

  if (error || !data || data.length === 0) {
    return {
      name: null,
      localSetSlug: null,
    };
  }

  const localization = pickPreferredSetLocalization(
    data as SetLocalizationRow[],
    language
  );

  return {
    name: localization?.name ?? null,
    localSetSlug: localization?.local_set_slug?.trim() ?? null,
  };
};

export const fetchSetLocalization = async (
  setId: string,
  language: Language
): Promise<string | null> => {
  const localization = await fetchSetLocalizationDetails(setId, language);
  return localization.name;
};
